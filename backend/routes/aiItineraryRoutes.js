import express from 'express';
import {
  generateItineraryController,
  saveItineraryController,
  getMyItinerariesController,
  deleteItineraryController,
  toggleShareItineraryController,
  getPublicSharedItineraryController
} from '../controllers/aiItineraryController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public Generation Endpoint
router.post('/generate', generateItineraryController);

// Authenticated Itinerary CRUD
router.post('/save', (req, res, next) => {
  // Allow session-based fallback or token authentication
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, saveItineraryController);

router.get('/my-itineraries', protect, getMyItinerariesController);
router.delete('/itinerary/:id', protect, deleteItineraryController);
router.post('/itinerary/:id/share', protect, toggleShareItineraryController);

// Public Shared Itinerary Endpoint
router.get('/shared/:shareToken', getPublicSharedItineraryController);

export default router;
