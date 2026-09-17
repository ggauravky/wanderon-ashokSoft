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

const TROPICAL_WARM_DESTINATIONS = new Set([
  'meghalaya',
  'goa',
  'kerala',
  'bali',
  'andaman',
  'sri lanka',
  'thailand',
  'vietnam'
]);

const SNOW_CLIMATE_REGEX = /\b(snow|ski|skiing|glacier|snowfall|blizzard|winter)\b/i;

const DESTINATION_MACRO_REGIONS = {
  meghalaya: 'Northeast India',
  'spiti-valley': 'Himalayas',
  spiti: 'Himalayas',
  'himachal-pradesh': 'North India',
  himachal: 'North India',
  manali: 'North India',
  kasol: 'North India',
  kashmir: 'Himalayas',
  ladakh: 'Himalayas',
  uttarakhand: 'Himalayas',
  rishikesh: 'North India',
  goa: 'South India',
  kerala: 'South India',
  rajasthan: 'North India',
  bali: 'Southeast Asia'
};

/**
 * Checks if destination should strictly reject snow/winter imagery
 */
export const isTropicalWarmDestination = (destClean = '', slugClean = '') => {
  const combined = `${destClean} ${slugClean}`.toLowerCase();
  return Array.from(TROPICAL_WARM_DESTINATIONS).some(d => combined.includes(d));
};

/**
 * Formats a MediaAsset document or object into a standardized media presentation object
 */
export const formatMediaObject = (asset, defaultText = '') => {
  if (!asset) return null;
  return {
    id: asset._id,
    url: asset.storage?.secureUrl || asset.url,
    altText: asset.altText || asset.title || defaultText,
    caption: asset.caption || asset.title || defaultText,
    width: asset.storage?.dimensions?.width || asset.storage?.width || 1600,
    height: asset.storage?.dimensions?.height || asset.storage?.height || 900
  };
};

/**
 * Deterministic Smart Image Resolver for Itinerary Days
 * Resolves verified MediaAsset from MongoDB based on strict geographic hierarchy.
 *
 * Hierarchy:
 * 1. EXACT_POI: Matches specific POI name (e.g. "Hadimba Temple", "Solang Valley", "Atal Tunnel")
 * 2. EXACT_LOCATION: Matches specific locality or city (e.g. "Old Manali", "Sissu", "Cherrapunji")
 * 3. DESTINATION_FALLBACK: Matches broader destination (e.g. "Manali", "Spiti", "Meghalaya")
 * 4. REGION_FALLBACK: Matches geographic macro-region (strictly quarantined to destination's true macro-region)
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

  const isTropical = isTropicalWarmDestination(destClean, canonicalDestSlug);
  const targetRegion = DESTINATION_MACRO_REGIONS[canonicalDestSlug] || DESTINATION_MACRO_REGIONS[destClean] || '';

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
    // LEVEL 4: Safe Region / Macro-Region Fallback (Strictly quarantined by region)
    // ---------------------------------------------------------------------------
    if (candidates.length === 0 && isKnown && targetRegion) {
      const regionQuery = {
        ...baseFilter,
        'geography.region': { $regex: new RegExp(targetRegion, 'i') }
      };

      if (isTropical) {
        regionQuery.tags = { $nin: ['snow', 'ski', 'skiing', 'glacier', 'winter'] };
      }

      const regionMatches = await MediaAsset.find(regionQuery).limit(8).lean();

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

    // LEVEL 4: Region Fallback (Strictly quarantined by macro-region)
    if (candidates.length === 0 && isKnown && targetRegion) {
      candidates = CANONICAL_MEDIA_ASSETS.filter(a => {
        if (!a.active) return false;
        const reg = (a.geography?.region || '').toLowerCase();
        if (!reg.includes(targetRegion.toLowerCase())) return false;
        if (isTropical) {
          const t = (a.tags || []).join(' ');
          const title = a.title || '';
          if (SNOW_CLIMATE_REGEX.test(`${t} ${title}`)) return false;
        }
        return true;
      });
      if (candidates.length > 0) {
        matchLevel = 'REGION_FALLBACK';
        exactMatch = false;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // CLIMATE GUARDRAIL ENFORCEMENT:
  // Tropical/Warm destinations (Meghalaya, Goa, Kerala, Bali) must NEVER have snow/winter imagery
  // ---------------------------------------------------------------------------
  if (isTropical && candidates.length > 0) {
    const climateFiltered = candidates.filter(a => {
      const t = (a.tags || []).join(' ');
      const title = a.title || '';
      return !SNOW_CLIMATE_REGEX.test(`${t} ${title}`);
    });
    if (climateFiltered.length > 0) {
      candidates = climateFiltered;
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
  const NATURE_REGEX = /\b(waterfall|waterfalls|lake|lakes|river|rivers|mountain|mountains|beach|beaches|valley|valleys|cliff|cliffs|canyon|canyons|forest|rainforest|jungle|scenic|viewpoint|panoramic|landscape|ocean|sea|plateau|pass|hills|nature|sunset|lagoon|terrace)\b/i;
  const NON_NATURE_REGEX = /\b(vehicle|car|bus|taxi|traffic|hotel|room|bedroom|food|dish|meal|restaurant|buffet|cocktail|plate|drink)\b/i;

  const scoredCandidates = candidates.map(asset => {
    let score = 0;
    const assetId = String(asset._id);
    const assetPoi = (asset.geography?.poi || '').toLowerCase().trim();
    const assetLoc = (asset.geography?.locality || '').toLowerCase().trim();
    const assetKeys = (asset.locationKeys || []).map(k => k.toLowerCase().trim());
    const assetTokens = `${(asset.tags || []).join(' ')} ${asset.title || ''} ${asset.caption || ''}`;

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

    // 3. Nature-first imagery boost vs artificial penalty
    if (NATURE_REGEX.test(assetTokens)) {
      score += 25; // Prioritize natural landscapes
    }
    if (NON_NATURE_REGEX.test(assetTokens)) {
      score -= 40; // Penalize vehicles, food, hotel interiors
    }

    // 4. Aesthetic bonuses (Sum to max 45 points, can never override geographic score!)
    if (asset.featured) score += 20;
    if (preferLandscape && asset.orientation === 'LANDSCAPE') score += 15;
    if (asset.storage?.width >= 1600) score += 10;
    else if (asset.storage?.width >= 1200) score += 5;

    // 5. Activity / Tag match bonus (up to 15 points)
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

  const coverMedia = formatMediaObject(recommended, locationName);

  // ---------------------------------------------------------------------------
  // GALLERY SUPPORTING IMAGES SELECTION (Up to 2 supporting nature images)
  // Ensures:
  // 1. Dynamic count (3 if available, 2 if available, 1 if available, 0 if unmapped)
  // 2. Strict place relevance: Must match the same destination
  // 3. Zero intra-day duplicates: All image URLs and IDs within the day must be distinct
  // 4. Climate guardrail: Zero snow in tropical destinations
  // ---------------------------------------------------------------------------
  const galleryAssets = [];
  const selectedIds = new Set();
  if (recommended?._id) {
    selectedIds.add(String(recommended._id));
  }

  if (matchLevel !== 'FALLBACK_UNMAPPED') {
    // 1st pass: Pick from scored candidates matching locality/poi
    for (const { asset, isExcluded } of scoredCandidates) {
      const aId = String(asset._id);
      if (selectedIds.has(aId) || isExcluded) continue;
      if (isTropical) {
        const text = `${(asset.tags || []).join(' ')} ${asset.title || ''}`;
        if (SNOW_CLIMATE_REGEX.test(text)) continue;
      }
      galleryAssets.push(asset);
      selectedIds.add(aId);
      if (galleryAssets.length >= 2) break;
    }

    // 2nd pass: If still under 2 supporting images, pull from same destination pool
    if (galleryAssets.length < 2 && (destClean || canonicalDestSlug)) {
      const destTokens = Array.from(new Set([
        canonicalDestSlug,
        destClean,
        ...tokenize(destClean)
      ].filter(Boolean)));

      let destPool = [];
      if (isDbConnected) {
        const destQuery = {
          ...baseFilter,
          _id: { $nin: Array.from(selectedIds) },
          $or: [
            { 'geography.destination': { $regex: new RegExp(destTokens.join('|'), 'i') } },
            { 'geography.state': { $regex: new RegExp(destTokens.join('|'), 'i') } },
            { locationKeys: { $in: destTokens } }
          ]
        };
        if (isTropical) {
          destQuery.tags = { $nin: ['snow', 'ski', 'skiing', 'glacier', 'winter'] };
        }
        destPool = await MediaAsset.find(destQuery).lean();
      } else {
        destPool = CANONICAL_MEDIA_ASSETS.filter(a => {
          if (!a.active) return false;
          const aId = String(a._id);
          if (selectedIds.has(aId)) return false;
          const dest = (a.geography?.destination || '').toLowerCase().trim();
          const state = (a.geography?.state || '').toLowerCase().trim();
          const keys = (a.locationKeys || []).map(k => k.toLowerCase().trim());
          const matchesDest = destTokens.some(t => dest.includes(t) || state.includes(t) || keys.includes(t));
          if (!matchesDest) return false;
          if (isTropical) {
            const text = `${(a.tags || []).join(' ')} ${a.title || ''}`;
            if (SNOW_CLIMATE_REGEX.test(text)) return false;
          }
          return true;
        });
      }

      // Rank destination pool by nature priority and repetition avoidance
      const sortedPool = destPool.map(asset => {
        let poolScore = 0;
        const aId = String(asset._id);
        const isExcluded = excludedSet.has(aId);
        if (isExcluded) poolScore -= 50;
        const assetTokens = `${(asset.tags || []).join(' ')} ${asset.title || ''} ${asset.caption || ''}`;
        if (NATURE_REGEX.test(assetTokens)) poolScore += 25;
        if (NON_NATURE_REGEX.test(assetTokens)) poolScore -= 40;
        if (asset.featured) poolScore += 20;
        return { asset, poolScore, isExcluded };
      });

      sortedPool.sort((a, b) => b.poolScore - a.poolScore);

      // Pick unexcluded assets first
      for (const { asset, isExcluded } of sortedPool) {
        const aId = String(asset._id);
        if (selectedIds.has(aId) || isExcluded) continue;
        galleryAssets.push(asset);
        selectedIds.add(aId);
        if (galleryAssets.length >= 2) break;
      }

      // 3rd pass: If still under 2 supporting images, allow from destination pool (strictly avoiding intra-day duplicates)
      if (galleryAssets.length < 2) {
        for (const { asset } of sortedPool) {
          const aId = String(asset._id);
          if (selectedIds.has(aId)) continue;
          galleryAssets.push(asset);
          selectedIds.add(aId);
          if (galleryAssets.length >= 2) break;
        }
      }
    }
  }

  const galleryMedia = galleryAssets.map(a => formatMediaObject(a, locationName)).filter(Boolean);
  const gallery = [coverMedia, ...galleryMedia].filter(Boolean);

  return {
    exactMatch,
    matchLevel,
    recommended,
    coverMedia,
    mediaAssetId: recommended?._id || null,
    galleryMedia,
    galleryMediaAssetIds: galleryMedia.map(m => m.id),
    gallery,
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

    // If day was manually edited/locked by staff, preserve selections faithfully
    if (day.mediaSelectionMode === 'MANUAL' && day.coverMedia) {
      if (day.coverMedia?.id) usedIds.push(String(day.coverMedia.id));
      if (Array.isArray(day.galleryMedia)) {
        day.galleryMedia.forEach(g => { if (g?.id) usedIds.push(String(g.id)); });
      }
      resolvedDays.push({
        ...day,
        gallery: day.gallery || [day.coverMedia, ...(day.galleryMedia || [])].filter(Boolean)
      });
      continue;
    }

    const locationName = day.locationName || day.title || '';
    const res = await resolveItineraryMedia({
      destination: destination || day.destination || '',
      locationName,
      dayNumber: day.day || i + 1,
      excludeAssetIds: usedIds
    });

    const asset = res?.recommended;
    const galleryMedia = res?.galleryMedia || [];
    const galleryMediaAssetIds = res?.galleryMediaAssetIds || [];

    if (asset) {
      usedIds.push(String(asset._id));
    }
    galleryMediaAssetIds.forEach(id => {
      usedIds.push(String(id));
    });

    resolvedDays.push({
      ...day,
      coverMedia: res?.coverMedia || null,
      coverMediaAssetId: asset?._id || null,
      galleryMedia,
      galleryMediaAssetIds,
      gallery: res?.gallery || (res?.coverMedia ? [res.coverMedia] : []),
      mediaSelectionMode: day.mediaSelectionMode || 'AUTO'
    });
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
