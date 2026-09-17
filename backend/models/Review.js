import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    tripId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: {
      type: String,
      required: true
    },
    userAvatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    title: {
      type: String,
      required: true
    },
    comment: {
      type: String,
      required: true
    },
    verifiedBooking: {
      type: Boolean,
      default: true
    },
    photos: {
      type: [String],
      default: []
    },
    likes: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model('Review', reviewSchema);
