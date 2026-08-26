import express from 'express';
import { 
  createBookingOrder, 
  verifyBookingPayment, 
  payRemainingBalance,
  verifyRemainingBalance,
  getMyBookings, 
  getBookingById, 
  getBoardingPassData,
  getProvisionalLetterData,
  verifyBookingToken,
  calculatePricingEndpoint,
  resendWhatsAppTicket
} from '../controllers/bookingController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Pricing Calculation (Public)
router.post('/calculate-pricing', calculatePricingEndpoint);

// Protected Booking & Payment Endpoints
router.post('/create-order', protect, createBookingOrder);
router.post('/verify-payment', protect, verifyBookingPayment);
router.post('/:bookingId/pay-balance', protect, payRemainingBalance);
router.post('/:bookingId/verify-balance', protect, verifyRemainingBalance);
router.post('/:bookingId/send-whatsapp', protect, resendWhatsAppTicket);

router.get('/my-bookings', protect, getMyBookings);
router.get('/:bookingId', protect, getBookingById);
router.get('/:bookingId/boarding-pass', protect, getBoardingPassData);
router.get('/:bookingId/provisional-letter', protect, getProvisionalLetterData);

// Public QR Code Verification Endpoint
router.get('/verify/:token', verifyBookingToken);

export default router;
