import mongoose from 'mongoose';
import Coupon from '../models/Coupon.js';
import { couponDisplayStatus, normalizeCouponCode } from '../services/couponService.js';

const isDbConnected = () => mongoose.connection?.readyState === 1;
const actorMongoId = (req) => req.authContext?.source === 'database' && mongoose.Types.ObjectId.isValid(req.authContext.mongoUserId)
  ? req.authContext.mongoUserId : undefined;
const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const promotionalCouponFilter = { $or: [{ scope: 'promotional' }, { scope: { $exists: false }, influencerId: { $in: ['', null] } }] };
const requireDatabase = (res) => {
  if (isDbConnected()) return true;
  res.status(503).json({ success: false, message: 'Discount administration is unavailable while the database is disconnected.' });
  return false;
};
const serialize = (document) => {
  const coupon = document?.toObject ? document.toObject() : document;
  return { ...coupon, displayStatus: couponDisplayStatus(coupon) };
};

const couponInput = (body, existing = {}) => {
  const discountType = body.discountType || body.type || existing.discountType || 'percentage';
  const discountValue = Number(body.discountValue ?? body.value ?? existing.discountValue);
  const code = normalizeCouponCode(body.code ?? existing.code);
  if (!code) throw Object.assign(new Error('Coupon code is required.'), { status: 400 });
  if (!['percentage', 'flat'].includes(discountType)) throw Object.assign(new Error('Discount type must be percentage or flat.'), { status: 400 });
  if (!Number.isFinite(discountValue) || discountValue <= 0 || (discountType === 'percentage' && discountValue > 100)) {
    throw Object.assign(new Error('Enter a valid discount value.'), { status: 400 });
  }
  const startsAt = body.startsAt === '' ? null : body.startsAt ?? existing.startsAt;
  const endsAt = body.endsAt === '' ? null : body.endsAt ?? body.expiry ?? existing.endsAt;
  if ((startsAt && Number.isNaN(new Date(startsAt).getTime())) || (endsAt && Number.isNaN(new Date(endsAt).getTime()))) throw Object.assign(new Error('Enter valid start and end dates.'), { status: 400 });
  const normalizedStart = startsAt ? new Date(startsAt) : null;
  const normalizedEnd = endsAt ? new Date(endsAt) : null;
  if (normalizedEnd && /^\d{4}-\d{2}-\d{2}$/.test(String(endsAt))) normalizedEnd.setUTCHours(23, 59, 59, 999);
  if (normalizedStart && normalizedEnd && normalizedStart > normalizedEnd) throw Object.assign(new Error('End date must be after the start date.'), { status: 400 });
  const usageLimitValue = body.usageLimit ?? body.maxUses ?? existing.usageLimit;
  const maximumDiscountValue = body.maximumDiscount ?? existing.maximumDiscount;
  const usageLimit = usageLimitValue === '' || usageLimitValue == null ? undefined : Number(usageLimitValue);
  const minimumAmount = Number(body.minimumAmount ?? existing.minimumAmount ?? 0);
  const maximumDiscount = maximumDiscountValue === '' || maximumDiscountValue == null ? undefined : Number(maximumDiscountValue);
  if (!Number.isFinite(minimumAmount) || minimumAmount < 0) throw Object.assign(new Error('Minimum booking amount must be zero or greater.'), { status: 400 });
  if (maximumDiscount !== undefined && (!Number.isFinite(maximumDiscount) || maximumDiscount < 0)) throw Object.assign(new Error('Maximum discount must be zero or greater.'), { status: 400 });
  if (usageLimit !== undefined && (!Number.isInteger(usageLimit) || usageLimit < Number(existing.usageCount || 0))) throw Object.assign(new Error('Usage limit cannot be lower than recorded usage.'), { status: 400 });
  return {
    code,
    scope: 'promotional',
    discountType,
    discountValue,
    minimumAmount,
    maximumDiscount,
    startsAt: normalizedStart,
    endsAt: normalizedEnd,
    expiryDate: normalizedEnd ? normalizedEnd.toISOString().slice(0, 10) : (body.endsAt === '' ? '' : existing.expiryDate),
    usageLimit,
    isActive: body.isActive ?? body.active ?? existing.isActive ?? true,
    status: (body.isActive ?? body.active ?? existing.isActive ?? true) ? 'active' : 'paused'
  };
};

export const getCoupons = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const { search = '', status = 'all', type = 'all', page = 1, limit = 25 } = req.query;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const noEndDate = { $or: [{ endsAt: null }, { endsAt: { $exists: false } }] };
    const activeValidity = { $or: [
      { endsAt: { $gte: now } },
      { $and: [noEndDate, { $or: [{ expiryDate: '' }, { expiryDate: null }, { expiryDate: { $exists: false } }, { expiryDate: { $gte: today } }] }] }
    ] };
    const expiredValidity = { $or: [
      { endsAt: { $lt: now } },
      { $and: [noEndDate, { expiryDate: { $nin: ['', null] } }, { expiryDate: { $lt: today } }] },
      { status: 'expired' }
    ] };
    const filter = { $and: [promotionalCouponFilter] };
    if (search.trim()) filter.code = new RegExp(escapeRegex(search.trim()), 'i');
    if (type !== 'all') filter.discountType = type;
    if (status === 'active') { filter.isActive = { $ne: false }; filter.status = 'active'; filter.$and.push(activeValidity); }
    if (status === 'paused') filter.$or = [{ isActive: false }, { status: 'paused' }];
    if (status === 'expired') filter.$and.push(expiredValidity);
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 25));
    const [coupons, total, active, paused, expired] = await Promise.all([
      Coupon.find(filter).sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize),
      Coupon.countDocuments(filter),
      Coupon.countDocuments({ $and: [promotionalCouponFilter, activeValidity], isActive: { $ne: false }, status: 'active' }),
      Coupon.countDocuments({ $and: [promotionalCouponFilter], $or: [{ isActive: false }, { status: 'paused' }] }),
      Coupon.countDocuments({ $and: [promotionalCouponFilter, expiredValidity] })
    ]);
    res.json({ success: true, coupons: coupons.map(serialize), pagination: { page: pageNumber, limit: pageSize, total, pages: Math.ceil(total / pageSize) }, counts: { total, active, paused, expired } });
  } catch (error) { res.status(500).json({ success: false, message: error.message || 'Unable to load discounts.' }); }
};

export const createCoupon = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const input = couponInput(req.body);
    if (await Coupon.exists({ code: input.code })) return res.status(409).json({ success: false, message: 'Coupon code already exists.' });
    const coupon = await Coupon.create({ ...input, createdBy: actorMongoId(req), updatedBy: actorMongoId(req) });
    res.status(201).json({ success: true, coupon: serialize(coupon) });
  } catch (error) { res.status(error.status || 500).json({ success: false, message: error.message || 'Unable to create discount.' }); }
};

export const updateCoupon = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    const coupon = await Coupon.findOne({ _id: req.params.id, ...promotionalCouponFilter });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    const input = couponInput(req.body, coupon.toObject());
    if (await Coupon.exists({ code: input.code, _id: { $ne: coupon._id } })) return res.status(409).json({ success: false, message: 'Coupon code already exists.' });
    Object.assign(coupon, input, { updatedBy: actorMongoId(req) });
    await coupon.save();
    res.json({ success: true, coupon: serialize(coupon) });
  } catch (error) { res.status(error.status || 500).json({ success: false, message: error.message || 'Unable to update discount.' }); }
};

export const toggleCoupon = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const coupon = mongoose.Types.ObjectId.isValid(req.params.id) ? await Coupon.findOne({ _id: req.params.id, ...promotionalCouponFilter }) : null;
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    const currentlyActive = coupon.isActive !== false && coupon.status === 'active';
    coupon.isActive = !currentlyActive;
    coupon.status = coupon.isActive ? 'active' : 'paused';
    coupon.updatedBy = actorMongoId(req);
    await coupon.save();
    res.json({ success: true, coupon: serialize(coupon) });
  } catch (error) { res.status(500).json({ success: false, message: error.message || 'Unable to change discount status.' }); }
};

export const deleteCoupon = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const coupon = mongoose.Types.ObjectId.isValid(req.params.id) ? await Coupon.findOne({ _id: req.params.id, ...promotionalCouponFilter }) : null;
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    if (Number(coupon.usageCount || 0) > 0 || Number(coupon.totalRedemptions || 0) > 0) return res.status(409).json({ success: false, message: 'Used coupons cannot be deleted. Pause this coupon instead.' });
    await coupon.deleteOne();
    res.json({ success: true, id: coupon._id, message: 'Coupon deleted.' });
  } catch (error) { res.status(500).json({ success: false, message: error.message || 'Unable to delete discount.' }); }
};
