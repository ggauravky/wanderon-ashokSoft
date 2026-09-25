import crypto from 'crypto';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import OperationalTrip from '../models/OperationalTrip.js';
import OperationalService from '../models/OperationalService.js';
import OperationalTask from '../models/OperationalTask.js';
import OperationalIncident from '../models/OperationalIncident.js';
import OperationalCommunication from '../models/OperationalCommunication.js';
import OperationalCost from '../models/OperationalCost.js';
import OperationalSettlement from '../models/OperationalSettlement.js';
import OperationalFeedback from '../models/OperationalFeedback.js';
import OperationalTripClosure from '../models/OperationalTripClosure.js';
import Vendor from '../models/Vendor.js';
import User from '../models/User.js';
import { OPERATIONS_DOCUMENT_TYPES } from '../models/schemas/operationsDocumentSchema.js';
import { summarizeOperationsDashboard } from '../services/operationsDashboardService.js';
import {
  bookingsForOperationalGroup,
  loadOperationalReadModel,
  resolveOperationalGroup,
  tripForBooking
} from '../services/operationsReadModelService.js';
import {
  applyServiceConfirmation,
  applyServiceDecline,
  applyVendorAssignment,
  buildExecutionBookingDto,
  buildSourceHandoffDto,
  deriveExecutionReadiness,
  enrichOperationalGroups,
  ensureOperationalTrip,
  executionMetricsFor,
  OperationsDomainError,
  vendorSupportsAssignment
} from '../services/operationsExecutionService.js';
import { isValidMongoObjectId } from '../utils/mongoId.js';
import { uploadDocument } from '../utils/cloudinaryService.js';
import { enrichGroupsWithCoordination } from '../services/operationsCoordinationService.js';
import { deriveTaskDueState, summarizeTasks } from '../services/operationsTaskService.js';
import { summarizeIncidents } from '../services/operationsIncidentService.js';
import { deriveClosureReadiness } from '../services/operationsClosureService.js';
import { summarizeOperationalFinancials } from '../services/operationsFinanceService.js';

const isDbConnected = () => mongoose.connection?.readyState === 1;
const fail = (res, status, message, code) => res.status(status).json({ success: false, message, ...(code ? { code } : {}) });
const actor = (req) => ({ id: req.user._id, name: req.user.name || '' });
const validDate = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value) : null;
const sameInstant = (left, right) => left && right && new Date(left).getTime() === new Date(right).getTime();
const ensureDatabase = (res) => {
  if (isDbConnected()) return true;
  fail(res, 503, 'Database temporarily unavailable.');
  return false;
};
const handleError = (res, error, fallback = 'Unable to complete the Operations request.') => {
  if (!isDbConnected()) return fail(res, 503, 'Database temporarily unavailable.');
  if (error instanceof OperationsDomainError) return fail(res, error.status, error.message, error.code);
  if (error?.name === 'ValidationError') return fail(res, 400, Object.values(error.errors || {})[0]?.message || 'Invalid Operations data.');
  if (error?.name === 'VersionError') return fail(res, 409, 'This record changed while you were editing it. Refresh and try again.');
  if (error?.code === 11000) return fail(res, 409, 'A record with the same unique identifier already exists.');
  console.error('Operations request error:', error?.message || error);
  return fail(res, 500, fallback);
};

const safeOperationalTrip = (trip) => {
  const value = trip?.toObject ? trip.toObject() : trip;
  if (!value) return null;
  return {
    _id: value._id,
    operationKey: value.operationKey,
    sourceType: value.sourceType,
    source: value.source,
    coordinator: value.coordinatorId || null,
    internalNotes: value.internalNotes || '',
    materializedAt: value.materializedAt,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
};

const executionView = ({ operationalTrip, group, bookings, services, readModel }) => {
  const booking = bookings[0];
  const trip = group.type === 'CATALOG' ? tripForBooking(readModel, booking) : null;
  return {
    operationalTrip: safeOperationalTrip(operationalTrip),
    group,
    bookings: bookings.map(buildExecutionBookingDto),
    services,
    readiness: deriveExecutionReadiness(services),
    sourceHandoff: buildSourceHandoffDto(bookings, trip)
  };
};

const loadExecutionView = async (operationId) => {
  if (!isValidMongoObjectId(operationId)) throw new OperationsDomainError(400, 'Invalid Operational Trip identifier.', 'INVALID_OPERATION_ID');
  const operationalTrip = await OperationalTrip.findById(operationId).populate('coordinatorId', 'name email role isActive');
  if (!operationalTrip) throw new OperationsDomainError(404, 'Operational departure no longer exists.', 'OPERATION_NOT_FOUND');
  const readModel = await loadOperationalReadModel({ includeSource: true });
  const group = resolveOperationalGroup(readModel, operationalTrip.operationKey);
  if (!group) throw new OperationsDomainError(409, 'The source Booking is no longer an eligible Operations handoff.', 'SOURCE_HANDOFF_UNAVAILABLE');
  const bookings = bookingsForOperationalGroup(readModel, group);
  const [services, tasks, incidents, communicationSummary, closure] = await Promise.all([
    OperationalService.find({ operationalTripId: operationalTrip._id }).sort({ serviceType: 1, createdAt: 1 }).lean(),
    OperationalTask.find({ operationalTripId: operationalTrip._id }).select('status priority dueAt assignedTo').lean(),
    OperationalIncident.find({ operationalTripId: operationalTrip._id }).select('status severity escalation resolvedAt').lean(),
    OperationalCommunication.aggregate([
      { $match: { operationalTripId: operationalTrip._id } },
      { $group: { _id: null, count: { $sum: 1 }, latestAt: { $max: '$occurredAt' } } }
    ]),
    OperationalTripClosure.findOne({ operationalTripId: operationalTrip._id }).select('closureStatus closedAt closedBy').populate('closedBy', 'name role').lean()
  ]);
  return {
    ...executionView({ operationalTrip, group, bookings, services, readModel }),
    taskSummary: summarizeTasks(tasks),
    incidentSummary: summarizeIncidents(incidents),
    communicationSummary: communicationSummary[0] ? { count: communicationSummary[0].count, latestAt: communicationSummary[0].latestAt } : { count: 0, latestAt: null },
    closure: closure || { closureStatus: 'OPEN' }
  };
};

export const getOperationsDashboard = async (req, res) => {
  try {
    if (!isDbConnected()) return fail(res, 503, 'Operations dashboard is temporarily unavailable.');
    const readModel = await loadOperationalReadModel();
    const operationKeys = readModel.groups.map((group) => group.operationKey);
    const [awaitingHandoff, operationalTrips, activeVendors] = await Promise.all([
      Booking.countDocuments({ bookingStatus: 'PENDING_PAYMENT' }),
      OperationalTrip.find({ operationKey: { $in: operationKeys } }).lean(),
      Vendor.countDocuments({ status: 'ACTIVE' })
    ]);
    const operationIds = operationalTrips.map((trip) => trip._id);
    const [services, tasks, incidents, costs, settlements, feedback, closures] = operationIds.length ? await Promise.all([
      OperationalService.find({ operationalTripId: { $in: operationIds } }).lean(),
      OperationalTask.find({ operationalTripId: { $in: operationIds } }).populate('assignedTo', 'name role').lean(),
      OperationalIncident.find({ operationalTripId: { $in: operationIds } }).populate('assignedTo', 'name role').lean(),
      OperationalCost.find({ operationalTripId: { $in: operationIds } }).lean(),
      OperationalSettlement.find({ operationalTripId: { $in: operationIds } }).lean(),
      OperationalFeedback.find({ operationalTripId: { $in: operationIds } }).lean(),
      OperationalTripClosure.find({ operationalTripId: { $in: operationIds } }).lean()
    ]) : [[], [], [], [], [], [], []];
    const base = summarizeOperationsDashboard(readModel.bookings, readModel.tripLookups, { now: readModel.now, awaitingHandoff });
    const executionEnriched = enrichOperationalGroups(readModel.groups, operationalTrips, services);
    const coordinated = enrichGroupsWithCoordination(executionEnriched, tasks, incidents, readModel.now);
    const tripByKey = new Map(operationalTrips.map((trip) => [trip.operationKey, trip]));
    const closureByTrip = new Map(closures.map((closure) => [String(closure.operationalTripId), closure]));
    const forTrip = (items, trip) => items.filter((item) => String(item.operationalTripId) === String(trip?._id));
    const enriched = coordinated.map((group) => {
      const trip = tripByKey.get(group.operationKey);
      if (!trip) return group;
      const closureReadiness = deriveClosureReadiness({
        group, closure: closureByTrip.get(String(trip._id)), services: forTrip(services, trip), tasks: forTrip(tasks, trip),
        incidents: forTrip(incidents, trip), costs: forTrip(costs, trip), settlements: forTrip(settlements, trip),
        feedback: forTrip(feedback, trip), bookings: bookingsForOperationalGroup(readModel, group), now: readModel.now
      });
      const financialReasons = [];
      if (closureReadiness.financialSummary.draftCostCount) financialReasons.push({ code: 'UNFINALIZED_OPERATIONAL_COST', label: 'Operational costs remain in Draft', severity: 'MEDIUM', count: closureReadiness.financialSummary.draftCostCount });
      if (closureReadiness.financialSummary.overdueVendorAmount > 0) financialReasons.push({ code: 'VENDOR_SETTLEMENT_OVERDUE', label: 'Vendor settlement is overdue', severity: 'MEDIUM' });
      else if (closureReadiness.financialSummary.vendorOutstanding > 0) financialReasons.push({ code: 'OUTSTANDING_VENDOR_SETTLEMENT', label: 'Vendor settlement remains outstanding', severity: 'MEDIUM' });
      if (group.operationalPhase === 'COMPLETED' && closureReadiness.status === 'NOT_READY') financialReasons.push({ code: 'TRIP_CLOSURE_BLOCKED', label: 'Completed journey has closure blockers', severity: 'MEDIUM', count: closureReadiness.blockers.length });
      const reasons = [...(group.attention?.reasons || []), ...financialReasons];
      return { ...group, closureReadiness, attention: { required: reasons.length > 0, severity: reasons.some((item) => item.severity === 'HIGH') ? 'HIGH' : reasons.length ? 'MEDIUM' : 'NONE', reasons } };
    });
    const byKey = new Map(enriched.map((group) => [group.operationKey, group]));
    const section = (groups) => groups.map((group) => byKey.get(group.operationKey) || group);
    const attention = enriched
      .filter((group) => group.attention.required)
      .sort((left, right) => (right.attention.severity === 'HIGH') - (left.attention.severity === 'HIGH') || String(left.startDate).localeCompare(String(right.startDate)));
    const operationsFinancials = summarizeOperationalFinancials({ bookings: readModel.bookings, costs, settlements, now: readModel.now });
    return res.json({
      ...base,
      summary: {
        ...base.summary,
        attentionRequired: attention.length,
        ...executionMetricsFor(enriched, activeVendors),
        openTasks: tasks.filter((task) => !['COMPLETED', 'CANCELLED'].includes(task.status)).length,
        overdueTasks: tasks.filter((task) => deriveTaskDueState(task, readModel.now) === 'OVERDUE').length,
        openIncidents: incidents.filter((incident) => ['OPEN', 'IN_PROGRESS'].includes(incident.status)).length,
        criticalIncidents: incidents.filter((incident) => ['OPEN', 'IN_PROGRESS'].includes(incident.status) && incident.severity === 'CRITICAL').length,
        tripsReadyForClosure: enriched.filter((group) => group.closureReadiness?.status === 'READY').length,
        outstandingVendorBalance: operationsFinancials.vendorOutstanding,
        overdueVendorSettlements: operationsFinancials.overdueVendorAmount,
        unfinalizedCosts: operationsFinancials.draftCostCount
      },
      urgentTasks: tasks
        .filter((task) => !['COMPLETED', 'CANCELLED'].includes(task.status) && (
          deriveTaskDueState(task, readModel.now) === 'OVERDUE'
          || task.priority === 'CRITICAL'
          || (task.priority === 'HIGH' && task.dueAt && new Date(task.dueAt) <= new Date(readModel.now.getTime() + 3 * 86400000))
        ))
        .sort((left, right) => Number(new Date(left.dueAt || '9999-12-31')) - Number(new Date(right.dueAt || '9999-12-31')))
        .slice(0, 8),
      activeIncidents: incidents
        .filter((incident) => ['OPEN', 'IN_PROGRESS'].includes(incident.status))
        .sort((left, right) => ({ CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }[right.severity] - { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }[left.severity]) || new Date(right.reportedAt) - new Date(left.reportedAt))
        .slice(0, 8),
      attention,
      ongoing: section(base.ongoing),
      upcoming: section(base.upcoming),
      recentlyCompleted: section(base.recentlyCompleted),
      unresolved: section(base.unresolved)
    });
  } catch (error) {
    console.error('Operations dashboard error:', error.message);
    if (!isDbConnected()) return fail(res, 503, 'Operations dashboard is temporarily unavailable.');
    return fail(res, 500, 'Unable to load Operations dashboard.');
  }
};

export const listOperationalTrips = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const readModel = await loadOperationalReadModel();
    const operationKeys = readModel.groups.map((group) => group.operationKey);
    const operationalTrips = await OperationalTrip.find({ operationKey: { $in: operationKeys } })
      .populate('coordinatorId', 'name email role isActive')
      .lean();
    const operationIds = operationalTrips.map((trip) => trip._id);
    const [services, tasks, incidents] = operationIds.length ? await Promise.all([
      OperationalService.find({ operationalTripId: { $in: operationIds } }).lean(),
      OperationalTask.find({ operationalTripId: { $in: operationIds } }).lean(),
      OperationalIncident.find({ operationalTripId: { $in: operationIds } }).lean()
    ]) : [[], [], []];
    let rows = enrichGroupsWithCoordination(enrichOperationalGroups(readModel.groups, operationalTrips, services), tasks, incidents, readModel.now);
    const search = String(req.query.search || '').trim().toLowerCase();
    const phase = String(req.query.phase || 'all').toUpperCase();
    const readiness = String(req.query.readiness || 'all').toUpperCase();
    const sourceType = String(req.query.sourceType || 'all').toUpperCase();
    const coordinator = String(req.query.coordinator || 'all');
    const from = validDate(req.query.from);
    const to = validDate(req.query.to);
    if (search) rows = rows.filter((row) => [row.title, row.destination, ...(row.bookingIds || [])].some((value) => String(value || '').toLowerCase().includes(search)));
    if (phase !== 'ALL') rows = rows.filter((row) => row.operationalPhase === phase);
    if (readiness !== 'ALL') rows = rows.filter((row) => row.execution.readiness.status === readiness);
    if (sourceType !== 'ALL') rows = rows.filter((row) => row.type === sourceType);
    if (req.query.attentionOnly === 'true') rows = rows.filter((row) => row.attention.required);
    if (coordinator !== 'all') rows = rows.filter((row) => String(row.execution.coordinator?._id || row.execution.coordinator || '') === coordinator);
    if (from) rows = rows.filter((row) => row.startDate && new Date(row.startDate) >= from);
    if (to) rows = rows.filter((row) => row.startDate && new Date(row.startDate) <= to);
    const sort = String(req.query.sort || 'soonest');
    if (sort === 'attention') rows.sort((left, right) => (right.attention.severity === 'HIGH') - (left.attention.severity === 'HIGH') || String(left.startDate || '9999').localeCompare(String(right.startDate || '9999')));
    else if (sort === 'recent') rows.sort((left, right) => String(right.execution.updatedAt || right.latestBookingAt || '').localeCompare(String(left.execution.updatedAt || left.latestBookingAt || '')));
    else rows.sort((left, right) => String(left.startDate || '9999').localeCompare(String(right.startDate || '9999')));
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(5, Number.parseInt(req.query.limit, 10) || 20));
    const total = rows.length;
    return res.json({ success: true, data: rows.slice((page - 1) * limit, page * limit), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleError(res, error, 'Unable to load Trip Execution.');
  }
};

export const ensureOperationalTripController = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const operationKey = String(req.body.operationKey || '').trim();
    if (!operationKey) return fail(res, 400, 'operationKey is required.');
    const result = await ensureOperationalTrip({ operationKey, actor: actor(req) });
    return res.json({ success: true, data: executionView(result) });
  } catch (error) {
    return handleError(res, error, 'Unable to open this operational departure.');
  }
};

export const getOperationalTrip = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    return res.json({ success: true, data: await loadExecutionView(req.params.operationId) });
  } catch (error) {
    return handleError(res, error, 'Unable to load Trip Execution.');
  }
};

export const updateOperationalTrip = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    if (!isValidMongoObjectId(req.params.operationId)) return fail(res, 400, 'Invalid Operational Trip identifier.');
    const trip = await OperationalTrip.findById(req.params.operationId);
    if (!trip) return fail(res, 404, 'Operational departure no longer exists.');
    if (req.body.updatedAt && !sameInstant(req.body.updatedAt, trip.updatedAt)) return fail(res, 409, 'This record changed while you were editing it. Refresh and try again.');
    if (Object.hasOwn(req.body, 'internalNotes')) trip.internalNotes = String(req.body.internalNotes || '').trim();
    if (Object.hasOwn(req.body, 'coordinatorId')) {
      const coordinatorId = String(req.body.coordinatorId || '');
      if (!coordinatorId) {
        trip.coordinatorId = null;
        trip.coordinatorAssignedAt = null;
        trip.coordinatorAssignedBy = null;
      } else {
        if (!isValidMongoObjectId(coordinatorId)) return fail(res, 400, 'Invalid coordinator identifier.');
        const coordinator = await User.findOne({ _id: coordinatorId, isActive: true, role: { $in: ['operations', 'admin', 'super_admin'] } }).select('_id');
        if (!coordinator) return fail(res, 400, 'Coordinator must be an active Operations or Administrator account.');
        trip.coordinatorId = coordinator._id;
        trip.coordinatorAssignedAt = new Date();
        trip.coordinatorAssignedBy = req.user._id;
      }
    }
    trip.updatedBy = req.user._id;
    await trip.save();
    return res.json({ success: true, data: await loadExecutionView(trip._id) });
  } catch (error) {
    return handleError(res, error, 'Unable to update Trip Execution.');
  }
};

export const getOperationsCoordinators = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const search = String(req.query.search || '').trim();
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = { isActive: true, role: { $in: ['operations', 'admin', 'super_admin'] } };
    if (search) query.$or = [{ name: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }];
    const users = await User.find(query).select('_id name email role').sort({ name: 1 }).limit(50).lean();
    return res.json({ success: true, data: users });
  } catch (error) {
    return handleError(res, error, 'Unable to load Operations coordinators.');
  }
};

const getService = async (operationId, serviceId) => {
  if (!isValidMongoObjectId(operationId) || !isValidMongoObjectId(serviceId)) throw new OperationsDomainError(400, 'Invalid service identifier.');
  const service = await OperationalService.findOne({ _id: serviceId, operationalTripId: operationId });
  if (!service) throw new OperationsDomainError(404, 'Operational service was not found.');
  return service;
};

const servicePayload = (body, req) => {
  const allowed = ['title', 'required', 'bookingReference', 'internalNotes', 'schedule', 'hotelDetails', 'transportDetails', 'activityDetails', 'guideDetails'];
  const payload = Object.fromEntries(allowed.filter((key) => Object.hasOwn(body, key)).map((key) => [key, body[key]]));
  if (Object.hasOwn(body, 'documents')) payload.documents = (body.documents || []).map((document) => ({ ...document, uploadedBy: document.uploadedBy || req.user._id }));
  return payload;
};

export const listOperationalServices = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    if (!isValidMongoObjectId(req.params.operationId)) return fail(res, 400, 'Invalid Operational Trip identifier.');
    const services = await OperationalService.find({ operationalTripId: req.params.operationId }).sort({ serviceType: 1, createdAt: 1 }).lean();
    return res.json({ success: true, data: services, readiness: deriveExecutionReadiness(services) });
  } catch (error) {
    return handleError(res, error, 'Unable to load operational services.');
  }
};

export const createOperationalService = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    if (!isValidMongoObjectId(req.params.operationId)) return fail(res, 400, 'Invalid Operational Trip identifier.');
    if (!await OperationalTrip.exists({ _id: req.params.operationId })) return fail(res, 404, 'Operational departure no longer exists.');
    const serviceType = String(req.body.serviceType || '').toUpperCase();
    if (!['HOTEL', 'TRANSPORT', 'ACTIVITY', 'GUIDE'].includes(serviceType)) return fail(res, 400, 'A valid serviceType is required.');
    const service = await OperationalService.create({
      operationalTripId: req.params.operationId,
      serviceKey: `manual:${serviceType.toLowerCase()}:${crypto.randomUUID()}`,
      serviceType,
      source: { type: 'MANUAL' },
      ...servicePayload(req.body, req),
      title: String(req.body.title || '').trim() || `${serviceType[0]}${serviceType.slice(1).toLowerCase()} service`,
      confirmationStatus: 'UNASSIGNED',
      createdBy: req.user._id,
      updatedBy: req.user._id,
      history: [{ action: 'CREATED', toStatus: 'UNASSIGNED', actorId: req.user._id, actorName: req.user.name || '', at: new Date() }]
    });
    return res.status(201).json({ success: true, data: service });
  } catch (error) {
    return handleError(res, error, 'Unable to add the operational service.');
  }
};

export const updateOperationalService = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const service = await getService(req.params.operationId, req.params.serviceId);
    if (req.body.updatedAt && !sameInstant(req.body.updatedAt, service.updatedAt)) return fail(res, 409, 'This service changed while you were editing it. Refresh and try again.');
    const payload = servicePayload(req.body, req);
    const nestedKeys = ['schedule', 'hotelDetails', 'activityDetails', 'guideDetails'];
    for (const key of nestedKeys) {
      if (!Object.hasOwn(payload, key)) continue;
      service.set(key, { ...(service[key]?.toObject?.() || service[key] || {}), ...payload[key] });
      delete payload[key];
    }
    if (Object.hasOwn(payload, 'transportDetails')) {
      const current = service.transportDetails?.toObject?.() || service.transportDetails || {};
      service.set('transportDetails', {
        ...current,
        ...payload.transportDetails,
        route: { ...(current.route || {}), ...(payload.transportDetails.route || {}) },
        driverVendorId: current.driverVendorId || null,
        driverSnapshot: current.driverSnapshot || {}
      });
      delete payload.transportDetails;
    }
    Object.assign(service, payload);
    service.updatedBy = req.user._id;
    service.history.push({ action: 'DETAILS_UPDATED', fromStatus: service.confirmationStatus, toStatus: service.confirmationStatus, actorId: req.user._id, actorName: req.user.name || '', at: new Date() });
    await service.save();
    return res.json({ success: true, data: service });
  } catch (error) {
    return handleError(res, error, 'Unable to update the operational service.');
  }
};

export const assignServiceVendor = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const service = await getService(req.params.operationId, req.params.serviceId);
    if (!isValidMongoObjectId(req.body.vendorId)) return fail(res, 400, 'Invalid Vendor identifier.');
    const vendor = await Vendor.findById(req.body.vendorId).lean();
    if (!vendor) return fail(res, 404, 'Vendor was not found.');
    applyVendorAssignment(service, vendor, actor(req));
    await service.save();
    return res.json({ success: true, data: service });
  } catch (error) {
    return handleError(res, error, 'Unable to assign the Vendor.');
  }
};

export const assignTransportDriver = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const service = await getService(req.params.operationId, req.params.serviceId);
    if (service.serviceType !== 'TRANSPORT') return fail(res, 400, 'Drivers can only be assigned to Transport services.');
    let snapshot = {
      name: String(req.body.name || '').trim(), phone: String(req.body.phone || '').trim(), licenseNumber: String(req.body.licenseNumber || '').trim()
    };
    let driverVendorId = null;
    if (req.body.vendorId) {
      if (!isValidMongoObjectId(req.body.vendorId)) return fail(res, 400, 'Invalid Driver Vendor identifier.');
      const vendor = await Vendor.findById(req.body.vendorId).lean();
      if (!vendor) return fail(res, 404, 'Driver Vendor was not found.');
      if (!vendorSupportsAssignment(service.serviceType, vendor, { driver: true })) return fail(res, 400, vendor.status !== 'ACTIVE' ? 'This Vendor is inactive and cannot be assigned.' : 'Selected Vendor is not a Driver.');
      driverVendorId = vendor._id;
      snapshot = { name: vendor.contact?.personName || vendor.name, phone: vendor.contact?.phone || vendor.contact?.whatsapp || '', licenseNumber: String(req.body.licenseNumber || '').trim() };
    }
    if (!snapshot.name || !snapshot.phone) return fail(res, 400, 'Driver name and phone are required.');
    service.transportDetails.driverVendorId = driverVendorId;
    service.transportDetails.driverSnapshot = snapshot;
    service.updatedBy = req.user._id;
    service.history.push({ action: 'DRIVER_ASSIGNED', fromStatus: service.confirmationStatus, toStatus: service.confirmationStatus, actorId: req.user._id, actorName: req.user.name || '', at: new Date() });
    await service.save();
    return res.json({ success: true, data: service });
  } catch (error) {
    return handleError(res, error, 'Unable to assign the Driver.');
  }
};

export const confirmOperationalService = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const service = await getService(req.params.operationId, req.params.serviceId);
    applyServiceConfirmation(service, req.body, actor(req));
    await service.save();
    return res.json({ success: true, data: service });
  } catch (error) {
    return handleError(res, error, 'Unable to confirm the operational service.');
  }
};

export const declineOperationalService = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const service = await getService(req.params.operationId, req.params.serviceId);
    applyServiceDecline(service, req.body.reason, actor(req));
    await service.save();
    return res.json({ success: true, data: service });
  } catch (error) {
    return handleError(res, error, 'Unable to decline the operational service.');
  }
};

export const cancelOperationalService = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const service = await getService(req.params.operationId, req.params.serviceId);
    if (service.confirmationStatus === 'CANCELLED') return fail(res, 409, 'This service is already cancelled.');
    const fromStatus = service.confirmationStatus;
    service.confirmationStatus = 'CANCELLED';
    service.updatedBy = req.user._id;
    service.history.push({ action: 'CANCELLED', fromStatus, toStatus: 'CANCELLED', note: String(req.body.reason || '').trim(), actorId: req.user._id, actorName: req.user.name || '', at: new Date() });
    await service.save();
    return res.json({ success: true, data: service });
  } catch (error) {
    return handleError(res, error, 'Unable to cancel the operational service.');
  }
};

export const uploadOperationsDocument = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    if (!req.file) return fail(res, 400, 'No document file provided.');
    const type = String(req.body.type || 'OTHER').toUpperCase();
    if (!OPERATIONS_DOCUMENT_TYPES.includes(type)) return fail(res, 400, 'Invalid Operations document type.');
    const result = await uploadDocument(req.file.buffer, req.file.originalname, 'wanderluxe/operations', req.file.mimetype);
    if (!result?.secure_url || !result?.public_id) return fail(res, 502, 'Document storage did not return a valid upload result.');
    return res.status(201).json({
      success: true,
      data: {
        documentId: `opdoc_${crypto.randomUUID()}`,
        type,
        title: String(req.body.title || req.file.originalname).trim(),
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size || result.bytes || 0,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        expiryDate: validDate(req.body.expiryDate),
        uploadedAt: new Date(),
        uploadedBy: req.user._id
      }
    });
  } catch (error) {
    return handleError(res, error, 'Unable to upload the Operations document.');
  }
};
