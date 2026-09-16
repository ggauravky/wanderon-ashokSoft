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
      default: '',
      trim: true,
      index: true
    },
    region: {
      type: String,
      default: '',
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
      default: 0,
      min: 0,
      max: 5
    },
    reviews: {
      type: Number,
      default: 0
    },
    tags: {
      type: [String],
      default: []
    },
    category: {
      type: String,
      default: '',
      index: true
    },
    mood: {
      type: String,
      default: ''
    },
    difficulty: {
      type: String,
      default: ''
    },
    groupType: {
      type: String,
      default: ''
    },
    bestMonths: {
      type: [String],
      default: []
    },
    nextBatch: {
      type: String,
      default: ''
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
        capacity: { type: Number, default: 0 },
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
        },
        bookingAmount: { type: Number },
        totalAmount: { type: Number }
      }
    ],
    sharingPricing: {
      tripleSharing: { type: Number },
      doubleSharing: { type: Number },
      singleSharing: { type: Number }
    },
    pickupPoints: {
      type: [String],
      default: []
    },
    capacity: {
      type: Number,
      default: 0
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
      default: 'draft',
      index: true
    },
    isActive: {
      type: Boolean,
      default: false,
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
    },
    // Traceability to Custom Quotation Origin
    sourceQuotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      default: null,
      index: true
    },
    isCustom: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model('Trip', tripSchema);
