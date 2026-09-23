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
      default: null,
      index: true
    },
    tripId: {
      type: String,
      required: true
    },
    batchId: {
      type: String,
      default: '',
      index: true
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
    paymentPlan: {
      type: { type: String, enum: ['FULL', 'PARTIAL'], default: 'FULL' },
      depositPercent: { type: Number, default: 10 },
      balanceDueDays: { type: Number, default: 6 }
    },
    pricing: {
      basePricePerPerson: { type: Number, required: true },
      subtotal: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      couponCode: { type: String, default: '' },
      taxes: { type: Number, default: 0 },
      finalAmount: { type: Number, required: true },
      amountPaid: { type: Number, default: 0 },
      amountOutstanding: { type: Number, default: 0 },
      balanceDueDate: { type: Date },
      isOverdue: { type: Boolean, default: false },
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
      pendingBalanceOrderId: { type: String, default: '' },
      razorpayPaymentId: { type: String, index: true },
      razorpaySignature: { type: String },
      paidAt: { type: Date }
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'UNPAID'
    },
    bookingStatus: {
      type: String,
      enum: ['DRAFT', 'PENDING_PAYMENT', 'PROVISIONALLY_CONFIRMED', 'CONFIRMED', 'CANCELLED', 'FAILED'],
      default: 'PENDING_PAYMENT',
      index: true
    },
    payments: [
      {
        provider: { type: String, default: 'razorpay' },
        orderId: { type: String, required: true },
        paymentId: { type: String },
        amount: { type: Number, required: true },
        type: { type: String, enum: ['DEPOSIT', 'BALANCE', 'FULL'], required: true },
        verifiedAt: { type: Date },
        signature: { type: String }
      }
    ],
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
    couponRedemption: {
      couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
      recordedAt: { type: Date, default: null }
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
    },
    // Traceability to Custom Quotation & CRM Lead
    sourceQuotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      default: null,
      index: true,
      unique: true,
      sparse: true
    },
    sourceQuotationRevisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuotationRevision',
      default: null,
      index: true
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
      index: true
    },
    isCustomQuotationBooking: {
      type: Boolean,
      default: false
    },
    quotationSnapshot: {
      quotationNumber: { type: String, default: '' },
      version: { type: Number, default: 1 },
      revisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuotationRevision', default: null },
      statusAtConversion: { type: String, default: '' },
      customerSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
      tripRequirements: { type: mongoose.Schema.Types.Mixed, default: null },
      selectedHotel: { type: mongoose.Schema.Types.Mixed, default: null },
      hotelOptions: { type: [mongoose.Schema.Types.Mixed], default: [] },
      selectedTransport: { type: [mongoose.Schema.Types.Mixed], default: [] },
      transportOptions: { type: [mongoose.Schema.Types.Mixed], default: [] },
      activities: { type: [mongoose.Schema.Types.Mixed], default: [] },
      addOns: { type: [mongoose.Schema.Types.Mixed], default: [] },
      itinerary: { type: [mongoose.Schema.Types.Mixed], default: [] },
      manualPricing: { type: mongoose.Schema.Types.Mixed, default: null },
      paymentTerms: { type: mongoose.Schema.Types.Mixed, default: null },
      depositRequired: { type: Number, default: 0 },
      convertedAt: { type: Date }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    cancellationReason: {
      type: String,
      default: '',
      trim: true
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    inventoryCommittedAt: {
      type: Date,
      default: null,
      index: true
    },
    inventoryReleasedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

bookingSchema.index({ bookingStatus: 1, paymentStatus: 1, createdAt: -1 });

export default mongoose.model('Booking', bookingSchema);
