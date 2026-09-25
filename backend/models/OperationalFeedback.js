import mongoose from 'mongoose';
import { operationsContextSnapshotSchema } from './schemas/operationsContextSnapshotSchema.js';

export const OPERATIONAL_FEEDBACK_CHANNELS = Object.freeze(['PHONE', 'WHATSAPP', 'EMAIL', 'FORM', 'IN_PERSON', 'OTHER']);

const customerSnapshotSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 180 },
  bookingId: { type: String, required: true, trim: true, maxlength: 100 }
}, { _id: false });

const operationalFeedbackSchema = new mongoose.Schema({
  operationalTripId: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationalTrip', required: true, immutable: true },
  contextSnapshot: { type: operationsContextSnapshotSchema, required: true, immutable: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, immutable: true },
  customerSnapshot: { type: customerSnapshotSchema, required: true, immutable: true },
  rating: { type: Number, default: null, min: 1, max: 5 },
  comments: { type: String, default: '', trim: true, maxlength: 5000 },
  highlights: { type: String, default: '', trim: true, maxlength: 3000 },
  concerns: { type: String, default: '', trim: true, maxlength: 3000 },
  sourceChannel: { type: String, enum: OPERATIONAL_FEEDBACK_CHANNELS, required: true },
  receivedAt: { type: Date, required: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true, optimisticConcurrency: true });

operationalFeedbackSchema.index({ operationalTripId: 1, bookingId: 1 }, { unique: true });
operationalFeedbackSchema.index({ receivedAt: -1 });

export default mongoose.model('OperationalFeedback', operationalFeedbackSchema);
