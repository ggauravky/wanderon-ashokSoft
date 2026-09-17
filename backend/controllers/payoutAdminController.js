import mongoose from 'mongoose';
import Payout from '../models/Payout.js';
import User from '../models/User.js';

const isDbConnected = () => mongoose.connection?.readyState === 1;
const actorMongoId = (req) => req.authContext?.source === 'database' && mongoose.Types.ObjectId.isValid(req.authContext.mongoUserId)
  ? req.authContext.mongoUserId : undefined;
const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const requireDatabase = (res) => {
  if (isDbConnected()) return true;
  res.status(503).json({ success: false, message: 'Payout administration is unavailable while the database is disconnected.' });
  return false;
};
const populatePayout = (query) => query
  .populate('creatorUserId', 'name email phone influencerStatus isActive')
  .populate('approvedBy', 'name email')
  .populate('processedBy', 'name email')
  .populate('rejectedBy', 'name email')
  .populate('createdBy', 'name email');
const statusLabel = (status) => ({ REQUESTED: 'Pending', UNDER_REVIEW: 'Approved', PROCESSING: 'Processed', PAID: 'Paid', FAILED: 'Failed', CANCELLED: 'Rejected' }[status] || status);
const serialize = (document) => {
  const payout = document?.toObject ? document.toObject() : document;
  return { ...payout, displayStatus: statusLabel(payout.status) };
};

export const getEligiblePayoutCreators = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const creators = await User.find({ role: 'influencer', influencerStatus: 'approved', isActive: { $ne: false } })
      .select('_id name email phone').sort({ name: 1 }).limit(500);
    res.json({ success: true, creators });
  } catch (error) { res.status(500).json({ success: false, message: error.message || 'Unable to load creators.' }); }
};

export const getPayouts = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const { search = '', status = 'all', creatorId, from, to, page = 1, limit = 25 } = req.query;
    const conditions = [];
    if (search.trim()) {
      const pattern = new RegExp(escapeRegex(search.trim()), 'i');
      conditions.push({ $or: [{ reference: pattern }, { providerReference: pattern }, { influencerName: pattern }, { influencerEmail: pattern }] });
    }
    if (status !== 'all') {
      if (!Payout.schema.path('status').enumValues.includes(status)) return res.status(400).json({ success: false, message: 'Unsupported payout status filter.' });
      conditions.push({ status });
    }
    if (creatorId) {
      if (!mongoose.Types.ObjectId.isValid(creatorId)) return res.status(400).json({ success: false, message: 'Invalid creator filter.' });
      conditions.push({ creatorUserId: creatorId });
    }
    if (from || to) {
      const start = from ? new Date(from) : new Date(0);
      const end = to ? new Date(to) : new Date();
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return res.status(400).json({ success: false, message: 'Enter a valid payout date range.' });
      end.setHours(23, 59, 59, 999);
      conditions.push({ $or: [
        { periodStart: { $gte: start, $lte: end } },
        { periodEnd: { $gte: start, $lte: end } },
        { periodStart: { $lte: start }, periodEnd: { $gte: end } },
        { periodStart: null, periodEnd: null, createdAt: { $gte: start, $lte: end } }
      ] });
    }
    const filter = conditions.length ? { $and: conditions } : {};
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 25));
    const [payouts, total, counts] = await Promise.all([
      populatePayout(Payout.find(filter).sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize)),
      Payout.countDocuments(filter),
      Payout.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }])
    ]);
    res.json({ success: true, payouts: payouts.map(serialize), pagination: { page: pageNumber, limit: pageSize, total, pages: Math.ceil(total / pageSize) }, counts: Object.fromEntries(counts.map((row) => [row._id, { count: row.count, amount: row.amount }])) });
  } catch (error) { res.status(500).json({ success: false, message: error.message || 'Unable to load payouts.' }); }
};

export const getPayoutById = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const payout = mongoose.Types.ObjectId.isValid(req.params.id) ? await populatePayout(Payout.findById(req.params.id)) : null;
    if (!payout) return res.status(404).json({ success: false, message: 'Payout not found.' });
    res.json({ success: true, payout: serialize(payout) });
  } catch (error) { res.status(500).json({ success: false, message: error.message || 'Unable to load payout.' }); }
};

export const createPayout = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const { creatorUserId, amount, currency = 'INR', destination = 'Manual settlement', periodStart, periodEnd, notes = '' } = req.body;
    if (!mongoose.Types.ObjectId.isValid(creatorUserId)) return res.status(400).json({ success: false, message: 'Select an approved creator.' });
    const creator = await User.findOne({ _id: creatorUserId, role: 'influencer', influencerStatus: 'approved', isActive: { $ne: false } });
    if (!creator) return res.status(409).json({ success: false, message: 'Only active, approved creators are eligible for payouts.' });
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return res.status(400).json({ success: false, message: 'Enter a payout amount greater than zero.' });
    if ((periodStart && Number.isNaN(new Date(periodStart).getTime())) || (periodEnd && Number.isNaN(new Date(periodEnd).getTime()))) return res.status(400).json({ success: false, message: 'Enter a valid payout period.' });
    if (periodStart && periodEnd && new Date(periodStart) > new Date(periodEnd)) return res.status(400).json({ success: false, message: 'Period end must be after period start.' });
    const reference = `PAY-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${new mongoose.Types.ObjectId().toString().slice(-6).toUpperCase()}`;
    const payout = await Payout.create({
      creatorUserId: creator._id, influencerId: String(creator._id), influencerName: creator.name, influencerEmail: creator.email,
      amount: value, currency, destination: String(destination || 'Manual settlement').trim(), periodStart: periodStart || undefined,
      periodEnd: periodEnd || undefined, notes: String(notes || '').trim(), reference, providerReference: reference,
      status: 'REQUESTED', requestedAt: new Date(), createdBy: actorMongoId(req)
    });
    const populated = await populatePayout(Payout.findById(payout._id));
    res.status(201).json({ success: true, payout: serialize(populated) });
  } catch (error) { res.status(500).json({ success: false, message: error.message || 'Unable to create payout.' }); }
};

export const updatePayoutStatus = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const payout = mongoose.Types.ObjectId.isValid(req.params.id) ? await Payout.findById(req.params.id) : null;
    if (!payout) return res.status(404).json({ success: false, message: 'Payout not found.' });
    const action = String(req.body.action || '').toLowerCase();
    const actor = actorMongoId(req);
    const now = new Date();
    const unchanged = (expected) => payout.status === expected;
    if (action === 'approve') {
      if (unchanged('UNDER_REVIEW')) return res.json({ success: true, unchanged: true, payout: serialize(await populatePayout(Payout.findById(payout._id))) });
      if (payout.status !== 'REQUESTED') return res.status(409).json({ success: false, message: 'Only pending payouts can be approved.' });
      payout.status = 'UNDER_REVIEW'; payout.approvedAt = now; payout.approvedBy = actor;
    } else if (action === 'process') {
      if (unchanged('PROCESSING')) return res.json({ success: true, unchanged: true, payout: serialize(await populatePayout(Payout.findById(payout._id))) });
      if (payout.status !== 'UNDER_REVIEW') return res.status(409).json({ success: false, message: 'Approve the payout before marking it processed.' });
      payout.status = 'PROCESSING'; payout.processedAt = now; payout.processedBy = actor;
    } else if (action === 'reject') {
      if (unchanged('CANCELLED')) return res.json({ success: true, unchanged: true, payout: serialize(await populatePayout(Payout.findById(payout._id))) });
      if (!['REQUESTED', 'UNDER_REVIEW'].includes(payout.status)) return res.status(409).json({ success: false, message: 'This payout can no longer be rejected.' });
      const reason = String(req.body.reason || '').trim();
      if (!reason) return res.status(400).json({ success: false, message: 'A rejection reason is required.' });
      payout.status = 'CANCELLED'; payout.rejectedAt = now; payout.rejectedBy = actor; payout.rejectionReason = reason;
    } else return res.status(400).json({ success: false, message: 'Unsupported payout action.' });
    await payout.save();
    const populated = await populatePayout(Payout.findById(payout._id));
    res.json({ success: true, payout: serialize(populated) });
  } catch (error) { res.status(500).json({ success: false, message: error.message || 'Unable to update payout.' }); }
};
