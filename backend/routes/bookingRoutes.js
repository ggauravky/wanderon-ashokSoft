import express from 'express';
import { 
  createBookingOrder, 
  verifyBookingPayment, 
  payRemainingBalance,
  verifyRemainingBalance,
  cancelBooking,
  getMyBookings, 
  getSalesBookings,
  getBookingById, 
  getBoardingPassData,
  getProvisionalLetterData,
  verifyBookingToken,
  calculatePricingEndpoint,
  resendWhatsAppTicket
} from '../controllers/bookingController.js';
import { protect, requireRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Pricing Calculation (Public)
router.post('/calculate-pricing', calculatePricingEndpoint);

// Protected Booking & Payment Endpoints
router.post('/create-order', protect, createBookingOrder);
router.post('/verify-payment', protect, verifyBookingPayment);
router.put('/:bookingId/cancel', protect, cancelBooking);
router.post('/:bookingId/pay-balance', protect, payRemainingBalance);
router.post('/:bookingId/verify-balance', protect, verifyRemainingBalance);
router.post('/:bookingId/send-whatsapp', protect, resendWhatsAppTicket);

router.get('/my-bookings', protect, getMyBookings);
router.get('/staff/sales', protect, requireRoles('super_admin', 'admin', 'sales'), getSalesBookings);
router.get('/:bookingId', protect, getBookingById);
router.get('/:bookingId/boarding-pass', protect, getBoardingPassData);
router.get('/:bookingId/provisional-letter', protect, getProvisionalLetterData);

// Public QR Code Verification Endpoint
router.get('/verify/:token', verifyBookingToken);

export default router;
