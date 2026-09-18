import mongoose from 'mongoose';

const mediaAssetSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['IMAGE', 'VIDEO', 'DOCUMENT'],
      default: 'IMAGE'
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    altText: {
      type: String,
      required: [true, 'Alt text is required for accessibility and SEO'],
      trim: true
    },
    caption: {
      type: String,
      trim: true,
      default: ''
    },
    storage: {
      provider: { type: String, default: 'cloudinary' },
      publicId: { type: String, default: '', trim: true },
      secureUrl: { type: String, required: [true, 'Secure URL is required'], trim: true },
      width: { type: Number, default: 1600 },
      height: { type: Number, default: 900 },
      format: { type: String, default: 'jpg' },
      bytes: { type: Number, default: 0 }
    },
    geography: {
      country: { type: String, default: 'India', trim: true },
      state: { type: String, default: '', trim: true },
      region: { type: String, default: '', trim: true },
      destination: { type: String, required: true, trim: true },
      city: { type: String, default: '', trim: true },
      locality: { type: String, default: '', trim: true },
      poi: { type: String, default: '', trim: true }
    },
    locationKeys: {
      type: [String],
      default: []
    },
    tags: {
      type: [String],
      default: []
    },
    categories: {
      type: [String],
      default: ['Landscape', 'Sightseeing']
    },
    orientation: {
      type: String,
      enum: ['LANDSCAPE', 'PORTRAIT', 'SQUARE'],
      default: 'LANDSCAPE'
    },
    usage: {
      itinerary: { type: Boolean, default: true },
      destination: { type: Boolean, default: true },
      tripCard: { type: Boolean, default: true },
      hero: { type: Boolean, default: false },
      gallery: { type: Boolean, default: true },
      hotel: { type: Boolean, default: false }
    },
    source: {
      sourceType: {
        type: String,
        enum: ['ADMIN_UPLOAD', 'STAFF_UPLOAD', 'PROJECT_ASSET', 'AUTHORIZED_EXTERNAL_SOURCE', 'PARTNER_MEDIA', 'UNSPLASH_CURATED', 'PEXELS_CURATED'],
        default: 'PROJECT_ASSET'
      },
      attribution: { type: String, default: 'WanderLuxe Verified Media' },
      sourceUrl: { type: String, default: '' },
      license: { type: String, default: 'Commercial Editorial Use' }
    },
    active: {
      type: Boolean,
      default: true
    },
    featured: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for high-speed location and tag matching without redundancy
mediaAssetSchema.index({ 'geography.destination': 1, active: 1 });
mediaAssetSchema.index({ 'geography.poi': 1, active: 1 });
mediaAssetSchema.index({ locationKeys: 1, active: 1 });
mediaAssetSchema.index({ tags: 1, active: 1 });
mediaAssetSchema.index({ 'storage.publicId': 1, active: 1 });
mediaAssetSchema.index({ featured: -1, createdAt: -1 });
mediaAssetSchema.index({ type: 1, active: 1, createdAt: -1 });
mediaAssetSchema.index({ 'source.sourceType': 1, active: 1, createdAt: -1 });
mediaAssetSchema.index({ 'usage.hotel': 1, active: 1, featured: -1, createdAt: -1 });

// Helper method to generate standardized location keys
export const generateLocationKeys = (geo = {}, title = '', tags = []) => {
  const tokens = new Set();

  const addToken = (val) => {
    if (!val || typeof val !== 'string') return;
    const clean = val.toLowerCase().trim();
    if (!clean) return;
    tokens.add(clean);
    // Slugify version
    const slug = clean.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (slug) tokens.add(slug);
    // Individual meaningful words
    clean.split(/[\s,/-]+/).forEach((word) => {
      if (word.length > 2 && !['and', 'the', 'for', 'via', 'with', 'from', 'near'].includes(word)) {
        tokens.add(word);
      }
    });
  };

  addToken(geo.country);
  addToken(geo.state);
  addToken(geo.region);
  addToken(geo.destination);
  addToken(geo.city);
  addToken(geo.locality);
  addToken(geo.poi);
  addToken(title);
  tags.forEach(t => addToken(t));

  return Array.from(tokens);
};

const MediaAsset = mongoose.models.MediaAsset || mongoose.model('MediaAsset', mediaAssetSchema);

export default MediaAsset;
