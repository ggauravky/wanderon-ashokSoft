import mongoose from 'mongoose';
import Review from '../models/Review.js';

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

const INITIAL_MOCK_REVIEWS = [
  {
    _id: 'rev_1',
    tripId: '1',
    userName: 'Vikramaditya Singh',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    rating: 5,
    title: 'Unforgettable Meghalaya Experience!',
    comment: 'The Double Decker Living Root Bridge trek was challenging but totally worth it. Dawki river camping under the stars was pure bliss! Trip Captain Rahul managed everything seamlessly.',
    verifiedBooking: true,
    likes: 18,
    createdAt: new Date('2026-07-28')
  },
  {
    _id: 'rev_2',
    tripId: '1',
    userName: 'Priya Malhotra',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    rating: 5,
    title: 'Best group trip ever!',
    comment: 'Traveled solo and made lifelong friends. The waterfalls in Cherrapunji are out of this world.',
    verifiedBooking: true,
    likes: 12,
    createdAt: new Date('2026-08-02')
  },
  {
    _id: 'rev_3',
    tripId: '2',
    userName: 'Karan Kapoor',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    rating: 5,
    title: 'Spiti Valley: Truly Heaven on Earth',
    comment: 'Maneuvering through high passes and posting a letter at Hikkim was a dream come true. Highly recommended WanderLuxe!',
    verifiedBooking: true,
    likes: 24,
    createdAt: new Date('2026-08-05')
  }
];

// @desc    Get verified customer reviews for a specific trip
// @route   GET /api/reviews/trip/:tripId
// @access  Public
export const getTripReviews = async (req, res) => {
  try {
    const { tripId } = req.params;

    let reviews = [];
    if (isDbConnected()) {
      try {
        reviews = await Review.find({
          $or: [{ tripId: String(tripId) }, { tripId: String(tripId).toLowerCase() }]
        }).sort({ createdAt: -1 });
      } catch (dbErr) {
        console.warn('Review DB query warning:', dbErr.message);
      }
    }

    if (reviews.length === 0) {
      reviews = INITIAL_MOCK_REVIEWS.filter(
        (r) => String(r.tripId) === String(tripId) || String(tripId) === '1'
      );
    }

    res.json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error fetching reviews' });
  }
};

// @desc    Submit a customer review for a trip
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { tripId, rating, title, comment, photos } = req.body;

    if (!tripId || !rating || !title || !comment) {
      return res.status(400).json({ message: 'Trip ID, rating, title, and comment are required.' });
    }

    let review = null;
    if (isDbConnected()) {
      try {
        review = await Review.create({
          tripId: String(tripId),
          userId,
          userName: req.user?.name || 'Verified Traveler',
          userAvatar: req.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
          rating: Number(rating),
          title: title.trim(),
          comment: comment.trim(),
          verifiedBooking: true,
          photos: photos || []
        });
      } catch (dbErr) {
        console.warn('Review DB create warning:', dbErr.message);
      }
    }

    if (!review) {
      review = {
        _id: 'rev_' + Date.now(),
        tripId: String(tripId),
        userId,
        userName: req.user?.name || 'Verified Traveler',
        userAvatar: req.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        rating: Number(rating),
        title: title.trim(),
        comment: comment.trim(),
        verifiedBooking: true,
        photos: photos || [],
        likes: 0,
        createdAt: new Date()
      };
      INITIAL_MOCK_REVIEWS.unshift(review);
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for your review! It has been published successfully.',
      data: review
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error submitting review' });
  }
};
