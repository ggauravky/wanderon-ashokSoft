import OperationalCost from '../models/OperationalCost.js';
import OperationalFeedback from '../models/OperationalFeedback.js';
import OperationalIncident from '../models/OperationalIncident.js';
import OperationalService from '../models/OperationalService.js';
import OperationalSettlement from '../models/OperationalSettlement.js';
import OperationalTask from '../models/OperationalTask.js';
import OperationalTripClosure from '../models/OperationalTripClosure.js';
import { buildClosureSnapshot, deriveClosureReadiness, validateOutstandingAcknowledgement } from '../services/operationsClosureService.js';
import { loadOperationsContext } from '../services/operationsContextService.js';
import { OperationsDomainError } from '../services/operationsExecutionService.js';
import { ensureOperationsDatabase, handleOperationsError, operationsActor, operationsFailure } from './operationsControllerUtils.js';

const loadClosureState = async (operationId, actualEndAt = null) => {
  const context = await loadOperationsContext(operationId);
  const [closure, services, tasks, incidents, costs, settlements, feedback] = await Promise.all([
    OperationalTripClosure.findOne({ operationalTripId: context.operationalTrip._id }),
    OperationalService.find({ operationalTripId: context.operationalTrip._id }).lean(),
    OperationalTask.find({ operationalTripId: context.operationalTrip._id }).lean(),
    OperationalIncident.find({ operationalTripId: context.operationalTrip._id }).lean(),
    OperationalCost.find({ operationalTripId: context.operationalTrip._id }).lean(),
    OperationalSettlement.find({ operationalTripId: context.operationalTrip._id }).lean(),
    OperationalFeedback.find({ operationalTripId: context.operationalTrip._id }).lean()
  ]);
  const readiness = deriveClosureReadiness({ group: context.group, closure, services, tasks, incidents, costs, settlements, feedback, bookings: context.bookings, actualEndAt });
  return { context, closure, services, tasks, incidents, costs, settlements, feedback, readiness };
};

export const getOperationalClosure = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const state = await loadClosureState(req.params.operationId);
    if (state.closure) await state.closure.populate('closedBy reopenedBy outstandingSettlementAcknowledgement.acknowledgedBy', 'name role');
    return res.json({ success: true, data: { closure: state.closure, closureReadiness: state.readiness } });
  } catch (error) { return handleOperationsError(res, error, 'Unable to load Trip Closure.'); }
};

export const closeOperationalTrip = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const actualEndAt = req.body.actualEndAt ? new Date(req.body.actualEndAt) : null;
    if (actualEndAt && Number.isNaN(actualEndAt.getTime())) return operationsFailure(res, 400, 'A valid actual end date is required.');
    const state = await loadClosureState(req.params.operationId, actualEndAt);
    if (state.closure?.closureStatus === 'CLOSED') return res.json({ success: true, data: state.closure, idempotent: true });
    if (!state.context.group.endDate && actualEndAt && !['admin', 'super_admin'].includes(String(req.user.role))) {
      return operationsFailure(res, 403, 'Only an Administrator may close a journey whose source travel dates are unresolved.', 'DATE_OVERRIDE_FORBIDDEN');
    }
    const scheduledEnd = state.context.group.endDate ? new Date(state.context.group.endDate) : null;
    if (actualEndAt && scheduledEnd && actualEndAt < scheduledEnd && state.incidents.length === 0 && String(req.body.closureSummary || '').trim().length < 20) {
      return operationsFailure(res, 400, 'Early closure requires clear explanation or Incident context.', 'EARLY_CLOSURE_CONTEXT_REQUIRED');
    }
    if (state.readiness.status !== 'READY') throw new OperationsDomainError(409, 'This operational journey is not ready for closure.', 'TRIP_NOT_READY_FOR_CLOSURE');
    const note = validateOutstandingAcknowledgement(state.readiness, req.body);
    const closureSummary = String(req.body.closureSummary || '').trim();
    if (!closureSummary) return operationsFailure(res, 400, 'A closure summary is required.', 'CLOSURE_SUMMARY_REQUIRED');
    const actor = operationsActor(req); const now = new Date();
    const finalSnapshot = buildClosureSnapshot(state); finalSnapshot.actualEndAt = actualEndAt;
    const closure = state.closure || new OperationalTripClosure({ operationalTripId: state.context.operationalTrip._id });
    closure.closureStatus = 'CLOSED'; closure.actualEndAt = actualEndAt; closure.closureSummary = closureSummary; closure.exceptions = state.readiness.exceptions; closure.finalSnapshot = finalSnapshot; closure.closedAt = now; closure.closedBy = actor.id;
    closure.outstandingSettlementAcknowledgement = note ? { acknowledged: true, note, acknowledgedAt: now, acknowledgedBy: actor.id } : { acknowledged: false, note: '', acknowledgedAt: null, acknowledgedBy: null };
    closure.history.push({ action: 'CLOSED', note: closureSummary, actorId: actor.id, actorName: actor.name, at: now, snapshot: finalSnapshot });
    await closure.save(); await closure.populate('closedBy', 'name role');
    return res.json({ success: true, data: closure });
  } catch (error) { return handleOperationsError(res, error, 'Unable to close the operational journey.'); }
};

export const reopenOperationalTrip = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const reason = String(req.body.reason || '').trim();
    if (reason.length < 10) return operationsFailure(res, 400, 'A meaningful reopen reason is required.', 'REOPEN_REASON_REQUIRED');
    const context = await loadOperationsContext(req.params.operationId);
    const closure = await OperationalTripClosure.findOne({ operationalTripId: context.operationalTrip._id });
    if (!closure || closure.closureStatus !== 'CLOSED') return operationsFailure(res, 409, 'This operational journey is not closed.', 'TRIP_NOT_CLOSED');
    const actor = operationsActor(req); const now = new Date();
    closure.history.push({ action: 'REOPENED', note: reason, actorId: actor.id, actorName: actor.name, at: now, snapshot: closure.finalSnapshot });
    closure.closureStatus = 'OPEN'; closure.reopenedAt = now; closure.reopenedBy = actor.id; closure.reopenReason = reason;
    await closure.save(); await closure.populate('reopenedBy', 'name role');
    return res.json({ success: true, data: closure });
  } catch (error) { return handleOperationsError(res, error, 'Unable to reopen the operational journey.'); }
};
