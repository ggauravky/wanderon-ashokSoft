import mongoose from 'mongoose';
import MediaAsset, { generateLocationKeys } from '../models/MediaAsset.js';
import Trip from '../models/Trip.js';
import Quotation from '../models/Quotation.js';
import { resolveItineraryMedia } from '../services/mediaResolverService.js';
import { getDestinations } from '../services/travelKnowledgeService.js';
import { CANONICAL_MEDIA_ASSETS } from '../data/canonicalMediaAssets.js';

let memoryMediaAssets = [...CANONICAL_MEDIA_ASSETS];
const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    List media assets with filters and pagination
// @route   GET /api/media
// @access  Public / Private (Admin)
export const listMediaAssets = async (req, res) => {
  try {
    const {
      destination,
      location,
      tag,
      search,
      usage,
      featured,
      orientation,
      active = 'true',
      page = 1,
      limit = 24
    } = req.query;

    if (!isDbConnected()) {
      let filtered = [...memoryMediaAssets];
      if (active !== 'all') {
        filtered = filtered.filter(a => a.active === (active === 'true'));
      }
      if (featured === 'true') {
        filtered = filtered.filter(a => a.featured);
      }
      if (destination) {
        const dRegex = new RegExp(destination, 'i');
        filtered = filtered.filter(a => dRegex.test(a.geography?.destination || ''));
      }
      if (orientation) {
        filtered = filtered.filter(a => a.orientation === orientation.toUpperCase());
      }
      if (search) {
        const sLower = search.toLowerCase().trim();
        filtered = filtered.filter(a => 
          (a.title || '').toLowerCase().includes(sLower) ||
          (a.geography?.destination || '').toLowerCase().includes(sLower) ||
          (a.geography?.poi || '').toLowerCase().includes(sLower) ||
          (a.locationKeys || []).some(k => k.toLowerCase().includes(sLower))
        );
      }
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 24));
      return res.json({
        success: true,
        data: filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filtered.length,
          pages: Math.ceil(filtered.length / limitNum) || 1
        }
      });
    }

    const filter = {};

    if (active !== 'all') {
      filter.active = active === 'true';
    }

    if (featured === 'true') {
      filter.featured = true;
    }

    if (destination) {
      filter['geography.destination'] = { $regex: new RegExp(destination, 'i') };
    }

    if (location) {
      filter.$or = [
        { 'geography.locality': { $regex: new RegExp(location, 'i') } },
        { 'geography.poi': { $regex: new RegExp(location, 'i') } },
        { locationKeys: { $in: [location.toLowerCase().trim()] } }
      ];
    }

    if (tag) {
      filter.tags = { $in: [tag.toLowerCase().trim()] };
    }

    if (orientation) {
      filter.orientation = orientation.toUpperCase();
    }

    if (usage) {
      filter[`usage.${usage}`] = true;
    }

    if (search) {
      const qRegex = new RegExp(search.trim(), 'i');
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

    const [assets, total] = await Promise.all([
      MediaAsset.find(filter)
        .sort({ featured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      MediaAsset.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: assets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('List Media Assets Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to list media assets' });
  }
};

// @desc    Get single media asset by ID with usage details
// @route   GET /api/media/:id
// @access  Private (Admin)
export const getMediaAssetById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isDbConnected()) {
      const found = memoryMediaAssets.find(a => String(a._id) === String(id));
      if (!found) return res.status(404).json({ success: false, message: 'Media asset not found' });
      return res.json({ success: true, data: found });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid media asset ID' });
    }

    const asset = await MediaAsset.findById(id).lean();
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Media asset not found' });
    }

    // Lookup usages in active trips and quotations
    const [tripsUsing, quotationsUsing] = await Promise.all([
      Trip.find(
        { 'itinerary.coverMediaAssetId': asset._id },
        { title: 1, slug: 1, 'itinerary.day': 1, 'itinerary.title': 1 }
      ).limit(10).lean(),
      Quotation.find(
        { 'itineraryDays.coverMediaAssetId': asset._id },
        { quotationNumber: 1, status: 1, 'tripRequirements.title': 1 }
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
          quotations: quotationsUsing.map(q => ({ id: q._id, number: q.quotationNumber, status: q.status }))
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

    if (!isDbConnected()) {
      const newAsset = {
        _id: 'med_' + Date.now(),
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
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryMediaAssets.unshift(newAsset);
      return res.status(201).json({
        success: true,
        message: 'Media asset created successfully.',
        data: newAsset
      });
    }

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
    res.status(500).json({ success: false, message: error.message || 'Failed to create media asset' });
  }
};

// @desc    Update media asset metadata
// @route   PATCH /api/media/:id
// @access  Private (Admin)
export const updateMediaAsset = async (req, res) => {
  try {
    const { id } = req.params;
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

    if (!isDbConnected()) {
      memoryMediaAssets = memoryMediaAssets.filter(a => String(a._id) !== String(id));
      return res.json({ success: true, message: 'Media asset deleted successfully.' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid media asset ID' });
    }

    const asset = await MediaAsset.findById(id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Media asset not found' });
    }

    // Check usage in published trips
    const usageCount = await Trip.countDocuments({
      'itinerary.coverMediaAssetId': asset._id
    });

    if (usageCount > 0 && permanent === 'true') {
      return res.status(400).json({
        success: false,
        message: `This image is actively used by ${usageCount} trip itinerary day(s). Please replace or reassign references before permanently deleting.`
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
    // 1. Scan unique destinations and locations from Catalog Trips
    const trips = isDbConnected() ? await Trip.find({ status: { $ne: 'inactive' } }, { destination: 1, location: 1, itinerary: 1 }).lean() : [];
    const centralDestinations = getDestinations();

    const locationSet = new Map();

    // Add Central Knowledge destinations & attractions
    centralDestinations.forEach(d => {
      const destName = d.name;
      if (!locationSet.has(destName.toLowerCase())) {
        locationSet.set(destName.toLowerCase(), { name: destName, destination: destName, count: 0, source: 'KnowledgeBase' });
      }
      (d.attractions || []).forEach(att => {
        const attName = att.name;
        if (!locationSet.has(attName.toLowerCase())) {
          locationSet.set(attName.toLowerCase(), { name: attName, destination: destName, count: 0, source: 'Attraction' });
        }
      });
    });

    // Add locations used in real Trip Itineraries
    trips.forEach(t => {
      const dest = t.destination || t.location;
      (t.itinerary || []).forEach(day => {
        const locName = day.locationName || day.title;
        if (locName) {
          const key = locName.toLowerCase().trim();
          const existing = locationSet.get(key);
          if (existing) {
            existing.count += 1;
          } else {
            locationSet.set(key, { name: locName, destination: dest, count: 1, source: 'Trip' });
          }
        }
      });
    });

    // 2. Query MediaAsset database for exact matches and calculate coverage
    const allUniqueLocations = Array.from(locationSet.values());
    const reportList = [];
    let exactCount = 0;
    let fallbackCount = 0;
    let missingCount = 0;

    for (const item of allUniqueLocations) {
      const resolution = await resolveItineraryMedia({
        locationName: item.name,
        destination: item.destination
      });

      const hasExact = resolution.exactMatch;
      const isUnmapped = resolution.matchLevel === 'FALLBACK_UNMAPPED' || resolution.matchLevel === 'NONE';
      const hasAny = Boolean(resolution.recommended);

      let status = 'MISSING';
      if (hasExact) {
        status = 'EXACT';
        exactCount += 1;
      } else if (hasAny && !isUnmapped) {
        status = 'FALLBACK';
        fallbackCount += 1;
      } else {
        status = 'MISSING';
        missingCount += 1;
      }

      reportList.push({
        location: item.name,
        destination: item.destination,
        source: item.source,
        usageCount: item.count,
        status,
        matchLevel: resolution.matchLevel,
        asset: resolution.recommended ? {
          id: resolution.recommended._id,
          title: resolution.recommended.title,
          url: resolution.recommended.storage?.secureUrl
        } : null
      });
    }

    const totalLocations = allUniqueLocations.length;
    const coveragePercentage = totalLocations > 0 
      ? Math.round(((exactCount + fallbackCount) / totalLocations) * 100) 
      : 100;

    const totalAssetsCount = isDbConnected() ? await MediaAsset.countDocuments({ active: true }) : memoryMediaAssets.length;

    res.json({
      success: true,
      data: {
        metrics: {
          totalLocations,
          exactCount,
          fallbackCount,
          missingCount,
          coveragePercentage
        },
        locations: reportList,
        missingQueue: reportList.filter(l => l.status === 'MISSING')
      },
      totalAssets: totalAssetsCount,
      coverageRate: `${coveragePercentage}%`,
      missingLocations: reportList.filter(l => l.status === 'MISSING')
    });
  } catch (error) {
    console.error('Media Coverage Report Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate media coverage report' });
  }
};

// @desc    Basic Media Health Check
// @route   GET /api/media/health
// @access  Private (Admin)
export const getMediaHealth = async (req, res) => {
  try {
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
  updateMediaAsset,
  deleteMediaAsset,
  resolveItineraryMediaController,
  getMediaCoverageReport,
  getMediaHealth
};
