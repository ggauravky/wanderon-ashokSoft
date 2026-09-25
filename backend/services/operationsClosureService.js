import OperationalTripClosure from '../models/OperationalTripClosure.js';
import { OperationsDomainError } from './operationsExecutionService.js';
import { summarizeOperationalFinancials } from './operationsFinanceService.js';
import { summarizeFeedback } from './operationsFeedbackService.js';
import { summarizeTasks } from './operationsTaskService.js';
import { summarizeIncidents } from './operationsIncidentService.js';

const ACTIVE_TASK_STATUSES = new Set(['TODO', 'IN_PROGRESS', 'BLOCKED']);
const ACTIVE_INCIDENT_STATUSES = new Set(['OPEN', 'IN_PROGRESS']);

export const deriveClosureReadiness = ({ group = {}, closure = null, services = [], tasks = [], incidents = [], costs = [], settlements = [], feedback = [], bookings = [], now = new Date(), actualEndAt = null } = {}) => {
  if (closure?.closureStatus === 'CLOSED') return { status: 'CLOSED', blockers: [], exceptions: closure.exceptions || [], checks: {}, financialSummary: closure.finalSnapshot?.financialSummary || summarizeOperationalFinancials({ bookings, costs, settlements, now }), feedbackSummary: summarizeFeedback(feedback, bookings.length) };
  const effectiveEnd = actualEndAt ? new Date(actualEndAt) : group.endDate ? new Date(group.endDate) : null;
  const journeyEnded = Boolean(effectiveEnd && !Number.isNaN(effectiveEnd.getTime()) && effectiveEnd <= now);
  const nonTerminalServices = services.filter((service) => service.required && !['CONFIRMED', 'CANCELLED'].includes(service.confirmationStatus));
  const activeTasks = tasks.filter((task) => ACTIVE_TASK_STATUSES.has(task.status));
  const activeIncidents = incidents.filter((incident) => ACTIVE_INCIDENT_STATUSES.has(incident.status));
  const draftCosts = costs.filter((cost) => cost.status === 'DRAFT');
  const financialSummary = summarizeOperationalFinancials({ bookings, costs, settlements, now });
  const feedbackSummary = summarizeFeedback(feedback, bookings.length);
  const blockers = [];
  if (!journeyEnded) blockers.push({ code: effectiveEnd ? 'JOURNEY_NOT_ENDED' : 'JOURNEY_DATE_UNRESOLVED', label: effectiveEnd ? 'The travel window has not ended.' : 'The journey end date is unresolved.' });
  if (nonTerminalServices.length) blockers.push({ code: 'REQUIRED_SERVICES_ACTIVE', label: `${nonTerminalServices.length} required service${nonTerminalServices.length === 1 ? '' : 's'} are not terminal.`, count: nonTerminalServices.length });
  if (activeTasks.length) blockers.push({ code: 'ACTIVE_TASKS', label: `${activeTasks.length} operational task${activeTasks.length === 1 ? '' : 's'} remain active.`, count: activeTasks.length });
  if (activeIncidents.length) blockers.push({ code: 'ACTIVE_INCIDENTS', label: `${activeIncidents.length} Incident${activeIncidents.length === 1 ? '' : 's'} remain unresolved.`, count: activeIncidents.length });
  if (draftCosts.length) blockers.push({ code: 'DRAFT_COSTS', label: `${draftCosts.length} operational cost${draftCosts.length === 1 ? '' : 's'} remain in Draft.`, count: draftCosts.length, amount: financialSummary.draftCost });
  const exceptions = [];
  const cancelledRequired = services.filter((service) => service.required && service.confirmationStatus === 'CANCELLED');
  if (cancelledRequired.length) exceptions.push(`${cancelledRequired.length} required service${cancelledRequired.length === 1 ? ' was' : 's were'} cancelled.`);
  if (financialSummary.vendorOutstanding > 0) exceptions.push(`INR ${financialSummary.vendorOutstanding} Vendor balance remains outstanding.`);
  if (feedbackSummary.feedbackRecords < bookings.length) exceptions.push(`${bookings.length - feedbackSummary.feedbackRecords} eligible Booking${bookings.length - feedbackSummary.feedbackRecords === 1 ? '' : 's'} have no feedback recorded.`);
  return {
    status: blockers.length ? 'NOT_READY' : 'READY', blockers, exceptions,
    checks: {
      journeyEnded, requiredServicesTerminal: nonTerminalServices.length === 0, tasksComplete: activeTasks.length === 0,
      incidentsResolved: activeIncidents.length === 0, costsFinalized: draftCosts.length === 0,
      vendorSettlementsComplete: financialSummary.vendorOutstanding === 0
    },
    financialSummary, feedbackSummary
  };
};

export const validateOutstandingAcknowledgement = (readiness, payload = {}) => {
  if (readiness.financialSummary.vendorOutstanding <= 0) return null;
  const note = String(payload.outstandingSettlementNote || '').trim();
  if (payload.acknowledgeOutstandingSettlements !== true || note.length < 10) {
    throw new OperationsDomainError(409, 'Acknowledge the outstanding Vendor balance with a meaningful settlement note before closure.', 'OUTSTANDING_SETTLEMENT_ACKNOWLEDGEMENT_REQUIRED');
  }
  return note;
};

export const assertOperationalTripOpen = async (operationalTripId) => {
  const closure = await OperationalTripClosure.findOne({ operationalTripId, closureStatus: 'CLOSED' }).select('_id').lean();
  if (closure) throw new OperationsDomainError(409, 'This operational journey is closed. Reopen it before making changes.', 'OPERATIONAL_TRIP_CLOSED');
};

export const buildClosureSnapshot = ({ context, readiness, services, tasks, incidents, feedback }) => ({
  operationKey: context.operationalTrip.operationKey,
  title: context.group.title,
  destination: context.group.destination,
  startDate: context.group.startDate,
  endDate: context.group.endDate,
  actualEndAt: null,
  bookingCount: context.bookings.length,
  travelerCount: context.bookings.reduce((sum, booking) => sum + Number(booking.numberOfTravelers || 0), 0),
  serviceSummary: {
    total: services.length,
    confirmed: services.filter((item) => item.confirmationStatus === 'CONFIRMED').length,
    cancelled: services.filter((item) => item.confirmationStatus === 'CANCELLED').length
  },
  taskSummary: summarizeTasks(tasks),
  incidentSummary: summarizeIncidents(incidents),
  financialSummary: readiness.financialSummary,
  feedbackSummary: readiness.feedbackSummary
});
