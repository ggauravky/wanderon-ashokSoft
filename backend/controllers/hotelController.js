import mongoose from 'mongoose';
import Hotel from '../models/Hotel.js';
import { escapeSearch, hotelSalesDto, normalizeHotelInput, normalizedHotelName, validateHotelActivation } from '../services/hotelCatalogService.js';

const admin = (user) => ['admin', 'super_admin'].includes(user?.role);
const respondError = (res, error) => {
  if (error?.code === 11000) return res.status(409).json({ success: false, message: 'Hotel code already exists. Please retry.' });
  if (error?.name === 'VersionError') return res.status(409).json({ success: false, message: 'This hotel was changed by another editor. Reload and try again.' });
  if (error?.name === 'ValidationError') return res.status(422).json({ success: false, message: Object.values(error.errors || {}).map((item) => item.message).join(' ') });
  console.error('Hotel Catalog Error:', error);
  return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Unable to complete hotel catalog request.' });
};
const requireDatabase = (res) => {
  if (mongoose.connection.readyState === 1) return true;
  res.status(503).json({ success: false, message: 'Hotel catalog is temporarily unavailable.' });
  return false;
};
const validId = (res, id) => {
  if (mongoose.isValidObjectId(id)) return true;
  res.status(404).json({ success: false, message: 'Hotel not found.' });
  return false;
};
const duplicateQuery = (item, exceptId) => ({
  normalizedName: normalizedHotelName(item.name),
  'location.city': new RegExp(`^${escapeSearch(item.location?.city)}$`, 'i'),
  'location.country': new RegExp(`^${escapeSearch(item.location?.country)}$`, 'i'),
  status: { $ne: 'ARCHIVED' },
  ...(exceptId ? { _id: { $ne: exceptId } } : {})
});

export const listHotels = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const isAdmin = admin(req.user);
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const query = { ...(isAdmin ? {} : { status: 'ACTIVE' }) };
    if (isAdmin && req.query.status && req.query.status !== 'ALL') query.status = String(req.query.status);
    if (req.query.propertyType) query.propertyType = String(req.query.propertyType);
    if (req.query.starRating !== undefined && req.query.starRating !== '') query.starRating = Number(req.query.starRating);
    if (req.query.city) query['location.city'] = new RegExp(escapeSearch(req.query.city), 'i');
    if (req.query.search) {
      const regex = new RegExp(escapeSearch(req.query.search), 'i');
      query.$or = [{ name: regex }, { aliases: regex }, { 'location.city': regex }, { 'location.state': regex }, { tags: regex }, { hotelCode: regex }];
    }
    const [items, total, statuses] = await Promise.all([
      Hotel.find(query).sort({ name: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Hotel.countDocuments(query),
      isAdmin ? Hotel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]) : Promise.resolve([])
    ]);
    res.json({ success: true, data: isAdmin ? items : items.map(hotelSalesDto), pagination: { page, limit, total, pages: Math.ceil(total / limit) }, facets: isAdmin ? { statuses: Object.fromEntries(statuses.map((item) => [item._id, item.count])) } : undefined });
  } catch (error) { respondError(res, error); }
};

export const getHotel = async (req, res) => {
  try {
    if (!requireDatabase(res) || !validId(res, req.params.id)) return;
    const item = await Hotel.findById(req.params.id).lean();
    if (!item || (!admin(req.user) && item.status !== 'ACTIVE')) return res.status(404).json({ success: false, message: 'Hotel not found.' });
    res.json({ success: true, data: admin(req.user) ? item : hotelSalesDto(item) });
  } catch (error) { respondError(res, error); }
};

export const createHotel = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const actorId = req.user._id;
    const input = await normalizeHotelInput(req.body || {}, { actorId });
    const item = new Hotel({ ...input, status: 'DRAFT', createdBy: actorId });
    if (await Hotel.exists(duplicateQuery(item))) return res.status(409).json({ success: false, message: 'A hotel with this name and location already exists.' });
    await item.save();
    return res.status(201).json({ success: true, data: item });
  } catch (error) { return respondError(res, error); }
};

export const updateHotel = async (req, res) => {
  try {
    if (!requireDatabase(res) || !validId(res, req.params.id)) return;
    const item = await Hotel.findById(req.params.id).select('+normalizedName');
    if (!item) return res.status(404).json({ success: false, message: 'Hotel not found.' });
    if (item.status === 'ARCHIVED') return res.status(409).json({ success: false, message: 'Archived hotels cannot be edited.' });
    if (Number(req.body?.catalogVersion) !== item.catalogVersion) return res.status(409).json({ success: false, message: 'This hotel has changed. Reload before editing.' });
    const input = await normalizeHotelInput(req.body || {}, { existing: item, actorId: req.user._id });
    item.set(input);
    if (await Hotel.exists(duplicateQuery(item, item._id))) return res.status(409).json({ success: false, message: 'A hotel with this name and location already exists.' });
    if (item.status === 'ACTIVE') {
      const problems = validateHotelActivation(item);
      if (problems.length) return res.status(422).json({ success: false, message: problems.join(' ') });
    }
    item.catalogVersion += 1;
    await item.save();
    return res.json({ success: true, data: item });
  } catch (error) { return respondError(res, error); }
};

export const setHotelStatus = async (req, res) => {
  try {
    if (!requireDatabase(res) || !validId(res, req.params.id)) return;
    const status = String(req.body?.status || '');
    if (!['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(status)) return res.status(422).json({ success: false, message: 'Invalid hotel status.' });
    const item = await Hotel.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Hotel not found.' });
    if (item.status === 'ARCHIVED') return res.status(409).json({ success: false, message: 'Archived hotels cannot be reactivated.' });
    if (Number(req.body?.catalogVersion) !== item.catalogVersion) return res.status(409).json({ success: false, message: 'This hotel has changed. Reload before changing status.' });
    if (item.status === status) return res.json({ success: true, data: item });
    if (status === 'ACTIVE') {
      const problems = validateHotelActivation(item);
      if (problems.length) return res.status(422).json({ success: false, message: problems.join(' ') });
    }
    item.status = status;
    item.catalogVersion += 1;
    item.updatedBy = req.user._id;
    await item.save();
    return res.json({ success: true, data: item });
  } catch (error) { return respondError(res, error); }
};
