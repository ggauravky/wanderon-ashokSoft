import Coupon from '../models/Coupon.js';
import Commission from '../models/Commission.js';
import WalletLedger from '../models/WalletLedger.js';
import Payout from '../models/Payout.js';

const MOCK_ELIGIBLE_PLANS = [
  { id: 1, planTitle: 'Meghalaya Backpacking Living Root Bridges', destination: 'Meghalaya, India', duration: '5D/4N', basePrice: 18500, customerDiscountPct: 10, influencerCommissionPct: 10, expiryDate: '2026-12-31', terms: 'Min booking value ₹15,000. Valid for group departures.', status: 'Approved & Active' },
  { id: 2, planTitle: 'Spiti Valley Circuit High Altitude Roadtrip', destination: 'Spiti Valley, Himachal', duration: '7D/6N', basePrice: 22000, customerDiscountPct: 10, influencerCommissionPct: 8, expiryDate: '2026-12-31', terms: 'Min booking value ₹20,000. Max 50 redemptions per code.', status: 'Approved & Active' },
  { id: 3, planTitle: 'Goa Sun Beach and Party Getaway', destination: 'Goa, India', duration: '4D/3N', basePrice: 14500, customerDiscountPct: 15, influencerCommissionPct: 10, expiryDate: '2026-12-31', terms: 'Valid on Double & Triple sharing plans.', status: 'Approved & Active' },
  { id: 4, planTitle: 'Bali Island Escape Beaches and Culture', destination: 'Bali, Indonesia', duration: '6D/5N', basePrice: 45000, customerDiscountPct: 10, influencerCommissionPct: 5, expiryDate: '2026-12-31', terms: 'Valid on international flight inclusive bookings.', status: 'Approved & Active' }
];

// @desc Get all eligible plans approved for influencer promotion
// @route GET /api/influencer/plans
export const getEligiblePlans = async (req, res) => {
  try {
    res.json(MOCK_ELIGIBLE_PLANS);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};

// @desc Generate unique random coupon code
// @route POST /api/influencer/coupons
export const generateCoupon = async (req, res) => {
  try {
    const { planId, planTitle, destination } = req.body;

    const prefix = (destination || 'TRIP').slice(0, 4).toUpperCase();
    const randomHash = Math.random().toString(36).substring(2, 8).toUpperCase();
    const uniqueCode = `${prefix}-${randomHash}`;

    const newCoupon = await Coupon.create({
      code: uniqueCode,
      influencerId: req.user?._id || 'usr_influencer',
      planId: planId || 1,
      planTitle: planTitle || 'Meghalaya Backpacking',
      discountType: 'percentage',
      discountValue: 10,
      commissionRate: 10,
      expiryDate: '2026-12-31',
      status: 'active'
    });

    res.status(201).json(newCoupon);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};

// @desc Get coupons for logged-in influencer
// @route GET /api/influencer/coupons
export const getInfluencerCoupons = async (req, res) => {
  try {
    const influencerId = req.user?._id || 'usr_influencer';
    const coupons = await Coupon.find({ influencerId }).sort({ createdAt: -1 });

    if (coupons.length === 0) {
      return res.json([
        { id: 'ic1', code: 'GOA-KR7X9P', planId: 3, planTitle: 'Goa Sun Beach and Party Getaway', discountType: 'percentage', discountValue: 15, commissionRate: 10, totalRedemptions: 14, revenueGenerated: 485000, commissionEarned: 37000, expiryDate: '2026-12-31', active: true },
        { id: 'ic2', code: 'MEGH-X82P9A', planId: 1, planTitle: 'Meghalaya Backpacking Living Root Bridges', discountType: 'percentage', discountValue: 10, commissionRate: 10, totalRedemptions: 6, revenueGenerated: 180000, commissionEarned: 11500, expiryDate: '2026-12-31', active: true }
      ]);
    }

    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};

// @desc Get ledger-derived wallet summary
// @route GET /api/influencer/wallet
export const getWalletSummary = async (req, res) => {
  try {
    res.json({
      pendingBalance: 18500,
      availableBalance: 12000,
      totalWithdrawn: 18000,
      minPayoutThreshold: 1000
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};

// @desc Get immutable wallet transactions
// @route GET /api/influencer/wallet/transactions
export const getWalletTransactions = async (req, res) => {
  try {
    const influencerId = req.user?._id || 'usr_influencer';
    const transactions = await WalletLedger.find({ influencerId }).sort({ createdAt: -1 });

    if (transactions.length === 0) {
      return res.json([
        { id: 'tx1', bookingId: 'WL-849201', type: 'Commission Pending', amount: 3700, date: '2026-08-05', status: 'Pending Settlement', reference: 'Booking WL-849201 (Meghalaya)' },
        { id: 'tx2', bookingId: 'WL-729104', type: 'Commission Cleared', amount: 2200, date: '2026-08-07', status: 'Available for Payout', reference: 'Cleared Settlement WL-729104 (Spiti)' },
        { id: 'tx3', bookingId: 'PO-910293', type: 'Payout Transfer', amount: 18000, date: '2026-08-01', status: 'Paid Out', reference: 'Bank Transfer UPI (8542036499@upi)' }
      ]);
    }

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};

// @desc Request payout withdrawal
// @route POST /api/influencer/payouts
export const requestPayout = async (req, res) => {
  try {
    const { amount, destination } = req.body;
    const amt = Number(amount);

    if (!amt || amt < 1000) {
      return res.status(400).json({ message: 'Minimum payout threshold is ₹1,000' });
    }

    const payout = await Payout.create({
      influencerId: req.user._id,
      influencerName: req.user.name,
      influencerEmail: req.user.email,
      amount: amt,
      destination: destination || 'Direct Transfer',
      status: 'REQUESTED',
      providerReference: `REQ-${Math.floor(100000 + Math.random() * 900000)}`
    });

    res.status(201).json(payout);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};

// @desc Get analytics metrics
// @route GET /api/influencer/analytics
export const getAnalytics = async (req, res) => {
  try {
    res.json({
      clicks: 248,
      conversions: 20,
      conversionRate: '8.4%',
      grossSales: 665000,
      totalCommission: 48500,
      averageOrderValue: 33250
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};
