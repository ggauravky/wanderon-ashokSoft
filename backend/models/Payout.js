import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema(
  {
    creatorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    influencerId: {
      type: String,
      required: true
    },
    influencerName: {
      type: String
    },
    influencerEmail: {
      type: String
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    currency: { type: String, default: 'INR', uppercase: true, trim: true },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    reference: { type: String, trim: true, unique: true, sparse: true },
    notes: { type: String, trim: true, maxlength: 2000 },
    destination: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['REQUESTED', 'UNDER_REVIEW', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED'],
      default: 'REQUESTED'
    },
    providerReference: {
      type: String
    },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, trim: true, maxlength: 1000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

payoutSchema.index({ status: 1, createdAt: -1 });
payoutSchema.index({ creatorUserId: 1, createdAt: -1 });

export default mongoose.model('Payout', payoutSchema);
