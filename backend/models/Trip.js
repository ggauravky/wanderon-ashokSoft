import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Trip title is required'],
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Trip URL slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    destination: {
      type: String,
      default: 'India',
      trim: true,
      index: true
    },
    region: {
      type: String,
      default: 'North India',
      trim: true
    },
    duration: {
      type: String,
      required: [true, 'Duration is required']
    },
    days: {
      type: Number
    },
    nights: {
      type: Number
    },
    price: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price must be non-negative']
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price must be non-negative']
    },
    discount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    image: {
      type: String,
      required: [true, 'Main image URL is required']
    },
    heroImage: {
      type: String,
      default: ''
    },
    gallery: {
      type: [String],
      default: []
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5
    },
    reviews: {
      type: Number,
      default: 12
    },
    tags: {
      type: [String],
      default: ['Backpacking', 'Adventure']
    },
    category: {
      type: String,
      default: 'Backpacking',
      index: true
    },
    mood: {
      type: String,
      default: 'Adventure'
    },
    difficulty: {
      type: String,
      default: 'Moderate'
    },
    groupType: {
      type: String,
      default: 'Mixed Group'
    },
    bestMonths: {
      type: [String],
      default: []
    },
    nextBatch: {
      type: String,
      default: '15 Sep'
    },
    availableDates: {
      type: Array,
      default: []
    },
    batches: [
      {
        batchId: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        dates: { type: String, required: true },
        capacity: { type: Number, default: 20 },
        bookedSeats: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ['available', 'filling_fast', 'sold_out'],
          default: 'available'
        },
        pricing: {
          tripleSharing: { type: Number },
          doubleSharing: { type: Number },
          singleSharing: { type: Number }
        }
      }
    ],
    sharingPricing: {
      tripleSharing: { type: Number },
      doubleSharing: { type: Number },
      singleSharing: { type: Number }
    },
    pickupPoints: {
      type: [String],
      default: ['Airport Arrival Terminal (10:00 AM)', 'Central Railway Station (11:30 AM)']
    },
    capacity: {
      type: Number,
      default: 20
    },
    shortDescription: {
      type: String,
      default: ''
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
    status: {
      type: String,
      enum: ['published', 'draft', 'inactive'],
      default: 'published',
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
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
