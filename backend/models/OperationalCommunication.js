import mongoose from 'mongoose';
import { operationsContextSnapshotSchema } from './schemas/operationsContextSnapshotSchema.js';

export const COMMUNICATION_DIRECTIONS = Object.freeze(['OUTBOUND', 'INBOUND']);
export const COMMUNICATION_CHANNELS = Object.freeze(['PHONE', 'WHATSAPP', 'EMAIL', 'SMS', 'IN_PERSON', 'OTHER']);
export const COMMUNICATION_TYPES = Object.freeze([
  'GENERAL_UPDATE', 'PICKUP_DETAILS', 'DRIVER_DETAILS', 'ITINERARY_UPDATE', 'HOTEL_CHANGE',
  'TRANSPORT_CHANGE', 'ACTIVITY_UPDATE', 'PRE_DEPARTURE_CONFIRMATION', 'CUSTOMER_QUERY',
  'CUSTOMER_COMPLAINT', 'EMERGENCY_UPDATE', 'OTHER'
]);

const operationalCommunicationSchema = new mongoose.Schema(
  {
    operationalTripId: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationalTrip', required: true },
    contextSnapshot: { type: operationsContextSnapshotSchema, required: true, immutable: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null, immutable: true },
    direction: { type: String, enum: COMMUNICATION_DIRECTIONS, required: true, immutable: true },
    channel: { type: String, enum: COMMUNICATION_CHANNELS, required: true, immutable: true },
    communicationType: { type: String, enum: COMMUNICATION_TYPES, required: true, immutable: true },
    summary: { type: String, required: true, trim: true, maxlength: 500, immutable: true },
    details: { type: String, default: '', trim: true, maxlength: 3000, immutable: true },
    occurredAt: { type: Date, required: true, immutable: true },
    contactNameSnapshot: { type: String, default: '', trim: true, maxlength: 160, immutable: true },
    relatedServiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationalService', default: null, immutable: true },
    relatedIncidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationalIncident', default: null, immutable: true },
    relatedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationalTask', default: null, immutable: true },
    correctionOf: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationalCommunication', default: null, immutable: true },
    loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

operationalCommunicationSchema.index({ operationalTripId: 1, occurredAt: -1 });
operationalCommunicationSchema.index({ bookingId: 1, occurredAt: -1 });

export default mongoose.model('OperationalCommunication', operationalCommunicationSchema);
