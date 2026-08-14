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
      minlength: 6
    },
    phone: {
      type: String,
      default: '+91 8542036499'
    },
    address: {
      type: String,
      default: 'Lucknow, UP, India'
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'influencer'],
      default: 'user'
    },
    influencerStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    influencerApplication: {
      socialHandle: { type: String, default: '' },
      platform: { type: String, default: 'Instagram' },
      followerCount: { type: String, default: '10K+' },
      niche: { type: String, default: 'Travel & Lifestyle' },
      sampleContent: { type: String, default: '' },
      applicationSubmitted: { type: Boolean, default: false },
      appliedAt: { type: Date },
      approvedAt: { type: Date },
      rejectedAt: { type: Date },
      reviewedAt: { type: Date },
      reviewedBy: { type: String, default: '' },
      reviewNotes: { type: String, default: '' }
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
