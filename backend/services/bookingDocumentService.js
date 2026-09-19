const DEFAULT_FRONTEND_ORIGIN = 'https://wanderon-ashok-soft.vercel.app';

export const bookingVerificationUrl = (booking) => {
  const token = booking?.qrCode?.verificationToken || booking?.verificationToken || booking?.bookingId;
  if (!token) return '';
  const configured = String(process.env.FRONTEND_URL || DEFAULT_FRONTEND_ORIGIN).trim().replace(/\/+$/, '');
  return `${configured}/booking/verify/${encodeURIComponent(token)}`;
};

export const safePaymentEvent = (payment) => ({
  provider: payment?.provider || 'razorpay',
  orderId: payment?.orderId || '',
  paymentId: payment?.paymentId || '',
  amount: payment?.amount ?? null,
  type: payment?.type || '',
  verifiedAt: payment?.verifiedAt || null
});

export const safeBooking = (booking) => {
  const result = booking?.toObject ? booking.toObject() : { ...booking };
  if (result.payment) {
    result.payment = { ...result.payment };
    delete result.payment.razorpaySignature;
  }
  result.payments = (result.payments || []).map(safePaymentEvent);
  if (result.qrCode) {
    result.qrCode = { ...result.qrCode, verificationUrl: bookingVerificationUrl(result) };
    delete result.qrCode.verificationToken;
  }
  return result;
};

export const receiptSummary = (booking, payment, index) => ({
  receiptNumber: `WLX-RCPT-${String(booking.bookingId || '').replace(/^WLX-/, '')}-${String(index + 1).padStart(2, '0')}`,
  paymentId: payment.paymentId,
  type: payment.type,
  amount: payment.amount,
  verifiedAt: payment.verifiedAt
});

export const buildPaymentReceipt = (booking, paymentId) => {
  const events = (booking.payments || []).filter((event) => event.paymentId && event.verifiedAt);
  const index = events.findIndex((event) => event.paymentId === paymentId);
  if (index < 0) return null;
  const payment = events[index];
  const amountPaidToDate = events.slice(0, index + 1).reduce((sum, event) => sum + Number(event.amount || 0), 0);
  const totalAmount = Number(booking.pricing?.finalAmount);
  return {
    ...receiptSummary(booking, payment, index),
    bookingId: booking.bookingId,
    payment: { ...safePaymentEvent(payment), currency: booking.pricing?.currency || 'INR' },
    booking: { status: booking.bookingStatus, paymentStatus: booking.paymentStatus },
    customer: {
      name: booking.customer?.name || '',
      email: booking.customer?.email || '',
      phone: booking.customer?.phone || ''
    },
    trip: {
      title: booking.tripSnapshot?.title || '',
      destination: booking.tripSnapshot?.destination || '',
      duration: booking.tripSnapshot?.duration || '',
      batchDate: booking.tripSnapshot?.batchDate || '',
      numberOfTravelers: booking.numberOfTravelers ?? null
    },
    pricing: {
      totalAmount: Number.isFinite(totalAmount) ? totalAmount : null,
      amountPaidToDate,
      amountOutstanding: Number.isFinite(totalAmount) ? Math.max(0, totalAmount - amountPaidToDate) : null
    },
    verification: { url: bookingVerificationUrl(booking) }
  };
};
