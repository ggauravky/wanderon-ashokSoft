import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingVerificationUrl, safeBooking, buildPaymentReceipt, receiptSummary } from './services/bookingDocumentService.js';

const booking = {
  bookingId: 'WLX-2026-AB12CD34',
  bookingStatus: 'CONFIRMED',
  paymentStatus: 'PAID',
  customer: { name: 'Traveler', email: 'traveler@example.com', phone: '9000000000' },
  tripSnapshot: { title: 'Kashmir', destination: 'Kashmir', batchDate: '10 Oct 2026' },
  pricing: { finalAmount: 10000, amountPaid: 10000, currency: 'INR' },
  payment: { razorpaySignature: 'secret', razorpayPaymentId: 'pay_deposit' },
  qrCode: { verificationToken: 'safe-token', verificationUrl: 'https://old.invalid/booking/verify/safe-token' },
  payments: [
    { paymentId: 'pay_deposit', orderId: 'order_1', type: 'DEPOSIT', amount: 1000, verifiedAt: new Date('2026-09-01'), signature: 'secret-1' },
    { paymentId: 'pay_balance', orderId: 'order_2', type: 'BALANCE', amount: 9000, verifiedAt: new Date('2026-09-02'), signature: 'secret-2' }
  ]
};

test('customer booking strips verification signatures', () => {
  const result = safeBooking(booking);
  assert.equal(result.payment.razorpaySignature, undefined);
  assert.equal(result.payments[0].signature, undefined);
  assert.equal(result.payments[1].signature, undefined);
});

test('deposit and balance receipts preserve transaction and cumulative amounts independently', () => {
  const deposit = buildPaymentReceipt(booking, 'pay_deposit');
  const balance = buildPaymentReceipt(booking, 'pay_balance');
  assert.equal(deposit.payment.amount, 1000);
  assert.equal(deposit.pricing.amountPaidToDate, 1000);
  assert.equal(deposit.pricing.amountOutstanding, 9000);
  assert.equal(balance.payment.amount, 9000);
  assert.equal(balance.pricing.amountPaidToDate, 10000);
  assert.equal(balance.pricing.amountOutstanding, 0);
  assert.equal(deposit.receiptNumber, receiptSummary(booking, booking.payments[0], 0).receiptNumber);
  assert.equal(buildPaymentReceipt(booking, 'missing'), null);
  assert.equal(JSON.stringify(balance).includes('secret'), false);
});

test('verification QR URL uses current configured frontend origin, not historical stored URL', () => {
  const previous = process.env.FRONTEND_URL;
  process.env.FRONTEND_URL = 'https://example.org/';
  try {
    assert.equal(bookingVerificationUrl(booking), 'https://example.org/booking/verify/safe-token');
  } finally {
    if (previous === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = previous;
  }
});
