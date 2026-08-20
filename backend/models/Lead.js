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
    destination: {
      type: String,
      default: 'Meghalaya'
    },
    travelersCount: {
      type: Number,
      default: 2
    },
    travelMonth: {
      type: String,
      default: 'September 2026'
    },
    budgetPerPerson: {
      type: String,
      default: '₹15,000 - ₹25,000'
    },
    message: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'LOST'],
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
      default: 'Custom Trip Inquiry Form'
    }
  },
  { timestamps: true }
);

export default mongoose.model('Lead', leadSchema);
