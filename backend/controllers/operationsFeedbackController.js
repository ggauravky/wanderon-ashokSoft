import OperationalFeedback, { OPERATIONAL_FEEDBACK_CHANNELS } from '../models/OperationalFeedback.js';
import { assertOperationalTripOpen } from '../services/operationsClosureService.js';
import { feedbackPayload, summarizeFeedback } from '../services/operationsFeedbackService.js';
import { loadOperationsContext, validateBookingInContext } from '../services/operationsContextService.js';
import { OperationsDomainError } from '../services/operationsExecutionService.js';
import { ensureOperationsDatabase, handleOperationsError, operationsActor, operationsFailure, sameInstant } from './operationsControllerUtils.js';

const validatePayload = (body) => {
  const payload = feedbackPayload(body);
  if (!OPERATIONAL_FEEDBACK_CHANNELS.includes(payload.sourceChannel)) throw new OperationsDomainError(400, 'A valid feedback source channel is required.', 'INVALID_FEEDBACK_CHANNEL');
  if (Number.isNaN(payload.receivedAt.getTime())) throw new OperationsDomainError(400, 'A valid feedback received date is required.', 'INVALID_FEEDBACK_DATE');
  if (![payload.comments, payload.highlights, payload.concerns].some(Boolean) && payload.rating === null) throw new OperationsDomainError(400, 'Record a rating or factual feedback details.', 'EMPTY_FEEDBACK');
  return payload;
};

export const listOperationalFeedback = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const context = await loadOperationsContext(req.params.operationId);
    const rows = await OperationalFeedback.find({ operationalTripId: context.operationalTrip._id }).populate('recordedBy updatedBy', 'name role').sort({ receivedAt: -1 }).lean();
    return res.json({ success: true, data: rows, summary: summarizeFeedback(rows, context.bookings.length), eligibleBookings: context.bookings.map((booking) => ({ _id: booking._id, bookingId: booking.bookingId, customerName: booking.customer?.name || 'Traveler' })) });
  } catch (error) { return handleOperationsError(res, error, 'Unable to load customer feedback.'); }
};

export const createOperationalFeedback = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const context = await loadOperationsContext(req.params.operationId); await assertOperationalTripOpen(context.operationalTrip._id);
    const booking = validateBookingInContext(req.body.bookingId, context.bookings, { required: true });
    const actor = operationsActor(req); const payload = validatePayload(req.body);
    const record = await OperationalFeedback.findOneAndUpdate(
      { operationalTripId: context.operationalTrip._id, bookingId: booking._id },
      { $set: { ...payload, updatedBy: actor.id }, $setOnInsert: { contextSnapshot: context.contextSnapshot, customerSnapshot: { name: booking.customer?.name || 'Traveler', bookingId: booking.bookingId }, recordedBy: actor.id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return res.status(201).json({ success: true, data: record });
  } catch (error) { return handleOperationsError(res, error, 'Unable to record customer feedback.'); }
};

export const updateOperationalFeedback = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const record = await OperationalFeedback.findById(req.params.feedbackId);
    if (!record) return operationsFailure(res, 404, 'Customer feedback was not found.');
    await assertOperationalTripOpen(record.operationalTripId);
    if (req.body.updatedAt && !sameInstant(req.body.updatedAt, record.updatedAt)) return operationsFailure(res, 409, 'This feedback changed while you were editing it. Refresh and try again.');
    Object.assign(record, validatePayload({ ...record.toObject(), ...req.body })); record.updatedBy = req.user._id;
    await record.save(); return res.json({ success: true, data: record });
  } catch (error) { return handleOperationsError(res, error, 'Unable to update customer feedback.'); }
};
