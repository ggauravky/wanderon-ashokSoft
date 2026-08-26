import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide lead name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide lead email address'],
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Please provide phone number'],
      trim: true
    },
    leadType: {
      type: String,
      enum: ['general', 'trip_enquiry', 'callback_request'],
      default: 'trip_enquiry',
      index: true
    },
    tripId: {
      type: String,
      default: '',
      index: true
    },
    tripTitle: {
      type: String,
      default: ''
    },
    destination: {
      type: String,
      default: 'Meghalaya'
    },
    travelersCount: {
      type: Number,
      default: 1
    },
    travelMonth: {
      type: String,
      default: ''
    },
    travelDate: {
      type: String,
      default: ''
    },
    budgetPerPerson: {
      type: String,
      default: ''
    },
    preferredCallDate: {
      type: String,
      default: ''
    },
    preferredCallWindow: {
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening', 'Anytime', ''],
      default: 'Anytime'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    message: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'IN_PROGRESS', 'QUALIFIED', 'CONVERTED', 'LOST'],
      default: 'NEW',
      index: true
    },
    assignedTo: {
      type: String,
      default: 'Sales Concierge Team'
    },
    notes: {
      type: String,
      default: ''
    },
    source: {
      type: String,
      enum: ['trip_page', 'contact_page', 'booking_page', 'custom_inquiry'],
      default: 'trip_page'
    },
    whatsappNotification: {
      sent: { type: Boolean, default: false },
      status: { type: String, default: 'PENDING' },
      sentAt: { type: Date }
    }
  },
  { timestamps: true }
);

export default mongoose.model('Lead', leadSchema);

