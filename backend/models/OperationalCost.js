import crypto from 'crypto';
import mongoose from 'mongoose';
import { operationsContextSnapshotSchema } from './schemas/operationsContextSnapshotSchema.js';
import { operationsDocumentSchema } from './schemas/operationsDocumentSchema.js';

export const OPERATIONAL_COST_CATEGORIES = Object.freeze(['HOTEL', 'TRANSPORT', 'ACTIVITY', 'GUIDE', 'PERMIT', 'MEALS', 'INCIDENT', 'MISCELLANEOUS']);
export const OPERATIONAL_COST_STATUSES = Object.freeze(['DRAFT', 'FINALIZED', 'VOID']);
export const MAX_OPERATIONAL_AMOUNT = 100000000;
export const createCostCode = (date = new Date()) => `COST-${date.getUTCFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const vendorSnapshotSchema = new mongoose.Schema({
  vendorCode: { type: String, default: '', trim: true, maxlength: 80 },
  name: { type: String, default: '', trim: true, maxlength: 180 },
  phone: { type: String, default: '', trim: true, maxlength: 40 },
  email: { type: String, default: '', trim: true, maxlength: 180 }
}, { _id: false });

const costHistorySchema = new mongoose.Schema({
  action: { type: String, enum: ['CREATED', 'UPDATED', 'FINALIZED', 'VOIDED'], required: true },
  fromStatus: { type: String, enum: OPERATIONAL_COST_STATUSES, default: null },
  toStatus: { type: String, enum: OPERATIONAL_COST_STATUSES, default: null },
  note: { type: String, default: '', trim: true, maxlength: 1500 },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  actorName: { type: String, default: '', trim: true, maxlength: 120 },
  at: { type: Date, default: Date.now }
}, { _id: false });

const amountField = (defaultValue = 0) => ({ type: Number, default: defaultValue, min: -MAX_OPERATIONAL_AMOUNT, max: MAX_OPERATIONAL_AMOUNT });

const operationalCostSchema = new mongoose.Schema({
  costCode: { type: String, required: true, unique: true, uppercase: true, trim: true, immutable: true, default: createCostCode },
  operationalTripId: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationalTrip', required: true, immutable: true },
  contextSnapshot: { type: operationsContextSnapshotSchema, required: true, immutable: true },
  category: { type: String, enum: OPERATIONAL_COST_CATEGORIES, required: true },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  operationalServiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationalService', default: null },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
  vendorSnapshot: { type: vendorSnapshotSchema, default: () => ({}) },
  incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationalIncident', default: null },
  payeeName: { type: String, default: '', trim: true, maxlength: 180 },
  currency: { type: String, enum: ['INR'], default: 'INR' },
  subtotal: amountField(),
  taxAmount: amountField(),
  adjustmentAmount: amountField(),
  totalAmount: { type: Number, required: true, min: 0, max: MAX_OPERATIONAL_AMOUNT },
  incurredAt: { type: Date, required: true },
  dueDate: { type: Date, default: null },
  invoiceReference: { type: String, default: '', trim: true, maxlength: 180 },
  documents: { type: [operationsDocumentSchema], default: [] },
  internalNotes: { type: String, default: '', trim: true, maxlength: 3000 },
  status: { type: String, enum: OPERATIONAL_COST_STATUSES, default: 'DRAFT' },
  finalizedAt: { type: Date, default: null },
  finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  voidedAt: { type: Date, default: null },
  voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  voidReason: { type: String, default: '', trim: true, maxlength: 1500 },
  settlementClaimedAmount: { type: Number, default: 0, min: 0, select: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  history: { type: [costHistorySchema], default: [] }
}, { timestamps: true, optimisticConcurrency: true });

operationalCostSchema.index({ operationalTripId: 1, status: 1, incurredAt: -1 });
operationalCostSchema.index({ vendorId: 1, status: 1, dueDate: 1 });
operationalCostSchema.index({ operationalServiceId: 1 });

export default mongoose.model('OperationalCost', operationalCostSchema);
