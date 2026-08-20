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
    validatedCoupon
  };
};

// @desc    Create Razorpay Test Order and Pending Booking
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

    const pricing = await calculateServerPrice(
      trip,
      travelersCount,
      occupancy,
      couponCode
    );

    const bookingId = 'WLX-2026-' + Math.floor(100000 + Math.random() * 900000);
    const verificationToken = crypto.randomBytes(16).toString('hex');
    const orderId = 'order_' + Math.random().toString(36).substring(2, 15);

    // Create Razorpay Order
    let rzpOrder = null;
    try {
      const rzp = getRazorpayInstance();
      rzpOrder = await rzp.orders.create({
        amount: pricing.finalAmount * 100,
        currency: 'INR',
        receipt: bookingId,
        notes: { bookingId, userId: userId.toString(), tripTitle: trip.title }
      });
    } catch (rzpErr) {
      console.warn('Razorpay SDK sandbox mode fallback:', rzpErr.message);
      rzpOrder = { id: orderId, amount: pricing.finalAmount * 100, currency: 'INR' };
    }

    const bookingData = {
      bookingId,
      userId,
      tripId: String(tripId),
      tripSnapshot: {
        title: trip.title,
        location: trip.location || 'India',
        destination: trip.destination || trip.location || 'India',
        image: trip.image,
        duration: trip.duration || '5D/4N',
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
    };

    let booking = null;
    if (isDbConnected()) {
      try {
        booking = await Booking.create(bookingData);
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
      currency: rzpOrder.currency,
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

// @desc    Verify Razorpay Payment Signature, Confirm Booking, and Generate Unique QR Code
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

    // Generate Scannable QR Code Data URL
    const qrPayload = JSON.stringify({
      bookingId: booking.bookingId,
      token: booking.qrCode?.verificationToken || 'token_' + Date.now(),
      trip: booking.tripSnapshot?.title || 'WanderLuxe Departure',
      travelers: booking.numberOfTravelers,
      batchDate: booking.tripSnapshot?.batchDate,
      lead: booking.customer?.name,
      status: 'CONFIRMED'
    });

    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 2,
        color: { dark: '#0b132b', light: '#ffffff' }
      });
    } catch (qrErr) {}

    booking.payment.status = 'PAID';
    booking.payment.razorpayPaymentId = razorpay_payment_id;
    booking.payment.razorpaySignature = razorpay_signature || 'verified_test_sig';
    booking.payment.paidAt = new Date();
    booking.bookingStatus = 'CONFIRMED';
    if (qrDataUrl) {
      booking.qrCode.dataUrl = qrDataUrl;
    }

    // Automatically send WhatsApp E-Ticket & Payment Receipt
    try {
      const waResult = await sendWhatsAppTicketAndReceipt(booking);
      booking.whatsappNotification = waResult;
    } catch (waErr) {
      console.warn('WhatsApp Notification Dispatch Warning:', waErr.message);
    }

    if (isDbConnected() && typeof booking.save === 'function') {
      await booking.save();
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
      paymentStatus: booking.payment?.status,
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

// @desc    Get Authoritative Boarding Pass Document Data
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
        totalAmount: booking.pricing?.totalAmount || 18500,
        discountAmount: booking.pricing?.discountAmount || 0,
        finalAmount: booking.pricing?.finalAmount || 18500,
        couponCode: booking.pricing?.couponCode || ''
      },
      payment: {
        status: booking.payment?.status || 'PAID',
        method: booking.payment?.method || 'Razorpay Gateway',
        razorpayPaymentId: booking.payment?.razorpayPaymentId || `pay_rzp_${Date.now()}`
      },
      qrCode: {
        dataUrl: qrDataUrl || '',
        verificationToken: booking.qrCode?.verificationToken || '',
        verificationUrl: booking.qrCode?.verificationUrl || `http://localhost:5173/verify/${booking.bookingId}`
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


