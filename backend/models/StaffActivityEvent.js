import mongoose from 'mongoose';

const staffActivityEventSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, required: true, trim: true },
    department: { type: String, enum: ['sales', 'marketing'], required: true },
    action: { type: String, required: true, trim: true },
    entityType: { type: String, required: true, trim: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    entityKey: { type: String, default: '', trim: true },
    entityLabel: { type: String, default: '', trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true, updatedAt: false }
);

staffActivityEventSchema.index({ actorId: 1, createdAt: -1 });
staffActivityEventSchema.index({ department: 1, createdAt: -1 });
staffActivityEventSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export default mongoose.model('StaffActivityEvent', staffActivityEventSchema);
