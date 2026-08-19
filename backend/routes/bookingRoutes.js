import express from 'express';
import { 
  createBookingOrder, 
  verifyBookingPayment, 
  getMyBookings, 
  getBookingById, 
  getBoardingPassData,
  verifyBookingToken 
} from '../controllers/bookingController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Protected Booking & Payment Endpoints
router.post('/create-order', protect, createBookingOrder);
router.post('/verify-payment', protect, verifyBookingPayment);
router.get('/my-bookings', protect, getMyBookings);
router.get('/:bookingId', protect, getBookingById);
router.get('/:bookingId/boarding-pass', protect, getBoardingPassData);

// Public QR Code Verification Endpoint
router.get('/verify/:token', verifyBookingToken);

export default router;
