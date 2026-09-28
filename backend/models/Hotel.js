import crypto from 'node:crypto';
import mongoose from 'mongoose';

export const PROPERTY_TYPES = ['HOTEL', 'BOUTIQUE_HOTEL', 'RESORT', 'HOSTEL', 'HOMESTAY', 'GUEST_HOUSE', 'CAMP', 'VILLA', 'APARTMENT', 'LODGE', 'OTHER'];
export const HOTEL_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'];
export const MEAL_PLANS = ['EP', 'CP', 'MAP', 'AP'];

const id = (prefix) => `${prefix}_${crypto.randomBytes(5).toString('hex')}`;
const mediaSchema = new mongoose.Schema({
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaAsset', required: true },
  publicId: { type: String, default: '' },
  secureUrl: { type: String, required: true },
  altText: { type: String, default: '' },
  caption: { type: String, default: '' }
}, { _id: false });

const roomTypeSchema = new mongoose.Schema({
  roomTypeId: { type: String, default: () => id('room'), required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  bedType: { type: String, default: '' },
  maxOccupancy: { type: Number, min: 1, default: 2 },
  maxAdults: { type: Number, min: 1, default: 2 },
  maxChildren: { type: Number, min: 0, default: 0 },
  extraBedAllowed: { type: Boolean, default: false },
  amenities: { type: [String], default: [] },
  media: { type: [mediaSchema], default: [] },
  active: { type: Boolean, default: true }
}, { _id: false });

const ratePlanSchema = new mongoose.Schema({
  ratePlanId: { type: String, default: () => id('rate'), required: true },
  roomTypeId: { type: String, required: true },
  mealPlan: { type: String, enum: MEAL_PLANS, required: true },
  currency: { type: String, default: 'INR' },
  supplierRatePerNight: { type: Number, min: 0, default: 0 },
  customerReferenceRatePerNight: { type: Number, min: 0, default: 0 },
  taxPercent: { type: Number, min: 0, max: 100, default: 0 },
  validFrom: { type: Date, default: null },
  validTo: { type: Date, default: null },
  minNights: { type: Number, min: 1, default: 1 },
  active: { type: Boolean, default: true },
  notes: { type: String, default: '' }
}, { _id: false });

const hotelSchema = new mongoose.Schema({
  hotelCode: { type: String, unique: true, immutable: true, default: () => `WL-HOT-${crypto.randomBytes(4).toString('hex').toUpperCase()}` },
  name: { type: String, required: true, trim: true },
  normalizedName: { type: String, required: true, select: false },
  aliases: { type: [String], default: [] },
  propertyType: { type: String, enum: PROPERTY_TYPES, default: 'HOTEL' },
  status: { type: String, enum: HOTEL_STATUSES, default: 'DRAFT' },
  starRating: { type: Number, min: 0, max: 5, default: 0 },
  classification: { type: String, default: '' },
  tags: { type: [String], default: [] },
  shortDescription: { type: String, default: '' },
  description: { type: String, default: '' },
  location: {
    addressLine1: { type: String, default: '' }, addressLine2: { type: String, default: '' },
    locality: { type: String, default: '' }, city: { type: String, required: true, trim: true },
    state: { type: String, default: '' }, country: { type: String, required: true, trim: true, default: 'India' },
    pincode: { type: String, default: '' },
    coordinates: { lat: { type: Number, min: -90, max: 90, default: null }, lng: { type: Number, min: -180, max: 180, default: null } },
    nearbyLandmarks: { type: [String], default: [] }
  },
  stayInfo: {
    checkInTime: { type: String, default: '' }, checkOutTime: { type: String, default: '' },
    earlyCheckInNotes: { type: String, default: '' }, lateCheckOutNotes: { type: String, default: '' },
    childPolicy: { type: String, default: '' }, extraBedPolicy: { type: String, default: '' },
    propertyNotes: { type: String, default: '' }
  },
  amenities: { type: [String], default: [] },
  highlights: { type: [String], default: [] },
  roomTypes: { type: [roomTypeSchema], default: [] },
  availableMealPlans: { type: [String], enum: MEAL_PLANS, default: [] },
  ratePlans: { type: [ratePlanSchema], default: [] },
  media: { hero: { type: mediaSchema, default: null }, gallery: { type: [mediaSchema], default: [] } },
  contact: {
    reservationsPerson: { type: String, default: '' }, phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    email: { type: String, default: '', trim: true, lowercase: true, validate: { validator: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), message: 'Enter a valid hotel email.' } },
    website: { type: String, default: '', trim: true, validate: { validator: (value) => !value || /^https?:\/\/[^\s/]+/i.test(value), message: 'Enter a valid hotel website URL.' } }
  },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
  internalNotes: { type: String, default: '' },
  catalogVersion: { type: Number, min: 1, default: 1 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true, optimisticConcurrency: true });

hotelSchema.index({ status: 1, name: 1 });
hotelSchema.index({ normalizedName: 1, 'location.city': 1, 'location.country': 1 });
hotelSchema.index({ 'location.city': 1, status: 1 });
hotelSchema.index({ propertyType: 1, status: 1 });
hotelSchema.index({ starRating: 1, status: 1 });

export default mongoose.models.Hotel || mongoose.model('Hotel', hotelSchema);
