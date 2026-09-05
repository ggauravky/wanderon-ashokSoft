import mongoose from 'mongoose';

const changeHistorySchema = new mongoose.Schema(
  {
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiedByName: { type: String, default: 'System' },
    previousValue: { type: Number },
    newValue: { type: Number },
    previousType: { type: String },
    newType: { type: String },
    changeReason: { type: String, default: '' },
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const pricingRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Pricing rule name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Unique rule code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      default: ''
    },
    ruleType: {
      type: String,
      enum: ['seasonal', 'fixed_departure', 'markup', 'discount', 'tax', 'component'],
      required: [true, 'Rule type is required'],
      index: true
    },
    destination: {
      type: String,
      default: 'All',
      trim: true
    },
    tripId: {
      type: String,
      default: 'All',
      trim: true
    },
    calculationType: {
      type: String,
      enum: ['percentage', 'flat'],
      default: 'percentage'
    },
    value: {
      type: Number,
      required: [true, 'Rule value is required']
    },
    minTravelers: {
      type: Number,
      default: 1
    },
    maxTravelers: {
      type: Number,
      default: 100
    },
    effectiveFrom: {
      type: Date,
      default: Date.now
    },
    effectiveUntil: {
      type: Date
    },
    seasonStartDate: {
      type: Date
    },
    seasonEndDate: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    changeHistory: {
      type: [changeHistorySchema],
      default: []
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

pricingRuleSchema.index({ ruleType: 1, isActive: 1 });

export default mongoose.model('PricingRule', pricingRuleSchema);
