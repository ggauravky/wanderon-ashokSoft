import mongoose from 'mongoose';
import { operationsContextSnapshotSchema } from './schemas/operationsContextSnapshotSchema.js';

export const OPERATIONAL_TASK_SOURCES = Object.freeze(['STANDARD_CHECKLIST', 'MANUAL', 'INCIDENT_FOLLOWUP']);
export const OPERATIONAL_TASK_CATEGORIES = Object.freeze(['PRE_TRIP', 'DURING_TRIP', 'GENERAL']);
export const OPERATIONAL_TASK_STATUSES = Object.freeze(['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED']);
export const OPERATIONAL_TASK_PRIORITIES = Object.freeze(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']);

const taskHistorySchema = new mongoose.Schema(
  {
    action: { type: String, enum: ['CREATED', 'ASSIGNED', 'DETAILS_UPDATED', 'STARTED', 'BLOCKED', 'UNBLOCKED', 'COMPLETED', 'REOPENED', 'CANCELLED'], required: true },
    fromStatus: { type: String, enum: OPERATIONAL_TASK_STATUSES, default: null },
    toStatus: { type: String, enum: OPERATIONAL_TASK_STATUSES, default: null },
    note: { type: String, default: '', trim: true, maxlength: 1000 },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actorName: { type: String, default: '', trim: true, maxlength: 120 },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const operationalTaskSchema = new mongoose.Schema(
  {
    operationalTripId: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationalTrip', required: true },
    taskKey: { type: String, required: true, trim: true, immutable: true, maxlength: 180 },
    source: { type: String, enum: OPERATIONAL_TASK_SOURCES, required: true, immutable: true },
    contextSnapshot: { type: operationsContextSnapshotSchema, required: true, immutable: true },
    title: { type: String, required: true, trim: true, maxlength: 220 },
    description: { type: String, default: '', trim: true, maxlength: 3000 },
    category: { type: String, enum: OPERATIONAL_TASK_CATEGORIES, default: 'GENERAL' },
    status: { type: String, enum: OPERATIONAL_TASK_STATUSES, default: 'TODO' },
    priority: { type: String, enum: OPERATIONAL_TASK_PRIORITIES, default: 'NORMAL' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    dueAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    blockedReason: { type: String, default: '', trim: true, maxlength: 1000 },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancellationReason: { type: String, default: '', trim: true, maxlength: 1000 },
    linkedServiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationalService', default: null },
    linkedIncidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationalIncident', default: null },
    linkedBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    history: { type: [taskHistorySchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true, optimisticConcurrency: true }
);

operationalTaskSchema.index({ operationalTripId: 1, taskKey: 1 }, { unique: true });
operationalTaskSchema.index({ operationalTripId: 1, status: 1, dueAt: 1 });
operationalTaskSchema.index({ assignedTo: 1, status: 1, dueAt: 1 });
operationalTaskSchema.index({ status: 1, priority: 1, dueAt: 1 });

export default mongoose.model('OperationalTask', operationalTaskSchema);
