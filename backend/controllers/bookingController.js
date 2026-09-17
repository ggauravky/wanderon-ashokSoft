import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import QRCode from 'qrcode';
import Booking from '../models/Booking.js';
import Quotation from '../models/Quotation.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import Commission from '../models/Commission.js';
import WalletLedger from '../models/WalletLedger.js';
import { validateCouponForAmount } from '../services/couponService.js';
import { sendWhatsAppTicketAndReceipt } from '../utils/whatsappService.js';
import { isValidMongoObjectId, toObjectIdOrNull } from '../utils/mongoId.js';
import { sendErrorResponse } from '../utils/httpResponse.js';
import { buildCreatedAtRange } from '../utils/dateFilters.js';

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

const recordCouponRedemption = async (booking) => {
  if (!isDbConnected() || !booking?._id || !booking?.couponRedemption?.couponId || booking.couponRedemption.recordedAt) return;
  const coupon = await Coupon.findById(booking.couponRedemption.couponId);
  if (!coupon) return;
  const claimed = await Booking.findOneAndUpdate(
    { _id: booking._id, 'couponRedemption.recordedAt': null },
    { $set: { 'couponRedemption.recordedAt': new Date() } },
    { new: true }
  );
  if (!claimed) return;
  const revenue = Number(booking.pricing?.finalAmount || 0);
  const creator = String(coupon.creatorUserId || coupon.influencerId || '');
  const commissionRate = mongoose.Types.ObjectId.isValid(creator) ? Number(coupon.commissionRate || 0) : 0;
  const commissionAmount = Math.round(revenue * (commissionRate / 100));
  await Coupon.updateOne({ _id: coupon._id }, { $inc: { usageCount: 1, totalRedemptions: 1, revenueGenerated: revenue, commissionEarned: commissionAmount } });
  if (commissionAmount > 0 && !(await Commission.exists({ bookingId: booking.bookingId, couponCode: coupon.code }))) {
    await Commission.create({ bookingId: booking.bookingId, influencerId: creator, couponCode: coupon.code, baseAmount: revenue, commissionRate, amount: commissionAmount, status: 'PENDING' });
    await WalletLedger.create({ influencerId: creator, bookingId: booking.bookingId, type: 'COMMISSION_PENDING', amount: commissionAmount, status: 'PENDING', reference: `Coupon redemption ${coupon.code} · ${booking.bookingId}` });
  }
};

const getBookingRole = (user) => String(user?.role || 'user').toLowerCase();
const isBroadBookingStaff = (user) => (
  ['super_admin', 'admin', 'operations'].includes(getBookingRole(user))
);

const getSalesQuotationScope = (user) => {
  const userId = user?._id || user?.id;
  const owned = mongoose.Types.ObjectId.isValid(userId)
    ? [{ assignedTo: userId }, { createdBy: userId }]
    : [];
  return { $or: [...owned, { assignedTo: null }] };
};

const canAccessBooking = async (user, booking) => {
  if (!user || !booking) return false;
  if (isBroadBookingStaff(user)) return true;

  const role = getBookingRole(user);
  if (role === 'marketing') return false;
  if (role === 'sales') {
    const sourceQuotationId = booking.sourceQuotationId?._id || booking.sourceQuotationId;
    if (!booking.isCustomQuotationBooking || !sourceQuotationId) return false;
    return Boolean(await Quotation.exists({ _id: sourceQuotationId, ...getSalesQuotationScope(user) }));
  }

  const userId = user._id || user.id;
  return Boolean(booking.userId && userId && String(booking.userId?._id || booking.userId) === String(userId));
};

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findBookableTrip = async (tripId) => {
  if (!isDbConnected()) return null;
  const identity = mongoose.Types.ObjectId.isValid(tripId)
    ? { $or: [{ _id: tripId }, { slug: String(tripId).toLowerCase() }] }
    : { slug: String(tripId).toLowerCase() };
  return Trip.findOne({
    ...identity,
    status: 'published',
    isActive: true,
    isCustom: { $ne: true }
  });
};

const getRazorpayInstance = () => {
  const key_id = String(process.env.RAZORPAY_KEY_ID || '').trim();
  const key_secret = String(process.env.RAZORPAY_KEY_SECRET || '').trim();
  if (!key_id || !key_secret) throw Object.assign(new Error('Payment provider is not configured.'), { status: 503 });
  return new Razorpay({ key_id, key_secret });
};

const hasValidRazorpaySignature = (orderId, paymentId, signature) => {
  const secret = String(process.env.RAZORPAY_KEY_SECRET || '').trim();
  if (!secret) throw Object.assign(new Error('Payment verification is unavailable.'), { status: 503 });
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest();
  const received = Buffer.from(String(signature), 'hex');
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
};

// Helper: Parse batch departure date accurately
export const parseBatchStartDate = (batchDateStr) => {
  if (!batchDateStr) return null;
  if (batchDateStr instanceof Date) return batchDateStr;
  if (typeof batchDateStr !== 'string') return null;
  const match = batchDateStr.match(/(\d{1,2})\s+([A-Za-z]{3})(?:\s*-\s*\d{1,2}\s+[A-Za-z]{3})?,?\s*(\d{4})/);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthStr = match[2];
    const year = parseInt(match[3], 10);
    const months = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const monthIndex = months[monthStr.toLowerCase().substring(0, 3)];
    if (monthIndex !== undefined) {
      return new Date(Date.UTC(year, monthIndex, day));
    }
  }
  const directDate = new Date(batchDateStr);
  if (!isNaN(directDate.getTime())) {
    return directDate;
  }
  return null;
};

// Helper: Authoritative Partial Payment Eligibility & Due Date Rule
export const evaluatePartialPaymentEligibility = (batchDateStr, balanceDueDays = 6) => {
  const departureDate = parseBatchStartDate(batchDateStr);
  const now = new Date();
  
  if (!departureDate) {
    const fallbackDueDate = new Date(now.getTime() + balanceDueDays * 24 * 60 * 60 * 1000);
    return {
      eligible: true,
      balanceDueDate: fallbackDueDate,
      daysUntilDeparture: 30,
      reason: 'Standard 6-day balance schedule applies.'
    };
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilDeparture = Math.round((departureDate.getTime() - now.getTime()) / msPerDay);

  // Partial payment disallowed if departure is too close (<= balanceDueDays)
  if (daysUntilDeparture <= balanceDueDays) {
    return {
      eligible: false,
      daysUntilDeparture,
      balanceDueDate: null,
      reason: `Partial payment is not available for this departure (only ${Math.max(0, daysUntilDeparture)} day(s) until trip). Full payment is required.`
    };
  }

  // Calculate balance due date: normal balanceDueDays from today, capped at least 2 days before departure
  const normalDueDate = new Date(now.getTime() + balanceDueDays * msPerDay);
  const maxDueDate = new Date(departureDate.getTime() - 2 * msPerDay);
  const balanceDueDate = normalDueDate < maxDueDate ? normalDueDate : maxDueDate;

  return {
    eligible: true,
    daysUntilDeparture,
    balanceDueDate,
    reason: `10% deposit now. 90% balance due by ${balanceDueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`
  };
};

// Helper: Authoritative Server-Side Price Calculation
export const calculateServerPrice = async (trip, travelersCount, occupancy, couponCode, batchId, batchDate) => {
  const count = Math.max(1, parseInt(travelersCount, 10) || 1);
  const basePrice = Number(trip.price);
  if (!Number.isFinite(basePrice) || basePrice < 0) {
    throw new Error('This trip does not have valid bookable pricing.');
  }
  
  // 1. Resolve matching batch if provided
  let matchedBatch = null;
  if (Array.isArray(trip.batches) && trip.batches.length > 0) {
    matchedBatch = trip.batches.find(b => 
      (batchId && (b.batchId === batchId || String(b._id) === String(batchId))) ||
      (batchDate && b.dates === batchDate)
    );
  }

  // 2. Resolve room sharing rate
  let effectivePerPerson = basePrice;
  const occ = (occupancy || 'Double Sharing').trim();

  if (matchedBatch && matchedBatch.pricing) {
    if (occ === 'Triple Sharing' && matchedBatch.pricing.tripleSharing) {
      effectivePerPerson = Number(matchedBatch.pricing.tripleSharing);
    } else if (occ === 'Single Sharing' && matchedBatch.pricing.singleSharing) {
      effectivePerPerson = Number(matchedBatch.pricing.singleSharing);
    } else if (matchedBatch.pricing.doubleSharing) {
      effectivePerPerson = Number(matchedBatch.pricing.doubleSharing);
    }
  } else if (trip.sharingPricing) {
    if (occ === 'Triple Sharing' && trip.sharingPricing.tripleSharing) {
      effectivePerPerson = Number(trip.sharingPricing.tripleSharing);
    } else if (occ === 'Single Sharing' && trip.sharingPricing.singleSharing) {
      effectivePerPerson = Number(trip.sharingPricing.singleSharing);
    } else if (trip.sharingPricing.doubleSharing) {
      effectivePerPerson = Number(trip.sharingPricing.doubleSharing);
    }
  }

  const subtotal = effectivePerPerson * count;

  // 3. Authoritative Coupon Verification
  let discount = 0;
  let validatedCoupon = null;

  if (couponCode && typeof couponCode === 'string') {
    if (!isDbConnected()) throw Object.assign(new Error('Coupon validation is temporarily unavailable.'), { status: 503 });
    const result = await validateCouponForAmount({ code: couponCode, amount: subtotal, planId: trip._id });
    if (!result.valid) throw Object.assign(new Error(result.message), { status: result.status });
    discount = result.discountAmount;
    validatedCoupon = result.coupon;
  }

  const finalAmount = Math.max(1, subtotal - discount);

  return {
    count,
    basePricePerPerson: effectivePerPerson,
    subtotal,
    discount,
    taxes: 0,
    finalAmount,
    currency: 'INR',
    occupancy: occ,
    batchDate: matchedBatch ? matchedBatch.dates : (batchDate || ''),
    validatedCoupon
  };
};

// @desc    Calculate Server-Authoritative Booking Pricing
// @route   POST /api/bookings/calculate-pricing
// @access  Public
export const calculatePricingEndpoint = async (req, res) => {
  try {
    const { tripId, travelersCount, occupancy, couponCode, batchId, batchDate } = req.body;

    if (!tripId) {
      return res.status(400).json({ message: 'Trip ID or slug is required.' });
    }
    if (!isDbConnected()) return res.status(503).json({ message: 'Booking inventory is temporarily unavailable.' });
    const trip = await findBookableTrip(tripId);
    if (!trip) return res.status(404).json({ message: 'This trip is unavailable for booking.' });
    if (!Array.isArray(trip.batches) || trip.batches.length === 0) {
      return res.status(409).json({ message: 'No departures are currently available for this trip.' });
    }
    const selectedBatch = trip.batches.find((batch) =>
      (batchId && (batch.batchId === batchId || String(batch._id) === String(batchId)))
      || (batchDate && batch.dates === batchDate)
    );
    if (!selectedBatch) return res.status(409).json({ message: 'Select a valid departure before continuing.' });
    if (selectedBatch.status === 'sold_out' || Number(selectedBatch.bookedSeats || 0) >= Number(selectedBatch.capacity || 0)) {
      return res.status(409).json({ message: 'The selected departure is sold out.' });
    }
    const requestedSeats = Math.max(1, parseInt(travelersCount, 10) || 1);
    const availableSeats = Math.max(0, Number(selectedBatch.capacity || 0) - Number(selectedBatch.bookedSeats || 0));
    if (requestedSeats > availableSeats) {
      return res.status(409).json({ message: `The selected departure only has ${availableSeats} seat${availableSeats === 1 ? '' : 's'} available.` });
    }

    const pricing = await calculateServerPrice(
      trip,
      travelersCount,
      occupancy,
      couponCode,
      batchId,
      batchDate
    );

    const partialEligibility = evaluatePartialPaymentEligibility(pricing.batchDate || batchDate, 6);
    const depositPercent = 10;
    const depositAmount = Math.round(pricing.finalAmount * (depositPercent / 100));
    const balanceAmount = pricing.finalAmount - depositAmount;

    res.json({
      success: true,
      pricing: {
        ...pricing,
        partialPayment: {
          eligible: partialEligibility.eligible,
          reason: partialEligibility.reason,
          depositPercent,
          depositAmount,
          balanceAmount,
          balanceDueDate: partialEligibility.balanceDueDate
        }
      }
    });
  } catch (err) {
    console.error('Calculate Pricing Error:', err);
    res.status(err.status || 500).json({ message: err.message || 'Server error calculating pricing.' });
  }
};

// @desc    Create Razorpay Test Order and Pending Booking (Full or 10% Deposit)
// @route   POST /api/bookings/create-order
// @access  Private
export const createBookingOrder = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required to create a booking.' });
    }
    if (!isDbConnected()) return res.status(503).json({ message: 'Booking storage is temporarily unavailable.' });

    const {
      tripId,
      travelersCount,
      batchId,
      batchDate,
      occupancy,
      pickupPoint,
      leadTraveler,
      coTravelers,
      couponCode,
      paymentPlan
    } = req.body;

    if (!tripId) {
      return res.status(400).json({ message: 'Trip ID is required for booking.' });
    }

    const count = Math.max(1, parseInt(travelersCount, 10) || 1);
    if (count > 10) {
      return res.status(400).json({ message: 'Maximum 10 travelers allowed per booking.' });
    }

    // Lead Traveler Validation
    const customerName = (leadTraveler?.name || req.user?.name || '').trim();
    const customerEmail = (leadTraveler?.email || req.user?.email || '').trim();
    const customerPhone = (leadTraveler?.phone || req.user?.phone || '').trim();

    if (!customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({ 
        message: 'Lead traveler name, valid email, and contact phone number are required.' 
      });
    }

    // Co-Travelers Validation
    const formattedCoTravelers = Array.isArray(coTravelers) ? coTravelers : [];
    if (count > 1) {
      if (formattedCoTravelers.length < count - 1) {
        return res.status(400).json({
          message: `Please provide details for all ${count} travelers (${count - 1} co-traveler${count > 2 ? 's' : ''}).`
        });
      }
      for (let i = 0; i < count - 1; i++) {
        const ct = formattedCoTravelers[i];
        if (!ct || !ct.name || !ct.name.trim()) {
          return res.status(400).json({
            message: `Please provide the full name for Traveler ${i + 2}.`
          });
        }
      }
    }

    if (!isDbConnected()) return res.status(503).json({ message: 'Booking inventory is temporarily unavailable.' });
    const trip = await findBookableTrip(tripId);
    if (!trip) return res.status(404).json({ message: 'This trip is unavailable for booking.' });
    if (!Array.isArray(trip.batches) || trip.batches.length === 0) {
      return res.status(409).json({ message: 'No departures are currently available for this trip.' });
    }

    // Capacity Validation against remaining batch seats
    let matchedBatch = null;
    if (Array.isArray(trip.batches) && trip.batches.length > 0) {
      matchedBatch = trip.batches.find(b => 
        (batchId && (b.batchId === batchId || String(b._id) === String(batchId))) ||
        (batchDate && b.dates === batchDate)
      );

      if (!matchedBatch) {
        return res.status(409).json({ message: 'Select a valid departure before continuing.' });
      }
      if (matchedBatch.status === 'sold_out') {
        return res.status(409).json({ message: 'The selected departure is sold out.' });
      }

      if (matchedBatch && matchedBatch.capacity !== undefined && matchedBatch.capacity !== null) {
        const availableSeats = Math.max(0, Number(matchedBatch.capacity) - Number(matchedBatch.bookedSeats || 0));
        if (count > availableSeats) {
          return res.status(400).json({
            message: `Selected departure batch only has ${availableSeats} seat${availableSeats === 1 ? '' : 's'} available (Requested: ${count}).`
          });
        }
      }
    }

    const pricing = await calculateServerPrice(
      trip,
      count,
      occupancy,
      couponCode,
      batchId,
      batchDate
    );

    // Payment Plan Resolution (Full vs 10% Deposit)
    const planType = (paymentPlan?.type || paymentPlan || 'FULL').toUpperCase();
    const depositPercent = Number(paymentPlan?.depositPercent) || 10;
    const balanceDueDays = Number(paymentPlan?.balanceDueDays) || 6;

    let amountToCharge = pricing.finalAmount;
    let depositAmount = Math.round(pricing.finalAmount * (depositPercent / 100));
    let amountOutstanding = 0;
    let balanceDueDate = null;

    if (planType === 'PARTIAL') {
      const eligibility = evaluatePartialPaymentEligibility(pricing.batchDate || batchDate, balanceDueDays);
      if (!eligibility.eligible) {
        return res.status(400).json({
          message: eligibility.reason || 'Partial payment is not available for this departure date. Full payment is required.'
        });
      }
      amountToCharge = depositAmount;
      amountOutstanding = pricing.finalAmount - depositAmount;
      balanceDueDate = eligibility.balanceDueDate;
    }

    const bookingId = 'WLX-2026-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const verificationToken = crypto.randomBytes(16).toString('hex');
    // Create Razorpay Order strictly with server-calculated amount
    const rzp = getRazorpayInstance();
    const rzpOrder = await rzp.orders.create({
        amount: amountToCharge * 100,
        currency: 'INR',
        receipt: bookingId,
        notes: {
          bookingId,
          userId: userId.toString(),
          tripTitle: trip.title,
          planType,
          depositPercent: planType === 'PARTIAL' ? depositPercent : 100
        }
      });

    const safeUserId = isValidMongoObjectId(userId) ? toObjectIdOrNull(userId) : null;
    if (!safeUserId) return res.status(401).json({ message: 'A valid database user is required to create a booking.' });

    const bookingData = {
      bookingId,
      userId: safeUserId,
      tripId: String(tripId),
      batchId: matchedBatch?.batchId || String(matchedBatch?._id || ''),
      tripSnapshot: {
        title: trip.title,
        location: trip.location || '',
        destination: trip.destination || trip.location || '',
        image: trip.image,
        duration: trip.duration || '',
        batchDate: pricing.batchDate || batchDate || '',
        pickupPoint: pickupPoint || ''
      },
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        age: leadTraveler?.age || '',
        gender: leadTraveler?.gender || 'Male'
      },
      travelers: formattedCoTravelers.slice(0, count - 1),
      numberOfTravelers: pricing.count,
      occupancy: occupancy || 'Double Sharing',
      paymentPlan: {
        type: planType,
        depositPercent,
        balanceDueDays
      },
      pricing: {
        basePricePerPerson: pricing.basePricePerPerson,
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        couponCode: couponCode ? couponCode.trim().toUpperCase() : '',
        taxes: 0,
        finalAmount: pricing.finalAmount,
        amountPaid: 0,
        amountOutstanding: pricing.finalAmount,
        balanceDueDate,
        isOverdue: false,
        currency: 'INR'
      },
      payment: {
        provider: 'razorpay',
        status: 'PENDING',
        razorpayOrderId: rzpOrder.id
      },
      paymentStatus: 'UNPAID',
      bookingStatus: 'PENDING_PAYMENT',
      payments: [],
      qrCode: {
        verificationToken,
        verificationUrl: `https://wanderluxe.in/booking/verify/${verificationToken}`
      },
      influencerAttribution: pricing.validatedCoupon?.influencerId ? {
        influencerId: pricing.validatedCoupon.influencerId,
        couponCode: pricing.validatedCoupon.code,
        commissionRate: Number(pricing.validatedCoupon.commissionRate || 0),
        commissionAmount: Math.round(pricing.finalAmount * (Number(pricing.validatedCoupon.commissionRate || 0) / 100))
      } : {},
      couponRedemption: pricing.validatedCoupon?._id ? { couponId: pricing.validatedCoupon._id, recordedAt: null } : {}
    };

    let booking = null;
    // Pending booking deduplication (update active draft instead of creating duplicates)
    const existingPending = await Booking.findOne({
          userId,
          tripId: String(tripId),
          bookingStatus: { $in: ['DRAFT', 'PENDING_PAYMENT'] },
          createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
        });

    if (existingPending) {
          existingPending.batchId = bookingData.batchId;
          existingPending.tripSnapshot = bookingData.tripSnapshot;
          existingPending.customer = bookingData.customer;
          existingPending.travelers = bookingData.travelers;
          existingPending.numberOfTravelers = bookingData.numberOfTravelers;
          existingPending.occupancy = bookingData.occupancy;
          existingPending.paymentPlan = bookingData.paymentPlan;
          existingPending.pricing = bookingData.pricing;
          existingPending.payment.razorpayOrderId = rzpOrder.id;
          existingPending.influencerAttribution = bookingData.influencerAttribution;
          existingPending.couponRedemption = bookingData.couponRedemption;
      booking = await existingPending.save();
    } else {
      booking = await Booking.create(bookingData);
    }

    res.status(201).json({
      success: true,
      bookingId: booking.bookingId,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      amountToPay: amountToCharge,
      amountOutstanding,
      balanceDueDate,
      paymentPlan: booking.paymentPlan,
      currency: rzpOrder.currency || 'INR',
      key: process.env.RAZORPAY_KEY_ID,
      customer: booking.customer,
      pricing: booking.pricing,
      tripSnapshot: booking.tripSnapshot
    });
  } catch (error) {
    console.error('Create Booking Order Error:', error);
    return sendErrorResponse(res, error, 'Unable to create the payment order.');
  }
};

// @desc    Verify Razorpay Payment Signature, Confirm / Provisionally Confirm Booking
// @route   POST /api/bookings/verify-payment
// @access  Private
export const verifyBookingPayment = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing required payment verification parameters.' });
    }
    if (!isDbConnected()) return res.status(503).json({ message: 'Payment verification is temporarily unavailable.' });

    // CRITICAL: Verify Razorpay HMAC-SHA256 signature to prevent fake payment confirmation
    if (!hasValidRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        console.error('Razorpay signature mismatch — potential tampered payment attempt', {
          bookingId,
          razorpay_order_id,
          razorpay_payment_id
        });
        return res.status(400).json({ message: 'Payment signature verification failed. Contact support.' });
    }

    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({ message: 'Booking record not found.' });
    }

    // Ensure booking belongs to authenticated user (unless admin)
    if (!isBroadBookingStaff(req.user) && String(booking.userId) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to verify this booking.' });
    }
    if (String(booking.payment?.razorpayOrderId || '') !== String(razorpay_order_id)) {
      return res.status(400).json({ message: 'Payment order does not match this booking.' });
    }
    if (booking.payment?.razorpayPaymentId) {
      if (booking.payment.razorpayPaymentId === razorpay_payment_id) {
        return res.json({ success: true, message: 'Payment was already verified.', booking });
      }
      return res.status(409).json({ message: 'This booking already has a different verified payment.' });
    }

    const isPartial = booking.paymentPlan?.type === 'PARTIAL';
    const depositPercent = booking.paymentPlan?.depositPercent || 10;
    const finalAmount = Number(booking.pricing?.finalAmount);
    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      return res.status(409).json({ message: 'Booking pricing is unavailable. Contact support before payment.' });
    }
    const depositPaid = Math.round(finalAmount * (depositPercent / 100));

    if (isPartial) {
      // 10% Deposit Verification Lifecycle
      booking.pricing.amountPaid = depositPaid;
      booking.pricing.amountOutstanding = Math.max(0, finalAmount - depositPaid);
      booking.paymentStatus = 'PARTIALLY_PAID';
      booking.bookingStatus = 'PROVISIONALLY_CONFIRMED';
      booking.payment.status = 'PAID';
      booking.payment.razorpayPaymentId = razorpay_payment_id;
      booking.payment.razorpaySignature = razorpay_signature;
      booking.payment.paidAt = new Date();

      if (!Array.isArray(booking.payments)) booking.payments = [];
      booking.payments.push({
        provider: 'razorpay',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount: depositPaid,
        type: 'DEPOSIT',
        verifiedAt: new Date(),
        signature: razorpay_signature
      });

      // No official Boarding QR unlocked for partial payment
      booking.qrCode.dataUrl = '';
    } else {
      // Full Payment Verification Lifecycle
      booking.pricing.amountPaid = finalAmount;
      booking.pricing.amountOutstanding = 0;
      booking.paymentStatus = 'PAID';
      booking.bookingStatus = 'CONFIRMED';
      booking.payment.status = 'PAID';
      booking.payment.razorpayPaymentId = razorpay_payment_id;
      booking.payment.razorpaySignature = razorpay_signature;
      booking.payment.paidAt = new Date();

      if (!Array.isArray(booking.payments)) booking.payments = [];
      booking.payments.push({
        provider: 'razorpay',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount: finalAmount,
        type: 'FULL',
        verifiedAt: new Date(),
        signature: razorpay_signature
      });

      // Generate Official Boarding Pass QR Code
      const qrPayload = JSON.stringify({
        bookingId: booking.bookingId,
        token: booking.qrCode?.verificationToken || 'token_' + Date.now(),
        trip: booking.tripSnapshot?.title || 'WanderLuxe Departure',
        travelers: booking.numberOfTravelers,
        batchDate: booking.tripSnapshot?.batchDate,
        lead: booking.customer?.name,
        status: 'CONFIRMED'
      });

      try {
        const qrDataUrl = await QRCode.toDataURL(qrPayload, {
          width: 320,
          margin: 2,
          color: { dark: '#0b132b', light: '#ffffff' }
        });
        booking.qrCode.dataUrl = qrDataUrl;
      } catch (qrErr) {}
    }

    // Automatically send WhatsApp Notification / Receipt
    try {
      const waResult = await sendWhatsAppTicketAndReceipt(booking);
      booking.whatsappNotification = waResult;
    } catch (waErr) {
      console.warn('WhatsApp Notification Dispatch Warning:', waErr.message);
    }

    // Automatically update Trip Departure Batch Seat Capacity
    try {
      if (booking.tripId && isDbConnected()) {
        const tripDoc = await Trip.findOne({
          $or: [
            { _id: mongoose.Types.ObjectId.isValid(booking.tripId) ? booking.tripId : null },
            { slug: String(booking.tripId).toLowerCase() }
          ]
        });

        if (tripDoc && Array.isArray(tripDoc.batches)) {
          const batchIndex = tripDoc.batches.findIndex(b =>
            (booking.tripSnapshot?.batchDate && b.dates === booking.tripSnapshot.batchDate) ||
            (booking.batchId && (b.batchId === booking.batchId || String(b._id) === String(booking.batchId)))
          );

          if (batchIndex !== -1) {
            const addedPax = Number(booking.numberOfTravelers) || 1;
            tripDoc.batches[batchIndex].bookedSeats = (tripDoc.batches[batchIndex].bookedSeats || 0) + addedPax;
            const cap = Number(tripDoc.batches[batchIndex].capacity) || 0;
            const booked = tripDoc.batches[batchIndex].bookedSeats;

            if (booked >= cap) {
              tripDoc.batches[batchIndex].status = 'sold_out';
            } else if (booked >= cap * 0.75) {
              tripDoc.batches[batchIndex].status = 'filling_fast';
            } else {
              tripDoc.batches[batchIndex].status = 'available';
            }
            await tripDoc.save();
          }
        }
      }
    } catch (seatErr) {
      console.warn('Trip batch seat update warning:', seatErr.message);
    }

    await booking.save();
    await recordCouponRedemption(booking);

    res.json({
      success: true,
      message: isPartial 
        ? 'Deposit payment verified. Booking is PROVISIONALLY CONFIRMED.' 
        : 'Payment verified and booking CONFIRMED successfully.',
      booking
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    return sendErrorResponse(res, error, 'Unable to verify the payment.');
  }
};

// @desc    Cancel booking and restore departure batch seats
// @route   PUT /api/bookings/:bookingId/cancel
// @access  Private
export const cancelBooking = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { bookingId } = req.params;
    const reason = String(req.body?.reason || '').trim();

    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Booking cancellation is unavailable while the database is disconnected.' });
    }
    const lookup = mongoose.Types.ObjectId.isValid(bookingId)
      ? { $or: [{ _id: bookingId }, { bookingId }] }
      : { bookingId };
    let booking = await Booking.findOne(lookup);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (!await canAccessBooking(req.user, booking)) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking.' });
    }

    if (booking.bookingStatus === 'CANCELLED') {
      return res.json({ success: true, alreadyCancelled: true, refundProcessed: false, message: 'Booking was already cancelled. Inventory was not adjusted again.', booking });
    }

    const previousStatus = booking.bookingStatus;
    const wasConfirmed = ['CONFIRMED', 'PROVISIONALLY_CONFIRMED'].includes(previousStatus);
    booking = await Booking.findOneAndUpdate(
      { _id: booking._id, bookingStatus: previousStatus },
      { $set: { bookingStatus: 'CANCELLED', cancellationReason: reason || 'No cancellation reason provided.', cancelledAt: new Date(), cancelledBy: userId } },
      { new: true }
    );
    if (!booking) {
      const current = await Booking.findOne(lookup);
      return res.json({ success: true, alreadyCancelled: true, refundProcessed: false, message: 'Booking was already cancelled. Inventory was not adjusted again.', booking: current });
    }
    let seatsRestored = false;

    // Restore seats on Trip batch if booking was confirmed
    if (wasConfirmed && booking.tripId && !booking.inventoryReleasedAt) {
      try {
        const tripDoc = await Trip.findOne({
          $or: [
            { _id: mongoose.Types.ObjectId.isValid(booking.tripId) ? booking.tripId : null },
            { slug: String(booking.tripId).toLowerCase() }
          ]
        });

        if (tripDoc && Array.isArray(tripDoc.batches)) {
          const batchIndex = tripDoc.batches.findIndex(b =>
            (booking.tripSnapshot?.batchDate && b.dates === booking.tripSnapshot.batchDate) ||
            (booking.batchId && (b.batchId === booking.batchId || String(b._id) === String(booking.batchId)))
          );

          if (batchIndex !== -1) {
            const removedPax = Number(booking.numberOfTravelers) || 1;
            tripDoc.batches[batchIndex].bookedSeats = Math.max(0, (tripDoc.batches[batchIndex].bookedSeats || 0) - removedPax);
            const cap = Number(tripDoc.batches[batchIndex].capacity) || 0;
            const booked = tripDoc.batches[batchIndex].bookedSeats;

            if (booked >= cap) {
              tripDoc.batches[batchIndex].status = 'sold_out';
            } else if (booked >= cap * 0.75) {
              tripDoc.batches[batchIndex].status = 'filling_fast';
            } else {
              tripDoc.batches[batchIndex].status = 'available';
            }
            await tripDoc.save();
            booking.inventoryReleasedAt = new Date();
            seatsRestored = true;
          }
        }
      } catch (restoreErr) {
        console.warn('Trip batch seat restoration warning:', restoreErr.message);
      }
    }

    await booking.save();

    res.json({
      success: true,
      refundProcessed: false,
      seatsRestored,
      message: `Booking ${booking.bookingId} cancelled.${seatsRestored ? ' Departure inventory was released.' : ''} No refund was processed.`,
      booking
    });
  } catch (error) {
    console.error('Cancel Booking Error:', error);
    return sendErrorResponse(res, error, 'Unable to cancel the booking.');
  }
};

// @desc    Initiate Razorpay Order to Pay Remaining Balance
// @route   POST /api/bookings/:bookingId/pay-balance
// @access  Private
export const payRemainingBalance = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { bookingId } = req.params;
    if (!isDbConnected()) return res.status(503).json({ message: 'Payment service is temporarily unavailable.' });
    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    if (booking.userId && String(booking.userId) !== String(userId) && !isBroadBookingStaff(req.user)) {
      return res.status(403).json({ message: 'Not authorized to pay for this booking.' });
    }

    const finalAmount = Number(booking.pricing?.finalAmount);
    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      return res.status(409).json({ message: 'Booking pricing is unavailable. Contact support before payment.' });
    }
    const amountPaid = Number(booking.pricing?.amountPaid) || 0;
    const outstanding = booking.pricing?.amountOutstanding !== undefined && booking.pricing?.amountOutstanding !== null
      ? Number(booking.pricing.amountOutstanding)
      : Math.max(0, finalAmount - amountPaid);

    if (outstanding <= 0 || booking.bookingStatus === 'CONFIRMED' || booking.paymentStatus === 'PAID') {
      return res.status(400).json({ message: 'Booking is already fully paid. No outstanding balance due.' });
    }

    const rzp = getRazorpayInstance();
    const rzpOrder = await rzp.orders.create({
        amount: outstanding * 100,
        currency: 'INR',
        receipt: `${booking.bookingId}_BAL`,
        notes: {
          bookingId: booking.bookingId,
          type: 'BALANCE_PAYMENT',
          userId: userId.toString()
        }
      });
    booking.payment.pendingBalanceOrderId = rzpOrder.id;
    await booking.save();

    res.json({
      success: true,
      bookingId: booking.bookingId,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      outstandingAmount: outstanding,
      currency: rzpOrder.currency || 'INR',
      key: process.env.RAZORPAY_KEY_ID,
      tripTitle: booking.tripSnapshot?.title,
      batchDate: booking.tripSnapshot?.batchDate
    });
  } catch (error) {
    console.error('Pay Remaining Balance Error:', error);
    return sendErrorResponse(res, error, 'Unable to initialize the balance payment order.');
  }
};

// @desc    Verify Razorpay Signature for Remaining Balance and Confirm Booking
// @route   POST /api/bookings/:bookingId/verify-balance
// @access  Private
export const verifyRemainingBalance = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { bookingId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification parameters.' });
    }
    if (!isDbConnected()) return res.status(503).json({ message: 'Payment verification is temporarily unavailable.' });

    // CRITICAL: Verify Razorpay HMAC-SHA256 signature for balance payment
    if (!hasValidRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        console.error('Razorpay balance signature mismatch — potential tampered payment attempt', {
          bookingId,
          razorpay_order_id
        });
        return res.status(400).json({ message: 'Balance payment signature verification failed. Contact support.' });
    }

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (!isBroadBookingStaff(req.user) && String(booking.userId) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to verify this booking payment.' });
    }
    if (String(booking.payment?.pendingBalanceOrderId || '') !== String(razorpay_order_id)) {
      return res.status(400).json({ message: 'Balance payment order does not match this booking.' });
    }
    const existingBalancePayment = (booking.payments || []).find((payment) => payment.type === 'BALANCE');
    if (existingBalancePayment) {
      if (existingBalancePayment.paymentId === razorpay_payment_id) {
        return res.json({ success: true, message: 'Balance payment was already verified.', booking });
      }
      return res.status(409).json({ message: 'This booking already has a verified balance payment.' });
    }

    const finalAmount = Number(booking.pricing?.finalAmount);
    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      return res.status(409).json({ message: 'Booking pricing is unavailable. Contact support before payment.' });
    }
    const outstandingPaid = Number(booking.pricing?.amountOutstanding) || (finalAmount - Number(booking.pricing?.amountPaid || 0));

    booking.pricing.amountPaid = finalAmount;
    booking.pricing.amountOutstanding = 0;
    booking.paymentStatus = 'PAID';
    booking.bookingStatus = 'CONFIRMED';
    booking.payment.status = 'PAID';
    booking.payment.pendingBalanceOrderId = '';
    booking.payment.paidAt = new Date();

    if (!Array.isArray(booking.payments)) booking.payments = [];
    booking.payments.push({
      provider: 'razorpay',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: outstandingPaid,
      type: 'BALANCE',
      verifiedAt: new Date(),
      signature: razorpay_signature
    });

    // Generate Final Scannable QR Code
    const qrPayload = JSON.stringify({
      bookingId: booking.bookingId,
      token: booking.qrCode?.verificationToken || 'token_' + Date.now(),
      trip: booking.tripSnapshot?.title || 'WanderLuxe Departure',
      travelers: booking.numberOfTravelers,
      batchDate: booking.tripSnapshot?.batchDate,
      lead: booking.customer?.name,
      status: 'CONFIRMED'
    });

    try {
      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 2,
        color: { dark: '#0b132b', light: '#ffffff' }
      });
      booking.qrCode.dataUrl = qrDataUrl;
    } catch (qrErr) {}

    // Send updated WhatsApp confirmation
    try {
      await sendWhatsAppTicketAndReceipt(booking);
    } catch (waErr) {}

    await booking.save();
    await recordCouponRedemption(booking);

    res.json({
      success: true,
      message: 'Remaining balance payment verified. Booking is now fully CONFIRMED with unlocked boarding pass.',
      booking
    });
  } catch (error) {
    console.error('Verify Balance Payment Error:', error);
    return sendErrorResponse(res, error, 'Unable to verify the balance payment.');
  }
};

// @desc    Get Authenticated User's Bookings History
// @route   GET /api/bookings/my-bookings
// @access  Private
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!isDbConnected()) return res.status(503).json({ message: 'Booking history is temporarily unavailable.' });
    const bookings = await Booking.find({ userId }).sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    return sendErrorResponse(res, error, 'Unable to fetch user bookings.');
  }
};

// @desc    List quotation-originated bookings visible to Sales staff
// @route   GET /api/bookings/staff/sales
// @access  Private (Sales/Admin)
export const getSalesBookings = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ message: 'Sales booking data is unavailable while the database is disconnected.' });
    }

    const role = getBookingRole(req.user);
    const { search, paymentStatus, bookingStatus, dateFrom, dateTo, page = 1, limit = 100 } = req.query;
    const andConditions = [
      { isCustomQuotationBooking: true },
      { sourceQuotationId: { $ne: null } }
    ];

    if (role === 'sales' && !isBroadBookingStaff(req.user)) {
      const quotationIds = await Quotation.find(getSalesQuotationScope(req.user)).distinct('_id');
      andConditions.push({ sourceQuotationId: { $in: quotationIds } });
    }
    if (paymentStatus && paymentStatus !== 'all') andConditions.push({ paymentStatus });
    if (bookingStatus && bookingStatus !== 'all') andConditions.push({ bookingStatus });
    const createdAt = buildCreatedAtRange(dateFrom, dateTo, 'booking');
    if (createdAt) andConditions.push({ createdAt });
    if (search) {
      const pattern = new RegExp(escapeRegex(search.trim()), 'i');
      andConditions.push({
        $or: [
          { bookingId: pattern },
          { 'customer.name': pattern },
          { 'customer.email': pattern },
          { 'customer.phone': pattern },
          { 'tripSnapshot.title': pattern },
          { 'tripSnapshot.destination': pattern },
          { 'quotationSnapshot.quotationNumber': pattern }
        ]
      });
    }

    const filter = { $and: andConditions };
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(limit) || 100));
    const [total, bookings] = await Promise.all([
      Booking.countDocuments(filter),
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .populate('sourceQuotationId', 'quotationNumber status bookingCode leadId')
        .populate('leadId', 'referenceId name email phone status')
        .lean()
    ]);

    return res.json({
      success: true,
      count: bookings.length,
      total,
      page: pageNumber,
      pages: Math.ceil(total / pageSize),
      bookings
    });
  } catch (error) {
    console.error('Get Sales Bookings Error:', error);
    return sendErrorResponse(res, error, 'Unable to fetch sales bookings.');
  }
};

// @desc    Get Single Booking by Booking ID
// @route   GET /api/bookings/:bookingId
// @access  Private
export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!isDbConnected()) return res.status(503).json({ message: 'Booking data is temporarily unavailable.' });
    const lookup = mongoose.Types.ObjectId.isValid(bookingId)
      ? { $or: [{ _id: bookingId }, { bookingId }] }
      : { bookingId };
    const booking = await Booking.findOne(lookup)
          .populate('sourceQuotationId', 'quotationNumber status bookingCode leadId assignedTo createdBy')
          .populate('leadId', 'referenceId name email phone status')
          .populate('createdBy', 'name email')
          .populate('updatedBy', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (!await canAccessBooking(req.user, booking)) {
      return res.status(403).json({ message: 'Access denied. You do not have permission to view this booking.' });
    }

    res.json(booking);
  } catch (error) {
    return sendErrorResponse(res, error, 'Unable to fetch booking details.');
  }
};

// @desc    Public QR Code Verification Endpoint
// @route   GET /api/bookings/verify/:token
// @access  Public
export const verifyBookingToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!isDbConnected()) return res.status(503).json({ valid: false, message: 'Booking verification is temporarily unavailable.' });
    const booking = await Booking.findOne({ 'qrCode.verificationToken': token });

    if (!booking) {
      return res.status(404).json({ valid: false, message: 'Invalid QR verification token. No booking found.' });
    }

    res.json({
      valid: true,
      bookingId: booking.bookingId,
      tripTitle: booking.tripSnapshot?.title,
      destination: booking.tripSnapshot?.destination,
      duration: booking.tripSnapshot?.duration,
      batchDate: booking.tripSnapshot?.batchDate,
      pickupPoint: booking.tripSnapshot?.pickupPoint,
      numberOfTravelers: booking.numberOfTravelers,
      customerName: booking.customer?.name,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus || booking.payment?.status,
      confirmedAt: booking.payment?.paidAt || booking.updatedAt || new Date()
    });
  } catch (error) {
    return sendErrorResponse(res, error, 'Unable to verify the booking token.', 500, { valid: false });
  }
};

// @desc    Resend WhatsApp E-Ticket and Receipt Notification
// @route   POST /api/bookings/:bookingId/send-whatsapp
// @access  Private
export const resendWhatsAppTicket = async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!isDbConnected()) return res.status(503).json({ message: 'Booking notifications are unavailable while the database is disconnected.' });
    const lookup = mongoose.Types.ObjectId.isValid(bookingId) ? { $or: [{ _id: bookingId }, { bookingId }] } : { bookingId };
    const booking = await Booking.findOne(lookup);

    if (!booking) {
      return res.status(404).json({ message: 'Booking record not found.' });
    }
    if (!await canAccessBooking(req.user, booking)) return res.status(403).json({ message: 'Not authorized to send this booking notification.' });

    const waResult = await sendWhatsAppTicketAndReceipt(booking);
    booking.whatsappNotification = waResult;

    if (isDbConnected() && typeof booking.save === 'function') {
      await booking.save();
    }

    res.json({
      success: true,
      message: 'WhatsApp notification processed successfully.',
      whatsappNotification: waResult
    });
  } catch (error) {
    console.error('Resend WhatsApp Error:', error);
    return sendErrorResponse(res, error, 'Unable to send the WhatsApp notification.');
  }
};

// @desc    Get Authoritative Boarding Pass Document Data (Only for Fully Confirmed Bookings)
// @route   GET /api/bookings/:bookingId/boarding-pass
// @access  Private
export const getBoardingPassData = async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!isDbConnected()) return res.status(503).json({ message: 'Booking documents are unavailable while the database is disconnected.' });
    const lookup = mongoose.Types.ObjectId.isValid(bookingId) ? { $or: [{ _id: bookingId }, { bookingId }] } : { bookingId };
    const booking = await Booking.findOne(lookup);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Authorization check
    if (!await canAccessBooking(req.user, booking)) return res.status(403).json({ message: 'Not authorized to access this boarding pass.' });

    // Strict Gatekeeper: No Boarding Pass until Fully Paid & Confirmed
    if (booking.bookingStatus !== 'CONFIRMED' || booking.paymentStatus !== 'PAID') {
      return res.status(403).json({
        message: 'Official Boarding Pass is locked. Please pay the remaining balance to unlock your boarding pass.',
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        amountOutstanding: booking.pricing?.amountOutstanding || (booking.pricing?.finalAmount - (booking.pricing?.amountPaid || 0))
      });
    }

    // Ensure high-resolution QR code
    let qrDataUrl = booking.qrCode?.dataUrl;
    if (!qrDataUrl && booking.qrCode?.verificationUrl) {
      qrDataUrl = await QRCode.toDataURL(booking.qrCode.verificationUrl, {
        width: 320,
        margin: 1,
        color: { dark: '#041e17', light: '#ffffff' }
      });
    }

    const boardingPass = {
      bookingId: booking.bookingId,
      bookingStatus: booking.bookingStatus,
      confirmedAt: booking.payment?.paidAt || booking.updatedAt || booking.createdAt || new Date(),
      trip: {
        id: booking.tripId,
        title: booking.tripSnapshot?.title || '',
        destination: booking.tripSnapshot?.destination || '',
        duration: booking.tripSnapshot?.duration || '',
        batchDate: booking.tripSnapshot?.batchDate || '',
        pickupPoint: booking.tripSnapshot?.pickupPoint || '',
        image: booking.tripSnapshot?.image || ''
      },
      leadTraveler: {
        name: booking.customer?.name || '',
        email: booking.customer?.email || '',
        phone: booking.customer?.phone || '',
        age: booking.customer?.age || '',
        gender: booking.customer?.gender || ''
      },
      coTravelers: booking.travelers || [],
      numberOfTravelers: booking.numberOfTravelers || 1,
      occupancy: booking.occupancy || 'Double Sharing',
      pricing: {
        totalAmount: Number(booking.pricing?.finalAmount) || 0,
        amountPaid: Number(booking.pricing?.amountPaid ?? booking.pricing?.finalAmount) || 0,
        amountOutstanding: 0,
        discountAmount: booking.pricing?.discount || 0,
        couponCode: booking.pricing?.couponCode || ''
      },
      payment: {
        status: booking.paymentStatus || '',
        method: booking.payment?.provider || '',
        razorpayPaymentId: booking.payment?.razorpayPaymentId || ''
      },
      qrCode: {
        dataUrl: qrDataUrl || '',
        verificationToken: booking.qrCode?.verificationToken || '',
        verificationUrl: booking.qrCode?.verificationUrl || `${process.env.FRONTEND_URL || 'https://wanderluxe.in'}/booking/verify/${booking.qrCode?.verificationToken || booking.bookingId}`
      },
      supportContact: {
        phone: '+91 8542036499',
        email: 'support@wanderluxe.in',
        desk: '24x7 Trip Commander Desk'
      }
    };

    res.json({
      success: true,
      boardingPass
    });
  } catch (error) {
    console.error('Get Boarding Pass Error:', error);
    return sendErrorResponse(res, error, 'Unable to fetch the boarding pass.');
  }
};

// @desc    Get Provisional Booking Letter Data (For Partially Paid Bookings)
// @route   GET /api/bookings/:bookingId/provisional-letter
// @access  Private
export const getProvisionalLetterData = async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!isDbConnected()) return res.status(503).json({ message: 'Booking documents are unavailable while the database is disconnected.' });
    const lookup = mongoose.Types.ObjectId.isValid(bookingId) ? { $or: [{ _id: bookingId }, { bookingId }] } : { bookingId };
    const booking = await Booking.findOne(lookup);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (!await canAccessBooking(req.user, booking)) return res.status(403).json({ message: 'Not authorized to access this booking document.' });

    if (booking.bookingStatus !== 'PROVISIONALLY_CONFIRMED' && booking.paymentStatus !== 'PARTIALLY_PAID') {
      return res.status(403).json({
        message: 'The provisional booking letter is only available for a provisionally confirmed or partially paid booking.',
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus
      });
    }

    const finalAmount = Number(booking.pricing?.finalAmount);
    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      return res.status(409).json({ message: 'Booking pricing is unavailable. Contact support.' });
    }
    const amountPaid = Number(booking.pricing?.amountPaid) || 0;
    const amountOutstanding = booking.pricing?.amountOutstanding !== undefined 
      ? Number(booking.pricing.amountOutstanding) 
      : Math.max(0, finalAmount - amountPaid);

    const provisionalLetter = {
      bookingId: booking.bookingId,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus || '',
      confirmedAt: booking.payment?.paidAt || booking.updatedAt || booking.createdAt || new Date(),
      trip: {
        id: booking.tripId,
        title: booking.tripSnapshot?.title || '',
        destination: booking.tripSnapshot?.destination || '',
        duration: booking.tripSnapshot?.duration || '',
        batchDate: booking.tripSnapshot?.batchDate || '',
        pickupPoint: booking.tripSnapshot?.pickupPoint || '',
        image: booking.tripSnapshot?.image || ''
      },
      leadTraveler: {
        name: booking.customer?.name || '',
        email: booking.customer?.email || '',
        phone: booking.customer?.phone || '',
        age: booking.customer?.age || '',
        gender: booking.customer?.gender || ''
      },
      coTravelers: booking.travelers || [],
      numberOfTravelers: booking.numberOfTravelers || 1,
      occupancy: booking.occupancy || 'Double Sharing',
      totalCost: finalAmount,
      amountPaid,
      amountOutstanding,
      balanceDueDate: booking.pricing?.balanceDueDate,
      depositPercent: booking.paymentPlan?.depositPercent || 10,
      payments: booking.payments || [],
      supportContact: {
        phone: '+91 8542036499',
        email: 'support@wanderluxe.in',
        desk: '24x7 Trip Commander Desk'
      }
    };

    res.json({
      success: true,
      provisionalLetter
    });
  } catch (error) {
    console.error('Get Provisional Letter Error:', error);
    return sendErrorResponse(res, error, 'Unable to fetch the provisional letter.');
  }
};
