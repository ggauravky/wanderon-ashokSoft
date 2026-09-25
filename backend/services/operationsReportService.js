import { deriveExecutionReadiness } from './operationsExecutionService.js';
import { deriveTaskDueState } from './operationsTaskService.js';
import { summarizeOperationalFinancials, summarizeVendors } from './operationsFinanceService.js';
import { summarizeFeedback } from './operationsFeedbackService.js';

export const OPERATIONS_REPORT_DEFINITIONS = Object.freeze({
  tripVolumeBasis: 'Travel window / departure date',
  closureBasis: 'closedAt',
  financialCostBasis: 'OperationalCost incurredAt',
  settlementBasis: 'OperationalSettlement paidAt',
  taskCompletionRate: 'Completed / (Completed + active non-cancelled tasks)'
});

export const buildOperationsReport = ({ groups = [], trips = [], services = [], tasks = [], incidents = [], costs = [], settlements = [], feedback = [], closures = [], bookings = [], now = new Date() } = {}) => {
  const financial = summarizeOperationalFinancials({ bookings, costs, settlements, now });
  const feedbackSummary = summarizeFeedback(feedback, bookings.length);
  const applicableTasks = tasks.filter((task) => task.status !== 'CANCELLED');
  const completedTasks = tasks.filter((task) => task.status === 'COMPLETED').length;
  const activeIncidents = incidents.filter((incident) => ['OPEN', 'IN_PROGRESS'].includes(incident.status));
  const resolvedIncidents = incidents.filter((incident) => ['RESOLVED', 'CLOSED'].includes(incident.status));
  const resolutionDurations = incidents.filter((incident) => incident.reportedAt && incident.resolvedAt).map((incident) => new Date(incident.resolvedAt) - new Date(incident.reportedAt));
  const requiredServices = services.filter((service) => service.required);
  const categories = Object.fromEntries(['HOTEL', 'TRANSPORT', 'ACTIVITY', 'GUIDE', 'PERMIT', 'MEALS', 'INCIDENT', 'MISCELLANEOUS'].map((category) => [category, 0]));
  costs.filter((cost) => cost.status === 'FINALIZED').forEach((cost) => { categories[cost.category] = (categories[cost.category] || 0) + Number(cost.totalAmount || 0); });
  return {
    success: true,
    generatedAt: now.toISOString(),
    definitions: OPERATIONS_REPORT_DEFINITIONS,
    overview: {
      operationalTrips: groups.length,
      closedTrips: closures.filter((item) => item.closureStatus === 'CLOSED').length,
      bookings: bookings.length,
      travelers: bookings.reduce((sum, booking) => sum + Number(booking.numberOfTravelers || 0), 0),
      readyServiceRate: requiredServices.length ? Math.round((requiredServices.filter((item) => item.confirmationStatus === 'CONFIRMED').length / requiredServices.length) * 10000) / 100 : null,
      tasksCompleted: completedTasks,
      issuesReported: incidents.length,
      feedbackCoverage: feedbackSummary.coveragePercent,
      materializedTrips: trips.length,
      readyTrips: trips.filter((trip) => deriveExecutionReadiness(services.filter((service) => String(service.operationalTripId) === String(trip._id))).status === 'READY').length
    },
    financial,
    costCategories: categories,
    vendors: summarizeVendors(costs, settlements, services, now),
    execution: {
      requiredServicesConfirmed: requiredServices.filter((item) => item.confirmationStatus === 'CONFIRMED').length,
      cancelledRequiredServices: requiredServices.filter((item) => item.confirmationStatus === 'CANCELLED').length,
      totalTasks: tasks.length,
      completedTasks,
      cancelledTasks: tasks.filter((task) => task.status === 'CANCELLED').length,
      openTasks: tasks.filter((task) => !['COMPLETED', 'CANCELLED'].includes(task.status)).length,
      overdueTasks: tasks.filter((task) => deriveTaskDueState(task, now) === 'OVERDUE').length,
      taskCompletionPercent: applicableTasks.length ? Math.round((completedTasks / applicableTasks.length) * 10000) / 100 : null,
      incidentsReported: incidents.length,
      criticalIncidents: incidents.filter((item) => item.severity === 'CRITICAL').length,
      resolvedIncidents: resolvedIncidents.length,
      currentlyOpenIncidents: activeIncidents.length,
      averageResolutionHours: resolutionDurations.length ? Math.round((resolutionDurations.reduce((sum, value) => sum + value, 0) / resolutionDurations.length / 3600000) * 100) / 100 : null
    },
    feedback: feedbackSummary,
    recentFeedback: [...feedback].sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)).slice(0, 10)
  };
};
