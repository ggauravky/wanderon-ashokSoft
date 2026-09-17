import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please add an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 8
    },
    phone: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'super_admin', 'operations', 'sales', 'marketing', 'influencer'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    influencerStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    influencerApplication: {
      socialHandle: { type: String, default: '' },
      platform: { type: String, default: '' },
      followerCount: { type: String, default: '' },
      niche: { type: String, default: '' },
      sampleContent: { type: String, default: '' },
      applicationSubmitted: { type: Boolean, default: false },
      appliedAt: { type: Date },
      approvedAt: { type: Date },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectedAt: { type: Date },
      rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: { type: String, default: '', trim: true, maxlength: 1000 },
      reviewedAt: { type: Date },
      reviewedBy: { type: String, default: '' },
      reviewNotes: { type: String, default: '' }
    },
    accessAudit: {
      roleChangedAt: { type: Date },
      roleChangedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      statusChangedAt: { type: Date },
      statusChangedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    bookedTrips: {
      type: Array,
      default: []
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({ role: 1, isActive: 1, createdAt: -1 });
userSchema.index({ influencerStatus: 1, updatedAt: -1 });

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
