import express from 'express';
import { 
  getTrips, getTripByIdOrSlug, createTrip, 
  updateTrip, deleteTrip, seedTrips 
} from '../controllers/tripController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public Trip Catalog Endpoints
router.get('/', getTrips);
router.get('/:idOrSlug', getTripByIdOrSlug);

// Admin Protected Trip Management Endpoints
router.post('/', protect, adminOnly, createTrip);
router.put('/:id', protect, adminOnly, updateTrip);
router.delete('/:id', protect, adminOnly, deleteTrip);
router.post('/seed', protect, adminOnly, seedTrips);

export default router;
