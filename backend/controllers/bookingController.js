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
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay Test Mode credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are missing in environment variables.');
  }

  return new Razorpay({ key_id, key_secret });
};

// Helper: Authoritative Server-Side Price Calculation
const calculateServerPrice = async (trip, travelersCount, occupancy, couponCode) => {
  const count = Math.max(1, parseInt(travelersCount, 10) || 1);
  const basePerPerson = Number(trip.price) || 18500;
  
  let occupancyDiff = 0;
  if (occupancy === 'Single Sharing') occupancyDiff = 3500;
  else if (occupancy === 'Triple Sharing') occupancyDiff = -1500;

  const effectivePerPerson = Math.max(1000, basePerPerson + occupancyDiff);
  const subtotal = effectivePerPerson * count;

  let discount = 0;
  let validatedCoupon = null;

  if (couponCode && couponCode.trim()) {
    const code = couponCode.trim().toUpperCase();
    if (code === 'GOA-KR7X9P' || code === 'GAURAV15' || code === 'EARLYBIRD15') {
      discount = Math.round(subtotal * 0.15);
      validatedCoupon = { code, discountValue: 15, discountType: 'percentage', influencerId: 'usr_influencer' };
    } else if (code === 'MEGH-X82P9A' || code === 'WANDER10' || code === 'EXPLOREWITHGAURAV') {
      discount = Math.round(subtotal * 0.10);
      validatedCoupon = { code, discountValue: 10, discountType: 'percentage', influencerId: 'usr_influencer' };
    } else if (code === 'SUMMER500') {
      discount = 500;
      validatedCoupon = { code, discountValue: 500, discountType: 'flat', influencerId: 'usr_influencer' };
    } else {
      const dbCoupon = await Coupon.findOne({ code, status: 'active' });
      if (dbCoupon) {
        discount = dbCoupon.discountType === 'percentage'
          ? Math.round(subtotal * (dbCoupon.discountValue / 100))
          : dbCoupon.discountValue;
        validatedCoupon = dbCoupon;
      }
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
    validatedCoupon
  };
};

// @desc    Create Razorpay Test Order and Pending Booking in MongoDB
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
      batchDate,
      occupancy,
      pickupPoint,
      leadTraveler,
      coTravelers,
      couponCode
    } = req.body;

    if (!tripId) {
      return res.status(400).json({ message: 'Trip ID is required for booking.' });
    }

    // 1. Fetch trip from DB or Static Catalog
    let trip = null;
    try {
      trip = await Trip.findById(tripId);
    } catch (e) {
      // Ignored if tripId is not a MongoDB ObjectId
    }

    if (!trip) {
      trip = await Trip.findOne({ slug: String(tripId).toLowerCase() });
    }

    if (!trip && STATIC_TRIPS_CATALOG[String(tripId)]) {
      trip = STATIC_TRIPS_CATALOG[String(tripId)];
    }

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or no longer available for booking.' });
    }

    // 2. Authoritative Server-Side Pricing Calculation
    const pricing = await calculateServerPrice(
      trip,
      travelersCount,
      occupancy,
      couponCode
    );

    // 3. Generate Unique Human-Friendly Booking ID & Verification Token
    const bookingId = 'WLX-2026-' + Math.floor(100000 + Math.random() * 900000);
    const verificationToken = crypto.randomBytes(16).toString('hex');

    // 4. Create Razorpay Test Order
    const rzp = getRazorpayInstance();
    const rzpOrder = await rzp.orders.create({
      amount: pricing.finalAmount * 100, // in paise
      currency: 'INR',
      receipt: bookingId,
      notes: {
        bookingId,
        userId: userId.toString(),
        tripTitle: trip.title,
        travelersCount: String(pricing.count)
      }
    });

    console.log(`[RAZORPAY ORDER CREATED] Order ID: ${rzpOrder.id} for Booking ${bookingId}, Amount: ₹${pricing.finalAmount}`);

    // 5. Create Pending Booking Record in MongoDB
    const booking = await Booking.create({
      bookingId,
      userId,
      tripId: String(tripId),
      tripSnapshot: {
        title: trip.title,
        location: trip.location || 'India',
        destination: trip.destination || trip.location || 'India',
        image: trip.image,
        duration: trip.duration,
        batchDate: batchDate || '15 Sep - 20 Sep 2026',
        pickupPoint: pickupPoint || 'Main Arrival Meeting Hub'
      },
      customer: {
        name: leadTraveler?.name || req.user.name,
        email: leadTraveler?.email || req.user.email,
        phone: leadTraveler?.phone || req.user.phone || '',
        age: leadTraveler?.age || '',
        gender: leadTraveler?.gender || 'Male'
      },
      travelers: coTravelers || [],
      numberOfTravelers: pricing.count,
      occupancy: occupancy || 'Double Sharing',
      pricing: {
        basePricePerPerson: pricing.basePricePerPerson,
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        couponCode: couponCode ? couponCode.trim().toUpperCase() : '',
        taxes: 0,
        finalAmount: pricing.finalAmount,
        currency: 'INR'
      },
      payment: {
        provider: 'razorpay',
        status: 'PENDING',
        razorpayOrderId: rzpOrder.id
      },
      bookingStatus: 'PENDING_PAYMENT',
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
    });

    res.status(201).json({
      success: true,
      bookingId: booking.bookingId,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      customer: booking.customer,
      pricing: booking.pricing,
      tripSnapshot: booking.tripSnapshot
    });
  } catch (error) {
    console.error('Create Booking Order Error:', error);
    res.status(500).json({ message: error.message || 'Server Error creating payment order' });
  }
};

// @desc    Verify Razorpay Payment Signature, Confirm Booking, and Generate Unique QR Code
// @route   POST /api/bookings/verify-payment
// @access  Private
export const verifyBookingPayment = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing required payment verification parameters.' });
    }

    // 1. Fetch Booking from MongoDB
    const booking = await Booking.findOne({ bookingId, userId });
    if (!booking) {
      return res.status(404).json({ message: 'Booking record not found or access denied.' });
    }

    // 2. Idempotency Check: If already confirmed, safely return confirmed booking
    if (booking.bookingStatus === 'CONFIRMED' && booking.payment.status === 'PAID') {
      return res.json({
        success: true,
        message: 'Booking was already confirmed.',
        booking
      });
    }

    // 3. Verify that the Razorpay Order ID matches the booking
    if (booking.payment.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: 'Order mismatch: Razorpay Order ID does not match this booking.' });
    }

    // 4. Server-Side Cryptographic Signature Verification (HMAC-SHA256)
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const bodyToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyToSign)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error(`[PAYMENT VERIFICATION FAILED] Signature mismatch for Booking ${bookingId}`);
      booking.payment.status = 'FAILED';
      booking.bookingStatus = 'FAILED';
      await booking.save();
      return res.status(400).json({ message: 'Invalid payment signature. Payment verification failed.' });
    }

    console.log(`[PAYMENT VERIFIED SUCCESS] Booking ${bookingId} verified with Payment ID: ${razorpay_payment_id}`);

    // 5. Generate Unique Scannable QR Code Data URL
    const qrPayload = JSON.stringify({
      bookingId: booking.bookingId,
      token: booking.qrCode.verificationToken,
      trip: booking.tripSnapshot.title,
      travelers: booking.numberOfTravelers,
      batchDate: booking.tripSnapshot.batchDate,
      lead: booking.customer.name,
      status: 'CONFIRMED'
    });

    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0b132b',
          light: '#ffffff'
        }
      });
    } catch (qrErr) {
      console.warn('QR generation error (non-fatal):', qrErr.message);
    }

    // 6. Update MongoDB Booking State to CONFIRMED and Payment to PAID
    booking.payment.status = 'PAID';
    booking.payment.razorpayPaymentId = razorpay_payment_id;
    booking.payment.razorpaySignature = razorpay_signature;
    booking.payment.paidAt = new Date();
    booking.bookingStatus = 'CONFIRMED';
    if (qrDataUrl) {
      booking.qrCode.dataUrl = qrDataUrl;
    }
    await booking.save();

    // 7. Save Booking Snapshot to User Profile
    const user = await User.findById(userId);
    if (user) {
      user.bookedTrips = user.bookedTrips || [];
      const alreadyInUser = user.bookedTrips.some(
        (b) => b.id === booking.bookingId || b.bookingId === booking.bookingId
      );

      if (!alreadyInUser) {
        user.bookedTrips.unshift({
          id: booking.bookingId,
          bookingId: booking.bookingId,
          tripTitle: booking.tripSnapshot.title,
          destination: booking.tripSnapshot.destination,
          image: booking.tripSnapshot.image,
          duration: booking.tripSnapshot.duration,
          travelDate: booking.tripSnapshot.batchDate,
          travelers: booking.numberOfTravelers,
          amount: booking.pricing.finalAmount,
          status: 'Confirmed',
          bookingDate: new Date().toISOString().split('T')[0],
          qrCode: qrDataUrl
        });
        await user.save();
      }
    }

    // 8. Record Influencer Commission Ledger Entry if Coupon Applied
    if (booking.influencerAttribution?.couponCode) {
      try {
        await Commission.create({
          bookingId: booking.bookingId,
          influencerId: booking.influencerAttribution.influencerId || 'usr_influencer',
          couponCode: booking.influencerAttribution.couponCode,
          baseAmount: booking.pricing.subtotal,
          amount: booking.influencerAttribution.commissionAmount,
          status: 'CONFIRMED'
        });

        await WalletLedger.create({
          influencerId: booking.influencerAttribution.influencerId || 'usr_influencer',
          bookingId: booking.bookingId,
          type: 'COMMISSION_CONFIRMED',
          amount: booking.influencerAttribution.commissionAmount,
          status: 'Settled',
          reference: `Verified Booking ${booking.bookingId} (${booking.tripSnapshot.title})`
        });
      } catch (ledgerErr) {
        console.warn('Ledger recording error (non-fatal):', ledgerErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Payment verified and booking confirmed successfully.',
      booking
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ message: error.message || 'Server Error verifying payment' });
  }
};

// @desc    Get Authenticated User's Bookings History from MongoDB
// @route   GET /api/bookings/my-bookings
// @access  Private
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const bookings = await Booking.find({ userId }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error fetching user bookings' });
  }
};

// @desc    Get Single Booking by Booking ID (Protected - Owner or Admin only)
// @route   GET /api/bookings/:bookingId
// @access  Private
export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?._id;

    const query = [{ bookingId }];
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      query.push({ _id: bookingId });
    }

    const booking = await Booking.findOne({ $or: query });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Access Control: Only owner or admin can view details
    const isOwner = booking.userId && booking.userId.toString() === userId.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to view this booking.' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error fetching booking details' });
  }
};

// @desc    Public QR Code Verification Endpoint (Safe Summary, No Secrets)
// @route   GET /api/bookings/verify/:token
// @access  Public
export const verifyBookingToken = async (req, res) => {
  try {
    const { token } = req.params;

    const booking = await Booking.findOne({ 'qrCode.verificationToken': token });

    if (!booking) {
      return res.status(404).json({ valid: false, message: 'Invalid QR verification token. No booking found.' });
    }

    res.json({
      valid: true,
      bookingId: booking.bookingId,
      tripTitle: booking.tripSnapshot.title,
      destination: booking.tripSnapshot.destination,
      duration: booking.tripSnapshot.duration,
      batchDate: booking.tripSnapshot.batchDate,
      pickupPoint: booking.tripSnapshot.pickupPoint,
      numberOfTravelers: booking.numberOfTravelers,
      customerName: booking.customer.name,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.payment.status,
      confirmedAt: booking.payment.paidAt || booking.updatedAt
    });
  } catch (error) {
    res.status(500).json({ valid: false, message: error.message || 'Server Error verifying token' });
  }
};
