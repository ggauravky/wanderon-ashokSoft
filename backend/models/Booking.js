import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true
    },
    customerId: {
      type: String
    },
    planId: {
      type: Number
    },
    tripTitle: {
      type: String,
      required: true
    },
    couponCode: {
      type: String
    },
    influencerId: {
      type: String
    },
    totalAmount: {
      type: Number,
      required: true
    },
    paidAmount: {
      type: Number,
      required: true
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      default: 'Paid in Full'
    },
    bookingStatus: {
      type: String,
      enum: ['Confirmed', 'Pending', 'Cancelled'],
      default: 'Confirmed'
    },
    leadTraveler: {
      name: String,
      email: String,
      phone: String,
      age: String,
      gender: String
    },
    coTravelers: Array,
    pickupPoint: String
  },
  { timestamps: true }
);

export default mongoose.model('Booking', bookingSchema);
