import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Campaign code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    utmSource: {
      type: String,
      default: 'meta'
    },
    utmMedium: {
      type: String,
      default: 'cpc'
    },
    utmCampaign: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      enum: ['meta_ads', 'google_ads', 'influencer', 'email', 'organic', 'festival_promo', 'other'],
      default: 'meta_ads'
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'],
      default: 'draft'
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    budget: {
      type: Number,
      default: 0,
      min: 0
    },
    spend: {
      type: Number,
      default: 0,
      min: 0
    },
    targetAudience: {
      type: String,
      default: ''
    },
    targetDestinations: {
      type: [String],
      default: []
    },
    featuredTrips: {
      type: [String],
      default: []
    },
    metrics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      leadsCount: { type: Number, default: 0 },
      conversionsCount: { type: Number, default: 0 },
      revenueGenerated: { type: Number, default: 0 }
    },
    notes: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

campaignSchema.index({ status: 1, startDate: 1, endDate: 1 });
campaignSchema.index({ type: 1, updatedAt: -1 });
campaignSchema.index({ createdBy: 1, createdAt: -1 });
campaignSchema.index({ updatedBy: 1, updatedAt: -1 });

export default mongoose.model('Campaign', campaignSchema);
