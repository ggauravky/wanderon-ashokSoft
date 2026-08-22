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
  morning: { type: [activitySchema], default: [] },
  afternoon: { type: [activitySchema], default: [] },
  evening: { type: [activitySchema], default: [] },
  stay: { type: String, default: '' },
  dailyCost: { type: String, default: '' },
  tips: { type: [String], default: [] }
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
  matchedTrip: {
    id: { type: Number },
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
  }
}, {
  timestamps: true
});

// Indexes for fast lookup
itinerarySchema.index({ user: 1, createdAt: -1 });
itinerarySchema.index({ userEmail: 1 });

const Itinerary = mongoose.model('Itinerary', itinerarySchema);
export default Itinerary;
