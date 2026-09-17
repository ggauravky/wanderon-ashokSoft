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
      default: 'home_hero',
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'scheduled'],
      default: 'active',
      index: true
    },
    priorityOrder: {
      type: Number,
      default: 1
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
    }
  },
  { timestamps: true }
);

export default mongoose.model('Banner', bannerSchema);
