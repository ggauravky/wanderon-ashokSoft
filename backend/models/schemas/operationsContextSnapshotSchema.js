import mongoose from 'mongoose';

export const operationsContextSnapshotSchema = new mongoose.Schema(
  {
    operationKey: { type: String, required: true, immutable: true, trim: true, maxlength: 300 },
    sourceType: { type: String, enum: ['CATALOG', 'CUSTOM'], required: true, immutable: true },
    title: { type: String, required: true, immutable: true, trim: true, maxlength: 240 },
    destination: { type: String, default: '', immutable: true, trim: true, maxlength: 180 },
    startDate: { type: Date, default: null, immutable: true },
    endDate: { type: Date, default: null, immutable: true }
  },
  { _id: false }
);
