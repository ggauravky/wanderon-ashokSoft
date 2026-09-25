import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  time: { type: String, default: '' },
  activity: { type: String, required: true },
  location: { type: String, default: '' },
  description: { type: String, default: '' },
  estimatedCost: { type: String, default: '' },
  travelTime: { type: String, default: '' }
}, { _id: false });

const daySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  locationName: { type: String, default: '' },
  morning: { type: [activitySchema], default: [] },
  afternoon: { type: [activitySchema], default: [] },
  evening: { type: [activitySchema], default: [] },
  stay: { type: String, default: '' },
  dailyCost: { type: String, default: '' },
  tips: { type: [String], default: [] },
  coverMedia: {
    id: { type: String, default: '' },
    url: { type: String, default: '' },
    altText: { type: String, default: '' },
    caption: { type: String, default: '' },
    width: { type: Number, default: 1600 },
    height: { type: Number, default: 900 }
  },
  coverMediaAssetId: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  galleryMedia: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  galleryMediaAssetIds: {
    type: [{ type: String }],
    default: []
  },
  gallery: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  mediaSelectionMode: {
    type: String,
    enum: ['AUTO', 'MANUAL', 'auto', 'manual'],
    default: 'AUTO'
  }
}, { _id: false });

const plannerContextSchema = new mongoose.Schema({
  origin: { type: String, default: '' },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  datesFlexible: { type: Boolean, default: true },
  flexibleMonth: { type: String, default: '' },
  travelersBreakdown: {
    adults: { type: Number, default: 0, min: 0 },
    children: { type: Number, default: 0, min: 0 },
    infants: { type: Number, default: 0, min: 0 },
    seniors: { type: Number, default: 0, min: 0 }
  },
  tripType: { type: String, default: '' },
  paceRhythm: { type: String, default: '' },
  acclimatization: { type: String, default: '' },
  interests: { type: [String], default: [] },
  stayPreference: { type: String, default: '' },
  roomStyle: { type: String, default: '' },
  dietaryPreference: { type: String, default: '' },
  hotelRating: { type: Number, default: null, min: 0, max: 5 },
  budgetTier: { type: String, default: '' },
  budgetAmount: { type: Number, default: null, min: 0 },
  transportPreference: { type: String, default: '' },
  mobilityConstraints: { type: [String], default: [] },
  mustInclude: { type: [String], default: [] },
  avoid: { type: [String], default: [] },
  customPreferences: { type: String, default: '' }
}, { _id: false });

const healthCheckSchema = new mongoose.Schema({
  id: { type: String, default: '' },
  code: { type: String, default: '' },
  name: { type: String, default: '' },
  status: { type: String, default: '' },
  severity: { type: String, default: '' },
  message: { type: String, default: '' }
}, { _id: false });

const itinerarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userEmail: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  tagline: {
    type: String,
    default: ''
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  destinationSlug: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 15
  },
  travelers: {
    type: Number,
    default: 2
  },
  travelStyle: {
    type: String,
    default: 'Adventure'
  },
  pace: {
    type: String,
    default: 'Balanced'
  },
  budgetLevel: {
    type: String,
    default: 'Moderate'
  },
  totalEstimatedCost: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  weather: {
    temp: { type: String, default: '' },
    condition: { type: String, default: '' },
    seasonTag: { type: String, default: '' }
  },
  seasonContext: {
    type: String,
    default: ''
  },
  bestTimeToVisit: {
    type: String,
    default: ''
  },
  days: {
    type: [daySchema],
    default: []
  },
  staySuggestions: {
    type: [String],
    default: []
  },
  foodSuggestions: {
    type: [String],
    default: []
  },
  packingList: {
    type: [String],
    default: []
  },
  localTips: {
    type: [String],
    default: []
  },
  budgetBreakdown: {
    stay: { type: String, default: '' },
    food: { type: String, default: '' },
    transport: { type: String, default: '' },
    activities: { type: String, default: '' },
    estimatedTotal: { type: String, default: '' }
  },
  plannerContext: {
    type: plannerContextSchema,
    default: () => ({})
  },
  healthReport: {
    isFeasible: { type: Boolean, default: true },
    feasibilityScore: { type: Number, default: null, min: 0, max: 100 },
    checks: { type: [healthCheckSchema], default: [] },
    modificationsApplied: { type: [String], default: [] }
  },
  media: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  matchedTrip: {
    id: { type: mongoose.Schema.Types.Mixed },
    title: { type: String },
    price: { type: Number },
    image: { type: String },
    duration: { type: String }
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  source: {
    type: String,
    enum: ['gemini-ai', 'template-engine', 'customized'],
    default: 'gemini-ai'
  },
  lifecycleStatus: {
    type: String,
    enum: ['GENERATED', 'LEAD_LINKED', 'QUOTATION_LINKED', 'BOOKED', 'ARCHIVED'],
    default: 'GENERATED',
    index: true
  },
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  lastEditedAt: {
    type: Date,
    default: null
  },
  leadLinkedAt: {
    type: Date,
    default: null
  },
  retentionExpiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for fast lookup
itinerarySchema.index({ user: 1, createdAt: -1 });
itinerarySchema.index({ userEmail: 1 });
itinerarySchema.index({ retentionExpiresAt: 1 }, { expireAfterSeconds: 0 });
itinerarySchema.index({ lifecycleStatus: 1, updatedAt: -1 });

const Itinerary = mongoose.model('Itinerary', itinerarySchema);
export default Itinerary;
