import mongoose from 'mongoose';
import Review from '../models/Review.js';
import { sendErrorResponse } from '../utils/httpResponse.js';

const isDbConnected = () => mongoose.connection?.readyState === 1;

const requireReviewDatabase = (res) => {
  if (isDbConnected()) return true;
  res.status(503).json({ success: false, message: 'Review service is temporarily unavailable.' });
  return false;
};

// @desc    Get verified customer reviews for a specific trip
// @route   GET /api/reviews/trip/:tripId
// @access  Public
export const getTripReviews = async (req, res) => {
  try {
    if (!requireReviewDatabase(res)) return;

    const tripId = String(req.params.tripId);
    const reviews = await Review.find({ tripId }).sort({ createdAt: -1 });

    return res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    return sendErrorResponse(res, error, 'Unable to fetch reviews.');
  }
};

// @desc    Submit a customer review for a trip
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res) => {
  try {
    if (!requireReviewDatabase(res)) return;

    const userId = req.user?._id;
    const { tripId, rating, title, comment, photos } = req.body;

    if (!tripId || !rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID, rating, title, and comment are required.'
      });
    }

    const review = await Review.create({
      tripId: String(tripId),
      userId,
      userName: req.user?.name || 'Verified Traveler',
      userAvatar: req.user?.avatar || '',
      rating: Number(rating),
      title: title.trim(),
      comment: comment.trim(),
      verifiedBooking: true,
      photos: photos || []
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for your review! It has been published successfully.',
      data: review
    });
  } catch (error) {
    return sendErrorResponse(res, error, 'Unable to submit the review.');
  }
};
