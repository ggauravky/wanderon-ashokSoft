import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true
    },
    subtitle: {
      type: String,
      default: ''
    },
    tag: {
      type: String,
      default: 'Special Offer'
    },
    imageUrl: {
      type: String,
      required: [true, 'Banner image URL is required']
    },
    mediaAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MediaAsset',
      default: null
    },
    mobileImageUrl: {
      type: String,
      default: ''
    },
    ctaText: {
      type: String,
      default: 'Explore Expeditions'
    },
    ctaLink: {
      type: String,
      default: '/trips'
    },
    placement: {
      type: String,
      enum: ['home_hero', 'top_bar', 'destination_highlight', 'offer_strip', 'popup'],
      default: 'home_hero'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'scheduled'],
      default: 'active'
    },
    priorityOrder: {
      type: Number,
      default: 1,
      min: 0
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    targetAudience: {
      type: String,
      default: 'All'
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

bannerSchema.index({ placement: 1, status: 1, priorityOrder: 1 });
bannerSchema.index({ status: 1, startDate: 1, endDate: 1 });

export default mongoose.model('Banner', bannerSchema);
