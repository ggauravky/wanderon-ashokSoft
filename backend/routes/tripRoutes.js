import express from 'express';
import { 
  getTrips, getAdminTrips, getTripByIdOrSlug, getAdminTripById, createTrip, 
  updateTrip, deleteTrip, seedTrips 
} from '../controllers/tripController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Admin reads are deliberately separate from the public catalog.
router.get('/admin/catalog', protect, adminOnly, getAdminTrips);
router.get('/admin/catalog/:id', protect, adminOnly, getAdminTripById);
router.post('/seed', protect, adminOnly, seedTrips);

// Public Trip Catalog Endpoints
router.get('/', getTrips);
router.get('/:idOrSlug', getTripByIdOrSlug);

// Admin Protected Trip Management Endpoints
router.post('/', protect, adminOnly, createTrip);
router.put('/:id', protect, adminOnly, updateTrip);
router.delete('/:id', protect, adminOnly, deleteTrip);

export default router;
