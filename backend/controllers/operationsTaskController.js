import OperationalService from '../models/OperationalService.js';
import OperationalTask from '../models/OperationalTask.js';
import {
  isValidObjectId, loadOperationsContext, validateBookingInContext, validateIncidentInTrip,
  validateOperationsStaff, validateServiceInTrip
} from '../services/operationsContextService.js';
import {
  blockOperationalTask, buildStandardChecklistSeeds, cancelOperationalTask, completeOperationalTask,
  createManualTaskKey, deriveTaskDueState, indiaDayBounds, isKnownTaskStatus, reopenOperationalTask,
  startOperationalTask, summarizeTasks, validateTaskFields
} from '../services/operationsTaskService.js';
import { OperationsDomainError } from '../services/operationsExecutionService.js';
import { ensureOperationsDatabase, handleOperationsError, operationsActor, operationsFailure, sameInstant } from './operationsControllerUtils.js';

const populateTask = (query) => query.populate('assignedTo', 'name role isActive').populate('completedBy', 'name role');
const withDueState = (task, now = new Date()) => ({ ...(task?.toObject ? task.toObject() : task), dueState: deriveTaskDueState(task, now) });
const getTask = async (operationId, taskId) => {
  const context = await loadOperationsContext(operationId);
  if (!isValidObjectId(taskId)) throw new OperationsDomainError(400, 'Invalid Task identifier.', 'INVALID_TASK_ID');
  const task = await OperationalTask.findOne({ _id: taskId, operationalTripId: context.operationalTrip._id });
  if (!task) throw new OperationsDomainError(404, 'Operational task was not found.', 'TASK_NOT_FOUND');
  return { task, context };
};

export const initializeOperationalChecklist = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const context = await loadOperationsContext(req.params.operationId);
    if (context.group.operationalPhase === 'COMPLETED') return operationsFailure(res, 409, 'Standard pre-trip checklist cannot be initialized for a completed journey.');
    const hasTransport = Boolean(await OperationalService.exists({ operationalTripId: context.operationalTrip._id, serviceType: 'TRANSPORT' }));
    const actor = operationsActor(req);
    const seeds = buildStandardChecklistSeeds({ group: context.group, hasTransport, actor });
    await OperationalTask.bulkWrite(seeds.map((seed) => ({ updateOne: {
      filter: { operationalTripId: context.operationalTrip._id, taskKey: seed.taskKey },
      update: { $setOnInsert: { ...seed, operationalTripId: context.operationalTrip._id, contextSnapshot: context.contextSnapshot } },
      upsert: true
    } })), { ordered: false });
    const tasks = await populateTask(OperationalTask.find({ operationalTripId: context.operationalTrip._id }).sort({ category: 1, dueAt: 1, createdAt: 1 })).lean();
    return res.json({ success: true, data: tasks.map((task) => withDueState(task)), summary: summarizeTasks(tasks), standardTaskCount: seeds.length });
  } catch (error) { return handleOperationsError(res, error, 'Unable to initialize the standard checklist.'); }
};

export const listOperationalTasks = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const query = {};
    const status = String(req.query.status || '').toUpperCase();
    const priority = String(req.query.priority || '').toUpperCase();
    const category = String(req.query.category || '').toUpperCase();
    if (status && status !== 'ALL') { if (!isKnownTaskStatus(status)) return operationsFailure(res, 400, 'Invalid task status.'); query.status = status; }
    if (priority && priority !== 'ALL') query.priority = priority;
    if (category && category !== 'ALL') query.category = category;
    if (req.query.operationId) {
      if (!isValidObjectId(req.query.operationId)) return operationsFailure(res, 400, 'Invalid Operational Trip identifier.');
      query.operationalTripId = req.query.operationId;
    }
    if (req.query.assignedTo === 'me') query.assignedTo = req.user._id;
    else if (req.query.assignedTo && req.query.assignedTo !== 'all') query.assignedTo = req.query.assignedTo;
    const search = String(req.query.search || '').trim();
    if (search) { const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); query.$or = [{ title: { $regex: safe, $options: 'i' } }, { description: { $regex: safe, $options: 'i' } }, { 'contextSnapshot.title': { $regex: safe, $options: 'i' } }, { 'contextSnapshot.destination': { $regex: safe, $options: 'i' } }, { 'contextSnapshot.operationKey': { $regex: safe, $options: 'i' } }]; }
    const dueState = String(req.query.dueState || '').toUpperCase();
    if (dueState && dueState !== 'ALL') {
      const { start, end } = indiaDayBounds();
      if (['COMPLETED', 'CANCELLED'].includes(query.status)) query._id = { $exists: false };
      else query.status = query.status || { $nin: ['COMPLETED', 'CANCELLED'] };
      if (dueState === 'OVERDUE') query.dueAt = { $lt: start };
      else if (dueState === 'DUE_TODAY') query.dueAt = { $gte: start, $lt: end };
      else if (dueState === 'UPCOMING') query.dueAt = { $gte: end };
      else if (dueState === 'NO_DUE_DATE') query.dueAt = null;
      else return operationsFailure(res, 400, 'Invalid due state.');
    }
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(5, Number.parseInt(req.query.limit, 10) || 25));
    const sortMap = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, priority: { priority: -1, dueAt: 1 }, due: { dueAt: 1, priority: -1 } };
    const sort = sortMap[String(req.query.sort || 'due').toLowerCase()] || sortMap.due;
    const [rows, total, allTasks] = await Promise.all([
      populateTask(OperationalTask.find(query).sort(sort).skip((page - 1) * limit).limit(limit)).lean(),
      OperationalTask.countDocuments(query),
      OperationalTask.find(req.query.operationId ? { operationalTripId: req.query.operationId } : {}).select('status priority dueAt assignedTo').lean()
    ]);
    return res.json({ success: true, data: rows.map((task) => withDueState(task)), summary: summarizeTasks(allTasks, new Date(), req.user._id), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return handleOperationsError(res, error, 'Unable to load Operations tasks.'); }
};

export const listOperationalTripTasks = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const context = await loadOperationsContext(req.params.operationId);
    const tasks = await populateTask(OperationalTask.find({ operationalTripId: context.operationalTrip._id }).sort({ status: 1, dueAt: 1, priority: -1, createdAt: 1 })).lean();
    return res.json({ success: true, data: tasks.map((task) => withDueState(task)), summary: summarizeTasks(tasks, new Date(), req.user._id) });
  } catch (error) { return handleOperationsError(res, error, 'Unable to load journey tasks.'); }
};

export const createOperationalTask = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const context = await loadOperationsContext(req.params.operationId);
    const fields = validateTaskFields(req.body);
    const [assignee, booking, service, incident] = await Promise.all([
      validateOperationsStaff(req.body.assignedTo),
      Promise.resolve(validateBookingInContext(req.body.linkedBookingId, context.bookings)),
      validateServiceInTrip(req.body.linkedServiceId, context.operationalTrip._id),
      validateIncidentInTrip(req.body.linkedIncidentId, context.operationalTrip._id)
    ]);
    const source = incident ? 'INCIDENT_FOLLOWUP' : 'MANUAL';
    const actor = operationsActor(req); const now = new Date();
    const task = await OperationalTask.create({
      operationalTripId: context.operationalTrip._id, taskKey: createManualTaskKey(), source,
      contextSnapshot: context.contextSnapshot, ...fields, assignedTo: assignee?._id || null,
      linkedBookingId: booking?._id || null, linkedServiceId: service?._id || null, linkedIncidentId: incident?._id || null,
      history: [{ action: 'CREATED', fromStatus: null, toStatus: 'TODO', actorId: actor.id, actorName: actor.name, at: now }, ...(assignee ? [{ action: 'ASSIGNED', fromStatus: 'TODO', toStatus: 'TODO', note: `Assigned to ${assignee.name}`, actorId: actor.id, actorName: actor.name, at: now }] : [])],
      createdBy: actor.id, updatedBy: actor.id
    });
    await task.populate('assignedTo', 'name role isActive');
    return res.status(201).json({ success: true, data: withDueState(task) });
  } catch (error) { return handleOperationsError(res, error, 'Unable to create the Operations task.'); }
};

export const updateOperationalTask = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const { task, context } = await getTask(req.params.operationId, req.params.taskId);
    if (req.body.updatedAt && !sameInstant(req.body.updatedAt, task.updatedAt)) return operationsFailure(res, 409, 'This task changed while you were editing it. Refresh and try again.');
    if (Object.hasOwn(req.body, 'status')) return operationsFailure(res, 400, 'Task status can only be changed through lifecycle actions.');
    const next = validateTaskFields({ ...task.toObject(), ...req.body });
    const [assignee, booking, service, incident] = await Promise.all([
      Object.hasOwn(req.body, 'assignedTo') ? validateOperationsStaff(req.body.assignedTo) : Promise.resolve(task.assignedTo),
      Object.hasOwn(req.body, 'linkedBookingId') ? Promise.resolve(validateBookingInContext(req.body.linkedBookingId, context.bookings)) : Promise.resolve(undefined),
      Object.hasOwn(req.body, 'linkedServiceId') ? validateServiceInTrip(req.body.linkedServiceId, context.operationalTrip._id) : Promise.resolve(undefined),
      Object.hasOwn(req.body, 'linkedIncidentId') ? validateIncidentInTrip(req.body.linkedIncidentId, context.operationalTrip._id) : Promise.resolve(undefined)
    ]);
    const actor = operationsActor(req); const assignmentChanged = Object.hasOwn(req.body, 'assignedTo') && String(task.assignedTo || '') !== String(assignee?._id || '');
    Object.assign(task, next);
    if (Object.hasOwn(req.body, 'assignedTo')) task.assignedTo = assignee?._id || null;
    if (Object.hasOwn(req.body, 'linkedBookingId')) task.linkedBookingId = booking?._id || null;
    if (Object.hasOwn(req.body, 'linkedServiceId')) task.linkedServiceId = service?._id || null;
    if (Object.hasOwn(req.body, 'linkedIncidentId')) task.linkedIncidentId = incident?._id || null;
    task.updatedBy = actor.id;
    task.history.push({ action: assignmentChanged ? 'ASSIGNED' : 'DETAILS_UPDATED', fromStatus: task.status, toStatus: task.status, note: assignmentChanged ? `Assigned to ${assignee?.name || 'Unassigned'}` : '', actorId: actor.id, actorName: actor.name, at: new Date() });
    await task.save(); await task.populate('assignedTo', 'name role isActive');
    return res.json({ success: true, data: withDueState(task) });
  } catch (error) { return handleOperationsError(res, error, 'Unable to update the Operations task.'); }
};

const transition = (apply, fallback) => async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const { task } = await getTask(req.params.operationId, req.params.taskId);
    const changed = apply(task, req.body || {}, operationsActor(req));
    if (changed) { task.updatedBy = req.user._id; await task.save(); }
    await task.populate('assignedTo', 'name role isActive');
    return res.json({ success: true, data: withDueState(task), idempotent: !changed });
  } catch (error) { return handleOperationsError(res, error, fallback); }
};
export const startTask = transition((task, _body, actor) => startOperationalTask(task, actor), 'Unable to start the task.');
export const blockTask = transition((task, body, actor) => blockOperationalTask(task, body.reason, actor), 'Unable to block the task.');
export const completeTask = transition((task, _body, actor) => completeOperationalTask(task, actor), 'Unable to complete the task.');
export const reopenTask = transition((task, body, actor) => reopenOperationalTask(task, body.reason, actor, { toStatus: body.toStatus }), 'Unable to reopen the task.');
export const cancelTask = transition((task, body, actor) => cancelOperationalTask(task, body.reason, actor), 'Unable to cancel the task.');
