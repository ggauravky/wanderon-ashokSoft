import mongoose from 'mongoose';
import MediaAsset, { generateLocationKeys } from '../models/MediaAsset.js';
import { isAllowedHotelMediaCategory, normalizeQuotationHotelMediaInput } from '../services/quotationHotelMediaService.js';
import Trip from '../models/Trip.js';
import Quotation from '../models/Quotation.js';
import Page from '../models/Page.js';
import { resolveItineraryMedia } from '../services/mediaResolverService.js';

const isDbConnected = () => mongoose.connection.readyState === 1;
const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    List media assets with filters and pagination
// @route   GET /api/media
// @access  Public / Private (Admin)
export const listMediaAssets = async (req, res) => {
  try {
    const {
      destination,
      destinationExact,
      location,
      tag,
      search,
      usage,
      featured,
      orientation,
      type,
      category,
      source,
      active: requestedActive = 'true',
      page = 1,
      limit = 24
    } = req.query;
    const active = req.mediaAdmin === true ? requestedActive : 'true';

    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Media assets are unavailable while the database is disconnected.' });

    const filter = {};

    if (active !== 'all') {
      filter.active = active === 'true';
    }

    if (featured === 'true') {
      filter.featured = true;
    }

    if (destination) {
      const expression = destinationExact === 'true' ? `^${escapeRegex(destination)}$` : escapeRegex(destination);
      filter['geography.destination'] = { $regex: new RegExp(expression, 'i') };
    }

    if (location) {
      filter.$or = [
        { 'geography.locality': { $regex: new RegExp(escapeRegex(location), 'i') } },
        { 'geography.poi': { $regex: new RegExp(escapeRegex(location), 'i') } },
        { locationKeys: { $in: [location.toLowerCase().trim()] } }
      ];
    }

    if (tag) {
      filter.tags = { $in: [tag.toLowerCase().trim()] };
    }

    if (orientation) {
      filter.orientation = orientation.toUpperCase();
    }

    if (type) filter.type = type.toUpperCase();
    if (category) filter.categories = category;
    if (source) filter['source.sourceType'] = source;

    if (usage && !['itinerary', 'destination', 'tripCard', 'hero', 'gallery', 'hotel'].includes(usage)) {
      return res.status(400).json({ success: false, message: 'Unsupported media usage filter.' });
    }
    if (usage) {
      filter[`usage.${usage}`] = true;
    }

    if (search) {
      const qRegex = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [
        { title: qRegex },
        { altText: qRegex },
        { caption: qRegex },
        { 'geography.destination': qRegex },
        { 'geography.poi': qRegex },
        { locationKeys: { $in: [search.toLowerCase().trim()] } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 24));
    const skip = (pageNum - 1) * limitNum;

    const [assets, total, destinations, categories, sources, types] = await Promise.all([
      MediaAsset.find(filter)
        .sort({ featured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'name email')
        .lean(),
      MediaAsset.countDocuments(filter),
      MediaAsset.distinct('geography.destination', { active: true }),
      MediaAsset.distinct('categories', { active: true }),
      MediaAsset.distinct('source.sourceType', { active: true }),
      MediaAsset.distinct('type', { active: true })
    ]);

    res.json({
      success: true,
      data: assets,
      destinations: destinations.filter(Boolean).sort(),
      facets: {
        destinations: destinations.filter(Boolean).sort(),
        categories: categories.filter(Boolean).sort(),
        sources: sources.filter(Boolean).sort(),
        types: types.filter(Boolean).sort()
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('List Media Assets Error:', error);
    res.status(500).json({ success: false, message: 'Unable to load media assets.' });
  }
};

// @desc    Get single media asset by ID with usage details
// @route   GET /api/media/:id
// @access  Private (Admin)
export const getMediaAssetById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Media assets are unavailable while the database is disconnected.' });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid media asset ID' });
    }

    const asset = await MediaAsset.findById(id).populate('createdBy', 'name email').lean();
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Media asset not found' });
    }

    // Lookup usages in active trips and quotations
    const assetUrl = asset.storage?.secureUrl;
    const [tripsUsing, quotationsUsing, pagesUsing] = await Promise.all([
      Trip.find(
        { $or: [{ 'itinerary.coverMediaAssetId': asset._id }, { 'itinerary.coverMedia.url': assetUrl }, { heroImage: assetUrl }, { image: assetUrl }] },
        { title: 1, slug: 1, 'itinerary.day': 1, 'itinerary.title': 1 }
      ).limit(10).lean(),
      Quotation.find(
        { $or: [{ 'itinerary.coverMediaAssetId': asset._id }, { 'itinerary.coverMedia.url': assetUrl }] },
        { quotationNumber: 1, status: 1, 'tripRequirements.title': 1 }
      ).limit(10).lean(),
      Page.find(
        { $or: [{ 'sections.imageUrl': assetUrl }, { 'seo.ogImage': assetUrl }, { 'seo.twitterImage': assetUrl }] },
        { title: 1, slug: 1, status: 1 }
      ).limit(10).lean()
    ]);

    res.json({
      success: true,
      data: {
        ...asset,
        usageDetails: {
          tripCount: tripsUsing.length,
          trips: tripsUsing.map(t => ({ id: t._id, title: t.title, slug: t.slug })),
          quotationCount: quotationsUsing.length,
          quotations: quotationsUsing.map(q => ({ id: q._id, number: q.quotationNumber, status: q.status })),
          pageCount: pagesUsing.length,
          pages: pagesUsing.map(p => ({ id: p._id, title: p.title, slug: p.slug, status: p.status })),
          totalKnownReferences: tripsUsing.length + quotationsUsing.length + pagesUsing.length
        }
      }
    });
  } catch (error) {
    console.error('Get Media Asset Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch media asset' });
  }
};

const isSafeRemoteUrl = (string) => {
  try {
    const u = new URL(string);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '169.254.169.254' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

// @desc    Create a new media asset record
// @route   POST /api/media
// @access  Private (Admin)
export const createMediaAsset = async (req, res) => {
  try {
    const {
      title,
      altText,
      caption = '',
      storage,
      tags = [],
      categories = ['Landscape'],
      orientation = 'LANDSCAPE',
      usage = { itinerary: true, destination: true, tripCard: true },
      source = { sourceType: 'ADMIN_UPLOAD', attribution: 'WanderLuxe' },
      featured = false
    } = req.body;

    const geography = req.body.geography || req.body.location || {};

    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Media assets cannot be created while the database is disconnected.' });

    if (!title || !altText || !storage?.secureUrl || !geography?.destination) {
      return res.status(400).json({
        success: false,
        message: 'Title, Alt Text, Secure URL, and Destination are required.'
      });
    }

    if (!isSafeRemoteUrl(storage.secureUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or unsafe image URL: only secure public HTTP/HTTPS URLs are permitted.'
      });
    }

    const locationKeys = generateLocationKeys(geography, title, tags);

    const asset = new MediaAsset({
      title,
      altText,
      caption,
      storage,
      geography,
      locationKeys,
      tags: Array.isArray(tags) ? tags.map(t => t.toLowerCase().trim()).filter(Boolean) : [],
      categories,
      orientation,
      usage,
      source,
      featured: Boolean(featured),
      createdBy: req.user?._id || null
    });

    await asset.save();

    res.status(201).json({
      success: true,
      message: 'Media asset created successfully.',
      data: asset
    });
  } catch (error) {
    console.error('Create Media Asset Error:', error);
    res.status(error?.name === 'ValidationError' ? 422 : 500).json({ success: false, message: error?.name === 'ValidationError' ? 'Media metadata contains an invalid value.' : 'Unable to create the media asset.' });
  }
};

// @desc    Register an uploaded image for quotation hotel selection
// @route   POST /api/media/quotation-hotel
// @access  Private (Sales, Admin). Does not grant general Media Library administration.
export const createQuotationHotelMediaAsset = async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Media assets cannot be created while the database is disconnected.' });
    const { title, altText, caption, storage, geography, tags, categories, orientation } = normalizeQuotationHotelMediaInput(req.body);
    if (!title) return res.status(400).json({ success: false, message: 'Title is required before adding hotel media.' });
    if (!altText) return res.status(400).json({ success: false, message: 'Alt text is required before adding hotel media.' });
    if (!geography.destination) return res.status(400).json({ success: false, message: 'Destination is required before adding hotel media.' });
    if (!storage.secureUrl) return res.status(400).json({ success: false, message: 'The uploaded image URL is missing. Please upload the image again.' });
    if (!isSafeRemoteUrl(storage.secureUrl)) {
      return res.status(400).json({ success: false, message: 'The uploaded image URL is invalid.' });
    }
    if (!categories.length || categories.some((value) => !isAllowedHotelMediaCategory(value))) {
      return res.status(400).json({ success: false, message: 'Select a valid hotel media category.' });
    }
    const asset = await MediaAsset.create({
      type: 'IMAGE',
      title,
      altText,
      caption,
      storage,
      geography,
      locationKeys: generateLocationKeys(geography, title, tags),
      tags,
      categories,
      orientation,
      usage: { itinerary: false, destination: false, tripCard: false, hero: false, gallery: true, hotel: true },
      source: { sourceType: 'STAFF_UPLOAD', attribution: 'WanderLuxe Staff Upload', license: 'Staff-provided quotation media' },
      active: true,
      featured: false,
      createdBy: req.user?._id || null
    });
    return res.status(201).json({ success: true, message: 'Hotel image added to the media library.', data: asset });
  } catch (error) {
    const publicId = req.body?.storage?.publicId || req.body?.storage?.public_id || req.body?.publicId || req.body?.public_id || '';
    console.error('Create Quotation Hotel Media Error:', error, { orphanPublicId: publicId });
    return res.status(error?.name === 'ValidationError' ? 400 : 500).json({
      success: false,
      message: error?.name === 'ValidationError'
        ? 'Hotel media metadata contains an invalid value.'
        : 'The image uploaded, but its media record could not be saved. Please retry without uploading the file again.'
    });
  }
};

// @desc    Update media asset metadata
// @route   PATCH /api/media/:id
// @access  Private (Admin)
export const updateMediaAsset = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Media assets cannot be updated while the database is disconnected.' });
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid media asset ID' });
    }

    const asset = await MediaAsset.findById(id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Media asset not found' });
    }

    const updatableFields = [
      'title', 'altText', 'caption', 'geography', 'tags', 'categories',
      'orientation', 'usage', 'source', 'active', 'featured'
    ];

    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        asset[field] = req.body[field];
      }
    }

    if (req.body.geography || req.body.title || req.body.tags) {
      asset.locationKeys = generateLocationKeys(asset.geography, asset.title, asset.tags);
    }

    await asset.save();

    res.json({
      success: true,
      message: 'Media asset updated successfully.',
      data: asset
    });
  } catch (error) {
    console.error('Update Media Asset Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update media asset' });
  }
};

// @desc    Archive or Delete media asset with safety check
// @route   DELETE /api/media/:id
// @access  Private (Admin)
export const deleteMediaAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;

    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Media assets cannot be deleted while the database is disconnected.' });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid media asset ID' });
    }

    const asset = await MediaAsset.findById(id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Media asset not found' });
    }

    // Check usage in published trips
    const assetUrl = asset.storage?.secureUrl;
    const [tripUsage, quotationUsage, pageUsage] = await Promise.all([
      Trip.countDocuments({ $or: [{ 'itinerary.coverMediaAssetId': asset._id }, { 'itinerary.coverMedia.url': assetUrl }, { heroImage: assetUrl }, { image: assetUrl }] }),
      Quotation.countDocuments({ $or: [{ 'itinerary.coverMediaAssetId': asset._id }, { 'itinerary.coverMedia.url': assetUrl }] }),
      Page.countDocuments({ $or: [{ 'sections.imageUrl': assetUrl }, { 'seo.ogImage': assetUrl }, { 'seo.twitterImage': assetUrl }] })
    ]);
    const usageCount = tripUsage + quotationUsage + pageUsage;

    if (usageCount > 0 && permanent === 'true') {
      return res.status(400).json({
        success: false,
        message: `This asset has ${usageCount} known reference(s) across Trips, Quotations, or Pages. Replace those references before permanently deleting it.`
      });
    }

    if (permanent === 'true') {
      await MediaAsset.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Media asset permanently deleted.' });
    }

    // Safe Soft Archive
    asset.active = false;
    await asset.save();

    res.json({
      success: true,
      message: 'Media asset archived successfully.',
      data: asset
    });
  } catch (error) {
    console.error('Delete Media Asset Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete media asset' });
  }
};

// @desc    Smart image resolution for an itinerary day
// @route   POST /api/media/resolve-itinerary
// @access  Public / Private
export const resolveItineraryMediaController = async (req, res) => {
  try {
    const {
      locationId,
      locationName,
      destination,
      poiNames,
      tags,
      excludeAssetIds
    } = req.body;

    const result = await resolveItineraryMedia({
      locationId,
      locationName,
      destination,
      poiNames,
      tags,
      excludeAssetIds
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Resolve Itinerary Media Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to resolve itinerary media' });
  }
};

// @desc    Generate Media Coverage Report across all trips and knowledge base
// @route   GET /api/media/coverage
// @access  Private (Admin)
export const getMediaCoverageReport = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'Media coverage is unavailable while the database is disconnected.' });
    }

    const [trips, assets] = await Promise.all([
      Trip.find(
        { status: { $ne: 'inactive' } },
        { title: 1, destination: 1, location: 1, itinerary: 1 }
      ).lean(),
      MediaAsset.find({ active: true })
        .select('title storage geography locationKeys categories')
        .lean()
    ]);

    const locationSet = new Map();
    const addLocation = (name, destination, source = 'Trip') => {
      const cleanName = String(name || '').trim();
      if (!cleanName) return;
      const key = cleanName.toLowerCase();
      const existing = locationSet.get(key);
      if (existing) {
        existing.usageCount += 1;
        return;
      }
      locationSet.set(key, {
        name: cleanName,
        destination: String(destination || cleanName).trim(),
        source,
        usageCount: 1
      });
    };

    trips.forEach((trip) => {
      const destination = trip.destination || trip.location || '';
      addLocation(destination, destination, 'Trip destination');
      (trip.itinerary || []).forEach((day) => addLocation(day.locationName || day.title, destination, 'Trip itinerary'));
    });

    const normalizedAssets = assets.map((asset) => {
      const values = [
        ...(asset.locationKeys || []),
        asset.geography?.destination,
        asset.geography?.city,
        asset.geography?.locality,
        asset.geography?.poi
      ].filter(Boolean).map((value) => String(value).toLowerCase().trim());
      return { ...asset, matchKeys: new Set(values) };
    });

    const locations = Array.from(locationSet.values()).map((location) => {
      const locationKey = location.name.toLowerCase();
      const destinationKey = location.destination.toLowerCase();
      const asset = normalizedAssets.find((candidate) =>
        candidate.matchKeys.has(locationKey)
        || candidate.matchKeys.has(destinationKey)
        || Array.from(candidate.matchKeys).some((key) => key.includes(locationKey) || locationKey.includes(key))
      );
      return {
        location: location.name,
        destination: location.destination,
        source: location.source,
        usageCount: location.usageCount,
        status: asset ? 'EXACT' : 'MISSING',
        matchLevel: asset ? 'DATABASE_MATCH' : 'NONE',
        asset: asset ? { id: asset._id, title: asset.title, url: asset.storage?.secureUrl } : null
      };
    });

    const byDestination = {};
    const byCategory = {};
    assets.forEach((asset) => {
      const destination = asset.geography?.destination || 'Unassigned';
      byDestination[destination] = (byDestination[destination] || 0) + 1;
      (asset.categories || []).forEach((category) => {
        byCategory[category] = (byCategory[category] || 0) + 1;
      });
    });

    const exactCount = locations.filter((item) => item.status === 'EXACT').length;
    const missingQueue = locations.filter((item) => item.status === 'MISSING');
    const totalLocations = locations.length;
    const coveragePercentage = totalLocations ? Math.round((exactCount / totalLocations) * 100) : 100;

    return res.json({
      success: true,
      data: {
        metrics: {
          totalAssets: assets.length,
          totalLocations,
          exactCount,
          fallbackCount: 0,
          missingCount: missingQueue.length,
          coveragePercentage
        },
        byDestination,
        byCategory,
        locations,
        missingQueue
      },
      totalAssets: assets.length,
      coverageRate: `${coveragePercentage}%`,
      missingLocations: missingQueue
    });
  } catch (error) {
    console.error('Media Coverage Report Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to generate media coverage report' });
  }
};

// @desc    Basic Media Health Check
// @route   GET /api/media/health
// @access  Private (Admin)
export const getMediaHealth = async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Media health is unavailable while the database is disconnected.' });
    const [totalAssets, activeCount, inactiveCount, withoutUrl] = await Promise.all([
      MediaAsset.countDocuments(),
      MediaAsset.countDocuments({ active: true }),
      MediaAsset.countDocuments({ active: false }),
      MediaAsset.countDocuments({ 'storage.secureUrl': { $in: ['', null] } })
    ]);

    res.json({
      success: true,
      data: {
        status: withoutUrl === 0 ? 'HEALTHY' : 'WARNING',
        totalAssets,
        activeCount,
        inactiveCount,
        brokenAssetsCount: withoutUrl
      }
    });
  } catch (error) {
    console.error('Media Health Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to check media health' });
  }
};

export default {
  listMediaAssets,
  getMediaAssetById,
  createMediaAsset,
  createQuotationHotelMediaAsset,
  updateMediaAsset,
  deleteMediaAsset,
  resolveItineraryMediaController,
  getMediaCoverageReport,
  getMediaHealth
};
