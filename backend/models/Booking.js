import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tripId: {
      type: String,
      required: true
    },
    tripSnapshot: {
      title: { type: String, required: true },
      location: { type: String, default: '' },
      destination: { type: String, default: '' },
      image: { type: String, default: '' },
      duration: { type: String, default: '' },
      batchDate: { type: String, default: '' },
      pickupPoint: { type: String, default: '' }
    },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      age: { type: String, default: '' },
      gender: { type: String, default: 'Male' }
    },
    travelers: [
      {
        name: { type: String, default: '' },
        age: { type: String, default: '' },
        gender: { type: String, default: 'Male' },
        phone: { type: String, default: '' },
        email: { type: String, default: '' }
      }
    ],
    numberOfTravelers: {
      type: Number,
      required: true,
      default: 1
    },
    occupancy: {
      type: String,
      default: 'Double Sharing'
    },
    pricing: {
      basePricePerPerson: { type: Number, required: true },
      subtotal: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      couponCode: { type: String, default: '' },
      taxes: { type: Number, default: 0 },
      finalAmount: { type: Number, required: true },
      currency: { type: String, default: 'INR' }
    },
    payment: {
      provider: { type: String, default: 'razorpay' },
      status: {
        type: String,
        enum: ['CREATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
      },
      razorpayOrderId: { type: String, index: true },
      razorpayPaymentId: { type: String, index: true },
      razorpaySignature: { type: String },
      paidAt: { type: Date }
    },
    bookingStatus: {
      type: String,
      enum: ['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'FAILED'],
      default: 'PENDING_PAYMENT',
      index: true
    },
    qrCode: {
      dataUrl: { type: String, default: '' },
      verificationToken: { type: String, index: true },
      verificationUrl: { type: String, default: '' }
    },
    influencerAttribution: {
      influencerId: { type: String, default: '' },
      couponCode: { type: String, default: '' },
      commissionRate: { type: Number, default: 0 },
      commissionAmount: { type: Number, default: 0 }
    },
    whatsappNotification: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      status: {
        type: String,
        enum: ['NOT_SENT', 'SENT', 'SIMULATED_SENT', 'FAILED'],
        default: 'NOT_SENT'
      },
      messageSid: { type: String, default: '' },
      phone: { type: String, default: '' },
      error: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

export default mongoose.model('Booking', bookingSchema);
