import express from 'express';
import {
  generateItineraryController,
  saveItineraryController,
  updateItineraryController,
  getItineraryByIdController,
  getMyItinerariesController,
  deleteItineraryController,
  toggleShareItineraryController,
  getPublicSharedItineraryController,
  regenerateDayController
} from '../controllers/aiItineraryController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public Generation & Day Adjustment Endpoints
router.post('/generate', generateItineraryController);
router.post('/regenerate-day', regenerateDayController);

// Authenticated Itinerary CRUD
router.post('/save', (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, saveItineraryController);

router.get('/my-itineraries', (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, getMyItinerariesController);

router.get('/itinerary/:id', (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, getItineraryByIdController);

router.put('/itinerary/:id', (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, updateItineraryController);

router.delete('/itinerary/:id', (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, deleteItineraryController);

router.post('/itinerary/:id/share', (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, toggleShareItineraryController);

// Public Shared Itinerary Endpoint
router.get('/shared/:shareToken', getPublicSharedItineraryController);

export default router;
