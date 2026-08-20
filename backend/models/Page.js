import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    heroSubtitle: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: 'General',
      index: true
    },
    content: {
      type: String,
      default: ''
    },
    sections: [
      {
        heading: { type: String, default: '' },
        subheading: { type: String, default: '' },
        body: { type: String, default: '' },
        imageUrl: { type: String, default: '' },
        imageAlt: { type: String, default: '' },
        ctaLabel: { type: String, default: '' },
        ctaUrl: { type: String, default: '' }
      }
    ],
    status: {
      type: String,
      enum: ['published', 'draft'],
      default: 'published',
      index: true
    },
    author: {
      type: String,
      default: 'WanderLuxe Editorial Team'
    },
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      keywords: { type: String, default: '' },
      canonicalUrl: { type: String, default: '' },
      robots: { type: String, default: 'index, follow' },
      ogTitle: { type: String, default: '' },
      ogDescription: { type: String, default: '' },
      ogImage: { type: String, default: '' },
      ogType: { type: String, default: 'website' },
      twitterCard: { type: String, default: 'summary_large_image' },
      twitterTitle: { type: String, default: '' },
      twitterDescription: { type: String, default: '' },
      twitterImage: { type: String, default: '' },
      structuredDataType: {
        type: String,
        enum: ['WebPage', 'Article', 'TouristAttraction', 'FAQPage', 'Event'],
        default: 'WebPage'
      },
      structuredDataJson: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

export default mongoose.model('Page', pageSchema);
