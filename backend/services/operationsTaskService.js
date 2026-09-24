import crypto from 'crypto';
import {
  OPERATIONAL_TASK_CATEGORIES,
  OPERATIONAL_TASK_PRIORITIES,
  OPERATIONAL_TASK_STATUSES
} from '../models/OperationalTask.js';
import { OperationsDomainError } from './operationsExecutionService.js';

const INDIA_OFFSET_MS = 330 * 60 * 1000;
const CLOSED_STATUSES = new Set(['COMPLETED', 'CANCELLED']);
const clean = (value) => String(value || '').trim();
const validDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const actorFields = (actor) => ({ actorId: actor?.id || null, actorName: clean(actor?.name), at: new Date(actor?.at || Date.now()) });

export const indiaDayBounds = (now = new Date()) => {
  const local = new Date(now.getTime() + INDIA_OFFSET_MS);
  const start = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - INDIA_OFFSET_MS);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
};

export const dueAtForIndiaDate = (startDate, offsetDays = 0, hour = 18) => {
  const start = validDate(startDate);
  if (!start) return null;
  const local = new Date(start.getTime() + INDIA_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + offsetDays, hour, 0) - INDIA_OFFSET_MS);
};

export const deriveTaskDueState = (task, now = new Date()) => {
  if (CLOSED_STATUSES.has(task?.status)) return null;
  const dueAt = validDate(task?.dueAt);
  if (!dueAt) return 'NO_DUE_DATE';
  const { start, end } = indiaDayBounds(now);
  if (dueAt < start) return 'OVERDUE';
  if (dueAt < end) return 'DUE_TODAY';
  return 'UPCOMING';
};

export const buildStandardChecklistSeeds = ({ group, hasTransport = false, actor, now = new Date() }) => {
  const start = validDate(group?.startDate);
  const end = validDate(group?.endDate);
  const base = [
    ['standard:review-travelers', 'Review traveler details', 'PRE_TRIP', -7, 'NORMAL'],
    ['standard:verify-pickup', 'Verify pickup / meeting details', 'PRE_TRIP', -3, 'HIGH'],
    ['standard:verify-emergency-contact', 'Verify emergency-contact readiness with traveler', 'PRE_TRIP', -3, 'HIGH'],
    ['standard:share-final-itinerary', 'Share final itinerary / travel brief', 'PRE_TRIP', -2, 'HIGH'],
    ['standard:share-travel-documents', 'Share available vouchers / travel documents', 'PRE_TRIP', -2, 'HIGH'],
    ['standard:predeparture-confirmation', 'Complete pre-departure customer confirmation', 'PRE_TRIP', -1, 'HIGH'],
    ['standard:arrival-checkin', 'Arrival check-in with traveler', 'DURING_TRIP', 0, 'NORMAL']
  ];
  if (hasTransport) base.splice(6, 0, ['standard:share-driver-details', 'Share final driver / vehicle details', 'PRE_TRIP', -1, 'HIGH']);
  if (start && end) {
    const days = Math.floor((end.getTime() - start.getTime()) / 86400000);
    if (days >= 5) base.push(['standard:midtrip-checkin', 'Mid-trip customer check-in', 'DURING_TRIP', Math.floor(days / 2), 'NORMAL']);
  }
  return base.map(([taskKey, title, category, offsetDays, priority]) => ({
    taskKey,
    source: 'STANDARD_CHECKLIST',
    title,
    description: '',
    category,
    status: 'TODO',
    priority,
    assignedTo: null,
    dueAt: start ? dueAtForIndiaDate(start, offsetDays, offsetDays === 0 ? 9 : 18) : null,
    history: [{ action: 'CREATED', fromStatus: null, toStatus: 'TODO', ...actorFields({ ...actor, at: now }) }],
    createdBy: actor.id,
    updatedBy: actor.id
  }));
};

export const createManualTaskKey = (randomUUID = crypto.randomUUID) => `manual:${randomUUID()}`;

const assertStatus = (task, allowed, action) => {
  if (!allowed.includes(task.status)) throw new OperationsDomainError(409, `${action} is not available while this task is ${task.status}.`, 'INVALID_TASK_TRANSITION');
};
const pushHistory = (task, action, fromStatus, toStatus, actor, note = '', now = new Date()) => {
  task.history.push({ action, fromStatus, toStatus, note: clean(note), ...actorFields({ ...actor, at: now }) });
};

export const startOperationalTask = (task, actor, now = new Date()) => {
  if (task.status === 'IN_PROGRESS') return false;
  assertStatus(task, ['TODO', 'BLOCKED'], 'Start');
  const from = task.status;
  task.status = 'IN_PROGRESS';
  task.startedAt ||= now;
  if (from === 'BLOCKED') task.blockedReason = '';
  pushHistory(task, from === 'BLOCKED' ? 'UNBLOCKED' : 'STARTED', from, 'IN_PROGRESS', actor, '', now);
  return true;
};

export const blockOperationalTask = (task, reason, actor, now = new Date()) => {
  const note = clean(reason);
  if (!note) throw new OperationsDomainError(400, 'A blocked reason is required.', 'BLOCK_REASON_REQUIRED');
  if (task.status === 'BLOCKED' && task.blockedReason === note) return false;
  assertStatus(task, ['TODO', 'IN_PROGRESS'], 'Block');
  const from = task.status;
  task.status = 'BLOCKED';
  task.blockedReason = note;
  pushHistory(task, 'BLOCKED', from, 'BLOCKED', actor, note, now);
  return true;
};

export const completeOperationalTask = (task, actor, now = new Date()) => {
  if (task.status === 'COMPLETED') return false;
  assertStatus(task, ['TODO', 'IN_PROGRESS', 'BLOCKED'], 'Complete');
  const from = task.status;
  task.status = 'COMPLETED';
  task.completedAt = now;
  task.completedBy = actor.id;
  task.blockedReason = '';
  pushHistory(task, 'COMPLETED', from, 'COMPLETED', actor, '', now);
  return true;
};

export const reopenOperationalTask = (task, reason, actor, { toStatus = 'TODO', now = new Date() } = {}) => {
  const note = clean(reason);
  if (!note) throw new OperationsDomainError(400, 'A reopen reason is required.', 'REOPEN_REASON_REQUIRED');
  if (task.status !== 'COMPLETED') throw new OperationsDomainError(409, 'Only a completed task can be reopened.', 'INVALID_TASK_TRANSITION');
  const next = String(toStatus || 'TODO').toUpperCase();
  if (!['TODO', 'IN_PROGRESS'].includes(next)) throw new OperationsDomainError(400, 'Reopen status must be TODO or IN_PROGRESS.', 'INVALID_REOPEN_STATUS');
  task.status = next;
  task.completedAt = null;
  task.completedBy = null;
  task.startedAt = next === 'IN_PROGRESS' ? (task.startedAt || now) : null;
  pushHistory(task, 'REOPENED', 'COMPLETED', next, actor, note, now);
  return true;
};

export const cancelOperationalTask = (task, reason, actor, now = new Date()) => {
  const note = clean(reason);
  if (!note) throw new OperationsDomainError(400, 'A cancellation reason is required.', 'CANCELLATION_REASON_REQUIRED');
  if (task.status === 'CANCELLED') return false;
  assertStatus(task, ['TODO', 'IN_PROGRESS', 'BLOCKED'], 'Cancel');
  const from = task.status;
  task.status = 'CANCELLED';
  task.cancelledAt = now;
  task.cancelledBy = actor.id;
  task.cancellationReason = note;
  task.blockedReason = '';
  pushHistory(task, 'CANCELLED', from, 'CANCELLED', actor, note, now);
  return true;
};

export const validateTaskFields = (payload = {}) => {
  const title = clean(payload.title);
  if (!title) throw new OperationsDomainError(400, 'Task title is required.', 'TASK_TITLE_REQUIRED');
  const category = String(payload.category || 'GENERAL').toUpperCase();
  const priority = String(payload.priority || 'NORMAL').toUpperCase();
  if (!OPERATIONAL_TASK_CATEGORIES.includes(category)) throw new OperationsDomainError(400, 'Invalid task category.', 'INVALID_TASK_CATEGORY');
  if (!OPERATIONAL_TASK_PRIORITIES.includes(priority)) throw new OperationsDomainError(400, 'Invalid task priority.', 'INVALID_TASK_PRIORITY');
  const dueAt = payload.dueAt ? validDate(payload.dueAt) : null;
  if (payload.dueAt && !dueAt) throw new OperationsDomainError(400, 'Invalid task due date.', 'INVALID_DUE_AT');
  return { title, description: clean(payload.description), category, priority, dueAt };
};

export const summarizeTasks = (tasks = [], now = new Date(), currentUserId = '') => ({
  total: tasks.length,
  open: tasks.filter((task) => !CLOSED_STATUSES.has(task.status)).length,
  completed: tasks.filter((task) => task.status === 'COMPLETED').length,
  overdue: tasks.filter((task) => deriveTaskDueState(task, now) === 'OVERDUE').length,
  dueToday: tasks.filter((task) => deriveTaskDueState(task, now) === 'DUE_TODAY').length,
  blocked: tasks.filter((task) => task.status === 'BLOCKED').length,
  my: currentUserId ? tasks.filter((task) => !CLOSED_STATUSES.has(task.status) && String(task.assignedTo?._id || task.assignedTo || '') === String(currentUserId)).length : 0
});

export const isOpenTaskStatus = (status) => !CLOSED_STATUSES.has(status);
export const isKnownTaskStatus = (status) => OPERATIONAL_TASK_STATUSES.includes(status);
