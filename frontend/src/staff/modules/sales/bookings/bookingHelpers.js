export const BOOKING_STATUSES = Object.freeze(['DRAFT', 'PENDING_PAYMENT', 'PROVISIONALLY_CONFIRMED', 'CONFIRMED', 'CANCELLED', 'FAILED']);
export const PAYMENT_STATUSES = Object.freeze(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'FAILED', 'REFUNDED']);

export const getBookingRouteId = (booking) => booking?.bookingId || booking?._id || booking?.id;
export const getSourceQuotation = (booking) => booking?.sourceQuotationId || {};
export const getQuotationNumber = (booking) => getSourceQuotation(booking)?.quotationNumber || booking?.quotationSnapshot?.quotationNumber || '—';

export const formatBookingMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

export const formatBookingDate = (value, includeTime = false) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  });
};

export const getAmountRemaining = (booking) => {
  const explicit = Number(booking?.pricing?.amountOutstanding);
  if (Number.isFinite(explicit)) return Math.max(0, explicit);
  return Math.max(0, Number(booking?.pricing?.finalAmount || 0) - Number(booking?.pricing?.amountPaid || 0));
};
