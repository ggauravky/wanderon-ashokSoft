import crypto from 'crypto';
import mongoose from 'mongoose';
import { operationsDocumentSchema } from './schemas/operationsDocumentSchema.js';
import { MAX_OPERATIONAL_AMOUNT } from './OperationalCost.js';

export const OPERATIONAL_SETTLEMENT_METHODS = Object.freeze(['BANK_TRANSFER', 'UPI', 'CASH', 'CARD', 'CHEQUE', 'OTHER']);
export const OPERATIONAL_SETTLEMENT_STATUSES = Object.freeze(['RECORDED', 'VOID']);
export const createSettlementCode = (date = new Date()) => `SET-${date.getUTCFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const operationalSettlementSchema = new mongoose.Schema({
  settlementCode: { type: String, required: true, unique: true, uppercase: true, trim: true, immutable: true, default: createSettlementCode },
  operationalTripId: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationalTrip', required: true, immutable: true },
  operationalCostId: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationalCost', required: true, immutable: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null, immutable: true },
  amount: { type: Number, required: true, min: 0.01, max: MAX_OPERATIONAL_AMOUNT, immutable: true },
  currency: { type: String, enum: ['INR'], default: 'INR', immutable: true },
  paymentMethod: { type: String, enum: OPERATIONAL_SETTLEMENT_METHODS, required: true, immutable: true },
  externalReference: { type: String, default: '', trim: true, maxlength: 180, immutable: true },
  paidAt: { type: Date, required: true, immutable: true },
  documents: { type: [operationsDocumentSchema], default: [], immutable: true },
  notes: { type: String, default: '', trim: true, maxlength: 2000, immutable: true },
  status: { type: String, enum: OPERATIONAL_SETTLEMENT_STATUSES, default: 'RECORDED' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  voidedAt: { type: Date, default: null },
  voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  voidReason: { type: String, default: '', trim: true, maxlength: 1500 }
}, { timestamps: { createdAt: true, updatedAt: false } });

operationalSettlementSchema.index({ operationalCostId: 1, status: 1, paidAt: -1 });
operationalSettlementSchema.index({ vendorId: 1, paidAt: -1 });
operationalSettlementSchema.index({ operationalTripId: 1, paidAt: -1 });

export default mongoose.model('OperationalSettlement', operationalSettlementSchema);
