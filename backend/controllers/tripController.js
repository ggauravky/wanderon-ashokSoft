import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import Trip from '../models/Trip.js';
import Booking from '../models/Booking.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDbConnected = () => mongoose.connection?.readyState === 1;
const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeSlug = (value) => String(value || '').toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

const getStaticKnowledgeTrips = () => {
  for (const filename of ['trips.json', 'travelKnowledge.json']) {
    try {
      const parsed = JSON.parse(fs.readFileSync(path.join(__dirname, `../data/${filename}`), 'utf8'));
      const trips = Array.isArray(parsed) ? parsed : parsed?.trips;
      if (Array.isArray(trips)) return trips;
    } catch {
      // Explicit seeding can legitimately have no source file.
    }
  }
  return [];
};

const databaseUnavailable = (res) => res.status(503).json({
  success: false,
  message: 'Trip catalog is temporarily unavailable.'
});

const numberOrUndefined = (value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const stringArray = (value) => Array.isArray(value)
  ? value.map((item) => String(item || '').trim()).filter(Boolean)
  : [];

const normalizeBatches = (incoming, current = []) => {
  const currentByIdentity = new Map();
  current.forEach((batch) => {
    if (batch?._id) currentByIdentity.set(String(batch._id), batch);
    if (batch?.batchId) currentByIdentity.set(String(batch.batchId), batch);
  });
  const retained = new Set();

  const batches = (Array.isArray(incoming) ? incoming : []).map((batch, index) => {
    const existing = currentByIdentity.get(String(batch?._id || ''))
      || currentByIdentity.get(String(batch?.batchId || ''));
    if (existing?._id) retained.add(String(existing._id));
    if (existing?.batchId) retained.add(String(existing.batchId));

    const capacity = numberOrUndefined(batch?.capacity);
    if (!Number.isFinite(capacity) || capacity < 0) {
      throw new Error(`Departure ${index + 1}: capacity must be a non-negative number.`);
    }
    const bookedSeats = Number(existing?.bookedSeats || 0);
    if (capacity < bookedSeats) {
      throw new Error(`Departure ${index + 1}: capacity cannot be lower than ${bookedSeats} booked seats.`);
    }
    const dates = String(batch?.dates || '').trim();
    if (!dates) throw new Error(`Departure ${index + 1}: date label is required.`);

    const pricing = {};
    for (const key of ['tripleSharing', 'doubleSharing', 'singleSharing']) {
      const value = numberOrUndefined(batch?.pricing?.[key]);
      if (Number.isNaN(value) || (value !== undefined && value < 0)) {
        throw new Error(`Departure ${index + 1}: ${key} price must be non-negative.`);
      }
      if (value !== undefined) pricing[key] = value;
    }

    return {
      ...(existing?._id ? { _id: existing._id } : {}),
      batchId: existing?.batchId || String(batch?.batchId || '').trim() || `DEP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      startDate: batch?.startDate || undefined,
      endDate: batch?.endDate || undefined,
      dates,
      capacity,
      bookedSeats,
      status: bookedSeats >= capacity
        ? 'sold_out'
        : (['available', 'filling_fast'].includes(batch?.status) ? batch.status : 'available'),
      pricing,
      bookingAmount: numberOrUndefined(batch?.bookingAmount),
      totalAmount: numberOrUndefined(batch?.totalAmount)
    };
  });

  const protectedRemoval = current.find((batch) => Number(batch?.bookedSeats || 0) > 0
    && !retained.has(String(batch?._id)) && !retained.has(String(batch?.batchId)));
  if (protectedRemoval) {
    throw new Error(`Departure ${protectedRemoval.dates || protectedRemoval.batchId} has booked seats and cannot be removed.`);
  }
  return batches;
};

const buildTripPayload = (body, currentTrip = null) => {
  const payload = {};
  const stringFields = [
    'title', 'location', 'destination', 'region', 'duration', 'currency', 'image', 'heroImage',
    'category', 'mood', 'difficulty', 'groupType', 'nextBatch', 'shortDescription', 'overview'
  ];
  stringFields.forEach((field) => {
    if (body[field] !== undefined) payload[field] = String(body[field] || '').trim();
  });
  if (body.slug !== undefined || body.title !== undefined) payload.slug = normalizeSlug(body.slug || body.title);

  for (const field of ['days', 'nights', 'price', 'originalPrice', 'discount', 'capacity']) {
    if (body[field] === undefined) continue;
    const value = numberOrUndefined(body[field]);
    if (Number.isNaN(value) || (value !== undefined && value < 0)) throw new Error(`${field} must be a non-negative number.`);
    payload[field] = value;
  }
  const price = payload.price ?? currentTrip?.price;
  const originalPrice = payload.originalPrice ?? currentTrip?.originalPrice;
  if (originalPrice !== undefined && originalPrice !== null && Number(originalPrice) < Number(price || 0)) {
    throw new Error('Original price cannot be lower than the base price.');
  }

  for (const field of ['gallery', 'tags', 'bestMonths', 'pickupPoints', 'inclusions', 'exclusions']) {
    if (body[field] !== undefined) payload[field] = stringArray(body[field]);
  }
  for (const field of ['itinerary', 'faqs']) {
    if (body[field] !== undefined) payload[field] = Array.isArray(body[field]) ? body[field] : [];
  }

  if (body.sharingPricing !== undefined) {
    payload.sharingPricing = {};
    for (const key of ['tripleSharing', 'doubleSharing', 'singleSharing']) {
      const value = numberOrUndefined(body.sharingPricing?.[key]);
      if (Number.isNaN(value) || (value !== undefined && value < 0)) throw new Error(`${key} price must be non-negative.`);
      if (value !== undefined) payload.sharingPricing[key] = value;
    }
  }
  if (body.seo !== undefined) {
    payload.seo = {
      seoTitle: String(body.seo?.seoTitle || '').trim(),
      metaDescription: String(body.seo?.metaDescription || '').trim(),
      canonicalUrl: String(body.seo?.canonicalUrl || '').trim(),
      indexingDirective: body.seo?.indexingDirective === 'noindex, nofollow' ? 'noindex, nofollow' : 'index, follow',
      ogTitle: String(body.seo?.ogTitle || '').trim(),
      ogDescription: String(body.seo?.ogDescription || '').trim(),
      ogImage: String(body.seo?.ogImage || '').trim(),
      structuredSchemaType: String(body.seo?.structuredSchemaType || '').trim()
    };
  }
  if (body.batches !== undefined) payload.batches = normalizeBatches(body.batches, currentTrip?.batches || []);

  const status = body.status || currentTrip?.status || 'draft';
  if (!['published', 'draft', 'inactive'].includes(status)) throw new Error('Invalid publishing status.');
  if ((body.isCustom ?? currentTrip?.isCustom) && status === 'published') {
    throw new Error('Quotation-created custom trips cannot be published to the public catalog.');
  }
  payload.status = status;
  payload.isActive = status === 'published';
  return payload;
};

const mutationError = (error, res, fallbackMessage) => {
  if (error?.code === 11000 && error?.keyPattern?.slug) {
    return res.status(409).json({ success: false, message: 'That trip slug is already in use. Choose a unique slug.' });
  }
  if (error?.name === 'ValidationError' || /Departure|price|capacity|status|custom trips/i.test(error?.message || '')) {
    return res.status(400).json({ success: false, message: error.message });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ success: false, message: fallbackMessage });
};

export const getTrips = async (req, res) => {
  if (!isDbConnected()) return databaseUnavailable(res);
  try {
    const { search, destination, category, mood, minPrice, maxPrice, sort, country, tag, duration } = req.query;
    const filter = { status: 'published', isActive: true, isCustom: { $ne: true } };
    if (destination && !/^all$/i.test(destination)) filter.destination = new RegExp(escapeRegex(destination), 'i');
    if (category && !/^all$/i.test(category)) filter.category = new RegExp(escapeRegex(category), 'i');
    if (mood && !/^all$/i.test(mood)) filter.mood = new RegExp(escapeRegex(mood), 'i');
    if (tag) filter.tags = new RegExp(escapeRegex(tag), 'i');
    if (duration === 'weekend') filter.duration = /2N|3D|3N\/4D/i;
    if (country && !/^all$/i.test(country)) {
      if (/^(india|domestic)$/i.test(country)) filter.destination = { $nin: [/bali/i, /indonesia/i] };
      if (/^international$/i.test(country)) filter.$or = [{ destination: /bali|indonesia/i }, { category: /international/i }];
    }
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ title: rx }, { slug: rx }, { location: rx }, { destination: rx }];
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    let sortOption = { updatedAt: -1 };
    if (sort === 'price_low') sortOption = { price: 1 };
    if (sort === 'price_high') sortOption = { price: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };
    const trips = await Trip.find(filter).sort(sortOption).lean();
    return res.json({ success: true, count: trips.length, data: trips });
  } catch (error) {
    console.error('getTrips Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load the trip catalog.' });
  }
};

export const getAdminTrips = async (req, res) => {
  if (!isDbConnected()) return databaseUnavailable(res);
  try {
    const { search, status, destination, category } = req.query;
    const filter = {};
    if (status && !/^all$/i.test(status)) filter.status = status;
    if (destination && !/^all$/i.test(destination)) filter.destination = new RegExp(escapeRegex(destination), 'i');
    if (category && !/^all$/i.test(category)) filter.category = new RegExp(escapeRegex(category), 'i');
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ title: rx }, { slug: rx }, { location: rx }, { destination: rx }];
    }
    const trips = await Trip.find(filter).sort({ updatedAt: -1 }).lean();
    return res.json({ success: true, count: trips.length, data: trips });
  } catch (error) {
    console.error('getAdminTrips Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load Admin trips.' });
  }
};

export const getTripByIdOrSlug = async (req, res) => {
  if (!isDbConnected()) return databaseUnavailable(res);
  try {
    const key = String(req.params.idOrSlug || '').trim();
    const identity = mongoose.Types.ObjectId.isValid(key)
      ? { $or: [{ _id: key }, { slug: normalizeSlug(key) }] }
      : { slug: normalizeSlug(key) };
    const trip = await Trip.findOne({ ...identity, status: 'published', isActive: true, isCustom: { $ne: true } }).lean();
    if (!trip) return res.status(404).json({ success: false, message: 'Trip is unavailable.' });
    return res.json({ success: true, data: trip });
  } catch (error) {
    console.error('getTripByIdOrSlug Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load trip details.' });
  }
};

export const getAdminTripById = async (req, res) => {
  if (!isDbConnected()) return databaseUnavailable(res);
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid trip ID.' });
    const trip = await Trip.findById(req.params.id).lean();
    if (!trip) return res.status(404).json({ success: false, message: 'Trip package not found.' });
    return res.json({ success: true, data: trip });
  } catch {
    return res.status(500).json({ success: false, message: 'Unable to load Admin trip.' });
  }
};

export const createTrip = async (req, res) => {
  if (!isDbConnected()) return databaseUnavailable(res);
  try {
    const payload = buildTripPayload({ ...req.body, status: req.body.status || 'draft' });
    if (!payload.title || !payload.location || !payload.duration || !Number.isFinite(payload.price) || !payload.image || !payload.slug) {
      return res.status(400).json({ success: false, message: 'Title, slug, location, duration, base price, and main image are required.' });
    }
    if (await Trip.exists({ slug: payload.slug })) return res.status(409).json({ success: false, message: 'That trip slug is already in use. Choose a unique slug.' });
    const trip = await Trip.create(payload);
    return res.status(201).json({ success: true, data: trip });
  } catch (error) {
    return mutationError(error, res, 'Unable to create trip.');
  }
};

export const updateTrip = async (req, res) => {
  if (!isDbConnected()) return databaseUnavailable(res);
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip package not found.' });
    const payload = buildTripPayload(req.body, trip);
    if (payload.slug && payload.slug !== trip.slug && await Trip.exists({ slug: payload.slug, _id: { $ne: trip._id } })) {
      return res.status(409).json({ success: false, message: 'That trip slug is already in use. Choose a unique slug.' });
    }
    Object.assign(trip, payload);
    await trip.save();
    return res.json({ success: true, data: trip });
  } catch (error) {
    return mutationError(error, res, 'Unable to update trip.');
  }
};

export const deleteTrip = async (req, res) => {
  if (!isDbConnected()) return databaseUnavailable(res);
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip package not found.' });
    const bookings = await Booking.countDocuments({ $or: [{ tripId: String(trip._id) }, { 'tripSnapshot.title': trip.title }] });
    if (bookings > 0 || trip.sourceQuotationId) {
      trip.status = 'inactive';
      trip.isActive = false;
      await trip.save();
      return res.json({ success: true, deactivated: true, message: 'Trip has linked commercial history and was deactivated instead of deleted.' });
    }
    await trip.deleteOne();
    return res.json({ success: true, deleted: true, message: 'Unused trip deleted.' });
  } catch {
    return res.status(500).json({ success: false, message: 'Unable to delete or deactivate trip.' });
  }
};

export const seedTrips = async (req, res) => {
  if (!isDbConnected()) return databaseUnavailable(res);
  try {
    const staticList = getStaticKnowledgeTrips();
    const count = await Trip.countDocuments();
    if (count > 0 && req.query.force !== 'true') return res.json({ message: `Database already has ${count} trips. Pass ?force=true to reseed.`, count });
    const rows = staticList.map((trip) => ({
      ...trip,
      slug: normalizeSlug(trip.slug || trip.title),
      status: 'draft',
      isActive: false,
      batches: Array.isArray(trip.batches) ? trip.batches : [],
      nextBatch: trip.nextBatch || ''
    }));
    const created = await Trip.insertMany(rows, { ordered: false });
    return res.status(201).json({ message: `Seeded ${created.length} draft trips. Review and publish them from Staff Trips.`, count: created.length });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to seed trips.' });
  }
};
