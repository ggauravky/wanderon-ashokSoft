export const discountValue = (coupon) => coupon.discountType === 'percentage' ? `${Number(coupon.discountValue || 0)}%` : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(coupon.discountValue || 0));
export const discountDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Open';
export const discountValidity = (coupon) => `${discountDate(coupon.startsAt)} – ${discountDate(coupon.endsAt || coupon.expiryDate)}`;

