import express from 'express';
import { 
  getTripReviews, createReview 
} from '../controllers/reviewController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public Trip Reviews
router.get('/trip/:tripId', getTripReviews);

// Private Create Review
router.post('/', protect, createReview);

export default router;
