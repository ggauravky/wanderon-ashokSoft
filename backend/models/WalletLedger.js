import mongoose from 'mongoose';

const walletLedgerSchema = new mongoose.Schema(
  {
    influencerId: {
      type: String,
      required: true
    },
    bookingId: {
      type: String
    },
    payoutId: {
      type: String
    },
    type: {
      type: String,
      enum: ['COMMISSION_PENDING', 'COMMISSION_CLEARED', 'PAYOUT_REQUESTED', 'PAYOUT_PAID', 'REVERSAL', 'ADJUSTMENT'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      required: true
    },
    reference: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('WalletLedger', walletLedgerSchema);
