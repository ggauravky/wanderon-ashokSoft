import mongoose from 'mongoose';

const followUpSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    salesUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    salesUserName: {
      type: String,
      default: 'Sales Concierge'
    },
    title: {
      type: String,
      required: [true, 'Follow-up title/purpose is required'],
      trim: true
    },
    notes: {
      type: String,
      default: ''
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled follow-up date and time is required'],
      index: true
    },
    callWindow: {
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening', 'Anytime'],
      default: 'Anytime'
    },
    channel: {
      type: String,
      enum: ['call', 'whatsapp', 'email', 'meeting'],
      default: 'call'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'rescheduled', 'missed'],
      default: 'pending',
      index: true
    },
    outcomeNotes: {
      type: String,
      default: ''
    },
    completedAt: {
      type: Date
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rescheduledTo: {
      type: Date
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

followUpSchema.index({ salesUserId: 1, status: 1, scheduledAt: 1 });
followUpSchema.index({ createdBy: 1, createdAt: -1 });
followUpSchema.index({ completedBy: 1, completedAt: -1 });

export default mongoose.model('FollowUp', followUpSchema);
