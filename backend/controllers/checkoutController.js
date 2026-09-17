import mongoose from 'mongoose';
import { validateCouponForAmount } from '../services/couponService.js';

export const validateCouponServerSide = async (req, res) => {
  try {
    if (mongoose.connection?.readyState !== 1) return res.status(503).json({ valid: false, message: 'Coupon validation is temporarily unavailable.' });
    const result = await validateCouponForAmount({ code: req.body.code, amount: req.body.bookingAmount, planId: req.body.planId });
    if (!result.valid) return res.status(result.status).json({ valid: false, message: result.message });
    const { coupon, discountAmount, finalPayable } = result;
    res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalPayable,
      minimumAmount: coupon.minimumAmount || 0,
      maximumDiscount: coupon.maximumDiscount ?? null
    });
  } catch (error) { res.status(500).json({ valid: false, message: error.message || 'Unable to validate coupon.' }); }
};

export const applyCouponServerSide = validateCouponServerSide;

export const createAttributedBooking = async (req, res) => {
  res.status(410).json({ message: 'This legacy checkout endpoint has been retired. Use the server-authoritative booking order workflow.' });
};

export const paymentWebhook = async (req, res) => {
  res.json({ received: true, status: 'ACCEPTED' });
};

export const payoutWebhook = async (req, res) => {
  res.status(501).json({ received: false, message: 'Automated payout processing is not configured. Payout status is managed manually by authorized staff.' });
};
