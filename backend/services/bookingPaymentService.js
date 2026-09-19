import mongoose from 'mongoose';
import QRCode from 'qrcode';
import Booking from '../models/Booking.js';
import Trip from '../models/Trip.js';
import Coupon from '../models/Coupon.js';
import Commission from '../models/Commission.js';
import WalletLedger from '../models/WalletLedger.js';
import { bookingVerificationUrl, safeBooking, safePaymentEvent } from './bookingDocumentService.js';
import { sendWhatsAppTicketAndReceipt } from '../utils/whatsappService.js';

export const recordCouponRedemption = async (booking) => {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) return;
  if (!booking?._id || !booking?.couponRedemption?.couponId || booking.couponRedemption.recordedAt) return;

  const coupon = await Coupon.findById(booking.couponRedemption.couponId);
  if (!coupon) return;

  const claimed = await Booking.findOneAndUpdate(
    { _id: booking._id, 'couponRedemption.recordedAt': null },
    { $set: { 'couponRedemption.recordedAt': new Date() } },
    { new: true }
  );
  if (!claimed) return;

  booking.couponRedemption.recordedAt = claimed.couponRedemption.recordedAt;
  const revenue = Number(booking.pricing?.finalAmount || 0);
  const creator = String(coupon.creatorUserId || coupon.influencerId || '');
  const commissionRate = mongoose.Types.ObjectId.isValid(creator) ? Number(coupon.commissionRate || 0) : 0;
  const commissionAmount = Math.round(revenue * (commissionRate / 100));

  await Coupon.updateOne(
    { _id: coupon._id },
    { $inc: { usageCount: 1, totalRedemptions: 1, revenueGenerated: revenue, commissionEarned: commissionAmount } }
  );

  if (commissionAmount > 0 && !(await Commission.exists({ bookingId: booking.bookingId, couponCode: coupon.code }))) {
    await Commission.create({
      bookingId: booking.bookingId,
      influencerId: creator,
      couponCode: coupon.code,
      baseAmount: revenue,
      commissionRate,
      amount: commissionAmount,
      status: 'PENDING'
    });
    await WalletLedger.create({
      influencerId: creator,
      bookingId: booking.bookingId,
      type: 'COMMISSION_PENDING',
      amount: commissionAmount,
      status: 'PENDING',
      reference: `Coupon redemption ${coupon.code} · ${booking.bookingId}`
    });
  }
};

export const commitBookingInventory = async (booking) => {
  if (!booking || !booking.tripId) return false;
  if (!mongoose.connection || mongoose.connection.readyState !== 1) return false;

  // Atomic claim: only proceed if inventoryCommittedAt is currently null
  const claimed = await Booking.findOneAndUpdate(
    { _id: booking._id, inventoryCommittedAt: null },
    { $set: { inventoryCommittedAt: new Date() } },
    { new: true }
  );
  if (!claimed) {
    // Inventory was already committed
    return false;
  }

  booking.inventoryCommittedAt = claimed.inventoryCommittedAt;

  try {
    const tripDoc = await Trip.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(booking.tripId) ? booking.tripId : null },
        { slug: String(booking.tripId).toLowerCase() }
      ]
    });

    if (tripDoc && Array.isArray(tripDoc.batches)) {
      const batchIndex = tripDoc.batches.findIndex(
        (b) =>
          (booking.tripSnapshot?.batchDate && b.dates === booking.tripSnapshot.batchDate) ||
          (booking.batchId && (b.batchId === booking.batchId || String(b._id) === String(booking.batchId)))
      );

      if (batchIndex !== -1) {
        const addedPax = Number(booking.numberOfTravelers) || 1;
        tripDoc.batches[batchIndex].bookedSeats = (tripDoc.batches[batchIndex].bookedSeats || 0) + addedPax;
        const cap = Number(tripDoc.batches[batchIndex].capacity) || 0;
        const booked = tripDoc.batches[batchIndex].bookedSeats;

        if (cap > 0 && booked >= cap) {
          tripDoc.batches[batchIndex].status = 'sold_out';
        } else if (cap > 0 && booked >= cap * 0.75) {
          tripDoc.batches[batchIndex].status = 'filling_fast';
        } else {
          tripDoc.batches[batchIndex].status = 'available';
        }
        await tripDoc.save();
      }
    }
  } catch (err) {
    console.warn('[Inventory] Warning updating batch capacity:', err.message);
  }

  return true;
};

/**
 * Central Payment Finalizer
 * Used by:
 * - verifyBookingPayment (Initial Checkout)
 * - verifyRemainingBalance (Balance Payment)
 * - razorpayWebhookHandler (Server Webhook)
 * - reconcileBookingPayment (Status Reconciliation)
 */
export const finalizeBookingPayment = async ({
  booking,
  orderId,
  paymentId,
  amount,
  type,
  verifiedAt = new Date(),
  source = 'checkout_callback'
}) => {
  if (!booking) {
    throw new Error('Booking instance is required for payment finalization.');
  }

  if (!Array.isArray(booking.payments)) {
    booking.payments = [];
  }

  // 1. Idempotency Check: if this paymentId is already recorded in payments[], return existing state
  const existingPayment = booking.payments.find((p) => p.paymentId === paymentId);
  if (existingPayment) {
    return {
      success: true,
      alreadyFinalized: true,
      booking,
      paymentEvent: existingPayment
    };
  }

  const finalAmount = Number(booking.pricing?.finalAmount || 0);
  if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
    throw new Error('Booking finalAmount is invalid or missing.');
  }

  // Resolve or validate payment type
  let paymentType = String(type || '').toUpperCase();
  if (!paymentType) {
    if (booking.bookingStatus === 'PROVISIONALLY_CONFIRMED' || booking.paymentStatus === 'PARTIALLY_PAID') {
      paymentType = 'BALANCE';
    } else if (booking.paymentPlan?.type === 'PARTIAL') {
      paymentType = 'DEPOSIT';
    } else {
      paymentType = 'FULL';
    }
  }

  const paidAmountNumber = Number(amount) || 0;

  // 2. State & Lifecycle Transitions
  if (paymentType === 'DEPOSIT') {
    const depositPercent = booking.paymentPlan?.depositPercent || 10;
    const expectedDeposit = Math.round(finalAmount * (depositPercent / 100));
    const depositPaid = paidAmountNumber > 0 ? paidAmountNumber : expectedDeposit;

    booking.pricing.amountPaid = depositPaid;
    booking.pricing.amountOutstanding = Math.max(0, finalAmount - depositPaid);
    booking.paymentStatus = 'PARTIALLY_PAID';
    booking.bookingStatus = 'PROVISIONALLY_CONFIRMED';
    booking.payment.status = 'PAID';
    booking.payment.razorpayPaymentId = paymentId;
    booking.payment.paidAt = verifiedAt;
    booking.qrCode.dataUrl = ''; // Boarding pass locked for deposit
  } else if (paymentType === 'BALANCE') {
    booking.pricing.amountPaid = finalAmount;
    booking.pricing.amountOutstanding = 0;
    booking.paymentStatus = 'PAID';
    booking.bookingStatus = 'CONFIRMED';
    booking.payment.status = 'PAID';
    booking.payment.pendingBalanceOrderId = '';
    booking.payment.paidAt = verifiedAt;

    // Generate unlocked Boarding QR Code
    try {
      if (!booking.qrCode) booking.qrCode = {};
      if (!booking.qrCode.verificationToken) {
        booking.qrCode.verificationToken = booking.verificationToken || `${booking.bookingId}-${Date.now()}`;
      }
      const qrUrl = bookingVerificationUrl(booking);
      if (qrUrl) {
        booking.qrCode.dataUrl = await QRCode.toDataURL(qrUrl, {
          width: 320,
          margin: 2,
          color: { dark: '#0b132b', light: '#ffffff' }
        });
      }
    } catch (qrErr) {
      console.warn('[QR] Could not generate boarding QR data URL:', qrErr.message);
    }
  } else {
    // FULL payment
    paymentType = 'FULL';
    booking.pricing.amountPaid = finalAmount;
    booking.pricing.amountOutstanding = 0;
    booking.paymentStatus = 'PAID';
    booking.bookingStatus = 'CONFIRMED';
    booking.payment.status = 'PAID';
    booking.payment.razorpayPaymentId = paymentId;
    booking.payment.paidAt = verifiedAt;

    // Generate unlocked Boarding QR Code
    try {
      if (!booking.qrCode) booking.qrCode = {};
      if (!booking.qrCode.verificationToken) {
        booking.qrCode.verificationToken = booking.verificationToken || `${booking.bookingId}-${Date.now()}`;
      }
      const qrUrl = bookingVerificationUrl(booking);
      if (qrUrl) {
        booking.qrCode.dataUrl = await QRCode.toDataURL(qrUrl, {
          width: 320,
          margin: 2,
          color: { dark: '#0b132b', light: '#ffffff' }
        });
      }
    } catch (qrErr) {
      console.warn('[QR] Could not generate boarding QR data URL:', qrErr.message);
    }
  }

  // 3. Append to payment ledger (No signature exposed)
  const paymentEvent = {
    provider: 'razorpay',
    orderId,
    paymentId,
    amount: paidAmountNumber > 0 ? paidAmountNumber : (paymentType === 'DEPOSIT' ? booking.pricing.amountPaid : finalAmount),
    type: paymentType,
    verifiedAt
  };
  booking.payments.push(paymentEvent);

  // 4. Atomic Inventory Commitment (Only for initial DEPOSIT or FULL, never BALANCE)
  if (paymentType === 'FULL' || paymentType === 'DEPOSIT') {
    await commitBookingInventory(booking);
  }

  // 5. Atomic Coupon Redemption
  await recordCouponRedemption(booking);

  // 6. Save Booking
  await booking.save();

  // 7. Dispatch WhatsApp notification asynchronously
  sendWhatsAppTicketAndReceipt(booking)
    .then((waResult) => {
      booking.whatsappNotification = waResult;
      return Booking.updateOne({ _id: booking._id }, { $set: { whatsappNotification: waResult } });
    })
    .catch((waErr) => {
      console.warn('[WhatsApp] Notification warning:', waErr.message);
    });

  console.log(`[BookingPayment] Finalized ${paymentType} for ${booking.bookingId} (${paymentId}) via ${source}`);

  return {
    success: true,
    alreadyFinalized: false,
    booking,
    paymentEvent
  };
};
