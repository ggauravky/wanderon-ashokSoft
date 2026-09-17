import mongoose from 'mongoose';

const quotationApprovalVerificationSchema = new mongoose.Schema(
  {
    quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true, index: true },
    revisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuotationRevision', required: true, index: true },
    shareId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuotationShare', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0, min: 0 },
    maxAttempts: { type: Number, default: 5 },
    verifiedAt: { type: Date, default: null },
    usedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

quotationApprovalVerificationSchema.index({ shareId: 1, email: 1, createdAt: -1 });

export default mongoose.model('QuotationApprovalVerification', quotationApprovalVerificationSchema);
