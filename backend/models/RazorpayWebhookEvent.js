import mongoose from 'mongoose';

const razorpayWebhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    eventType: {
      type: String,
      required: true,
      index: true
    },
    paymentId: {
      type: String,
      default: '',
      index: true
    },
    orderId: {
      type: String,
      default: '',
      index: true
    },
    status: {
      type: String,
      enum: ['RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED'],
      default: 'RECEIVED',
      index: true
    },
    error: {
      type: String,
      default: ''
    },
    receivedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model('RazorpayWebhookEvent', razorpayWebhookEventSchema);
