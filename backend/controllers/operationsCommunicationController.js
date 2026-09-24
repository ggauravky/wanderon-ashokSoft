import OperationalCommunication from '../models/OperationalCommunication.js';
import {
  loadOperationsContext, validateBookingInContext, validateCorrectionInTrip, validateIncidentInTrip,
  validateServiceInTrip, validateTaskInTrip
} from '../services/operationsContextService.js';
import { validateCommunicationPayload } from '../services/operationsCommunicationService.js';
import { ensureOperationsDatabase, handleOperationsError, operationsActor } from './operationsControllerUtils.js';

export const listOperationalCommunications = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const context = await loadOperationsContext(req.params.operationId);
    const rows = await OperationalCommunication.find({ operationalTripId: context.operationalTrip._id })
      .populate('bookingId', 'bookingId customer.name')
      .populate('loggedBy', 'name role')
      .sort({ occurredAt: -1, createdAt: -1 }).limit(500).lean();
    return res.json({ success: true, data: rows, summary: { count: rows.length, latestAt: rows[0]?.occurredAt || null } });
  } catch (error) { return handleOperationsError(res, error, 'Unable to load customer communication history.'); }
};

export const createOperationalCommunication = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const context = await loadOperationsContext(req.params.operationId);
    const fields = validateCommunicationPayload(req.body);
    const booking = validateBookingInContext(req.body.bookingId, context.bookings);
    const [service, incident, task, correction] = await Promise.all([
      validateServiceInTrip(req.body.relatedServiceId, context.operationalTrip._id),
      validateIncidentInTrip(req.body.relatedIncidentId, context.operationalTrip._id),
      validateTaskInTrip(req.body.relatedTaskId, context.operationalTrip._id),
      validateCorrectionInTrip(req.body.correctionOf, context.operationalTrip._id)
    ]);
    const actor = operationsActor(req);
    const communication = await OperationalCommunication.create({
      operationalTripId: context.operationalTrip._id, contextSnapshot: context.contextSnapshot,
      bookingId: booking?._id || null, contactNameSnapshot: String(req.body.contactNameSnapshot || booking?.customer?.name || '').trim(),
      ...fields, relatedServiceId: service?._id || null, relatedIncidentId: incident?._id || null,
      relatedTaskId: task?._id || null, correctionOf: correction?._id || null, loggedBy: actor.id
    });
    if (incident) {
      incident.history.push({ action: 'CUSTOMER_UPDATED', fromStatus: incident.status, toStatus: incident.status, note: fields.summary, actorId: actor.id, actorName: actor.name, at: new Date() });
      incident.updatedBy = actor.id; await incident.save();
    }
    await communication.populate('bookingId', 'bookingId customer.name'); await communication.populate('loggedBy', 'name role');
    return res.status(201).json({ success: true, data: communication });
  } catch (error) { return handleOperationsError(res, error, 'Unable to record the customer update.'); }
};
