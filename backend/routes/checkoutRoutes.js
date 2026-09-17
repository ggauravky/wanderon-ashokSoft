import express from 'express';
import { 
  validateCouponServerSide, applyCouponServerSide, createAttributedBooking, 
  paymentWebhook, payoutWebhook 
} from '../controllers/checkoutController.js';

const router = express.Router();

router.post('/coupon/validate', validateCouponServerSide);
router.post('/apply-coupon', applyCouponServerSide);
router.post('/bookings', createAttributedBooking);
router.post('/webhooks/payment', paymentWebhook);
router.post('/webhooks/payout', payoutWebhook);

export default router;
