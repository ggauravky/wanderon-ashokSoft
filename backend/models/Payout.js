import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema(
  {
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
      required: true
    },
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
    }
  },
  { timestamps: true }
);

export default mongoose.model('Payout', payoutSchema);
