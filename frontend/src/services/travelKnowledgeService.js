import travelKnowledge from '../data/travelKnowledge.json';
import { UPCOMING_TRIPS } from '../constants/mockData.js';
import { 
  Mountain, Palmtree, Trees, Waves, Compass, 
  Heart, Award, Coffee, Sun, CloudRain, Luggage, 
  ShieldCheck, Ticket, BatteryCharging, HeartPulse, 
  Shirt, Layers, Smile, Hand, Smartphone, Glasses, 
  Footprints, Flashlight, Droplet, Wind, CloudSun
} from 'lucide-react';

/**
 * Lucide Icon Safe Map: Decouples JSX from JSON
 */
export const ICON_MAP = {
  Mountain,
  Palmtree,
  Trees,
  Waves,
  Compass,
  Heart,
  Award,
  Coffee,
  Sun,
  CloudRain,
  Luggage,
  ShieldCheck,
  Ticket,
  BatteryCharging,
  HeartPulse,
  Shirt,
  Layers,
  Smile,
  Hand,
  Smartphone,
  Glasses,
  Footprints,
  Flashlight,
  Droplet,
  Wind,
  CloudSun
};

/**
 * Safely resolves Lucide icon component by name string
 */
export const getLucideIcon = (iconName, fallback = Compass) => {
  return ICON_MAP[iconName] || fallback;
};

/**
 * Normalize any arbitrary destination/location string into canonical slug
 */
export const normalizeDestinationSlug = (input = '') => {
  const q = String(input || '').toLowerCase().trim();
  if (!q) return 'meghalaya';

  if (q.includes('meghalaya') || q.includes('shillong') || q.includes('cherrapunji') || q.includes('dawki') || q.includes('nongriat') || q.includes('guwahati') || q.includes('jowai')) {
    return 'meghalaya';
  }
  if (q.includes('spiti') || q.includes('kaza') || q.includes('tabo') || q.includes('chandratal') || q.includes('hikkim') || q.includes('komic') || q.includes('langza') || q.includes('kalpa')) {
    return 'spiti-valley';
  }
  if (q.includes('bali') || q.includes('indonesia') || q.includes('nusa penida') || q.includes('canggu') || q.includes('ubud') || q.includes('seminyak') || q.includes('gili')) {
    return 'bali';
  }
  if (q.includes('kerala') || q.includes('munnar') || q.includes('alleppey') || q.includes('varkala') || q.includes('wayanad') || q.includes('cochin') || q.includes('thekkady')) {
    return 'kerala';
  }
  if (q.includes('kashmir') || q.includes('srinagar') || q.includes('gulmarg') || q.includes('pahalgam') || q.includes('sonamarg') || q.includes('dal lake')) {
    return 'kashmir';
  }
  if (q.includes('ladakh') || q.includes('leh') || q.includes('pangong') || q.includes('nubra') || q.includes('khardung') || q.includes('zanskar') || q.includes('hanle')) {
    return 'ladakh';
  }
  if (q.includes('goa') || q.includes('panaji') || q.includes('calangute') || q.includes('palolem') || q.includes('anjuna') || q.includes('vagator') || q.includes('fontainhas')) {
    return 'goa';
  }
  if (q.includes('rajasthan') || q.includes('jaipur') || q.includes('udaipur') || q.includes('jaisalmer') || q.includes('jodhpur') || q.includes('pushkar') || q.includes('mount abu')) {
    return 'rajasthan';
  }
  if (q.includes('himachal') || q.includes('manali') || q.includes('kasol') || q.includes('jibhi') || q.includes('bir billing') || q.includes('dharamshala') || q.includes('shimla') || q.includes('tirthan')) {
    return 'himachal-pradesh';
  }
  if (q.includes('uttarakhand') || q.includes('rishikesh') || q.includes('kedarnath') || q.includes('chopta') || q.includes('auli') || q.includes('tungnath') || q.includes('dehradun') || q.includes('mussoorie') || q.includes('nainital')) {
    return 'uttarakhand';
  }

  // Fallback to closest match or first destination
  const matched = travelKnowledge.destinations.find(d => 
    q.includes(d.id) || q.includes(d.slug) || q.includes(d.name.toLowerCase()) || q.includes(d.state.toLowerCase())
  );

  return matched ? matched.slug : 'meghalaya';
};

/**
 * Get all destinations with full structured metadata
 */
export const getDestinations = () => {
  return travelKnowledge.destinations || [];
};

/**
 * Get specific destination metadata by slug or location name
 */
export const getDestinationBySlug = (slugOrName = '') => {
  const canonicalSlug = normalizeDestinationSlug(slugOrName);
  return travelKnowledge.destinations.find(d => d.slug === canonicalSlug) || travelKnowledge.destinations[0];
};

/**
 * Get all standardized travel styles / moods
 */
export const getTravelStyles = () => {
  return travelKnowledge.travelStyles || [];
};

/**
 * Get current season context from date
 */
export const getSeasonContext = (date = new Date()) => {
  const month = date.getMonth() + 1; // 1-12

  for (const season of Object.values(travelKnowledge.seasons || {})) {
    if (season.months.includes(month)) {
      return season;
    }
  }

  return travelKnowledge.seasons.spring;
};

/**
 * Get destination weather profile safely
 */
export const getDestinationWeather = (locationString = '') => {
  const dest = getDestinationBySlug(locationString);
  if (dest && dest.weatherProfile) {
    return dest.weatherProfile;
  }

  return {
    temp: '22°C',
    condition: 'Pleasant & Clear',
    humidity: '60%',
    iconType: 'Sun',
    statusTag: 'Great Travel Window',
    bestMonthsText: 'Year Round',
    vibe: 'Ideal conditions for outdoor adventure and sightseeing.'
  };
};

/**
 * Get active occasion / holiday window from date
 */
export const getActiveOccasionContext = (date = new Date()) => {
  const currentMonth = date.getMonth() + 1;
  const occasions = travelKnowledge.occasions || [];

  for (const occasion of occasions) {
    if (occasion.startMonth <= occasion.endMonth) {
      if (currentMonth >= occasion.startMonth && currentMonth <= occasion.endMonth) {
        return occasion;
      }
    } else {
      if (currentMonth >= occasion.startMonth || currentMonth <= occasion.endMonth) {
        return occasion;
      }
    }
  }

  return occasions[0] || null;
};

/**
 * Generate complete structured packing recommendations
 */
export const getPackingRecommendations = (destinationInput, weather, season, isTrekking = false) => {
  const dest = getDestinationBySlug(destinationInput);
  const rules = travelKnowledge.packingRules || {};

  const items = [...(rules.base || [])];

  const tempNum = parseInt(weather?.temp || '22', 10);
  const isCold = tempNum < 16 || ['spiti-valley', 'ladakh', 'kashmir'].includes(dest.slug);
  const isRain = (weather?.condition || '').toLowerCase().includes('rain') || ['meghalaya', 'kerala'].includes(dest.slug);
  const isBeach = ['bali', 'goa'].includes(dest.slug);

  if (isCold && rules.cold) {
    items.push(...rules.cold);
  }
  if (isRain && rules.rain) {
    items.push(...rules.rain);
  }
  if (isBeach && rules.beach) {
    items.push(...rules.beach);
  }
  if ((isTrekking || dest.travelStyles.includes('adventure')) && rules.trekking) {
    items.push(...rules.trekking);
  }

  return items;
};

/**
 * Compact AI Context Selector: Builds token-efficient payload (< 3KB) for Gemini AI
 */
export const buildAITravelContext = ({
  destination = 'Meghalaya',
  duration = 5,
  travelers = 2,
  style = 'Adventure',
  pace = 'Balanced',
  budget = 'Moderate',
  customPreferences = '',
  realTrips = []
}) => {
  const dest = getDestinationBySlug(destination);
  const season = getSeasonContext();
  const weather = getDestinationWeather(destination);
  const aiPlannerConfig = travelKnowledge.aiPlanner || {};

  // Extract matching real trips from catalog without overloading context
  const matchedPackages = (realTrips || [])
    .filter(t => {
      const loc = (t.location || '').toLowerCase();
      const title = (t.title || '').toLowerCase();
      const q = dest.slug.replace(/-/g, ' ');
      return loc.includes(q) || title.includes(q) || loc.includes(dest.name.toLowerCase());
    })
    .slice(0, 3)
    .map(t => ({
      id: t.id,
      title: t.title,
      price: t.price,
      duration: t.duration,
      rating: t.rating
    }));

  return {
    destinationContext: {
      name: dest.name,
      slug: dest.slug,
      region: dest.region,
      state: dest.state,
      bestMonths: dest.bestMonths,
      summary: dest.summary,
      attractions: dest.attractions,
      foodDelicacies: dest.food,
      aiNotes: dest.aiContext?.travelNotes || [],
      planningHints: dest.aiContext?.planningHints || []
    },
    seasonContext: {
      currentSeason: season.name,
      weatherAdvice: season.weatherAdvice,
      weather: weather
    },
    userPreferences: {
      duration: Number(duration),
      travelers: Number(travelers),
      travelStyle: style,
      pace: pace,
      budgetLevel: budget,
      customPreferences: customPreferences
    },
    planningRules: aiPlannerConfig.basePlanningRules || [],
    availableCatalogPackages: matchedPackages
  };
};

/**
 * Normalize single trip object to guarantee all expected fields exist
 */
export const normalizeTripObject = (t) => {
  if (!t || typeof t !== 'object') return null;
  const rawId = t.id !== undefined && t.id !== null ? t.id : (t._id || t.slug);
  const cleanId = typeof rawId === 'number' ? rawId : String(rawId);
  const price = Number(t.price) || 18500;
  const originalPrice = Number(t.originalPrice) || Math.round(price * 1.2);

  return {
    ...t,
    id: cleanId,
    _id: t._id || cleanId,
    title: t.title || 'Curated Expedition',
    slug: t.slug || String(t.title || 'trip').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    location: t.location || t.destination || 'India',
    destination: t.destination || 'India',
    duration: t.duration || `${t.days || 5}D/${t.nights || 4}N`,
    days: t.days || 5,
    nights: t.nights || 4,
    price,
    originalPrice,
    discount: t.discount || Math.round(((originalPrice - price) / (originalPrice || 1)) * 100),
    image: t.image || t.heroImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
    heroImage: t.heroImage || t.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200',
    gallery: Array.isArray(t.gallery) && t.gallery.length > 0 ? t.gallery : [t.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'],
    rating: Number(t.rating) || 4.8,
    reviews: Number(t.reviews) || 24,
    tags: Array.isArray(t.tags) && t.tags.length > 0 ? t.tags : ['Backpacking', 'Adventure'],
    category: t.category || 'Backpacking',
    mood: t.mood || 'Adventure',
    overview: t.overview || t.shortDescription || '',
    nextBatch: t.nextBatch || '15 Sep',
    availableBatches: Array.isArray(t.availableBatches) && t.availableBatches.length > 0 ? t.availableBatches : [
      { id: `b-${cleanId}-1`, dates: t.nextBatch || '15 Sep - 20 Sep, 2026', seatsLeft: 8, status: 'Available' }
    ],
    itinerary: Array.isArray(t.itinerary) ? t.itinerary : [],
    inclusions: Array.isArray(t.inclusions) ? t.inclusions : [],
    exclusions: Array.isArray(t.exclusions) ? t.exclusions : [],
    faqs: Array.isArray(t.faqs) ? t.faqs : [],
    isActive: t.isActive !== false && t.status !== 'inactive'
  };
};

/**
 * Get all trips from the static central knowledge base
 */
export const getAllStaticTrips = () => {
  const base = (travelKnowledge.trips && travelKnowledge.trips.length > 0) ? travelKnowledge.trips : (UPCOMING_TRIPS || []);
  return base.map(normalizeTripObject).filter(Boolean);
};

/**
 * Merge live MongoDB trips with knowledge base trips seamlessly
 */
export const mergeTripsWithLive = (liveTrips = []) => {
  const staticTrips = getAllStaticTrips();
  if (!Array.isArray(liveTrips) || liveTrips.length === 0) {
    return staticTrips;
  }

  const mergedMap = new Map();

  // 1. Add all static knowledge trips
  staticTrips.forEach(t => {
    const key = String(t.slug || t.id);
    mergedMap.set(key, t);
  });

  // 2. Overlay / add live MongoDB trips
  liveTrips.forEach(raw => {
    const t = normalizeTripObject(raw);
    if (t) {
      const key = String(t.slug || t._id || t.id);
      mergedMap.set(key, t);
    }
  });

  return Array.from(mergedMap.values());
};

export default {
  getDestinations,
  getDestinationBySlug,
  normalizeDestinationSlug,
  getTravelStyles,
  getSeasonContext,
  getDestinationWeather,
  getActiveOccasionContext,
  getPackingRecommendations,
  buildAITravelContext,
  getAllStaticTrips,
  mergeTripsWithLive,
  getLucideIcon,
  ICON_MAP
};
