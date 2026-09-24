import crypto from 'crypto';
import mongoose from 'mongoose';

export const OPERATIONS_DOCUMENT_TYPES = Object.freeze([
  'AGREEMENT',
  'RATE_CARD',
  'LICENSE',
  'REGISTRATION',
  'INSURANCE',
  'ID',
  'HOTEL_VOUCHER',
  'TRANSPORT_VOUCHER',
  'ACTIVITY_TICKET',
  'CONFIRMATION',
  'PERMIT',
  'DRIVER_DOCUMENT',
  'OTHER'
]);

export const operationsDocumentSchema = new mongoose.Schema(
  {
    documentId: { type: String, default: () => `opdoc_${crypto.randomUUID()}` },
    type: { type: String, enum: OPERATIONS_DOCUMENT_TYPES, default: 'OTHER' },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    fileName: { type: String, default: '', trim: true, maxlength: 255 },
    mimeType: {
      type: String,
      enum: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      required: true
    },
    size: { type: Number, default: 0, min: 0, max: 15 * 1024 * 1024 },
    secureUrl: { type: String, required: true, trim: true },
    publicId: { type: String, default: '', trim: true },
    expiryDate: { type: Date, default: null },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { _id: false }
);
