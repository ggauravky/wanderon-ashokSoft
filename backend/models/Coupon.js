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
      default: ''
    },
    creatorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    scope: { type: String, enum: ['promotional', 'referral'], default: 'promotional' },
    planId: {
      type: Number
    },
    planTitle: {
      type: String,
      default: ''
    },
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    minimumAmount: { type: Number, default: 0, min: 0 },
    maximumDiscount: { type: Number, min: 0 },
    startsAt: { type: Date },
    endsAt: { type: Date },
    usageLimit: { type: Number, min: 0 },
    usageCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
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
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'revoked', 'expired'],
      default: 'active'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

couponSchema.index({ status: 1, isActive: 1, createdAt: -1 });
couponSchema.index({ endsAt: 1 });

export default mongoose.model('Coupon', couponSchema);
