import crypto from 'crypto';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import RazorpayWebhookEvent from '../models/RazorpayWebhookEvent.js';
import { verifyWebhookSignature } from '../services/razorpayService.js';
import { finalizeBookingPayment } from '../services/bookingPaymentService.js';

export const razorpayWebhookHandler = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const eventId = req.headers['x-razorpay-event-id'];
  const rawBody = req.body;

  if (!rawBody) {
    return res.status(400).json({ message: 'Missing webhook request body.' });
  }

  // 1. Verify Webhook Signature using raw Buffer
  const isValid = verifyWebhookSignature({ rawBody, signature });
  if (!isValid) {
    console.error('[RazorpayWebhook] Signature verification failed.');
    return res.status(400).json({ message: 'Invalid webhook signature.' });
  }

  // 2. Parse payload safely
  let payload;
  try {
    const rawString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
    payload = JSON.parse(rawString);
  } catch (parseErr) {
    console.error('[RazorpayWebhook] Could not parse JSON payload:', parseErr.message);
    return res.status(400).json({ message: 'Malformed JSON payload.' });
  }

  const eventType = payload.event;
  const resolvedEventId = eventId || payload.event_id || payload.id || `evt_${Date.now()}`;

  // 3. Database check - fail with 503 so Razorpay will retry if DB is temporarily disconnected
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    console.warn('[RazorpayWebhook] Database disconnected. Asking Razorpay to retry.');
    return res.status(503).json({ message: 'Database temporarily unavailable.' });
  }

  // 4. Webhook Event Idempotency
  try {
    const existingEvent = await RazorpayWebhookEvent.findOne({ eventId: resolvedEventId });
    if (existingEvent && existingEvent.status === 'PROCESSED') {
      return res.status(200).json({ received: true, alreadyProcessed: true });
    }

    if (!existingEvent) {
      await RazorpayWebhookEvent.create({
        eventId: resolvedEventId,
        eventType,
        status: 'RECEIVED'
      });
    }
  } catch (dupErr) {
    // If unique key collision occurred during concurrent write
    if (dupErr.code === 11000) {
      const existing = await RazorpayWebhookEvent.findOne({ eventId: resolvedEventId });
      if (existing?.status === 'PROCESSED') {
        return res.status(200).json({ received: true, alreadyProcessed: true });
      }
    }
  }

  // 5. Filter for actionable events
  if (!['payment.captured', 'order.paid', 'payment.failed'].includes(eventType)) {
    await RazorpayWebhookEvent.updateOne(
      { eventId: resolvedEventId },
      { $set: { status: 'IGNORED', error: `Unhandled event type: ${eventType}` } }
    );
    return res.status(200).json({ received: true, status: 'IGNORED' });
  }

  if (eventType === 'payment.failed') {
    const paymentEntity = payload.payload?.payment?.entity;
    await RazorpayWebhookEvent.updateOne(
      { eventId: resolvedEventId },
      {
        $set: {
          status: 'FAILED',
          paymentId: paymentEntity?.id || '',
          orderId: paymentEntity?.order_id || '',
          error: paymentEntity?.error_description || 'Payment failed'
        }
      }
    );
    return res.status(200).json({ received: true, status: 'RECORDED_FAILURE' });
  }

  // 6. Handle payment.captured or order.paid
  const paymentEntity = payload.payload?.payment?.entity;
  const orderEntity = payload.payload?.order?.entity;

  const paymentId = paymentEntity?.id;
  const orderId = paymentEntity?.order_id || orderEntity?.id;
  const amountPaise = Number(paymentEntity?.amount ?? orderEntity?.amount_paid ?? 0);
  const currency = String(paymentEntity?.currency || orderEntity?.currency || '').toUpperCase();
  const paymentStatus = paymentEntity?.status;

  if (!orderId || !paymentId) {
    await RazorpayWebhookEvent.updateOne(
      { eventId: resolvedEventId },
      { $set: { status: 'FAILED', error: 'Missing order_id or payment_id in webhook payload' } }
    );
    return res.status(200).json({ received: true, error: 'Missing order_id or payment_id' });
  }

  // Currency check
  if (currency !== 'INR') {
    await RazorpayWebhookEvent.updateOne(
      { eventId: resolvedEventId },
      { $set: { status: 'FAILED', paymentId, orderId, error: `Invalid currency: ${currency}` } }
    );
    return res.status(200).json({ received: true, error: 'Currency mismatch' });
  }

  // Ensure payment is actually captured
  if (eventType === 'payment.captured' && paymentStatus !== 'captured') {
    await RazorpayWebhookEvent.updateOne(
      { eventId: resolvedEventId },
      { $set: { status: 'IGNORED', paymentId, orderId, error: `Payment not captured (status: ${paymentStatus})` } }
    );
    return res.status(200).json({ received: true, status: 'WAITING_CAPTURE' });
  }

  // 7. Find correlating Booking
  const booking = await Booking.findOne({
    $or: [{ 'payment.razorpayOrderId': orderId }, { 'payment.pendingBalanceOrderId': orderId }]
  });

  if (!booking) {
    console.warn(`[RazorpayWebhook] No booking matched order ${orderId}.`);
    await RazorpayWebhookEvent.updateOne(
      { eventId: resolvedEventId },
      { $set: { status: 'IGNORED', paymentId, orderId, error: 'IGNORED_UNKNOWN_ORDER' } }
    );
    return res.status(200).json({ received: true, status: 'IGNORED_UNKNOWN_ORDER' });
  }

  // 8. Amount Validation
  const isBalancePayment = booking.payment?.pendingBalanceOrderId === orderId;
  const finalAmount = Number(booking.pricing?.finalAmount || 0);
  let expectedPaise = 0;
  let paymentType = 'FULL';

  if (isBalancePayment) {
    paymentType = 'BALANCE';
    const outstanding = Number(booking.pricing?.amountOutstanding || 0);
    expectedPaise = Math.round(outstanding * 100);
  } else if (booking.paymentPlan?.type === 'PARTIAL') {
    paymentType = 'DEPOSIT';
    const depositPercent = booking.paymentPlan?.depositPercent || 10;
    const expectedDeposit = Math.round(finalAmount * (depositPercent / 100));
    expectedPaise = Math.round(expectedDeposit * 100);
  } else {
    paymentType = 'FULL';
    expectedPaise = Math.round(finalAmount * 100);
  }

  if (amountPaise !== expectedPaise) {
    console.error(
      `[RazorpayWebhook] Amount mismatch for ${booking.bookingId}: expected ${expectedPaise} paise, received ${amountPaise} paise.`
    );
    await RazorpayWebhookEvent.updateOne(
      { eventId: resolvedEventId },
      {
        $set: {
          status: 'FAILED',
          paymentId,
          orderId,
          error: `AMOUNT_MISMATCH: expected ${expectedPaise}, received ${amountPaise}`
        }
      }
    );
    return res.status(200).json({ received: true, error: 'AMOUNT_MISMATCH' });
  }

  // 9. Central Payment Finalization
  try {
    await finalizeBookingPayment({
      booking,
      orderId,
      paymentId,
      amount: amountPaise / 100,
      type: paymentType,
      verifiedAt: new Date(paymentEntity?.created_at ? paymentEntity.created_at * 1000 : Date.now()),
      source: 'webhook'
    });

    await RazorpayWebhookEvent.updateOne(
      { eventId: resolvedEventId },
      {
        $set: {
          status: 'PROCESSED',
          paymentId,
          orderId,
          processedAt: new Date()
        }
      }
    );

    return res.status(200).json({ received: true, status: 'PROCESSED' });
  } catch (finalizeErr) {
    console.error('[RazorpayWebhook] Error in finalizeBookingPayment:', finalizeErr);
    await RazorpayWebhookEvent.updateOne(
      { eventId: resolvedEventId },
      {
        $set: {
          status: 'FAILED',
          paymentId,
          orderId,
          error: finalizeErr.message
        }
      }
    );
    return res.status(500).json({ received: false, error: 'Finalization failed' });
  }
};
