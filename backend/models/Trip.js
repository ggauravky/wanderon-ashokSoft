import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
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
      trim: true
    },
    location: {
      type: String,
      required: true
    },
    destination: {
      type: String,
      default: 'India'
    },
    duration: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    originalPrice: {
      type: Number
    },
    image: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      default: 4.8
    },
    reviews: {
      type: Number,
      default: 12
    },
    tags: {
      type: [String],
      default: ['Backpacking', 'Adventure']
    },
    nextBatch: {
      type: String,
      default: '15 Sep'
    },
    overview: {
      type: String,
      default: ''
    },
    itinerary: {
      type: Array,
      default: []
    },
    inclusions: {
      type: [String],
      default: []
    },
    exclusions: {
      type: [String],
      default: []
    },
    faqs: {
      type: Array,
      default: []
    },
    // Trip-Level SEO Configuration Schema
    seo: {
      seoTitle: {
        type: String,
        default: ''
      },
      metaDescription: {
        type: String,
        default: ''
      },
      canonicalUrl: {
        type: String,
        default: ''
      },
      indexingDirective: {
        type: String,
        enum: ['index, follow', 'noindex, nofollow'],
        default: 'index, follow'
      },
      ogTitle: {
        type: String,
        default: ''
      },
      ogDescription: {
        type: String,
        default: ''
      },
      ogImage: {
        type: String,
        default: ''
      },
      structuredSchemaType: {
        type: String,
        default: 'Product'
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model('Trip', tripSchema);
