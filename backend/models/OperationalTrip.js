import mongoose from 'mongoose';

const operationalTripSchema = new mongoose.Schema(
  {
    operationKey: { type: String, required: true, unique: true, immutable: true, trim: true },
    sourceType: { type: String, enum: ['CATALOG', 'CUSTOM'], required: true, immutable: true },
    source: {
      tripId: { type: String, default: '', immutable: true },
      tripMongoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null, immutable: true },
      tripSlug: { type: String, default: '', immutable: true },
      batchId: { type: String, default: '', immutable: true },
      customBookingId: { type: String, default: '', immutable: true }
    },
    coordinatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    coordinatorAssignedAt: { type: Date, default: null },
    coordinatorAssignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    internalNotes: { type: String, default: '', trim: true, maxlength: 5000 },
    materializedAt: { type: Date, default: Date.now, immutable: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true, optimisticConcurrency: true }
);

operationalTripSchema.index({ coordinatorId: 1, updatedAt: -1 });

export default mongoose.model('OperationalTrip', operationalTripSchema);
