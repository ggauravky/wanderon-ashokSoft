import mongoose from 'mongoose';
import Coupon from '../models/Coupon.js';
import Commission from '../models/Commission.js';
import WalletLedger from '../models/WalletLedger.js';
import Payout from '../models/Payout.js';

const isDbConnected = () => mongoose.connection?.readyState === 1;
const requireDatabase = (res) => {
  if (isDbConnected()) return true;
  res.status(503).json({ success: false, message: 'Creator finance data is unavailable while the database is disconnected.' });
  return false;
};
const creatorId = (req) => req.authContext?.source === 'database' && mongoose.Types.ObjectId.isValid(req.authContext.mongoUserId)
  ? String(req.authContext.mongoUserId) : null;
const ensureApprovedCreator = (req, res) => {
  const id = creatorId(req);
  if (!id || req.user?.role !== 'influencer' || req.user?.influencerStatus !== 'approved' || req.user?.isActive === false) {
    res.status(403).json({ success: false, message: 'An active, approved creator account is required.' });
    return null;
  }
  return id;
};

export const getEligiblePlans = async (req, res) => {
  if (!requireDatabase(res)) return;
  res.json({ success: true, plans: [], message: 'Creator plan eligibility has not been configured.' });
};

export const generateCoupon = async (req, res) => {
  if (!requireDatabase(res)) return;
  if (!ensureApprovedCreator(req, res)) return;
  res.status(409).json({ success: false, message: 'Self-service coupon creation is unavailable until plan eligibility is configured by an administrator.' });
};

export const getInfluencerCoupons = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const id = ensureApprovedCreator(req, res);
    if (!id) return;
    const coupons = await Coupon.find({ $or: [{ creatorUserId: id }, { influencerId: id }] }).sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) { res.status(500).json({ success: false, message: error.message || 'Unable to load coupons.' }); }
};

const getBalances = async (id) => {
  const [commissionRows, payoutRows] = await Promise.all([
    Commission.aggregate([{ $match: { influencerId: id } }, { $group: { _id: '$status', amount: { $sum: '$amount' } } }]),
    Payout.aggregate([{ $match: { influencerId: id } }, { $group: { _id: '$status', amount: { $sum: '$amount' } } }])
  ]);
  const commissions = Object.fromEntries(commissionRows.map((row) => [row._id, row.amount]));
  const payouts = Object.fromEntries(payoutRows.map((row) => [row._id, row.amount]));
  const reserved = Number(payouts.REQUESTED || 0) + Number(payouts.UNDER_REVIEW || 0) + Number(payouts.PROCESSING || 0);
  return {
    pendingBalance: Number(commissions.PENDING || 0) + Number(commissions.APPROVED || 0),
    availableBalance: Math.max(0, Number(commissions.AVAILABLE || 0) - reserved),
    totalWithdrawn: Number(commissions.PAID || 0),
    reservedBalance: reserved,
    minPayoutThreshold: 1000
  };
};

export const getWalletSummary = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const id = ensureApprovedCreator(req, res);
    if (!id) return;
    res.json({ success: true, wallet: await getBalances(id) });
  } catch (error) { res.status(500).json({ success: false, message: error.message || 'Unable to load wallet.' }); }
};

export const getWalletTransactions = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const id = ensureApprovedCreator(req, res);
    if (!id) return;
    const transactions = await WalletLedger.find({ influencerId: id }).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, transactions });
  } catch (error) { res.status(500).json({ success: false, message: error.message || 'Unable to load transactions.' }); }
};

export const getInfluencerPayouts = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const id = ensureApprovedCreator(req, res);
    if (!id) return;
    const payouts = await Payout.find({ influencerId: id }).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, payouts });
  } catch (error) { res.status(500).json({ success: false, message: error.message || 'Unable to load payouts.' }); }
};

export const requestPayout = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const id = ensureApprovedCreator(req, res);
    if (!id) return;
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount < 1000) return res.status(400).json({ success: false, message: 'Minimum payout threshold is ₹1,000.' });
    const balances = await getBalances(id);
    if (amount > balances.availableBalance) return res.status(409).json({ success: false, message: 'Payout amount exceeds the available commission balance.' });
    const reference = `PAY-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${new mongoose.Types.ObjectId().toString().slice(-6).toUpperCase()}`;
    const payout = await Payout.create({
      creatorUserId: id, influencerId: id, influencerName: req.user.name, influencerEmail: req.user.email,
      amount, currency: 'INR', destination: String(req.body.destination || 'Manual settlement').trim(), status: 'REQUESTED',
      reference, providerReference: reference, requestedAt: new Date(), createdBy: id
    });
    await WalletLedger.create({ influencerId: id, payoutId: String(payout._id), type: 'PAYOUT_REQUESTED', amount: -amount, status: 'REQUESTED', reference });
    res.status(201).json({ success: true, payout });
  } catch (error) { res.status(500).json({ success: false, message: error.message || 'Unable to request payout.' }); }
};

export const getAnalytics = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const id = ensureApprovedCreator(req, res);
    if (!id) return;
    const coupons = await Coupon.find({ $or: [{ creatorUserId: id }, { influencerId: id }] });
    const totals = coupons.reduce((acc, coupon) => ({
      redemptions: acc.redemptions + Number(coupon.totalRedemptions || coupon.usageCount || 0),
      grossSales: acc.grossSales + Number(coupon.revenueGenerated || 0),
      totalCommission: acc.totalCommission + Number(coupon.commissionEarned || 0)
    }), { redemptions: 0, grossSales: 0, totalCommission: 0 });
    res.json({ success: true, analytics: { ...totals, activeCoupons: coupons.filter((coupon) => coupon.status === 'active' && coupon.isActive !== false).length } });
  } catch (error) { res.status(500).json({ success: false, message: error.message || 'Unable to load analytics.' }); }
};
