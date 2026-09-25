import mongoose from 'mongoose';

export const OPERATIONAL_CLOSURE_STATUSES = Object.freeze(['OPEN', 'CLOSED']);

const closureHistorySchema = new mongoose.Schema({
  action: { type: String, enum: ['CLOSED', 'REOPENED'], required: true },
  note: { type: String, default: '', trim: true, maxlength: 3000 },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorName: { type: String, default: '', trim: true, maxlength: 120 },
  at: { type: Date, default: Date.now },
  snapshot: { type: mongoose.Schema.Types.Mixed, default: null }
}, { _id: false });

const operationalTripClosureSchema = new mongoose.Schema({
  operationalTripId: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationalTrip', required: true, unique: true, immutable: true },
  closureStatus: { type: String, enum: OPERATIONAL_CLOSURE_STATUSES, default: 'OPEN' },
  actualEndAt: { type: Date, default: null },
  closureSummary: { type: String, default: '', trim: true, maxlength: 5000 },
  exceptions: { type: [String], default: [] },
  outstandingSettlementAcknowledgement: {
    acknowledged: { type: Boolean, default: false },
    note: { type: String, default: '', trim: true, maxlength: 2000 },
    acknowledgedAt: { type: Date, default: null },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  finalSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
  closedAt: { type: Date, default: null },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reopenedAt: { type: Date, default: null },
  reopenedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reopenReason: { type: String, default: '', trim: true, maxlength: 2000 },
  history: { type: [closureHistorySchema], default: [] }
}, { timestamps: true, optimisticConcurrency: true });

operationalTripClosureSchema.index({ closureStatus: 1, closedAt: -1 });

export default mongoose.model('OperationalTripClosure', operationalTripClosureSchema);
