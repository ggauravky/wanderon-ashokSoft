import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true
    },
    influencerId: {
      type: String,
      required: true
    },
    couponCode: {
      type: String,
      required: true
    },
    baseAmount: {
      type: Number,
      required: true
    },
    commissionRate: {
      type: Number,
      default: 10
    },
    amount: {
      type: Number,
      required: true
    },
    commissionBaseType: {
      type: String,
      enum: ['gross', 'net', 'fixed'],
      default: 'net'
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'AVAILABLE', 'PAID', 'REVERSED', 'DISPUTED'],
      default: 'PENDING'
    }
  },
  { timestamps: true }
);

export default mongoose.model('Commission', commissionSchema);
