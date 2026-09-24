import mongoose from 'mongoose';
import { operationsDocumentSchema } from './schemas/operationsDocumentSchema.js';

export const VENDOR_TYPES = Object.freeze(['HOTEL', 'TRANSPORT', 'DRIVER', 'ACTIVITY', 'GUIDE']);
export const VENDOR_RATE_TYPES = Object.freeze([
  'PER_ROOM_NIGHT', 'PER_NIGHT', 'PER_VEHICLE', 'PER_DAY', 'PER_PERSON', 'PER_ACTIVITY', 'FIXED', 'CUSTOM'
]);

const cleanPhone = (value) => String(value || '').trim().replace(/[^\d+()\-\s]/g, '');

const vendorSchema = new mongoose.Schema(
  {
    vendorCode: { type: String, required: true, unique: true, uppercase: true, trim: true, immutable: true },
    name: { type: String, required: true, trim: true, maxlength: 180 },
    types: {
      type: [{ type: String, enum: VENDOR_TYPES }],
      required: true,
      validate: { validator: (values) => Array.isArray(values) && values.length > 0, message: 'At least one Vendor type is required.' }
    },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
    contact: {
      personName: { type: String, default: '', trim: true, maxlength: 120 },
      phone: { type: String, default: '', set: cleanPhone, maxlength: 40 },
      alternatePhone: { type: String, default: '', set: cleanPhone, maxlength: 40 },
      whatsapp: { type: String, default: '', set: cleanPhone, maxlength: 40 },
      email: {
        type: String,
        default: '',
        lowercase: true,
        trim: true,
        validate: { validator: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), message: 'Please provide a valid Vendor email.' }
      }
    },
    location: {
      address: { type: String, default: '', trim: true, maxlength: 500 },
      city: { type: String, default: '', trim: true, maxlength: 120 },
      state: { type: String, default: '', trim: true, maxlength: 120 },
      country: { type: String, default: 'India', trim: true, maxlength: 120 },
      pincode: { type: String, default: '', trim: true, maxlength: 20 }
    },
    serviceAreas: { type: [String], default: [], set: (values) => [...new Set((values || []).map((value) => String(value).trim()).filter(Boolean))] },
    commercialReference: {
      currency: { type: String, default: 'INR', trim: true, uppercase: true, maxlength: 8 },
      rateType: { type: String, enum: VENDOR_RATE_TYPES, default: 'CUSTOM' },
      defaultRate: { type: Number, default: null, min: 0 },
      taxPercent: { type: Number, default: null, min: 0, max: 100 },
      paymentTerms: { type: String, default: '', trim: true, maxlength: 1000 },
      notes: { type: String, default: '', trim: true, maxlength: 2000 }
    },
    documents: { type: [operationsDocumentSchema], default: [] },
    notes: { type: String, default: '', trim: true, maxlength: 5000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true, optimisticConcurrency: true }
);

vendorSchema.index({ types: 1, status: 1 });
vendorSchema.index({ 'location.city': 1, status: 1 });
vendorSchema.index({ name: 1, status: 1 });

export default mongoose.model('Vendor', vendorSchema);
