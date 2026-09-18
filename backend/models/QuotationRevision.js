import mongoose from 'mongoose';

const quotationRevisionSchema = new mongoose.Schema(
  {
    quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true, index: true },
    version: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['DRAFT_SNAPSHOT', 'FINALIZED', 'SHARED', 'SUPERSEDED', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED'],
      default: 'FINALIZED',
      index: true
    },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
    templateKey: { type: String, enum: ['minimal', 'journey', 'signature_luxe'], default: 'journey' },
    finalCustomerPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, default: '' },
    finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    finalizedByName: { type: String, default: '' },
    finalizedAt: { type: Date, default: Date.now },
    supersededAt: { type: Date, default: null },
    approval: {
      method: { type: String, enum: ['CUSTOMER_ACCOUNT', 'RECIPIENT_VERIFICATION', 'ADMIN_OVERRIDE'], default: null },
      approvedAt: { type: Date, default: null },
      approvedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      approvedByEmail: { type: String, default: '' },
      approvedByName: { type: String, default: '' },
      reason: { type: String, default: '' },
      termsAccepted: { type: Boolean, default: false }
    },
    customerDecision: {
      type: { type: String, enum: ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'], default: null },
      notes: { type: String, default: '' },
      decidedAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

quotationRevisionSchema.index({ quotationId: 1, version: 1 }, { unique: true });

export default mongoose.model('QuotationRevision', quotationRevisionSchema);
