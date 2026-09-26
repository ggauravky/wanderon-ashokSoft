import mongoose from 'mongoose';
import {
  QUOTATION_ATTACHMENT_CATEGORIES,
  QUOTATION_ATTACHMENT_VISIBILITIES,
  TRANSPORT_DOCUMENT_TYPES,
  normalizeAttachmentVisibility,
  normalizeQuotationAttachment,
  normalizeTransportDocumentType
} from '../constants/quotationAttachments.js';

const candidateReviewFields = {
  sourceKind: { type: String, enum: ['MANUAL', 'AI_PLANNER'], default: 'MANUAL' },
  reviewStatus: { type: String, enum: ['SUGGESTED', 'REVIEWED', 'DISMISSED'], default: 'REVIEWED' },
  sourceLabel: { type: String, default: '' },
  sourceDayNumbers: { type: [Number], default: [] },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null }
};

const quotationAttachmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    category: {
      type: String,
      enum: QUOTATION_ATTACHMENT_CATEGORIES,
      default: 'GENERAL'
    },
    sectionType: { type: String, enum: ['GENERAL', 'HOTEL', 'TRANSPORT', 'ACTIVITY', 'ADD_ON'], default: 'GENERAL' },
    sectionId: { type: String, default: '' },
    title: { type: String, required: true, trim: true },
    fileName: { type: String, default: '' },
    mimeType: { type: String, required: true },
    size: { type: Number, default: 0, min: 0 },
    storageProvider: { type: String, default: 'cloudinary' },
    publicId: { type: String, default: '' },
    secureUrl: { type: String, required: true },
    visibility: {
      type: String,
      enum: QUOTATION_ATTACHMENT_VISIBILITIES,
      default: 'INTERNAL_ONLY'
    },
    bookingReference: { type: String, default: '' },
    passengerName: { type: String, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    uploadedByName: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const hotelOptionSchema = new mongoose.Schema(
  {
    ...candidateReviewFields,
    optionId: { type: String, required: true },
    segmentId: { type: String, default: 'seg_default' },
    segmentName: { type: String, default: 'Primary Stay' },
    segmentOrder: { type: Number, default: 1 },
    tier: { 
      type: String, 
      enum: ['Standard', 'Deluxe', 'Super Deluxe', 'Luxury', 'Boutique', 'Option A', 'Option B', 'Option C', 'Custom'],
      default: 'Custom'
    },
    label: { type: String, default: '' },
    hotelName: { type: String, required: [true, 'Hotel name is required'] },
    city: { type: String, default: '' },
    location: { type: String, default: '' },
    category: { type: String, default: '' },
    roomType: { type: String, default: '' },
    rooms: { type: Number, default: 1, min: 1 },
    occupancy: { 
      type: String, 
      enum: ['', 'Single', 'Double Sharing', 'Triple Sharing', 'Family Suite', 'Quad Sharing'],
      default: ''
    },
    mealPlan: { 
      type: String, 
      enum: ['', 'EP (Room Only)', 'CP (Breakfast)', 'MAP (Breakfast + Dinner)', 'AP (All Meals)'],
      default: ''
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
    gallery: { type: [mongoose.Schema.Types.Mixed], default: [] },
    documents: { type: [quotationAttachmentSchema], default: [] },
    recommendationType: { type: String, enum: ['RECOMMENDED', 'ALTERNATIVE', 'CUSTOM'], default: 'CUSTOM' },
    selected: { type: Boolean, default: false }
  },
  { _id: false }
);

const vehicleMediaSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => `vm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` },
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    caption: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const transportDocumentSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => `tdoc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` },
    type: {
      type: String,
      enum: TRANSPORT_DOCUMENT_TYPES,
      default: 'TRANSPORT_VOUCHER'
    },
    title: { type: String, default: '' },
    fileName: { type: String, default: '' },
    mimeType: { type: String, default: 'application/pdf' },
    size: { type: Number, default: 0 },
    storageProvider: { type: String, default: 'cloudinary' },
    publicId: { type: String, default: '' },
    secureUrl: { type: String, required: true },
    visibility: {
      type: String,
      enum: QUOTATION_ATTACHMENT_VISIBILITIES,
      default: 'CUSTOMER_VISIBLE'
    },
    passengerName: { type: String, default: '' },
    bookingReference: { type: String, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedByName: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const transportOptionSchema = new mongoose.Schema(
  {
    ...candidateReviewFields,
    optionId: { type: String, required: true },
    mode: {
      type: String,
      enum: [
        'FLIGHT',
        'TRAIN',
        'BUS',
        'CAB',
        'PRIVATE_CAR',
        'SUV',
        'TEMPO_TRAVELLER',
        'COACH',
        'BIKE',
        'FERRY',
        'TRANSFER',
        'OTHER'
      ],
      default: 'SUV'
    },
    type: { 
      type: String, 
      default: ''
    },
    title: { type: String, default: '' },
    vehicle: { type: String, default: '' },
    provider: { type: String, default: '' }, // Internal supplier name
    pickup: { type: String, default: '' },
    drop: { type: String, default: '' },
    route: {
      from: { type: String, default: '' },
      to: { type: String, default: '' },
      pickupPoint: { type: String, default: '' },
      dropPoint: { type: String, default: '' }
    },
    schedule: {
      departureDate: { type: String, default: '' },
      departureTime: { type: String, default: '' },
      arrivalDate: { type: String, default: '' },
      arrivalTime: { type: String, default: '' }
    },
    reference: {
      flightNumber: { type: String, default: '' },
      trainNumber: { type: String, default: '' },
      busNumber: { type: String, default: '' },
      vehicleNumber: { type: String, default: '' },
      pnr: { type: String, default: '' },
      bookingReference: { type: String, default: '' }
    },
    cabinClass: { type: String, default: '' },
    seatDetails: { type: String, default: '' },
    baggage: {
      cabin: { type: String, default: '' },
      checkIn: { type: String, default: '' }
    },
    driverDetails: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      licenseNumber: { type: String, default: '' }
    },
    startDate: { type: Date },
    endDate: { type: Date },
    capacity: { type: Number, default: 6 },
    quantity: { type: Number, default: 1, min: 1 },
    pricingType: {
      type: String,
      enum: ['PER_VEHICLE', 'PER_PERSON', 'PER_SEGMENT', 'FIXED'],
      default: 'PER_VEHICLE'
    },
    unitCost: { type: Number, default: 0, min: 0 }, // Supplier Cost
    unitPrice: { type: Number, default: 0, min: 0 }, // Customer Price
    taxRate: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, default: 0, min: 0 },
    inclusions: { type: [String], default: [] },
    notes: { type: String, default: '' },
    selected: { type: Boolean, default: false },

    vehicleMedia: { type: [vehicleMediaSchema], default: [] },
    documents: { type: [transportDocumentSchema], default: [] }
  },
  { _id: false }
);

const activitySchema = new mongoose.Schema(
  {
    ...candidateReviewFields,
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
    isIncluded: { type: Boolean, default: false },
    isOptional: { type: Boolean, default: true },
    attachments: { type: [quotationAttachmentSchema], default: [] },
    selected: { type: Boolean, default: false }
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
    attachments: { type: [quotationAttachmentSchema], default: [] },
    selected: { type: Boolean, default: false }
  },
  { _id: false }
);

const itineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    locationName: { type: String, default: '' },
    locationId: { type: String, default: '' },
    destination: { type: String, default: '' },
    description: { type: String, default: '' },
    morning: { type: String, default: '' },
    afternoon: { type: String, default: '' },
    evening: { type: String, default: '' },
    stay: { type: String, default: '' },
    mealsIncluded: { type: [String], default: [] },
    transferDetails: { type: String, default: '' },
    activityHighlights: { type: [String], default: [] },
    coverMedia: {
      id: { type: String, default: '' },
      url: { type: String, default: '' },
      altText: { type: String, default: '' },
      caption: { type: String, default: '' },
      width: { type: Number, default: 1600 },
      height: { type: Number, default: 900 }
    },
    coverMediaAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MediaAsset',
      default: null
    },
    galleryMedia: {
      type: [
        {
          id: { type: String, default: '' },
          url: { type: String, default: '' },
          altText: { type: String, default: '' },
          caption: { type: String, default: '' }
        }
      ],
      default: []
    },
    mediaSelectionMode: {
      type: String,
      enum: ['AUTO', 'MANUAL'],
      default: 'AUTO'
    }
  },
  { _id: false }
);

const quotationSchema = new mongoose.Schema(
  {
    schemaVersion: { type: Number, default: 1, index: true },
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
      origin: { type: String, default: '', trim: true },
      startDate: { type: Date },
      endDate: { type: Date },
      datesFlexible: { type: Boolean, default: false },
      flexibleMonth: { type: String, default: '', trim: true },
      duration: { type: String, default: '5D/4N' },
      days: { type: Number, default: 5, min: 1 },
      nights: { type: Number, default: 4, min: 0 },
      adults: { type: Number, default: 2, min: 0 },
      children: { type: Number, default: 0, min: 0 },
      infants: { type: Number, default: 0, min: 0 },
      seniors: { type: Number, default: 0, min: 0 },
      totalTravelers: { type: Number, default: 2, min: 1 },
      travelStyle: { 
        type: String, 
        enum: ['Adventure', 'Luxury', 'Budget', 'Backpacking', 'Family', 'Honeymoon', 'Custom'], 
        default: 'Adventure' 
      },
      budgetPerPerson: { type: Number, default: 0, min: 0 },
      specialRequests: { type: String, default: '' }
    },

    tripPreferences: {
      tripType: { type: String, default: '' },
      pace: { type: String, default: '' },
      paceRhythm: { type: String, default: '' },
      acclimatization: { type: String, default: '' },
      interests: { type: [String], default: [] },
      stayPreference: { type: String, default: '' },
      roomStyle: { type: String, default: '' },
      hotelRating: { type: Number, default: null, min: 0, max: 5 },
      dietaryPreference: { type: String, default: '' },
      transportPreference: { type: String, default: '' },
      mobilityConstraints: { type: [String], default: [] },
      mustInclude: { type: [String], default: [] },
      avoid: { type: [String], default: [] },
      customPreferences: { type: String, default: '' }
    },

    planningReference: {
      sourceItineraryVersion: { type: Number, default: null },
      sourceGeneratedAt: { type: Date, default: null },
      sourceUpdatedAt: { type: Date, default: null },
      plannerBudgetAmount: { type: Number, default: null, min: 0 },
      plannerBudgetScope: { type: String, enum: ['', 'UNSPECIFIED', 'TOTAL', 'PER_PERSON'], default: '' },
      aiEstimatedTotal: { type: Number, default: null, min: 0 },
      currency: { type: String, default: 'INR' },
      budgetBreakdown: { type: mongoose.Schema.Types.Mixed, default: null },
      bestTimeToVisit: { type: String, default: '' },
      seasonContext: { type: String, default: '' }
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

    inclusions: { type: [String], default: [] },
    exclusions: { type: [String], default: [] },
    termsAndConditions: { type: [String], default: [] },
    cancellationPolicy: { type: [String], default: [] },

    policies: {
      paymentTerms: { type: String, default: '' },
      cancellationPolicy: { type: String, default: '' },
      refundNotes: { type: String, default: '' },
      importantInformation: { type: String, default: '' },
      travelRequirements: { type: String, default: '' },
      termsAndConditions: { type: String, default: '' }
    },

    personalNote: { type: String, default: '' },
    attachments: { type: [quotationAttachmentSchema], default: [] },

    presentationSettings: {
      template: { type: String, enum: ['minimal', 'journey', 'signature_luxe'], default: 'journey' },
      showComponentPrices: { type: Boolean, default: false },
      showPaymentSchedule: { type: Boolean, default: true },
      showAttachments: { type: Boolean, default: true },
      showAdvisor: { type: Boolean, default: true },
      showTerms: { type: Boolean, default: true },
      showItineraryGallery: { type: Boolean, default: true },
      showTripPreferences: { type: Boolean, default: false }
    },

    commercialState: {
      type: String,
      enum: ['DRAFT', 'CONTENT_READY', 'AWAITING_PRICING', 'READY_TO_SHARE', 'SHARED', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED', 'EXPIRED'],
      default: 'DRAFT',
      index: true
    },

    manualPricing: {
      currency: { type: String, default: 'INR' },
      componentReference: { type: Number, default: 0, min: 0 },
      finalCustomerPrice: { type: Number, default: 0, min: 0 },
      depositAmount: { type: Number, default: 0, min: 0 },
      balanceAmount: { type: Number, default: 0, min: 0 },
      adjustments: {
        type: [{ label: { type: String, default: '' }, amount: { type: Number, default: 0, min: 0 }, type: { type: String, enum: ['ADD', 'REDUCE'], default: 'ADD' } }],
        default: []
      },
      paymentSchedule: {
        type: [{ label: { type: String, default: '' }, amount: { type: Number, default: 0, min: 0 }, dueDate: { type: Date, default: null }, notes: { type: String, default: '' } }],
        default: []
      },
      priceNotes: { type: String, default: '' },
      finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      finalizedByName: { type: String, default: '' },
      finalizedAt: { type: Date, default: null }
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

    // Immutable Snapshot of Agreed Proposal at Time of Customer Approval
    approvedSnapshot: {
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
      enum: ['DRAFT', 'CONTENT_READY', 'AWAITING_PRICING', 'READY_TO_SHARE', 'SENT', 'SHARED', 'VIEWED', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED', 'ARCHIVED'],
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

    currentRevisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuotationRevision', default: null, index: true },
    latestSharedRevisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuotationRevision', default: null },
    approvedRevisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuotationRevision', default: null },
    shareSummary: {
      shareCount: { type: Number, default: 0, min: 0 },
      activeShareCount: { type: Number, default: 0, min: 0 },
      viewCount: { type: Number, default: 0, min: 0 },
      pdfDownloads: { type: Number, default: 0, min: 0 },
      attachmentDownloads: { type: Number, default: 0, min: 0 },
      lastViewedAt: { type: Date, default: null }
    },

    sourceTripId: { type: String, default: null },
    sourceItineraryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary', default: null, index: true },
    aiImportProvenance: {
      sourceType: { type: String, default: '' },
      sourceTitle: { type: String, default: '' },
      sourceDestination: { type: String, default: '' },
      sourceUpdatedAt: { type: Date, default: null },
      sourceVersion: { type: Number, default: null },
      sourceGeneratedAt: { type: Date, default: null },
      buildMode: { type: String, enum: ['', 'PREVIEW', 'SMART_BUILD', 'REIMPORT', 'AI_LEAD_SMART_BUILD'], default: '' },
      importedAt: { type: Date, default: null },
      importedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
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

const plain = (value) => value?.toObject ? value.toObject() : value;

// Normalize recognized legacy display labels on every document-save path. This
// keeps old drafts editable while the whitelist still rejects unknown values.
quotationSchema.pre('validate', function normalizeLegacyAttachmentEnums() {
  this.attachments = (this.attachments || []).map((item) => normalizeQuotationAttachment(plain(item)));
  this.hotelOptions = (this.hotelOptions || []).map((item) => ({
    ...plain(item),
    documents: (item.documents || []).map((document) => normalizeQuotationAttachment(plain(document)))
  }));
  this.transportOptions = (this.transportOptions || []).map((item) => ({
    ...plain(item),
    documents: (item.documents || []).map((document) => ({
      ...plain(document),
      type: normalizeTransportDocumentType(document.type),
      visibility: normalizeAttachmentVisibility(document.visibility, 'CUSTOMER_VISIBLE')
    }))
  }));
  this.activities = (this.activities || []).map((item) => ({
    ...plain(item),
    attachments: (item.attachments || []).map((attachment) => normalizeQuotationAttachment(plain(attachment)))
  }));
  this.addOns = (this.addOns || []).map((item) => ({
    ...plain(item),
    attachments: (item.attachments || []).map((attachment) => normalizeQuotationAttachment(plain(attachment)))
  }));
});

// Compound and fast-lookup indexes for pipeline querying
quotationSchema.index({ status: 1, createdAt: -1 });
quotationSchema.index({ schemaVersion: 1, commercialState: 1, updatedAt: -1 });
quotationSchema.index({ assignedTo: 1, schemaVersion: 1, updatedAt: -1 });
quotationSchema.index({ bookingCode: 1 });
quotationSchema.index({ updatedAt: -1 });
quotationSchema.index({ createdBy: 1, createdAt: -1 });

const Quotation = mongoose.model('Quotation', quotationSchema);
export default Quotation;
