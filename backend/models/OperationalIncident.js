import mongoose from 'mongoose';
import { operationsDocumentSchema } from './schemas/operationsDocumentSchema.js';
import { operationsContextSnapshotSchema } from './schemas/operationsContextSnapshotSchema.js';

export const INCIDENT_TYPES = Object.freeze([
  'CUSTOMER_COMPLAINT', 'SERVICE_FAILURE', 'DELAY', 'HOTEL_ISSUE', 'TRANSPORT_ISSUE',
  'VEHICLE_BREAKDOWN', 'ACTIVITY_ISSUE', 'CANCELLATION', 'WEATHER_DISRUPTION',
  'ROAD_CLOSURE', 'MEDICAL_EMERGENCY', 'SAFETY_EMERGENCY', 'LOST_ITEM', 'OTHER'
]);
export const INCIDENT_SEVERITIES = Object.freeze(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const INCIDENT_STATUSES = Object.freeze(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
export const INCIDENT_SCOPES = Object.freeze(['TRIP_WIDE', 'BOOKING', 'SERVICE']);
export const INCIDENT_ESCALATION_STATUSES = Object.freeze(['NONE', 'ESCALATED', 'ACKNOWLEDGED']);

const incidentHistorySchema = new mongoose.Schema(
  {
    action: { type: String, enum: ['REPORTED', 'ASSIGNED', 'DETAILS_UPDATED', 'STARTED', 'ESCALATED', 'ESCALATION_ACKNOWLEDGED', 'RESOLVED', 'CLOSED', 'REOPENED', 'DOCUMENT_ADDED', 'CUSTOMER_UPDATED'], required: true },
    fromStatus: { type: String, default: '', trim: true, maxlength: 60 },
    toStatus: { type: String, default: '', trim: true, maxlength: 60 },
    note: { type: String, default: '', trim: true, maxlength: 1500 },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actorName: { type: String, default: '', trim: true, maxlength: 120 },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const operationalIncidentSchema = new mongoose.Schema(
  {
    incidentCode: { type: String, required: true, unique: true, uppercase: true, trim: true, immutable: true },
    operationalTripId: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationalTrip', required: true },
    contextSnapshot: { type: operationsContextSnapshotSchema, required: true, immutable: true },
    title: { type: String, required: true, trim: true, maxlength: 220 },
    incidentType: { type: String, enum: INCIDENT_TYPES, required: true },
    severity: { type: String, enum: INCIDENT_SEVERITIES, required: true },
    status: { type: String, enum: INCIDENT_STATUSES, default: 'OPEN' },
    scope: { type: String, enum: INCIDENT_SCOPES, required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    linkedServiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationalService', default: null },
    linkedVendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
    serviceSnapshot: {
      serviceType: { type: String, default: '' },
      title: { type: String, default: '' },
      vendorCode: { type: String, default: '' },
      vendorName: { type: String, default: '' }
    },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reportedAt: { type: Date, required: true, default: Date.now },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actionTaken: { type: String, default: '', trim: true, maxlength: 5000 },
    resolutionSummary: { type: String, default: '', trim: true, maxlength: 3000 },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    closedAt: { type: Date, default: null },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    escalation: {
      status: { type: String, enum: INCIDENT_ESCALATION_STATUSES, default: 'NONE' },
      escalatedAt: { type: Date, default: null },
      escalatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      note: { type: String, default: '', trim: true, maxlength: 1500 },
      acknowledgedAt: { type: Date, default: null },
      acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    documents: { type: [operationsDocumentSchema], default: [] },
    history: { type: [incidentHistorySchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true, optimisticConcurrency: true }
);

operationalIncidentSchema.index({ operationalTripId: 1, status: 1, severity: 1 });
operationalIncidentSchema.index({ assignedTo: 1, status: 1, severity: 1 });
operationalIncidentSchema.index({ status: 1, severity: 1, reportedAt: -1 });

export default mongoose.model('OperationalIncident', operationalIncidentSchema);
