import { OperationsDomainError } from './operationsExecutionService.js';

export const normalizeFeedbackRating = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new OperationsDomainError(400, 'Feedback rating must be a whole number from 1 to 5, or blank.', 'INVALID_FEEDBACK_RATING');
  }
  return rating;
};

export const summarizeFeedback = (feedback = [], eligibleBookingCount = 0) => {
  const ratings = feedback.map((item) => item.rating).filter((rating) => Number.isFinite(rating));
  const distribution = Object.fromEntries([1, 2, 3, 4, 5].map((rating) => [rating, ratings.filter((value) => value === rating).length]));
  return {
    feedbackRecords: feedback.length,
    ratedFeedback: ratings.length,
    averageRating: ratings.length ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 100) / 100 : null,
    ratingDistribution: distribution,
    eligibleBookings: eligibleBookingCount,
    coveragePercent: eligibleBookingCount ? Math.round((feedback.length / eligibleBookingCount) * 10000) / 100 : 0
  };
};

export const feedbackPayload = (body = {}) => ({
  rating: normalizeFeedbackRating(body.rating),
  comments: String(body.comments || '').trim(),
  highlights: String(body.highlights || '').trim(),
  concerns: String(body.concerns || '').trim(),
  sourceChannel: String(body.sourceChannel || '').trim().toUpperCase(),
  receivedAt: body.receivedAt ? new Date(body.receivedAt) : new Date()
});
