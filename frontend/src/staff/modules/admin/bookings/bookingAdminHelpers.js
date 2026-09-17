export { BOOKING_STATUSES, PAYMENT_STATUSES } from '../../sales/bookings/bookingHelpers.js';

export const getAdminBookingRouteId = (booking) => booking?.bookingId || booking?._id || booking?.id;
export const getBookingSource = (booking) => (booking?.isCustomQuotationBooking || booking?.sourceQuotationId ? 'quotation' : 'direct');
export const getBookingSourceLabel = (booking) => getBookingSource(booking) === 'quotation' ? 'Custom quotation' : 'Direct trip';
export const getSourceQuotation = (booking) => booking?.sourceQuotationId || {};
export const getQuotationNumber = (booking) => getSourceQuotation(booking)?.quotationNumber || booking?.quotationSnapshot?.quotationNumber || '—';

export const formatBookingMoney = (value, currency = 'INR') => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(amount);
};

export const formatBookingDate = (value, includeTime = false) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}) });
};

export const getAmountRemaining = (booking) => {
  const explicitValue = booking?.pricing?.amountOutstanding;
  const explicit = explicitValue === undefined || explicitValue === null || explicitValue === '' ? NaN : Number(explicitValue);
  if (Number.isFinite(explicit)) return Math.max(0, explicit);
  const total = Number(booking?.pricing?.finalAmount);
  const paid = Number(booking?.pricing?.amountPaid);
  return Number.isFinite(total) && Number.isFinite(paid) ? Math.max(0, total - paid) : null;
};

export const getLead = (booking) => booking?.leadId || getSourceQuotation(booking)?.leadId || null;
