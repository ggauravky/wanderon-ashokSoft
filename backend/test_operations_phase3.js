import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import OperationalCommunication from './models/OperationalCommunication.js';
import OperationalIncident from './models/OperationalIncident.js';
import OperationalTask from './models/OperationalTask.js';
import { ACTION_PERMISSIONS } from './middlewares/authMiddleware.js';
import { deriveExecutionReadiness } from './services/operationsExecutionService.js';
import { buildOperationsContextSnapshot, isOperationsStaffRole, validateBookingInContext } from './services/operationsContextService.js';
import { enrichGroupsWithCoordination, incidentAttentionReasons, taskAttentionReasons } from './services/operationsCoordinationService.js';
import { validateCommunicationPayload } from './services/operationsCommunicationService.js';
import {
  acknowledgeIncidentEscalation, closeIncident, createIncidentCode, escalateIncident, reopenIncident,
  resolveIncident, startIncident, summarizeIncidents, validateIncidentFields, validateIncidentScopeRelations
} from './services/operationsIncidentService.js';
import {
  blockOperationalTask, buildStandardChecklistSeeds, completeOperationalTask, deriveTaskDueState,
  reopenOperationalTask, startOperationalTask, summarizeTasks
} from './services/operationsTaskService.js';

const actor = { id: new mongoose.Types.ObjectId(), name: 'Operations Lead' };
const now = new Date('2026-10-10T08:00:00.000Z');
const group = {
  operationKey: 'catalog:trip-1:batch-a', type: 'CATALOG', title: 'Spiti Departure', destination: 'Spiti',
  startDate: '2026-10-17T00:00:00.000Z', endDate: '2026-10-23T00:00:00.000Z', operationalPhase: 'STARTING_SOON'
};

test('Phase 3 models expose the justified query and identity indexes', () => {
  assert(OperationalTask.schema.indexes().some(([fields, options]) => fields.operationalTripId === 1 && fields.taskKey === 1 && options.unique));
  assert(OperationalIncident.schema.indexes().some(([fields, options]) => fields.incidentCode === 1 && options.unique));
  assert(OperationalCommunication.schema.indexes().some(([fields]) => fields.operationalTripId === 1 && fields.occurredAt === -1));
});

test('shared context snapshot stays small and excludes commercial/private data', () => {
  const snapshot = buildOperationsContextSnapshot({ ...group, supplierCost: 5000, paymentId: 'secret' });
  assert.deepEqual(Object.keys(snapshot), ['operationKey', 'sourceType', 'title', 'destination', 'startDate', 'endDate']);
  assert.equal(snapshot.operationKey, group.operationKey);
  assert.equal(snapshot.supplierCost, undefined);
});

test('standard checklist seeds are deterministic, Transport-aware and India-date safe', () => {
  const withTransport = buildStandardChecklistSeeds({ group, hasTransport: true, actor, now });
  const withoutTransport = buildStandardChecklistSeeds({ group, hasTransport: false, actor, now });
  assert.equal(new Set(withTransport.map((task) => task.taskKey)).size, withTransport.length);
  assert(withTransport.some((task) => task.taskKey === 'standard:share-driver-details'));
  assert.equal(withoutTransport.some((task) => task.taskKey === 'standard:share-driver-details'), false);
  assert.equal(withTransport.find((task) => task.taskKey === 'standard:review-travelers').dueAt.toISOString(), '2026-10-10T12:30:00.000Z');
  assert(withTransport.some((task) => task.taskKey === 'standard:midtrip-checkin'));
  assert(buildStandardChecklistSeeds({ group: { ...group, startDate: null, endDate: null }, hasTransport: false, actor, now }).every((task) => task.dueAt === null));
});

test('set-on-insert checklist semantics preserve edits on repeat initialization', () => {
  const store = new Map();
  const apply = (seeds) => seeds.forEach((seed) => { if (!store.has(seed.taskKey)) store.set(seed.taskKey, structuredClone(seed)); });
  const seeds = buildStandardChecklistSeeds({ group, hasTransport: true, actor, now });
  apply(seeds);
  store.get('standard:verify-pickup').status = 'COMPLETED';
  store.get('standard:verify-pickup').assignedTo = 'operator-1';
  apply(buildStandardChecklistSeeds({ group, hasTransport: true, actor, now: new Date('2026-10-11T08:00:00Z') }));
  assert.equal(store.size, seeds.length);
  assert.equal(store.get('standard:verify-pickup').status, 'COMPLETED');
  assert.equal(store.get('standard:verify-pickup').assignedTo, 'operator-1');
});

test('task lifecycle records start, block, unblock, complete and reopen metadata', () => {
  const task = { status: 'TODO', startedAt: null, completedAt: null, completedBy: null, blockedReason: '', history: [] };
  assert.equal(startOperationalTask(task, actor, now), true);
  assert.equal(task.status, 'IN_PROGRESS');
  blockOperationalTask(task, 'Waiting for vehicle number', actor, now);
  assert.equal(task.status, 'BLOCKED');
  startOperationalTask(task, actor, now);
  assert.equal(task.history.at(-1).action, 'UNBLOCKED');
  completeOperationalTask(task, actor, now);
  assert.equal(task.completedBy, actor.id);
  assert.equal(completeOperationalTask(task, actor, now), false);
  reopenOperationalTask(task, 'Traveler changed pickup', actor, { toStatus: 'IN_PROGRESS', now });
  assert.equal(task.status, 'IN_PROGRESS');
  assert.equal(task.completedAt, null);
  assert(task.history.some((entry) => entry.action === 'COMPLETED'));
});

test('derived overdue state ignores completed and cancelled tasks', () => {
  assert.equal(deriveTaskDueState({ status: 'TODO', dueAt: '2026-10-09T10:00:00Z' }, now), 'OVERDUE');
  assert.equal(deriveTaskDueState({ status: 'COMPLETED', dueAt: '2026-10-09T10:00:00Z' }, now), null);
  assert.equal(deriveTaskDueState({ status: 'TODO', dueAt: null }, now), 'NO_DUE_DATE');
});

test('task assignment roles are limited to active Operations-side roles by policy', () => {
  for (const role of ['operations', 'admin', 'super_admin']) assert.equal(isOperationsStaffRole(role), true);
  for (const role of ['sales', 'marketing', 'user', 'influencer']) assert.equal(isOperationsStaffRole(role), false);
});

test('communication validation permits past facts, rejects future claims, and schema is append-only', () => {
  const data = validateCommunicationPayload({ direction: 'OUTBOUND', channel: 'WHATSAPP', communicationType: 'DRIVER_DETAILS', summary: 'Driver details were shared.', occurredAt: '2026-10-09T08:00:00Z' }, now);
  assert.equal(data.channel, 'WHATSAPP');
  assert.throws(() => validateCommunicationPayload({ ...data, occurredAt: '2026-10-11T08:00:00Z' }, now));
  assert.equal(OperationalCommunication.schema.options.timestamps.updatedAt, false);
});

test('booking relationship validation refuses a booking outside the operational group', () => {
  const current = { _id: new mongoose.Types.ObjectId(), bookingId: 'WLX-1' };
  assert.equal(validateBookingInContext(current._id, [current]), current);
  assert.throws(() => validateBookingInContext(new mongoose.Types.ObjectId(), [current]));
});

test('incident scope, type and severity require factual supported values', () => {
  const fields = validateIncidentFields({ title: 'Vehicle breakdown', description: 'Vehicle stopped near Kaza.', incidentType: 'VEHICLE_BREAKDOWN', severity: 'HIGH', scope: 'SERVICE' }, now);
  assert.equal(fields.incidentType, 'VEHICLE_BREAKDOWN');
  assert.equal(validateIncidentScopeRelations('SERVICE', { service: { _id: 'service-1' } }), true);
  assert.throws(() => validateIncidentScopeRelations('SERVICE', { service: null }));
  assert.throws(() => validateIncidentScopeRelations('TRIP_WIDE', { booking: { _id: 'booking-1' } }));
  assert.match(createIncidentCode(now, () => Buffer.from('a8f4c2', 'hex')), /^INC-2026-A8F4C2$/);
});

test('incident lifecycle and escalation are explicit, idempotent and retain history', () => {
  const incident = { status: 'OPEN', escalation: { status: 'NONE' }, resolutionSummary: '', resolvedAt: null, resolvedBy: null, closedAt: null, closedBy: null, history: [] };
  startIncident(incident, actor, now);
  escalateIncident(incident, 'Leadership visibility required', actor, now);
  assert.equal(escalateIncident(incident, 'Leadership visibility required', actor, now), false);
  acknowledgeIncidentEscalation(incident, actor, now);
  assert.equal(incident.status, 'IN_PROGRESS');
  resolveIncident(incident, 'Replacement vehicle arranged.', actor, now);
  assert.equal(resolveIncident(incident, 'Replacement vehicle arranged.', actor, now), false);
  closeIncident(incident, actor, now);
  reopenIncident(incident, 'Vehicle replacement failed', actor, now);
  assert.equal(incident.status, 'IN_PROGRESS');
  assert.deepEqual(incident.history.map((entry) => entry.action), ['STARTED', 'ESCALATED', 'ESCALATION_ACKNOWLEDGED', 'RESOLVED', 'CLOSED', 'REOPENED']);
});

test('Phase 3 attention enriches groups while Phase 2 execution readiness remains service-only', () => {
  const operationalTripId = new mongoose.Types.ObjectId();
  const readiness = deriveExecutionReadiness([{ required: true, confirmationStatus: 'CONFIRMED' }]);
  const base = [{ ...group, attention: { required: false, severity: 'NONE', reasons: [] }, execution: { operationalTripId, readiness } }];
  const tasks = [{ _id: 'task-1', operationalTripId, status: 'TODO', priority: 'HIGH', dueAt: '2026-10-09T08:00:00Z' }];
  const incidents = [{ _id: 'incident-1', incidentCode: 'INC-2026-A8F4C2', operationalTripId, status: 'OPEN', severity: 'CRITICAL', escalation: { status: 'NONE' } }];
  const [enriched] = enrichGroupsWithCoordination(base, tasks, incidents, now);
  assert.equal(enriched.execution.readiness.status, 'READY');
  assert.equal(enriched.attention.severity, 'HIGH');
  assert(enriched.attention.reasons.some((reason) => reason.code === 'OVERDUE_OPERATION_TASK'));
  assert(enriched.attention.reasons.some((reason) => reason.code === 'CRITICAL_INCIDENT_OPEN'));
  assert.equal(taskAttentionReasons([{ ...tasks[0], status: 'COMPLETED' }], now).length, 0);
  assert.equal(incidentAttentionReasons([{ ...incidents[0], status: 'CLOSED' }], group).length, 0);
});

test('dashboard summary helpers count real open, overdue, critical and resolved-today records', () => {
  const tasks = [
    { status: 'TODO', priority: 'HIGH', dueAt: '2026-10-09T08:00:00Z', assignedTo: actor.id },
    { status: 'IN_PROGRESS', priority: 'NORMAL', dueAt: '2026-10-12T08:00:00Z' },
    { status: 'COMPLETED', priority: 'NORMAL', dueAt: '2026-10-09T08:00:00Z' }
  ];
  const incidents = [
    { status: 'OPEN', severity: 'CRITICAL', escalation: { status: 'ESCALATED' } },
    { status: 'RESOLVED', severity: 'HIGH', resolvedAt: '2026-10-10T06:00:00Z', escalation: { status: 'NONE' } }
  ];
  assert.deepEqual(summarizeTasks(tasks, now, actor.id), { total: 3, open: 2, completed: 1, overdue: 1, dueToday: 0, blocked: 0, my: 1 });
  const incidentSummary = summarizeIncidents(incidents, now);
  assert.equal(incidentSummary.active, 1);
  assert.equal(incidentSummary.critical, 1);
  assert.equal(incidentSummary.escalated, 1);
  assert.equal(incidentSummary.resolvedToday, 1);
});

test('all Phase 3 permissions remain exclusive to Operations and administrators', () => {
  const permissions = ['operations:view_tasks', 'operations:manage_tasks', 'operations:view_communications', 'operations:manage_communications', 'operations:view_incidents', 'operations:manage_incidents'];
  for (const permission of permissions) {
    assert.deepEqual(ACTION_PERMISSIONS[permission], ['super_admin', 'admin', 'operations']);
    for (const role of ['sales', 'marketing', 'user', 'influencer']) assert.equal(ACTION_PERMISSIONS[permission].includes(role), false);
  }
});
