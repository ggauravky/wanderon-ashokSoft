import OperationalCommunication from '../models/OperationalCommunication.js';
import OperationalIncident from '../models/OperationalIncident.js';
import OperationalTask from '../models/OperationalTask.js';
import {
  isValidObjectId, loadOperationsContext, validateBookingInContext, validateOperationsStaff, validateServiceInTrip
} from '../services/operationsContextService.js';
import {
  acknowledgeIncidentEscalation, closeIncident, createIncidentCode, escalateIncident,
  isKnownIncidentStatus, reopenIncident, resolveIncident, startIncident, summarizeIncidents, validateIncidentFields,
  validateIncidentScopeRelations
} from '../services/operationsIncidentService.js';
import { OperationsDomainError } from '../services/operationsExecutionService.js';
import { assertOperationalTripOpen } from '../services/operationsClosureService.js';
import { ensureOperationsDatabase, handleOperationsError, operationsActor, operationsFailure, sameInstant } from './operationsControllerUtils.js';

const populateIncident = (query) => query
  .populate('assignedTo', 'name role isActive')
  .populate('reportedBy', 'name role')
  .populate('linkedVendorId', 'vendorCode name types status')
  .populate('bookingId', 'bookingId customer.name');

const getIncident = async (incidentId) => {
  if (!isValidObjectId(incidentId)) throw new OperationsDomainError(400, 'Invalid Incident identifier.', 'INVALID_INCIDENT_ID');
  const incident = await OperationalIncident.findById(incidentId);
  if (!incident) throw new OperationsDomainError(404, 'Operational Incident was not found.', 'INCIDENT_NOT_FOUND');
  return incident;
};

export const listOperationalIncidents = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const query = {};
    const status = String(req.query.status || '').toUpperCase();
    if (status && status !== 'ALL') { if (!isKnownIncidentStatus(status)) return operationsFailure(res, 400, 'Invalid Incident status.'); query.status = status; }
    for (const key of ['severity', 'incidentType']) if (req.query[key] && String(req.query[key]).toUpperCase() !== 'ALL') query[key] = String(req.query[key]).toUpperCase();
    if (req.query.operationId) {
      if (!isValidObjectId(req.query.operationId)) return operationsFailure(res, 400, 'Invalid Operational Trip identifier.');
      query.operationalTripId = req.query.operationId;
    }
    if (req.query.assignedTo === 'me') query.assignedTo = req.user._id;
    else if (req.query.assignedTo && req.query.assignedTo !== 'all') query.assignedTo = req.query.assignedTo;
    if (req.query.escalation && String(req.query.escalation).toUpperCase() !== 'ALL') query['escalation.status'] = String(req.query.escalation).toUpperCase();
    const search = String(req.query.search || '').trim();
    if (search) { const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); query.$or = [{ incidentCode: { $regex: safe, $options: 'i' } }, { title: { $regex: safe, $options: 'i' } }, { description: { $regex: safe, $options: 'i' } }, { 'contextSnapshot.title': { $regex: safe, $options: 'i' } }, { 'contextSnapshot.destination': { $regex: safe, $options: 'i' } }]; }
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(5, Number.parseInt(req.query.limit, 10) || 25));
    const sorts = { critical: { severity: -1, reportedAt: -1 }, newest: { reportedAt: -1 }, oldest: { reportedAt: 1 }, updated: { updatedAt: -1 } };
    const sort = sorts[String(req.query.sort || 'critical').toLowerCase()] || sorts.critical;
    const rowsPromise = String(req.query.sort || 'critical').toLowerCase() === 'critical'
      ? OperationalIncident.aggregate([
        { $match: query },
        { $addFields: { __severityRank: { $indexOfArray: [['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], '$severity'] } } },
        { $sort: { __severityRank: -1, reportedAt: -1 } },
        { $skip: (page - 1) * limit }, { $limit: limit }, { $unset: '__severityRank' }
      ]).then((items) => OperationalIncident.populate(items, [
        { path: 'assignedTo', select: 'name role isActive' }, { path: 'reportedBy', select: 'name role' },
        { path: 'linkedVendorId', select: 'vendorCode name types status' }, { path: 'bookingId', select: 'bookingId customer.name' }
      ]))
      : populateIncident(OperationalIncident.find(query).sort(sort).skip((page - 1) * limit).limit(limit)).lean();
    const [rows, total, allIncidents] = await Promise.all([
      rowsPromise,
      OperationalIncident.countDocuments(query),
      OperationalIncident.find(req.query.operationId ? { operationalTripId: req.query.operationId } : {}).select('status severity escalation resolvedAt').lean()
    ]);
    return res.json({ success: true, data: rows, summary: summarizeIncidents(allIncidents), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return handleOperationsError(res, error, 'Unable to load operational Incidents.'); }
};

export const listOperationalTripIncidents = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const context = await loadOperationsContext(req.params.operationId);
    const rows = await populateIncident(OperationalIncident.find({ operationalTripId: context.operationalTrip._id }).sort({ status: 1, reportedAt: -1 })).lean();
    rows.sort((left, right) => ({ CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }[right.severity] - { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }[left.severity]) || new Date(right.reportedAt) - new Date(left.reportedAt));
    return res.json({ success: true, data: rows, summary: summarizeIncidents(rows) });
  } catch (error) { return handleOperationsError(res, error, 'Unable to load journey Incidents.'); }
};

export const createOperationalIncident = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const context = await loadOperationsContext(req.params.operationId);
    const fields = validateIncidentFields(req.body);
    const booking = validateBookingInContext(req.body.bookingId, context.bookings, { required: fields.scope === 'BOOKING' });
    const [service, assignee] = await Promise.all([
      validateServiceInTrip(req.body.linkedServiceId, context.operationalTrip._id, { required: fields.scope === 'SERVICE' }),
      validateOperationsStaff(req.body.assignedTo)
    ]);
    validateIncidentScopeRelations(fields.scope, { booking, service });
    const actor = operationsActor(req); const now = new Date();
    const vendorId = service?.vendorId || service?.transportDetails?.driverVendorId || service?.guideDetails?.guideVendorId || null;
    const serviceSnapshot = service ? { serviceType: service.serviceType, title: service.title, vendorCode: service.vendorSnapshot?.vendorCode || '', vendorName: service.vendorSnapshot?.name || '' } : {};
    let incident;
    for (let attempt = 0; attempt < 5 && !incident; attempt += 1) {
      try {
        incident = await OperationalIncident.create({
          incidentCode: createIncidentCode(), operationalTripId: context.operationalTrip._id, contextSnapshot: context.contextSnapshot,
          ...fields, bookingId: booking?._id || null, linkedServiceId: service?._id || null, linkedVendorId: vendorId,
          serviceSnapshot, assignedTo: assignee?._id || null, documents: (req.body.documents || []).map((document) => ({ ...document, uploadedBy: document.uploadedBy || actor.id })),
          reportedBy: actor.id, createdBy: actor.id, updatedBy: actor.id,
          history: [{ action: 'REPORTED', fromStatus: '', toStatus: 'OPEN', actorId: actor.id, actorName: actor.name, at: now }, ...(assignee ? [{ action: 'ASSIGNED', fromStatus: 'OPEN', toStatus: 'OPEN', note: `Assigned to ${assignee.name}`, actorId: actor.id, actorName: actor.name, at: now }] : [])]
        });
      } catch (error) { if (error?.code !== 11000 || attempt === 4) throw error; }
    }
    await incident.populate('assignedTo', 'name role isActive');
    return res.status(201).json({ success: true, data: incident });
  } catch (error) { return handleOperationsError(res, error, 'Unable to report the operational Incident.'); }
};

export const getOperationalIncident = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    if (!isValidObjectId(req.params.incidentId)) return operationsFailure(res, 400, 'Invalid Incident identifier.');
    const incident = await populateIncident(OperationalIncident.findById(req.params.incidentId)).lean();
    if (!incident) return operationsFailure(res, 404, 'Operational Incident was not found.');
    const [communications, tasks] = await Promise.all([
      OperationalCommunication.find({ relatedIncidentId: incident._id }).populate('loggedBy', 'name role').sort({ occurredAt: -1 }).lean(),
      OperationalTask.find({ linkedIncidentId: incident._id }).populate('assignedTo', 'name role isActive').sort({ createdAt: -1 }).lean()
    ]);
    return res.json({ success: true, data: { incident, communications, tasks } });
  } catch (error) { return handleOperationsError(res, error, 'Unable to load the operational Incident.'); }
};

export const updateOperationalIncident = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const incident = await getIncident(req.params.incidentId);
    await assertOperationalTripOpen(incident.operationalTripId);
    if (req.body.updatedAt && !sameInstant(req.body.updatedAt, incident.updatedAt)) return operationsFailure(res, 409, 'This Incident changed while you were editing it. Refresh and try again.');
    if (Object.hasOwn(req.body, 'status') || Object.hasOwn(req.body, 'escalation')) return operationsFailure(res, 400, 'Incident lifecycle state can only be changed through explicit actions.');
    const actor = operationsActor(req); const previousDocumentCount = incident.documents.length;
    for (const key of ['title', 'description', 'incidentType', 'severity', 'actionTaken']) {
      if (!Object.hasOwn(req.body, key)) continue;
      incident[key] = ['incidentType', 'severity'].includes(key)
        ? String(req.body[key] || '').trim().toUpperCase()
        : String(req.body[key] || '').trim();
    }
    if (Object.hasOwn(req.body, 'assignedTo')) {
      const assignee = await validateOperationsStaff(req.body.assignedTo); incident.assignedTo = assignee?._id || null;
      incident.history.push({ action: 'ASSIGNED', fromStatus: incident.status, toStatus: incident.status, note: `Assigned to ${assignee?.name || 'Unassigned'}`, actorId: actor.id, actorName: actor.name, at: new Date() });
    }
    if (Object.hasOwn(req.body, 'documents')) incident.documents = (req.body.documents || []).map((document) => ({ ...document, uploadedBy: document.uploadedBy || actor.id }));
    incident.history.push({ action: incident.documents.length > previousDocumentCount ? 'DOCUMENT_ADDED' : 'DETAILS_UPDATED', fromStatus: incident.status, toStatus: incident.status, actorId: actor.id, actorName: actor.name, at: new Date() });
    incident.updatedBy = actor.id; await incident.save(); await incident.populate('assignedTo', 'name role isActive');
    return res.json({ success: true, data: incident });
  } catch (error) { return handleOperationsError(res, error, 'Unable to update the operational Incident.'); }
};

export const assignOperationalIncident = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const incident = await getIncident(req.params.incidentId); await assertOperationalTripOpen(incident.operationalTripId); const assignee = await validateOperationsStaff(req.body.assignedTo);
    if (String(incident.assignedTo || '') === String(assignee?._id || '')) return res.json({ success: true, data: incident, idempotent: true });
    const actor = operationsActor(req); incident.assignedTo = assignee?._id || null; incident.updatedBy = actor.id;
    incident.history.push({ action: 'ASSIGNED', fromStatus: incident.status, toStatus: incident.status, note: `Assigned to ${assignee?.name || 'Unassigned'}`, actorId: actor.id, actorName: actor.name, at: new Date() });
    await incident.save(); await incident.populate('assignedTo', 'name role isActive'); return res.json({ success: true, data: incident });
  } catch (error) { return handleOperationsError(res, error, 'Unable to assign the operational Incident.'); }
};

const transition = (apply, fallback) => async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const incident = await getIncident(req.params.incidentId); await assertOperationalTripOpen(incident.operationalTripId); const changed = apply(incident, req.body || {}, operationsActor(req));
    if (changed) { incident.updatedBy = req.user._id; await incident.save(); }
    await incident.populate('assignedTo', 'name role isActive'); return res.json({ success: true, data: incident, idempotent: !changed });
  } catch (error) { return handleOperationsError(res, error, fallback); }
};
export const startOperationalIncident = transition((incident, _body, actor) => startIncident(incident, actor), 'Unable to start the Incident.');
export const escalateOperationalIncident = transition((incident, body, actor) => escalateIncident(incident, body.note, actor), 'Unable to escalate the Incident.');
export const acknowledgeOperationalIncident = transition((incident, _body, actor) => acknowledgeIncidentEscalation(incident, actor), 'Unable to acknowledge the escalation.');
export const resolveOperationalIncident = transition((incident, body, actor) => resolveIncident(incident, body.resolutionSummary, actor), 'Unable to resolve the Incident.');
export const closeOperationalIncident = transition((incident, _body, actor) => closeIncident(incident, actor), 'Unable to close the Incident.');
export const reopenOperationalIncident = transition((incident, body, actor) => reopenIncident(incident, body.reason, actor), 'Unable to reopen the Incident.');
