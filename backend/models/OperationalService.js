import mongoose from 'mongoose';
import { operationsDocumentSchema } from './schemas/operationsDocumentSchema.js';

export const OPERATIONAL_SERVICE_TYPES = Object.freeze(['HOTEL', 'TRANSPORT', 'ACTIVITY', 'GUIDE']);
export const SERVICE_CONFIRMATION_STATUSES = Object.freeze([
  'UNASSIGNED', 'PENDING_CONFIRMATION', 'CONFIRMED', 'DECLINED', 'CANCELLED'
]);

const serviceHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['CREATED', 'VENDOR_ASSIGNED', 'VENDOR_CHANGED', 'DRIVER_ASSIGNED', 'CONFIRMATION_REQUESTED', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'DETAILS_UPDATED'],
      required: true
    },
    fromStatus: { type: String, enum: SERVICE_CONFIRMATION_STATUSES, default: null },
    toStatus: { type: String, enum: SERVICE_CONFIRMATION_STATUSES, default: null },
    note: { type: String, default: '', trim: true, maxlength: 1000 },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actorName: { type: String, default: '', trim: true, maxlength: 120 },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const operationalServiceSchema = new mongoose.Schema(
  {
    operationalTripId: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationalTrip', required: true, index: true },
    serviceKey: { type: String, required: true, trim: true, immutable: true },
    serviceType: { type: String, enum: OPERATIONAL_SERVICE_TYPES, required: true },
    source: {
      type: { type: String, enum: ['QUOTATION', 'MANUAL', 'CATALOG'], required: true },
      sectionId: { type: String, default: '', trim: true },
      sectionType: { type: String, default: '', trim: true },
      bookingId: { type: String, default: '', trim: true },
      sourceProviderName: { type: String, default: '', trim: true }
    },
    title: { type: String, required: true, trim: true, maxlength: 220 },
    required: { type: Boolean, default: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null, index: true },
    vendorSnapshot: {
      vendorCode: { type: String, default: '' },
      name: { type: String, default: '' },
      type: { type: String, default: '' },
      contactName: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' }
    },
    confirmationStatus: { type: String, enum: SERVICE_CONFIRMATION_STATUSES, default: 'UNASSIGNED', index: true },
    confirmationRequestedAt: { type: Date, default: null },
    confirmedAt: { type: Date, default: null },
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    declinedAt: { type: Date, default: null },
    declineReason: { type: String, default: '', trim: true, maxlength: 1000 },
    confirmationNumber: { type: String, default: '', trim: true, maxlength: 180 },
    bookingReference: { type: String, default: '', trim: true, maxlength: 180 },
    internalNotes: { type: String, default: '', trim: true, maxlength: 5000 },
    schedule: {
      startDate: { type: Date, default: null },
      startTime: { type: String, default: '', trim: true },
      endDate: { type: Date, default: null },
      endTime: { type: String, default: '', trim: true }
    },
    hotelDetails: {
      hotelName: { type: String, default: '', trim: true },
      city: { type: String, default: '', trim: true },
      address: { type: String, default: '', trim: true },
      roomType: { type: String, default: '', trim: true },
      rooms: { type: Number, default: null, min: 0 },
      occupancy: { type: String, default: '', trim: true },
      mealPlan: { type: String, default: '', trim: true },
      checkIn: { type: Date, default: null },
      checkOut: { type: Date, default: null },
      nights: { type: Number, default: null, min: 0 }
    },
    transportDetails: {
      mode: { type: String, default: '', trim: true },
      vehicleType: { type: String, default: '', trim: true },
      vehicleNumber: { type: String, default: '', trim: true },
      capacity: { type: Number, default: null, min: 0 },
      route: {
        from: { type: String, default: '', trim: true },
        to: { type: String, default: '', trim: true },
        pickupPoint: { type: String, default: '', trim: true },
        dropPoint: { type: String, default: '', trim: true }
      },
      departureDate: { type: Date, default: null },
      departureTime: { type: String, default: '', trim: true },
      arrivalDate: { type: Date, default: null },
      arrivalTime: { type: String, default: '', trim: true },
      driverVendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
      driverSnapshot: {
        name: { type: String, default: '', trim: true },
        phone: { type: String, default: '', trim: true },
        licenseNumber: { type: String, default: '', trim: true }
      }
    },
    activityDetails: {
      activityName: { type: String, default: '', trim: true },
      location: { type: String, default: '', trim: true },
      date: { type: Date, default: null },
      startTime: { type: String, default: '', trim: true },
      endTime: { type: String, default: '', trim: true },
      travelerCount: { type: Number, default: null, min: 0 },
      meetingPoint: { type: String, default: '', trim: true },
      dayNumber: { type: Number, default: null, min: 1 }
    },
    guideDetails: {
      guideVendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
      guideName: { type: String, default: '', trim: true },
      phone: { type: String, default: '', trim: true },
      date: { type: Date, default: null },
      startTime: { type: String, default: '', trim: true },
      endTime: { type: String, default: '', trim: true },
      location: { type: String, default: '', trim: true },
      language: { type: String, default: '', trim: true },
      meetingPoint: { type: String, default: '', trim: true }
    },
    documents: { type: [operationsDocumentSchema], default: [] },
    history: { type: [serviceHistorySchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true, optimisticConcurrency: true }
);

operationalServiceSchema.index({ operationalTripId: 1, serviceKey: 1 }, { unique: true });
operationalServiceSchema.index({ operationalTripId: 1, serviceType: 1, confirmationStatus: 1 });
operationalServiceSchema.index({ vendorId: 1, updatedAt: -1 });

export default mongoose.model('OperationalService', operationalServiceSchema);
