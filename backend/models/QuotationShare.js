import mongoose from 'mongoose';

const quotationShareSchema = new mongoose.Schema(
  {
    quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true, index: true },
    revisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuotationRevision', required: true, index: true },
    version: { type: Number, required: true },
    recipientEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    tokenPrefix: { type: String, default: '' },
    templateKey: { type: String, enum: ['minimal', 'journey', 'signature_luxe'], default: 'journey' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, default: '' },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    revokeReason: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    allowPdfDownload: { type: Boolean, default: true },
    allowAttachments: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: true },
    approvalEnabled: { type: Boolean, default: true },
    viewCount: { type: Number, default: 0, min: 0 },
    firstViewedAt: { type: Date, default: null },
    lastViewedAt: { type: Date, default: null },
    pdfDownloadCount: { type: Number, default: 0, min: 0 },
    attachmentDownloadCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

quotationShareSchema.index({ quotationId: 1, createdAt: -1 });

export default mongoose.model('QuotationShare', quotationShareSchema);
