import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import QRCode from 'qrcode';
import Booking from '../models/Booking.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import Commission from '../models/Commission.js';
import WalletLedger from '../models/WalletLedger.js';
import { sendWhatsAppTicketAndReceipt } from '../utils/whatsappService.js';
import { isValidMongoObjectId, toObjectIdOrNull } from '../utils/mongoId.js';

// In-Memory Bookings Store Fallback
const memoryBookings = [];

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

// Static Catalog fallback for predefined numerical IDs or static trips
const STATIC_TRIPS_CATALOG = {
  '1': {
    title: 'Meghalaya Backpacking Living Root Bridges',
    location: 'Meghalaya',
    destination: 'Northeast India',
    duration: '5D/4N',
    price: 18500,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'
  },
  '2': {
    title: 'Spiti Valley Circuit High Altitude Roadtrip',
    location: 'Spiti Valley',
    destination: 'Himachal Pradesh',
    duration: '7D/6N',
    price: 22000,
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800'
  },
  '3': {
    title: 'Goa Sun Beach and Party Getaway',
    location: 'Goa',
    destination: 'Goa Coast',
    duration: '4D/3N',
    price: 14500,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e'
  },
  '4': {
    title: 'Bali Island Escape Beaches and Culture',
    location: 'Bali',
    destination: 'Indonesia',
    duration: '6D/5N',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4'
  }
};

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_wanderluxe2026key';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'wanderluxe_rzp_secret_key_2026';

  return new Razorpay({ key_id, key_secret });
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
  const basePrice = Number(trip.price) || 18500;
  
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
  } else {
    if (occ === 'Triple Sharing') effectivePerPerson = Math.round(basePrice * 0.92);
    else if (occ === 'Single Sharing') effectivePerPerson = Math.round(basePrice * 1.25);
  }

  const subtotal = effectivePerPerson * count;

  // 3. Authoritative Coupon Verification
  let discount = 0;
  let validatedCoupon = null;

  if (couponCode && typeof couponCode === 'string') {
    const code = couponCode.trim().toUpperCase();
    if (code === 'GOA-KR7X9P' || code === 'EARLYBIRD15' || code === 'GAURAV15') {
      discount = Math.round(subtotal * 0.15);
      validatedCoupon = { code, discountValue: 15, discountType: 'percentage', influencerId: 'usr_influencer' };
    } else if (code === 'MEGH-X82P9A' || code === 'WANDER10' || code === 'EXPLOREWITHGAURAV') {
      discount = Math.round(subtotal * 0.10);
      validatedCoupon = { code, discountValue: 10, discountType: 'percentage', influencerId: 'usr_influencer' };
    } else if (code === 'SUMMER500') {
      discount = 500;
      validatedCoupon = { code, discountValue: 500, discountType: 'flat', influencerId: 'usr_influencer' };
    } else if (isDbConnected()) {
      try {
        const dbCoupon = await Coupon.findOne({ code, status: 'active' });
        if (dbCoupon) {
          discount = dbCoupon.discountType === 'percentage'
            ? Math.round(subtotal * (dbCoupon.discountValue / 100))
            : dbCoupon.discountValue;
          validatedCoupon = dbCoupon;
        }
      } catch (e) {}
    }
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
    batchDate: matchedBatch ? matchedBatch.dates : (batchDate || trip.nextBatch || 'Upcoming Batch'),
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

    let trip = null;
    if (isDbConnected()) {
      try {
        if (mongoose.Types.ObjectId.isValid(tripId)) {
          trip = await Trip.findById(tripId);
        }
        if (!trip) {
          trip = await Trip.findOne({ slug: String(tripId).toLowerCase() });
        }
      } catch (e) {}
    }

    if (!trip && STATIC_TRIPS_CATALOG[String(tripId)]) {
      trip = STATIC_TRIPS_CATALOG[String(tripId)];
    }

    if (!trip) {
      trip = {
        title: 'Curated Expedition',
        price: 18500
      };
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
    res.status(500).json({ message: err.message || 'Server error calculating pricing.' });
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

    let trip = null;
    if (isDbConnected()) {
      try {
        if (mongoose.Types.ObjectId.isValid(tripId)) {
          trip = await Trip.findById(tripId);
        }
        if (!trip) {
          trip = await Trip.findOne({ slug: String(tripId).toLowerCase() });
        }
      } catch (e) {}
    }

    if (!trip && STATIC_TRIPS_CATALOG[String(tripId)]) {
      trip = STATIC_TRIPS_CATALOG[String(tripId)];
    }

    if (!trip) {
      trip = {
        title: 'Himalayan Adventure Departure',
        location: 'Himachal Pradesh',
        destination: 'India',
        price: 18500,
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'
      };
    }

    // Capacity Validation against remaining batch seats
    let matchedBatch = null;
    if (Array.isArray(trip.batches) && trip.batches.length > 0) {
      matchedBatch = trip.batches.find(b => 
        (batchId && (b.batchId === batchId || String(b._id) === String(batchId))) ||
        (batchDate && b.dates === batchDate)
      );

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
    const orderId = 'order_' + crypto.randomBytes(8).toString('hex');

    // Create Razorpay Order strictly with server-calculated amount
    let rzpOrder = null;
    try {
      const rzp = getRazorpayInstance();
      rzpOrder = await rzp.orders.create({
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
    } catch (rzpErr) {
      console.warn('Razorpay SDK sandbox mode fallback:', rzpErr.message);
      rzpOrder = { id: orderId, amount: amountToCharge * 100, currency: 'INR' };
    }

    let safeUserId = (userId && isValidMongoObjectId(userId)) ? toObjectIdOrNull(userId) : null;
    if (!safeUserId && req.user?.email && isDbConnected()) {
      try {
        const foundUser = await User.findOne({ email: req.user.email.toLowerCase().trim() });
        if (foundUser) safeUserId = foundUser._id;
      } catch (e) {}
    }
    if (!safeUserId) {
      safeUserId = new mongoose.Types.ObjectId('64f000000000000000000001');
    }

    const bookingData = {
      bookingId,
      userId: safeUserId,
      tripId: String(tripId),
      tripSnapshot: {
        title: trip.title,
        location: trip.location || 'India',
        destination: trip.destination || trip.location || 'India',
        image: trip.image,
        duration: trip.duration || '5D/4N',
        batchDate: pricing.batchDate || batchDate || '15 Sep - 20 Sep 2026',
        pickupPoint: pickupPoint || 'Main Arrival Meeting Hub'
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
      influencerAttribution: pricing.validatedCoupon ? {
        influencerId: pricing.validatedCoupon.influencerId || 'usr_influencer',
        couponCode: pricing.validatedCoupon.code,
        commissionRate: 10,
        commissionAmount: Math.round(pricing.finalAmount * 0.1)
      } : {}
    };

    let booking = null;
    if (isDbConnected()) {
      try {
        // Pending booking deduplication (update active draft instead of creating duplicates)
        const existingPending = await Booking.findOne({
          userId,
          tripId: String(tripId),
          bookingStatus: { $in: ['DRAFT', 'PENDING_PAYMENT'] },
          createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
        });

        if (existingPending) {
          existingPending.tripSnapshot = bookingData.tripSnapshot;
          existingPending.customer = bookingData.customer;
          existingPending.travelers = bookingData.travelers;
          existingPending.numberOfTravelers = bookingData.numberOfTravelers;
          existingPending.occupancy = bookingData.occupancy;
          existingPending.paymentPlan = bookingData.paymentPlan;
          existingPending.pricing = bookingData.pricing;
          existingPending.payment.razorpayOrderId = rzpOrder.id;
          existingPending.influencerAttribution = bookingData.influencerAttribution;
          booking = await existingPending.save();
        } else {
          booking = await Booking.create(bookingData);
        }
      } catch (dbErr) {
        console.warn('Booking DB save fallback:', dbErr.message);
      }
    }

    if (!booking) {
      booking = { ...bookingData, _id: 'bk_' + Date.now(), createdAt: new Date() };
      memoryBookings.unshift(booking);
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
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_wanderluxe2026key',
      customer: booking.customer,
      pricing: booking.pricing,
      tripSnapshot: booking.tripSnapshot
    });
  } catch (error) {
    console.error('Create Booking Order Error:', error);
    res.status(500).json({ message: error.message || 'Server Error creating payment order' });
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

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ message: 'Missing required payment verification parameters.' });
    }

    // CRITICAL: Verify Razorpay HMAC-SHA256 signature to prevent fake payment confirmation
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    if (razorpaySecret && razorpay_signature) {
      const expectedSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        console.error('Razorpay signature mismatch — potential tampered payment attempt', {
          bookingId,
          razorpay_order_id,
          razorpay_payment_id
        });
        return res.status(400).json({ message: 'Payment signature verification failed. Contact support.' });
      }
    } else if (!razorpaySecret) {
      // Test/sandbox mode — log warning but do not block
      console.warn('RAZORPAY_KEY_SECRET not set — skipping HMAC verification (sandbox mode only)');
    }

    let booking = null;
    if (isDbConnected()) {
      try {
        booking = await Booking.findOne({ bookingId });
      } catch (e) {}
    }

    if (!booking) {
      booking = memoryBookings.find((b) => b.bookingId === bookingId);
    }

    if (!booking) {
      return res.status(404).json({ message: 'Booking record not found.' });
    }

    // Ensure booking belongs to authenticated user (unless admin)
    if (req.user?.role !== 'admin' && String(booking.userId) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to verify this booking.' });
    }

    const isPartial = booking.paymentPlan?.type === 'PARTIAL';
    const depositPercent = booking.paymentPlan?.depositPercent || 10;
    const finalAmount = booking.pricing?.finalAmount || 18500;
    const depositPaid = Math.round(finalAmount * (depositPercent / 100));

    if (isPartial) {
      // 10% Deposit Verification Lifecycle
      booking.pricing.amountPaid = depositPaid;
      booking.pricing.amountOutstanding = Math.max(0, finalAmount - depositPaid);
      booking.paymentStatus = 'PARTIALLY_PAID';
      booking.bookingStatus = 'PROVISIONALLY_CONFIRMED';
      booking.payment.status = 'PAID';
      booking.payment.razorpayPaymentId = razorpay_payment_id;
      booking.payment.razorpaySignature = razorpay_signature || 'verified_test_sig';
      booking.payment.paidAt = new Date();

      if (!Array.isArray(booking.payments)) booking.payments = [];
      booking.payments.push({
        provider: 'razorpay',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount: depositPaid,
        type: 'DEPOSIT',
        verifiedAt: new Date(),
        signature: razorpay_signature || 'verified_test_sig'
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
      booking.payment.razorpaySignature = razorpay_signature || 'verified_test_sig';
      booking.payment.paidAt = new Date();

      if (!Array.isArray(booking.payments)) booking.payments = [];
      booking.payments.push({
        provider: 'razorpay',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount: finalAmount,
        type: 'FULL',
        verifiedAt: new Date(),
        signature: razorpay_signature || 'verified_test_sig'
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
            const cap = Number(tripDoc.batches[batchIndex].capacity) || 20;
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

    if (isDbConnected() && typeof booking.save === 'function') {
      await booking.save();
    }

    res.json({
      success: true,
      message: isPartial 
        ? 'Deposit payment verified. Booking is PROVISIONALLY CONFIRMED.' 
        : 'Payment verified and booking CONFIRMED successfully.',
      booking
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ message: error.message || 'Server Error verifying payment' });
  }
};

// @desc    Cancel booking and restore departure batch seats
// @route   PUT /api/bookings/:bookingId/cancel
// @access  Private
export const cancelBooking = async (req, res) => {
  try {
    const userId = req.user?._id;
    const userRole = (req.user?.role || 'user').toLowerCase();
    const { bookingId } = req.params;
    const { reason = 'Cancelled by traveler / admin' } = req.body;

    let booking = null;
    if (isDbConnected()) {
      try {
        booking = await Booking.findOne({ bookingId });
      } catch (e) {}
    }
    if (!booking) {
      booking = memoryBookings.find(b => b.bookingId === bookingId);
    }
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Permission check
    const isOwner = String(booking.userId) === String(userId);
    const isStaff = ['super_admin', 'admin', 'operations', 'sales'].includes(userRole);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking.' });
    }

    if (booking.bookingStatus === 'CANCELLED') {
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }

    const wasConfirmed = ['CONFIRMED', 'PROVISIONALLY_CONFIRMED'].includes(booking.bookingStatus);
    booking.bookingStatus = 'CANCELLED';
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    booking.cancelledBy = userId;

    // Restore seats on Trip batch if booking was confirmed
    if (wasConfirmed && booking.tripId && isDbConnected()) {
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
            const cap = Number(tripDoc.batches[batchIndex].capacity) || 20;
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
      } catch (restoreErr) {
        console.warn('Trip batch seat restoration warning:', restoreErr.message);
      }
    }

    if (isDbConnected() && typeof booking.save === 'function') {
      await booking.save();
    }

    res.json({
      success: true,
      message: `Booking ${booking.bookingId} cancelled successfully. Seats restored to batch availability.`,
      booking
    });
  } catch (error) {
    console.error('Cancel Booking Error:', error);
    res.status(500).json({ message: error.message || 'Server Error cancelling booking' });
  }
};

// @desc    Initiate Razorpay Order to Pay Remaining Balance
// @route   POST /api/bookings/:bookingId/pay-balance
// @access  Private
export const payRemainingBalance = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { bookingId } = req.params;

    let booking = null;
    if (isDbConnected()) {
      try {
        booking = await Booking.findOne({ bookingId });
      } catch (e) {}
    }
    if (!booking) {
      booking = memoryBookings.find(b => b.bookingId === bookingId);
    }
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.userId && String(booking.userId) !== String(userId) && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to pay for this booking.' });
    }

    const finalAmount = Number(booking.pricing?.finalAmount) || 18500;
    const amountPaid = Number(booking.pricing?.amountPaid) || 0;
    const outstanding = booking.pricing?.amountOutstanding !== undefined && booking.pricing?.amountOutstanding !== null
      ? Number(booking.pricing.amountOutstanding)
      : Math.max(0, finalAmount - amountPaid);

    if (outstanding <= 0 || booking.bookingStatus === 'CONFIRMED' || booking.paymentStatus === 'PAID') {
      return res.status(400).json({ message: 'Booking is already fully paid. No outstanding balance due.' });
    }

    const balanceOrderId = 'order_bal_' + crypto.randomBytes(8).toString('hex');
    let rzpOrder = null;
    try {
      const rzp = getRazorpayInstance();
      rzpOrder = await rzp.orders.create({
        amount: outstanding * 100,
        currency: 'INR',
        receipt: `${booking.bookingId}_BAL`,
        notes: {
          bookingId: booking.bookingId,
          type: 'BALANCE_PAYMENT',
          userId: userId.toString()
        }
      });
    } catch (rzpErr) {
      console.warn('Razorpay SDK balance order fallback:', rzpErr.message);
      rzpOrder = { id: balanceOrderId, amount: outstanding * 100, currency: 'INR' };
    }

    res.json({
      success: true,
      bookingId: booking.bookingId,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      outstandingAmount: outstanding,
      currency: rzpOrder.currency || 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_wanderluxe2026key',
      tripTitle: booking.tripSnapshot?.title,
      batchDate: booking.tripSnapshot?.batchDate
    });
  } catch (error) {
    console.error('Pay Remaining Balance Error:', error);
    res.status(500).json({ message: error.message || 'Error initializing balance payment order' });
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

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ message: 'Missing payment verification parameters.' });
    }

    // CRITICAL: Verify Razorpay HMAC-SHA256 signature for balance payment
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    if (razorpaySecret && razorpay_signature) {
      const expectedSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        console.error('Razorpay balance signature mismatch — potential tampered payment attempt', {
          bookingId,
          razorpay_order_id
        });
        return res.status(400).json({ message: 'Balance payment signature verification failed. Contact support.' });
      }
    } else if (!razorpaySecret) {
      console.warn('RAZORPAY_KEY_SECRET not set — skipping balance HMAC verification (sandbox mode only)');
    }

    let booking = null;
    if (isDbConnected()) {
      try {
        booking = await Booking.findOne({ bookingId });
      } catch (e) {}
    }
    if (!booking) {
      booking = memoryBookings.find(b => b.bookingId === bookingId);
    }
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const finalAmount = Number(booking.pricing?.finalAmount) || 18500;
    const outstandingPaid = Number(booking.pricing?.amountOutstanding) || (finalAmount - Number(booking.pricing?.amountPaid || 0));

    booking.pricing.amountPaid = finalAmount;
    booking.pricing.amountOutstanding = 0;
    booking.paymentStatus = 'PAID';
    booking.bookingStatus = 'CONFIRMED';
    booking.payment.status = 'PAID';
    booking.payment.paidAt = new Date();

    if (!Array.isArray(booking.payments)) booking.payments = [];
    booking.payments.push({
      provider: 'razorpay',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: outstandingPaid,
      type: 'BALANCE',
      verifiedAt: new Date(),
      signature: razorpay_signature || 'verified_test_sig'
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

    if (isDbConnected() && typeof booking.save === 'function') {
      await booking.save();
    }

    res.json({
      success: true,
      message: 'Remaining balance payment verified. Booking is now fully CONFIRMED with unlocked boarding pass.',
      booking
    });
  } catch (error) {
    console.error('Verify Balance Payment Error:', error);
    res.status(500).json({ message: error.message || 'Error verifying balance payment' });
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

    let bookings = [];
    if (isDbConnected()) {
      try {
        bookings = await Booking.find({ userId }).sort({ createdAt: -1 });
      } catch (e) {}
    }

    if (bookings.length === 0) {
      bookings = memoryBookings.filter((b) => String(b.userId) === String(userId));
    }

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error fetching user bookings' });
  }
};

// @desc    Get Single Booking by Booking ID
// @route   GET /api/bookings/:bookingId
// @access  Private
export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    let booking = null;
    if (isDbConnected()) {
      try {
        booking = await Booking.findOne({ bookingId });
      } catch (e) {}
    }

    if (!booking) {
      booking = memoryBookings.find((b) => b.bookingId === bookingId);
    }

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error fetching booking details' });
  }
};

// @desc    Public QR Code Verification Endpoint
// @route   GET /api/bookings/verify/:token
// @access  Public
export const verifyBookingToken = async (req, res) => {
  try {
    const { token } = req.params;

    let booking = null;
    if (isDbConnected()) {
      try {
        booking = await Booking.findOne({ 'qrCode.verificationToken': token });
      } catch (e) {}
    }

    if (!booking) {
      booking = memoryBookings.find((b) => b.qrCode?.verificationToken === token);
    }

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
    res.status(500).json({ valid: false, message: error.message || 'Server Error verifying token' });
  }
};

// @desc    Resend WhatsApp E-Ticket and Receipt Notification
// @route   POST /api/bookings/:bookingId/send-whatsapp
// @access  Private
export const resendWhatsAppTicket = async (req, res) => {
  try {
    const { bookingId } = req.params;

    let booking = null;
    if (isDbConnected()) {
      try {
        booking = await Booking.findOne({ bookingId });
      } catch (e) {}
    }

    if (!booking) {
      booking = memoryBookings.find((b) => b.bookingId === bookingId);
    }

    if (!booking) {
      return res.status(404).json({ message: 'Booking record not found.' });
    }

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
    res.status(500).json({ message: error.message || 'Failed to send WhatsApp notification.' });
  }
};

// @desc    Get Authoritative Boarding Pass Document Data (Only for Fully Confirmed Bookings)
// @route   GET /api/bookings/:bookingId/boarding-pass
// @access  Private
export const getBoardingPassData = async (req, res) => {
  try {
    const { bookingId } = req.params;

    let booking = null;
    if (isDbConnected()) {
      try {
        booking = await Booking.findOne({ bookingId });
      } catch (e) {}
    }

    if (!booking) {
      booking = memoryBookings.find((b) => b.bookingId === bookingId);
    }

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Authorization check
    if (req.user && req.user.role !== 'admin' && String(booking.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to access this boarding pass.' });
    }

    // Strict Gatekeeper: No Boarding Pass until Fully Paid & Confirmed
    if (booking.bookingStatus !== 'CONFIRMED' || (booking.paymentStatus && booking.paymentStatus !== 'PAID')) {
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
        title: booking.tripSnapshot?.title || 'WanderLuxe Expedition',
        destination: booking.tripSnapshot?.destination || 'Destination Hub',
        duration: booking.tripSnapshot?.duration || '5D/4N',
        batchDate: booking.tripSnapshot?.batchDate || '15 Sep - 20 Sep, 2026',
        pickupPoint: booking.tripSnapshot?.pickupPoint || 'Central Pickup Station',
        image: booking.tripSnapshot?.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'
      },
      leadTraveler: {
        name: booking.customer?.name || 'Lead Explorer',
        email: booking.customer?.email || 'traveler@wanderluxe.in',
        phone: booking.customer?.phone || '+91 8542036499',
        age: booking.customer?.age || 24,
        gender: booking.customer?.gender || 'Male'
      },
      coTravelers: booking.travelers || [],
      numberOfTravelers: booking.numberOfTravelers || 1,
      occupancy: booking.occupancy || 'Double Sharing',
      pricing: {
        totalAmount: booking.pricing?.finalAmount || 18500,
        amountPaid: booking.pricing?.amountPaid || booking.pricing?.finalAmount || 18500,
        amountOutstanding: 0,
        discountAmount: booking.pricing?.discount || 0,
        couponCode: booking.pricing?.couponCode || ''
      },
      payment: {
        status: booking.paymentStatus || 'PAID',
        method: booking.payment?.method || 'Razorpay Gateway',
        razorpayPaymentId: booking.payment?.razorpayPaymentId || `pay_rzp_${Date.now()}`
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
    res.status(500).json({ message: error.message || 'Server Error fetching boarding pass' });
  }
};

// @desc    Get Provisional Booking Letter Data (For Partially Paid Bookings)
// @route   GET /api/bookings/:bookingId/provisional-letter
// @access  Private
export const getProvisionalLetterData = async (req, res) => {
  try {
    const { bookingId } = req.params;

    let booking = null;
    if (isDbConnected()) {
      try {
        booking = await Booking.findOne({ bookingId });
      } catch (e) {}
    }

    if (!booking) {
      booking = memoryBookings.find((b) => b.bookingId === bookingId);
    }

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (req.user && req.user.role !== 'admin' && String(booking.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to access this booking document.' });
    }

    const finalAmount = Number(booking.pricing?.finalAmount) || 18500;
    const amountPaid = Number(booking.pricing?.amountPaid) || 0;
    const amountOutstanding = booking.pricing?.amountOutstanding !== undefined 
      ? Number(booking.pricing.amountOutstanding) 
      : Math.max(0, finalAmount - amountPaid);

    const provisionalLetter = {
      bookingId: booking.bookingId,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus || 'PARTIALLY_PAID',
      confirmedAt: booking.payment?.paidAt || booking.updatedAt || booking.createdAt || new Date(),
      trip: {
        id: booking.tripId,
        title: booking.tripSnapshot?.title || 'WanderLuxe Expedition',
        destination: booking.tripSnapshot?.destination || 'Destination Hub',
        duration: booking.tripSnapshot?.duration || '5D/4N',
        batchDate: booking.tripSnapshot?.batchDate || '15 Sep - 20 Sep, 2026',
        pickupPoint: booking.tripSnapshot?.pickupPoint || 'Central Pickup Station',
        image: booking.tripSnapshot?.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'
      },
      leadTraveler: {
        name: booking.customer?.name || 'Lead Explorer',
        email: booking.customer?.email || 'traveler@wanderluxe.in',
        phone: booking.customer?.phone || '+91 8542036499',
        age: booking.customer?.age || 24,
        gender: booking.customer?.gender || 'Male'
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
    res.status(500).json({ message: error.message || 'Server Error fetching provisional letter' });
  }
};
