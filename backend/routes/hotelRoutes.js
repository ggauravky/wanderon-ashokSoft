import express from 'express';
import { protect, requireRoles } from '../middlewares/authMiddleware.js';
import { createHotel, getHotel, listHotels, setHotelStatus, updateHotel } from '../controllers/hotelController.js';

const router = express.Router();
router.use(protect);
router.get('/', requireRoles('super_admin', 'admin', 'sales'), listHotels);
router.get('/:id', requireRoles('super_admin', 'admin', 'sales'), getHotel);
router.post('/', requireRoles('super_admin', 'admin'), createHotel);
router.patch('/:id', requireRoles('super_admin', 'admin'), updateHotel);
router.patch('/:id/status', requireRoles('super_admin', 'admin'), setHotelStatus);
export default router;
