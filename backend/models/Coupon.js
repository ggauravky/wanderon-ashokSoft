import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    influencerId: {
      type: String,
      required: true
    },
    planId: {
      type: Number,
      required: true
    },
    planTitle: {
      type: String,
      required: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      required: true
    },
    commissionRate: {
      type: Number,
      default: 10
    },
    totalRedemptions: {
      type: Number,
      default: 0
    },
    revenueGenerated: {
      type: Number,
      default: 0
    },
    commissionEarned: {
      type: Number,
      default: 0
    },
    expiryDate: {
      type: String,
      default: '2026-12-31'
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'revoked', 'expired'],
      default: 'active'
    }
  },
  { timestamps: true }
);

export default mongoose.model('Coupon', couponSchema);
