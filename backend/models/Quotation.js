import mongoose from 'mongoose';

const hotelOptionSchema = new mongoose.Schema(
  {
    optionId: { type: String, required: true },
    segmentId: { type: String, default: 'seg_default' },
    segmentName: { type: String, default: 'Primary Stay' },
    segmentOrder: { type: Number, default: 1 },
    tier: { 
      type: String, 
      enum: ['Standard', 'Deluxe', 'Super Deluxe', 'Luxury', 'Boutique', 'Option A', 'Option B', 'Option C', 'Custom'],
      default: 'Deluxe' 
    },
    label: { type: String, default: '' },
    hotelName: { type: String, required: [true, 'Hotel name is required'] },
    city: { type: String, default: '' },
    location: { type: String, default: '' },
    category: { type: String, default: 'Deluxe' },
    roomType: { type: String, default: 'Standard Deluxe' },
    rooms: { type: Number, default: 1, min: 1 },
    occupancy: { 
      type: String, 
      enum: ['Single', 'Double Sharing', 'Triple Sharing', 'Family Suite', 'Quad Sharing'],
      default: 'Double Sharing' 
    },
    mealPlan: { 
      type: String, 
      enum: ['EP (Room Only)', 'CP (Breakfast)', 'MAP (Breakfast + Dinner)', 'AP (All Meals)'], 
      default: 'MAP (Breakfast + Dinner)' 
    },
    checkIn: { type: Date },
    checkOut: { type: Date },
    nights: { type: Number, default: 1, min: 1 },
    costPerNight: { type: Number, default: 0, min: 0 }, // Internal Supplier Cost
    pricePerNight: { type: Number, default: 0, min: 0 }, // Customer-Facing Price
    taxRate: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String, default: '' },
    amenities: { type: [String], default: [] },
    notes: { type: String, default: '' },
    selected: { type: Boolean, default: false }
  },
  { _id: false }
);

const transportOptionSchema = new mongoose.Schema(
  {
    optionId: { type: String, required: true },
    type: { 
      type: String, 
      enum: [
        'Sedan (Dzire/Etios)', 
        'SUV (Innova/Crysta)', 
        'Tempo Traveller (12/17 Seater)', 
        'Luxury Coach / Bus', 
        'Private Cab', 
        'Flight', 
        'Train', 
        'Self Drive', 
        'None'
      ], 
      default: 'SUV (Innova/Crysta)' 
    },
    vehicle: { type: String, default: '' },
    provider: { type: String, default: '' }, // Internal supplier name
    pickup: { type: String, default: '' },
    drop: { type: String, default: '' },
    startDate: { type: Date },
    endDate: { type: Date },
    capacity: { type: Number, default: 6 },
    quantity: { type: Number, default: 1, min: 1 },
    unitCost: { type: Number, default: 0, min: 0 }, // Supplier Cost
    unitPrice: { type: Number, default: 0, min: 0 }, // Customer Price
    taxRate: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, default: 0, min: 0 },
    inclusions: { type: [String], default: ['Fuel', 'Tolls', 'Driver Allowance', 'State Permits'] },
    notes: { type: String, default: '' },
    selected: { type: Boolean, default: false }
  },
  { _id: false }
);

const activitySchema = new mongoose.Schema(
  {
    activityId: { type: String, required: true },
    dayNumber: { type: Number, default: 1 },
    date: { type: Date },
    name: { type: String, required: [true, 'Activity name is required'] },
    description: { type: String, default: '' },
    location: { type: String, default: '' },
    pricingType: { 
      type: String, 
      enum: ['PER_PERSON', 'PER_VEHICLE', 'FIXED'], 
      default: 'PER_PERSON' 
    },
    quantity: { type: Number, default: 1, min: 1 },
    unitCost: { type: Number, default: 0, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, default: 0, min: 0 },
    isIncluded: { type: Boolean, default: true },
    isOptional: { type: Boolean, default: false },
    selected: { type: Boolean, default: true }
  },
  { _id: false }
);

const addOnSchema = new mongoose.Schema(
  {
    addonId: { type: String, required: true },
    category: { 
      type: String, 
      enum: ['Room Upgrade', 'Special Meals', 'Private Transfer', 'Adventure Gear', 'Photography', 'Insurance', 'General', 'Custom'],
      default: 'General'
    },
    name: { type: String, required: [true, 'Add-on name is required'] },
    description: { type: String, default: '' },
    pricingType: { 
      type: String, 
      enum: ['PER_PERSON', 'PER_VEHICLE', 'FIXED', 'PER_NIGHT'], 
      default: 'FIXED' 
    },
    quantity: { type: Number, default: 1, min: 1 },
    unitCost: { type: Number, default: 0, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, default: 0, min: 0 },
    selected: { type: Boolean, default: false }
  },
  { _id: false }
);

const itineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    morning: { type: String, default: '' },
    afternoon: { type: String, default: '' },
    evening: { type: String, default: '' },
    stay: { type: String, default: '' },
    mealsIncluded: { type: [String], default: ['Breakfast'] },
    transferDetails: { type: String, default: '' },
    activityHighlights: { type: [String], default: [] }
  },
  { _id: false }
);

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    version: {
      type: Number,
      default: 1,
      min: 1
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      index: true,
      default: null
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null
    },
    assignedToSnapshot: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // Customer Snapshot
    customerSnapshot: {
      name: { type: String, required: [true, 'Customer name is required'], trim: true },
      email: { type: String, required: [true, 'Customer email is required'], lowercase: true, trim: true },
      phone: { type: String, required: [true, 'Customer phone is required'], trim: true },
      city: { type: String, default: '' },
      notes: { type: String, default: '' }
    },

    // Trip Requirements
    tripRequirements: {
      title: { type: String, required: [true, 'Trip title is required'], trim: true },
      destination: { type: String, required: [true, 'Destination is required'], trim: true },
      startDate: { type: Date },
      endDate: { type: Date },
      duration: { type: String, default: '5D/4N' },
      days: { type: Number, default: 5, min: 1 },
      nights: { type: Number, default: 4, min: 0 },
      adults: { type: Number, default: 2, min: 1 },
      children: { type: Number, default: 0, min: 0 },
      infants: { type: Number, default: 0, min: 0 },
      totalTravelers: { type: Number, default: 2, min: 1 },
      travelStyle: { 
        type: String, 
        enum: ['Adventure', 'Luxury', 'Budget', 'Backpacking', 'Family', 'Honeymoon', 'Custom'], 
        default: 'Adventure' 
      },
      budgetPerPerson: { type: Number, default: 0, min: 0 },
      specialRequests: { type: String, default: '' }
    },

    // Pricing Rules for Age Categories & Concessions
    pricingRules: {
      adultMultiplier: { type: Number, default: 1.0 },
      childMultiplier: { type: Number, default: 0.70 },
      infantMultiplier: { type: Number, default: 0.0 },
      maxSalesDiscount: { type: Number, default: 10 }, // 10% max for sales role
      maxSalesMarkup: { type: Number, default: 30 }    // 30% max for sales role
    },

    // Day-by-Day Itinerary
    itinerary: {
      type: [itineraryDaySchema],
      default: []
    },

    // Hotel Options (Multiple Alternatives, Groupable by Stay Segment)
    hotelOptions: {
      type: [hotelOptionSchema],
      default: []
    },

    // Transport Options (Multiple Alternatives)
    transportOptions: {
      type: [transportOptionSchema],
      default: []
    },

    // Activities & Add-ons
    activities: {
      type: [activitySchema],
      default: []
    },
    addOns: {
      type: [addOnSchema],
      default: []
    },

    inclusions: { 
      type: [String], 
      default: [
        'All stays as specified in the selected hotel option',
        'Daily breakfast & dinner (as per meal plan)',
        'Private airport/station pick and drop transfers',
        'Dedicated tour captain and local sightseeing guides',
        'Driver allowance, tolls, fuel, parking, and state permits'
      ] 
    },
    exclusions: { 
      type: [String], 
      default: [
        'Airfare / Train tickets to starting point',
        'Personal expenses, room service, laundry, telephone charges',
        'Optional adventure activities and entry tickets unless specified',
        'Any cost arising due to unforeseen road blocks or weather calamities',
        'Applicable 5% GST'
      ] 
    },
    termsAndConditions: { 
      type: [String], 
      default: [
        'Rates are valid for 7 days from the quotation date.',
        '10% advance deposit confirms provisional reservation.',
        'Remaining 90% balance is due 6 days prior to departure date.'
      ] 
    },
    cancellationPolicy: { 
      type: [String], 
      default: [
        '100% refund of deposit if cancelled 15+ days prior to departure.',
        '50% refund if cancelled between 7-14 days prior to departure.',
        'Non-refundable within 6 days of departure.'
      ] 
    },

    paymentTerms: {
      depositPercent: { type: Number, default: 10, min: 5, max: 100 },
      balanceDueDays: { type: Number, default: 6, min: 1, max: 30 },
      paymentMode: { type: String, enum: ['FULL', 'PARTIAL'], default: 'PARTIAL' },
      currency: { type: String, default: 'INR' }
    },

    // Comprehensive Authoritative Server Pricing Breakdown
    pricing: {
      internalBaseCost: { type: Number, default: 0, min: 0 },
      internalHotelCost: { type: Number, default: 0, min: 0 },
      internalTransportCost: { type: Number, default: 0, min: 0 },
      internalActivityCost: { type: Number, default: 0, min: 0 },
      internalAddOnCost: { type: Number, default: 0, min: 0 },
      totalInternalCost: { type: Number, default: 0, min: 0 },
      
      customerBasePrice: { type: Number, default: 0, min: 0 },
      customerHotelPrice: { type: Number, default: 0, min: 0 },
      customerTransportPrice: { type: Number, default: 0, min: 0 },
      customerActivityPrice: { type: Number, default: 0, min: 0 },
      customerAddOnPrice: { type: Number, default: 0, min: 0 },
      subtotal: { type: Number, default: 0, min: 0 },
      
      markupType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
      markupPercent: { type: Number, default: 0, min: 0 },
      markupAmount: { type: Number, default: 0, min: 0 },

      discountType: { type: String, enum: ['percentage', 'flat', 'none'], default: 'none' },
      discountValue: { type: Number, default: 0, min: 0 },
      discountAmount: { type: Number, default: 0, min: 0 },
      
      taxableAmount: { type: Number, default: 0, min: 0 },
      gstPercent: { type: Number, default: 5, min: 0 },
      gstAmount: { type: Number, default: 0, min: 0 },
      tcsPercent: { type: Number, default: 0, min: 0 },
      tcsAmount: { type: Number, default: 0, min: 0 },
      
      finalTotal: { type: Number, default: 0, min: 0 },
      perPersonPrice: { type: Number, default: 0, min: 0 },
      adultPrice: { type: Number, default: 0, min: 0 },
      childPrice: { type: Number, default: 0, min: 0 },
      infantPrice: { type: Number, default: 0, min: 0 },
      adultTotal: { type: Number, default: 0, min: 0 },
      childTotal: { type: Number, default: 0, min: 0 },
      infantTotal: { type: Number, default: 0, min: 0 },

      depositRequired: { type: Number, default: 0, min: 0 },
      balanceAmount: { type: Number, default: 0, min: 0 },
      
      projectedMargin: { type: Number, default: 0 },
      projectedMarginPercent: { type: Number, default: 0 }
    },

    // Immutable Snapshot of Frozen Proposal at Time of Sending
    priceSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    // Revision Audit History (Version increments on re-pricing sent quotes)
    revisions: [
      {
        version: { type: Number, required: true },
        revisedAt: { type: Date, default: Date.now },
        revisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        revisedByName: { type: String, default: '' },
        reason: { type: String, default: '' },
        priceSnapshot: { type: mongoose.Schema.Types.Mixed }
      }
    ],

    status: {
      type: String,
      enum: ['DRAFT', 'SENT', 'VIEWED', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED'],
      default: 'DRAFT',
      index: true
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedByName: { type: String, default: 'System' },
        changedAt: { type: Date, default: Date.now },
        reason: { type: String, default: '' }
      }
    ],

    validUntil: {
      type: Date,
      required: true
    },

    publicShare: {
      token: { type: String, unique: true, sparse: true, index: true },
      isPublic: { type: Boolean, default: true },
      viewCount: { type: Number, default: 0 },
      firstViewedAt: { type: Date },
      lastViewedAt: { type: Date },
      customerDecisionAt: { type: Date },
      customerNotes: { type: String, default: '' }
    },

    sourceTripId: { type: String, default: null },
    convertedTripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    bookingCode: { type: String, default: '' },

    auditTrail: [
      {
        action: { type: String, required: true },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        performedByName: { type: String, default: '' },
        details: { type: mongoose.Schema.Types.Mixed },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { 
    timestamps: true 
  }
);

// Compound index for pipeline querying
quotationSchema.index({ status: 1, createdAt: -1 });

const Quotation = mongoose.model('Quotation', quotationSchema);
export default Quotation;
