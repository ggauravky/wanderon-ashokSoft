import mongoose from 'mongoose';
import crypto from 'crypto';

const leadSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please provide lead name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide lead email address'],
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Please provide phone number'],
      trim: true
    },
    leadType: {
      type: String,
      enum: ['general', 'trip_enquiry', 'callback_request'],
      default: 'trip_enquiry',
      index: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true
    },
    tripId: {
      type: String,
      default: '',
      index: true
    },
    tripRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      default: null,
      index: true
    },
    tripSlug: {
      type: String,
      default: ''
    },
    tripTitle: {
      type: String,
      default: ''
    },
    tripTitleSnapshot: {
      type: String,
      default: ''
    },
    tripPriceSnapshot: {
      type: Number,
      default: 0
    },
    selectedBatch: {
      type: String,
      default: ''
    },
    destination: {
      type: String,
      default: 'Meghalaya'
    },
    travelersCount: {
      type: Number,
      default: 1
    },
    travelMonth: {
      type: String,
      default: ''
    },
    travelDate: {
      type: String,
      default: ''
    },
    budgetPerPerson: {
      type: String,
      default: ''
    },
    preferredCallDate: {
      type: String,
      default: ''
    },
    preferredCallWindow: {
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening', 'Anytime', ''],
      default: 'Anytime'
    },
    topics: [
      {
        type: String,
        trim: true
      }
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    message: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'IN_PROGRESS', 'QUALIFIED', 'CONVERTED', 'LOST'],
      default: 'NEW',
      index: true
    },
    // Assignment fields
    assignedTo: {
      type: String,
      default: 'Sales Concierge Team'
    },
    assignedToUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    assignedToUserName: {
      type: String,
      default: ''
    },
    assignedAt: {
      type: Date,
      default: null
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    assignedByName: {
      type: String,
      default: ''
    },
    // Contact & Activity Tracking
    firstContactAt: {
      type: Date,
      default: null
    },
    lastContactAt: {
      type: Date,
      default: null
    },
    nextFollowUpAt: {
      type: Date,
      default: null
    },
    contactCount: {
      type: Number,
      default: 0
    },
    callOutcomes: [
      {
        outcome: {
          type: String,
          enum: ['CONNECTED', 'BUSY', 'CALL_LATER', 'WRONG_NUMBER', 'WHATSAPP_SENT', 'EMAIL_SENT', 'NO_ANSWER'],
          required: true
        },
        channel: {
          type: String,
          enum: ['call', 'whatsapp', 'email', 'other'],
          default: 'call'
        },
        notes: {
          type: String,
          default: ''
        },
        loggedAt: {
          type: Date,
          default: Date.now
        },
        loggedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        loggedByName: {
          type: String,
          default: ''
        }
      }
    ],
    lostReason: {
      type: String,
      default: ''
    },
    lostReasonDetail: {
      type: String,
      default: ''
    },
    convertedBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    },
    convertedBookingCode: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    },
    source: {
      type: String,
      enum: ['trip_page', 'contact_page', 'booking_page', 'custom_inquiry', 'Website Lead Form', 'website_lead_form', 'expert_inquiry', 'callback_request', 'expert_callback_modal'],
      default: 'trip_page'
    },
    marketingAttribution: {
      schemaVersion: { type: Number, default: 1 },
      model: { type: String, enum: ['FIRST_TOUCH'], default: 'FIRST_TOUCH' },
      campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
      campaignCodeSnapshot: { type: String, default: '' },
      campaignNameSnapshot: { type: String, default: '' },
      matchedBy: { type: String, enum: ['', 'UTM_ID', 'UTM_TUPLE'], default: '' },
      firstTouch: {
        utmId: { type: String, default: '' }, source: { type: String, default: '' }, medium: { type: String, default: '' },
        campaign: { type: String, default: '' }, content: { type: String, default: '' }, term: { type: String, default: '' },
        landingPath: { type: String, default: '' }, referrerHost: { type: String, default: '' }, capturedAt: { type: Date, default: null }
      },
      lastTouch: {
        utmId: { type: String, default: '' }, source: { type: String, default: '' }, medium: { type: String, default: '' },
        campaign: { type: String, default: '' }, content: { type: String, default: '' }, term: { type: String, default: '' },
        landingPath: { type: String, default: '' }, referrerHost: { type: String, default: '' }, capturedAt: { type: Date, default: null }
      },
      leadCapture: {
        source: { type: String, default: '' }, medium: { type: String, default: '' }, campaign: { type: String, default: '' },
        landingPath: { type: String, default: '' }, capturedAt: { type: Date, default: null }
      }
    },
    whatsappNotification: {
      sent: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ['NOT_CONFIGURED', 'PENDING', 'SENT', 'FAILED'],
        default: 'NOT_CONFIGURED'
      },
      sentAt: { type: Date }
    },
    quotations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quotation'
      }
    ]
  },
  { timestamps: true }
);

// Helper function to generate canonical reference ID (collision-resistant)
export function generateLeadReferenceId() {
  const year = new Date().getFullYear();
  let rand;
  try {
    rand = crypto.randomInt(100000, 999999);
  } catch (e) {
    rand = Math.floor(100000 + Math.random() * 900000);
  }
  return `WLX-EXP-${year}-${rand}`;
}

// Pre-save hook: assign referenceId if not set
leadSchema.pre('save', function (next) {
  if (!this.referenceId) {
    this.referenceId = generateLeadReferenceId();
  }
  next();
});

leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ assignedToUser: 1, status: 1 });
leadSchema.index({ leadType: 1, createdAt: -1 });
leadSchema.index({ destination: 1, status: 1 });
leadSchema.index({ priority: 1, createdAt: -1 });
leadSchema.index({ preferredCallDate: 1 });
// Supports selected-member contact attribution without introducing lead ownership.
leadSchema.index({ 'callOutcomes.loggedBy': 1, 'callOutcomes.loggedAt': -1 });
leadSchema.index({ 'marketingAttribution.campaignId': 1, createdAt: -1 });
leadSchema.index({ 'marketingAttribution.firstTouch.source': 1, createdAt: -1 });

export default mongoose.model('Lead', leadSchema);
