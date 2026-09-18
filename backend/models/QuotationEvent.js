import mongoose from 'mongoose';

const quotationEventSchema = new mongoose.Schema(
  {
    quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true, index: true },
    revisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuotationRevision', default: null, index: true },
    shareId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuotationShare', default: null, index: true },
    type: { type: String, required: true, index: true },
    actorType: { type: String, enum: ['STAFF', 'CUSTOMER', 'SYSTEM'], default: 'SYSTEM' },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actorName: { type: String, default: '' },
    actorEmail: { type: String, default: '' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

quotationEventSchema.index({ quotationId: 1, createdAt: -1 });
quotationEventSchema.index({ actorId: 1, createdAt: -1 });

export default mongoose.model('QuotationEvent', quotationEventSchema);
