import Coupon from '../models/Coupon.js';

export const normalizeCouponCode = (value) => String(value || '').trim().toUpperCase();

export const couponDisplayStatus = (coupon, now = new Date()) => {
  const legacyEnd = coupon?.expiryDate ? new Date(`${coupon.expiryDate}T23:59:59.999Z`) : null;
  const end = coupon?.endsAt ? new Date(coupon.endsAt) : legacyEnd;
  if (end && end < now) return 'expired';
  if (coupon?.status === 'revoked') return 'revoked';
  if (coupon?.isActive === false || coupon?.status === 'paused') return 'paused';
  return 'active';
};

export const validateCouponForAmount = async ({ code, amount }) => {
  const normalized = normalizeCouponCode(code);
  const subtotal = Number(amount);
  if (!normalized) return { valid: false, status: 400, message: 'Coupon code is required.' };
  if (!Number.isFinite(subtotal) || subtotal <= 0) return { valid: false, status: 400, message: 'A valid booking amount is required.' };

  const coupon = await Coupon.findOne({ code: normalized });
  if (!coupon) return { valid: false, status: 404, message: 'Coupon code was not found.' };

  const now = new Date();
  if (couponDisplayStatus(coupon, now) !== 'active') return { valid: false, status: 409, message: 'This coupon is inactive or expired.' };
  if (coupon.startsAt && coupon.startsAt > now) return { valid: false, status: 409, message: 'This coupon is not active yet.' };
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) return { valid: false, status: 409, message: 'This coupon has reached its usage limit.' };
  if (subtotal < Number(coupon.minimumAmount || 0)) return { valid: false, status: 409, message: `This coupon requires a minimum booking amount of ₹${Number(coupon.minimumAmount).toLocaleString('en-IN')}.` };
  let discountAmount = coupon.discountType === 'percentage'
    ? Math.round(subtotal * (Number(coupon.discountValue) / 100))
    : Number(coupon.discountValue);
  if (coupon.maximumDiscount != null) discountAmount = Math.min(discountAmount, Number(coupon.maximumDiscount));
  discountAmount = Math.max(0, Math.min(subtotal, discountAmount));

  return { valid: true, coupon, discountAmount, finalPayable: Math.max(0, subtotal - discountAmount) };
};
