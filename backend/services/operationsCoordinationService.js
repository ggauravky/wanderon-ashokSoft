import { deriveTaskDueState, summarizeTasks } from './operationsTaskService.js';
import { summarizeIncidents } from './operationsIncidentService.js';

const severityRank = { NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3 };

export const taskAttentionReasons = (tasks = [], now = new Date()) => tasks.flatMap((task) => {
  if (['COMPLETED', 'CANCELLED'].includes(task.status)) return [];
  const priority = String(task.priority || 'NORMAL');
  if (task.status === 'BLOCKED' && ['HIGH', 'CRITICAL'].includes(priority)) return [{ code: 'BLOCKED_HIGH_PRIORITY_TASK', severity: 'HIGH', taskId: task._id, label: `${priority} priority task is blocked` }];
  if (deriveTaskDueState(task, now) === 'OVERDUE') return [{ code: 'OVERDUE_OPERATION_TASK', severity: ['HIGH', 'CRITICAL'].includes(priority) ? 'HIGH' : 'MEDIUM', taskId: task._id, label: `${priority} priority task is overdue` }];
  return [];
});

export const incidentAttentionReasons = (incidents = [], group = {}) => incidents.flatMap((incident) => {
  if (!['OPEN', 'IN_PROGRESS'].includes(incident.status)) return [];
  if (incident.escalation?.status === 'ESCALATED') return [{ code: 'ESCALATED_INCIDENT_OPEN', severity: 'HIGH', incidentId: incident._id, label: `${incident.incidentCode} is escalated` }];
  if (incident.severity === 'CRITICAL') return [{ code: 'CRITICAL_INCIDENT_OPEN', severity: 'HIGH', incidentId: incident._id, label: `${incident.incidentCode} critical incident is active` }];
  if (incident.severity === 'HIGH') return [{ code: 'HIGH_INCIDENT_OPEN', severity: 'HIGH', incidentId: incident._id, label: `${incident.incidentCode} high-severity incident is active` }];
  if (incident.severity === 'MEDIUM' && ['ONGOING', 'STARTING_SOON'].includes(group.operationalPhase)) return [{ code: 'MEDIUM_INCIDENT_ACTIVE', severity: 'MEDIUM', incidentId: incident._id, label: `${incident.incidentCode} requires coordination` }];
  return [];
});

export const enrichGroupsWithCoordination = (groups = [], tasks = [], incidents = [], now = new Date()) => {
  const tasksByTrip = new Map();
  const incidentsByTrip = new Map();
  for (const task of tasks) { const key = String(task.operationalTripId); tasksByTrip.set(key, [...(tasksByTrip.get(key) || []), task]); }
  for (const incident of incidents) { const key = String(incident.operationalTripId); incidentsByTrip.set(key, [...(incidentsByTrip.get(key) || []), incident]); }
  return groups.map((group) => {
    const tripId = String(group.execution?.operationalTripId || '');
    const tripTasks = tasksByTrip.get(tripId) || [];
    const tripIncidents = incidentsByTrip.get(tripId) || [];
    const reasons = [...(group.attention?.reasons || []), ...taskAttentionReasons(tripTasks, now), ...incidentAttentionReasons(tripIncidents, group)];
    const severity = reasons.reduce((highest, reason) => severityRank[reason.severity] > severityRank[highest] ? reason.severity : highest, 'NONE');
    return {
      ...group,
      attention: { required: reasons.length > 0, severity, reasons },
      taskSummary: summarizeTasks(tripTasks, now),
      incidentSummary: summarizeIncidents(tripIncidents, now)
    };
  });
};
