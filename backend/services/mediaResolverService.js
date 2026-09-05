import mongoose from 'mongoose';
import MediaAsset from '../models/MediaAsset.js';
import { normalizeDestinationSlug } from './travelKnowledgeService.js';
import { CANONICAL_MEDIA_ASSETS } from '../data/canonicalMediaAssets.js';

/**
 * Normalizes a raw string into search tokens
 */
export const tokenize = (str = '') => {
  if (!str || typeof str !== 'string') return [];
  const clean = str.toLowerCase().trim();
  const slug = clean.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const words = clean.split(/[\s,/-]+/).filter(w => w.length > 2 && !['and', 'the', 'for', 'via', 'with', 'from', 'near'].includes(w));
  return Array.from(new Set([clean, slug, ...words]));
};

/**
 * Neutral WanderLuxe Travel Landscape Asset for unmapped locations
 */
const NEUTRAL_TRAVEL_FALLBACK = {
  _id: 'med_neutral_fallback',
  title: 'WanderLuxe Scenic Itinerary Journey',
  altText: 'Scenic panoramic travel landscape and mountain horizon',
  caption: 'Bespoke scenic horizon for unmapped itinerary location',
  storage: {
    provider: 'cloudinary',
    publicId: 'wanderluxe/seed/neutral_journey_landscape',
    secureUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop',
    width: 1600,
    height: 900
  },
  geography: {
    country: 'Global',
    state: '',
    region: 'Global',
    destination: 'Universal',
    city: '',
    locality: '',
    poi: ''
  },
  tags: ['landscape', 'travel', 'mountains', 'scenic', 'journey'],
  orientation: 'LANDSCAPE',
  featured: false,
  active: true
};

/**
 * Deterministic Smart Image Resolver for Itinerary Days
 * Resolves verified MediaAsset from MongoDB based on strict geographic hierarchy.
 *
 * Hierarchy:
 * 1. EXACT_POI: Matches specific POI name (e.g. "Hadimba Temple", "Solang Valley", "Atal Tunnel")
 * 2. EXACT_LOCATION: Matches specific locality or city (e.g. "Old Manali", "Sissu", "Cherrapunji")
 * 3. DESTINATION_FALLBACK: Matches broader destination (e.g. "Manali", "Spiti", "Meghalaya")
 * 4. REGION_FALLBACK: Matches geographic macro-region (e.g. "North India", "Himalayas", "Northeast")
 * 5. FALLBACK_UNMAPPED: Neutral scenic travel imagery for completely unknown locations
 *
 * Principle: DATA ACCURACY > VISUAL VARIETY. Geographic relevance strictly outranks aesthetics.
 *
 * @param {Object} params
 * @param {string} [params.locationId] - MongoDB or normalized location ID
 * @param {string} [params.locationName] - Raw location string (e.g. "Solang Valley", "Old Manali")
 * @param {string} [params.destination] - Destination (e.g. "Manali", "Himachal Pradesh", "Meghalaya")
 * @param {string[]} [params.poiNames] - Specific POI names (e.g. ["Hadimba Temple", "Jogini Waterfall"])
 * @param {string[]} [params.tags] - Activity or style tags (e.g. ["snow", "adventure"])
 * @param {string[]} [params.excludeAssetIds] - Assets already used on earlier days to prevent repetitive imagery
 * @param {boolean} [params.preferLandscape=true] - Prefer landscape orientation for day covers
 */
export async function resolveItineraryMedia({
  locationId = '',
  locationName = '',
  destination = '',
  poiNames = [],
  tags = [],
  excludeAssetIds = [],
  preferLandscape = true
}) {
  const cleanLocation = (locationName || '').toLowerCase().trim();
  const rawDestination = destination || locationName;
  const destClean = (rawDestination || '').toLowerCase().trim();

  const knownDests = ['meghalaya', 'spiti', 'bali', 'kerala', 'kashmir', 'ladakh', 'goa', 'rajasthan', 'himachal', 'manali', 'kasol', 'uttarakhand', 'rishikesh'];
  const isKnown = destClean && knownDests.some(k => destClean.includes(k));
  const canonicalDestSlug = isKnown ? normalizeDestinationSlug(destClean) : '';

  const rawPoiPhrases = (Array.isArray(poiNames) ? poiNames : [poiNames])
    .map(p => (p || '').toLowerCase().trim())
    .filter(Boolean);

  const tagTokens = (Array.isArray(tags) ? tags : [tags]).flatMap(t => tokenize(t));
  const excludedSet = new Set((excludeAssetIds || []).map(id => String(id)));

  // Specific phrases to search for POI and Locality (excluding pure destination name)
  const specificPhrases = [];
  if (cleanLocation && cleanLocation !== destClean && cleanLocation !== canonicalDestSlug) {
    specificPhrases.push(cleanLocation);
    const slug = cleanLocation.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (slug && slug !== cleanLocation) specificPhrases.push(slug);
  }
  const poiSearch = Array.from(new Set([...rawPoiPhrases, ...specificPhrases]));

  // Base query: only active image assets suitable for itinerary usage
  const baseFilter = {
    type: 'IMAGE',
    active: true,
    'usage.itinerary': true
  };

  const isDbConnected = mongoose.connection?.readyState === 1;
  let candidates = [];
  let matchLevel = 'NONE';
  let exactMatch = false;

  if (isDbConnected) {
    // ---------------------------------------------------------------------------
    // LEVEL 1: Exact POI Match (e.g. "Hadimba Temple", "Solang Valley", "Atal Tunnel")
    // ---------------------------------------------------------------------------
    if (poiSearch.length > 0) {
      const poiQuery = {
        ...baseFilter,
        $or: poiSearch.flatMap(phrase => [
          { 'geography.poi': { $regex: new RegExp(`^${phrase}$|${phrase}`, 'i') } },
          { locationKeys: phrase }
        ])
      };

      const poiMatches = await MediaAsset.find(poiQuery).lean();
      if (poiMatches && poiMatches.length > 0) {
        candidates = poiMatches;
        matchLevel = 'EXACT_POI';
        exactMatch = true;
      }
    }

    // ---------------------------------------------------------------------------
    // LEVEL 2: Exact Location / Locality Match (e.g. "Old Manali", "Sissu", "Cherrapunji")
    // ---------------------------------------------------------------------------
    if (candidates.length === 0 && specificPhrases.length > 0) {
      const locQuery = {
        ...baseFilter,
        $or: specificPhrases.flatMap(phrase => [
          { 'geography.locality': { $regex: new RegExp(`^${phrase}$|${phrase}`, 'i') } },
          { 'geography.city': { $regex: new RegExp(`^${phrase}$|${phrase}`, 'i') } },
          { 'geography.location': { $regex: new RegExp(`^${phrase}$|${phrase}`, 'i') } },
          { locationKeys: phrase }
        ])
      };

      const locMatches = await MediaAsset.find(locQuery).lean();
      if (locMatches && locMatches.length > 0) {
        candidates = locMatches;
        matchLevel = 'EXACT_LOCATION';
        exactMatch = true;
      }
    }

    // ---------------------------------------------------------------------------
    // LEVEL 3: Destination Fallback (e.g. "Manali", "Himachal Pradesh", "Meghalaya")
    // ---------------------------------------------------------------------------
    if (candidates.length === 0 && (destClean || canonicalDestSlug)) {
      const destTokens = Array.from(new Set([
        canonicalDestSlug,
        destClean,
        ...tokenize(destClean)
      ].filter(Boolean)));

      const destQuery = {
        ...baseFilter,
        $or: [
          { 'geography.destination': { $regex: new RegExp(destTokens.join('|'), 'i') } },
          { 'geography.state': { $regex: new RegExp(destTokens.join('|'), 'i') } },
          { locationKeys: { $in: destTokens } }
        ]
      };

      const destMatches = await MediaAsset.find(destQuery).lean();
      if (destMatches && destMatches.length > 0) {
        candidates = destMatches;
        matchLevel = 'DESTINATION';
        exactMatch = false;
      }
    }

    // ---------------------------------------------------------------------------
    // LEVEL 4: Safe Region / Macro-Region Fallback
    // ---------------------------------------------------------------------------
    if (candidates.length === 0 && isKnown) {
      const regionMatches = await MediaAsset.find({
        ...baseFilter,
        'geography.region': { $regex: /North India|Himalayas|Northeast|South India/i }
      }).limit(8).lean();

      if (regionMatches && regionMatches.length > 0) {
        candidates = regionMatches;
        matchLevel = 'REGION_FALLBACK';
        exactMatch = false;
      }
    }
  } else {
    // ---------------------------------------------------------------------------
    // IN-MEMORY RESOLUTION ENGINE (Zero DB dependency fallback for tests/offline)
    // ---------------------------------------------------------------------------

    // LEVEL 1: Exact POI match
    if (poiSearch.length > 0) {
      candidates = CANONICAL_MEDIA_ASSETS.filter(a => {
        if (!a.active) return false;
        const poi = (a.geography?.poi || '').toLowerCase().trim();
        const keys = (a.locationKeys || []).map(k => k.toLowerCase().trim());
        return poiSearch.some(p => (poi && (poi === p || poi.includes(p) || p.includes(poi))) || keys.includes(p));
      });
      if (candidates.length > 0) {
        matchLevel = 'EXACT_POI';
        exactMatch = true;
      }
    }

    // LEVEL 2: Exact Location / Locality
    if (candidates.length === 0 && specificPhrases.length > 0) {
      candidates = CANONICAL_MEDIA_ASSETS.filter(a => {
        if (!a.active) return false;
        const loc = (a.geography?.locality || '').toLowerCase().trim();
        const city = (a.geography?.city || '').toLowerCase().trim();
        const keys = (a.locationKeys || []).map(k => k.toLowerCase().trim());
        return specificPhrases.some(p => 
          (loc && (loc === p || loc.includes(p) || p.includes(loc))) ||
          (city && (city === p || city.includes(p))) ||
          keys.includes(p)
        );
      });
      if (candidates.length > 0) {
        matchLevel = 'EXACT_LOCATION';
        exactMatch = true;
      }
    }

    // LEVEL 3: Destination Fallback
    if (candidates.length === 0 && (destClean || canonicalDestSlug)) {
      const destTokens = Array.from(new Set([
        canonicalDestSlug,
        destClean,
        ...tokenize(destClean)
      ].filter(Boolean)));

      candidates = CANONICAL_MEDIA_ASSETS.filter(a => {
        if (!a.active) return false;
        const dest = (a.geography?.destination || '').toLowerCase().trim();
        const state = (a.geography?.state || '').toLowerCase().trim();
        const keys = (a.locationKeys || []).map(k => k.toLowerCase().trim());
        return destTokens.some(t => dest.includes(t) || state.includes(t) || keys.includes(t));
      });
      if (candidates.length > 0) {
        matchLevel = 'DESTINATION';
        exactMatch = false;
      }
    }

    // LEVEL 4: Region Fallback
    if (candidates.length === 0 && isKnown) {
      candidates = CANONICAL_MEDIA_ASSETS.filter(a => 
        a.active && /North India|Himalayas|Northeast|South India/i.test(a.geography?.region || '')
      );
      if (candidates.length > 0) {
        matchLevel = 'REGION_FALLBACK';
        exactMatch = false;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // LEVEL 5: Unmapped Unknown Destination Fallback
  // Provide neutral scenic travel imagery without falsely claiming local identity
  // ---------------------------------------------------------------------------
  if (candidates.length === 0) {
    candidates = [NEUTRAL_TRAVEL_FALLBACK];
    matchLevel = 'FALLBACK_UNMAPPED';
    exactMatch = false;
  }

  // ---------------------------------------------------------------------------
  // DETERMINISTIC SPECIFICITY SCORING & REPETITION AVOIDANCE (Zero Math.random)
  // Geographic relevance dominates aesthetics completely.
  // ---------------------------------------------------------------------------
  const scoredCandidates = candidates.map(asset => {
    let score = 0;
    const assetId = String(asset._id);
    const assetPoi = (asset.geography?.poi || '').toLowerCase().trim();
    const assetLoc = (asset.geography?.locality || '').toLowerCase().trim();
    const assetKeys = (asset.locationKeys || []).map(k => k.toLowerCase().trim());

    // 1. Geographic Specificity (Dominates aesthetics!)
    if (assetPoi && (assetPoi === cleanLocation || rawPoiPhrases.includes(assetPoi))) {
      score += 300; // Perfect POI match
    } else if (assetPoi && cleanLocation && (assetPoi.includes(cleanLocation) || cleanLocation.includes(assetPoi))) {
      score += 250; // Contained POI match
    }

    if (assetLoc && (assetLoc === cleanLocation || specificPhrases.includes(assetLoc))) {
      score += 200; // Exact locality match
    } else if (assetLoc && cleanLocation && (assetLoc.includes(cleanLocation) || cleanLocation.includes(assetLoc))) {
      score += 150; // Contained locality match
    }

    if (cleanLocation && assetKeys.includes(cleanLocation)) {
      score += 100; // Full phrase key match
    }

    // 2. Repetition penalty: If already used in this itinerary, lower score so alternative is picked
    const isExcluded = excludedSet.has(assetId);
    if (isExcluded) {
      score -= 50;
    }

    // 3. Aesthetic bonuses (Sum to max 45 points, can never override geographic score!)
    if (asset.featured) score += 20;
    if (preferLandscape && asset.orientation === 'LANDSCAPE') score += 15;
    if (asset.storage?.width >= 1600) score += 10;
    else if (asset.storage?.width >= 1200) score += 5;

    // 4. Activity / Tag match bonus (up to 15 points)
    if (tagTokens.length > 0 && Array.isArray(asset.tags)) {
      const matchCount = asset.tags.filter(t => tagTokens.includes(t.toLowerCase().trim())).length;
      score += Math.min(15, matchCount * 5);
    }

    return { asset, score, isExcluded };
  });

  // Sort deterministically: highest score first, then newest createdAt, then stable _id
  scoredCandidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const dateA = new Date(a.asset.createdAt || 0).getTime();
    const dateB = new Date(b.asset.createdAt || 0).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return String(a.asset._id).localeCompare(String(b.asset._id));
  });

  // Top recommendation is first scored candidate
  const recommended = scoredCandidates[0]?.asset || null;

  // Alternatives: up to 8 other assets for manual admin picker
  const alternatives = scoredCandidates
    .slice(1, 9)
    .map(c => c.asset);

  const coverMedia = recommended ? {
    id: recommended._id,
    url: recommended.storage?.secureUrl || recommended.url,
    altText: recommended.title || locationName,
    caption: recommended.caption || locationName,
    width: recommended.storage?.dimensions?.width || recommended.storage?.width || 1600,
    height: recommended.storage?.dimensions?.height || recommended.storage?.height || 900
  } : null;

  return {
    exactMatch,
    matchLevel,
    recommended,
    coverMedia,
    mediaAssetId: recommended?._id || null,
    alternatives
  };
}

/**
 * Batch resolve media for an entire itinerary array, preventing duplicate imagery
 */
export async function batchResolveItineraryMedia(days = [], destination = '', tripTitle = '') {
  const resolvedDays = [];
  const usedIds = [];

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const locationName = day.locationName || day.title || '';
    const res = await resolveItineraryMedia({
      destination: destination || day.destination || '',
      locationName,
      dayNumber: day.day || i + 1,
      excludeAssetIds: usedIds
    });

    const asset = res?.recommended;
    if (asset) {
      usedIds.push(String(asset._id));
      resolvedDays.push({
        ...day,
        coverMedia: {
          id: asset._id,
          url: asset.storage?.secureUrl || asset.url,
          altText: asset.title || locationName,
          caption: asset.caption || locationName,
          width: asset.storage?.dimensions?.width || asset.storage?.width || 1600,
          height: asset.storage?.dimensions?.height || asset.storage?.height || 900
        },
        coverMediaAssetId: asset._id,
        mediaSelectionMode: day.mediaSelectionMode || 'AUTO'
      });
    } else {
      resolvedDays.push({
        ...day,
        mediaSelectionMode: day.mediaSelectionMode || 'AUTO'
      });
    }
  }

  return resolvedDays;
}

export const normalizeKey = (str = '') => {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, ' ');
};

export const tokenizeText = tokenize;

export default {
  resolveItineraryMedia,
  batchResolveItineraryMedia,
  tokenize,
  tokenizeText,
  normalizeKey
};
