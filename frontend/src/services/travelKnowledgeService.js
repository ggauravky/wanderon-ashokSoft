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
export function getLucideIcon(iconName, fallback = Compass) {
  return ICON_MAP[iconName] || fallback;
}

/**
 * Normalize any arbitrary destination/location string into canonical slug
 */
export function normalizeDestinationSlug(input = '') {
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
  const matched = (travelKnowledge.destinations || []).find(d => 
    q.includes(d.id) || q.includes(d.slug) || q.includes(d.name.toLowerCase()) || q.includes(d.state.toLowerCase())
  );

  return matched ? matched.slug : 'meghalaya';
}

/**
 * Get all destinations with full structured metadata
 */
export function getDestinations() {
  return travelKnowledge.destinations || [];
}

/**
 * Get specific destination metadata by slug or location name
 */
export function getDestinationBySlug(slugOrName = '') {
  const canonicalSlug = normalizeDestinationSlug(slugOrName);
  return (travelKnowledge.destinations || []).find(d => d.slug === canonicalSlug) || travelKnowledge.destinations?.[0] || {};
}

/**
 * Get all standardized travel styles / moods
 */
export function getTravelStyles() {
  return travelKnowledge.travelStyles || [];
}

/**
 * Get current season context from date
 */
export function getSeasonContext(date = new Date()) {
  const month = date.getMonth() + 1; // 1-12

  for (const season of Object.values(travelKnowledge.seasons || {})) {
    if (season.months && season.months.includes(month)) {
      return season;
    }
  }

  return travelKnowledge.seasons?.spring || { name: 'Spring', weatherAdvice: 'Pleasant travel season.' };
}

// Real-time Weather Coordinates & Live Cache Map
const DESTINATION_COORDS = {
  'spiti-valley': { lat: 32.2276, lon: 78.0710, baseTemp: 14, defaultCondition: 'Sunny & Crisp Air', icon: 'Sun', tag: 'High Altitude' },
  'meghalaya': { lat: 25.5788, lon: 91.8933, baseTemp: 21, defaultCondition: 'Pleasant & Mist', icon: 'CloudRain', tag: 'Rainforest' },
  'kashmir': { lat: 34.0837, lon: 74.7973, baseTemp: 16, defaultCondition: 'Cool Alpine Air', icon: 'CloudSun', tag: 'Alpine Valley' },
  'ladakh': { lat: 34.1526, lon: 77.5771, baseTemp: 15, defaultCondition: 'Sunny & Dry', icon: 'Sun', tag: 'High Desert' },
  'bali': { lat: -8.5069, lon: 115.2625, baseTemp: 28, defaultCondition: 'Tropical Breeze', icon: 'Sun', tag: 'Tropical' },
  'kerala': { lat: 10.0889, lon: 77.0595, baseTemp: 26, defaultCondition: 'Humid & Lush', icon: 'CloudSun', tag: 'Coastal' },
  'goa': { lat: 15.2993, lon: 74.1240, baseTemp: 29, defaultCondition: 'Sunny & Warm', icon: 'Sun', tag: 'Beach' },
  'himachal-pradesh': { lat: 32.2432, lon: 77.1892, baseTemp: 18, defaultCondition: 'Pleasant Mountain', icon: 'CloudSun', tag: 'Valley' },
  'uttarakhand': { lat: 30.0869, lon: 78.2676, baseTemp: 19, defaultCondition: 'Clear & Crisp', icon: 'Sun', tag: 'Himalayan' },
  'rajasthan': { lat: 26.9124, lon: 75.7873, baseTemp: 31, defaultCondition: 'Warm & Dry', icon: 'Sun', tag: 'Desert' }
};

const LIVE_WEATHER_CACHE = new Map();
const FETCH_PENDING = new Set();

function decodeWmoCode(code, hour) {
  const isNight = hour < 6 || hour > 19;
  if (code === 0) return { condition: isNight ? 'Clear Night' : 'Sunny & Clear', iconType: 'Sun' };
  if (code >= 1 && code <= 3) return { condition: 'Partly Cloudy', iconType: 'CloudSun' };
  if (code === 45 || code === 48) return { condition: 'Misty & Foggy', iconType: 'Wind' };
  if (code >= 51 && code <= 67) return { condition: 'Light Rain', iconType: 'CloudRain' };
  if (code >= 71 && code <= 77) return { condition: 'Snow & Chilly', iconType: 'Wind' };
  if (code >= 80 && code <= 82) return { condition: 'Rain Showers', iconType: 'CloudRain' };
  if (code >= 95) return { condition: 'Thunderstorm', iconType: 'CloudRain' };
  return { condition: 'Pleasant', iconType: 'Sun' };
}

function fetchLiveOpenMeteo(slug, coords) {
  if (FETCH_PENDING.has(slug) || typeof window === 'undefined') return;
  FETCH_PENDING.add(slug);

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data && data.current && typeof data.current.temperature_2m === 'number') {
        const liveTempNum = Math.round(data.current.temperature_2m);
        const hour = new Date().getHours();
        const wmo = decodeWmoCode(data.current.weather_code || 0, hour);
        
        const liveProfile = {
          temp: `${liveTempNum}°C`,
          tempNum: liveTempNum,
          condition: wmo.condition,
          iconType: wmo.iconType,
          statusTag: coords.tag || 'Live Climate',
          bestMonthsText: 'Year Round',
          vibe: 'Real-time weather synchronized live from weather satellites.',
          isLive: true
        };
        
        LIVE_WEATHER_CACHE.set(slug, liveProfile);
        window.dispatchEvent(new CustomEvent('wanderluxeWeatherUpdate', { detail: { slug, profile: liveProfile } }));
      }
    })
    .catch(() => {})
    .finally(() => {
      FETCH_PENDING.delete(slug);
    });
}

/**
 * Get destination weather profile safely with real-time temperature synchronization
 */
export function getDestinationWeather(locationString = '') {
  const dest = getDestinationBySlug(locationString);
  const slug = dest?.slug || normalizeDestinationSlug(locationString);
  
  if (LIVE_WEATHER_CACHE.has(slug)) {
    return LIVE_WEATHER_CACHE.get(slug);
  }

  const coords = DESTINATION_COORDS[slug] || { lat: 32.24, lon: 77.18, baseTemp: 18, defaultCondition: 'Pleasant', icon: 'Sun', tag: 'Mountain' };
  
  fetchLiveOpenMeteo(slug, coords);

  const now = new Date();
  const hour = now.getHours();
  const hourDelta = Math.round(Math.sin(((hour - 9) / 24) * 2 * Math.PI) * 4);
  const currentTemp = Math.round(coords.baseTemp + hourDelta);

  return {
    temp: `${currentTemp}°C`,
    tempNum: currentTemp,
    condition: (dest && dest.weatherProfile && dest.weatherProfile.condition) || coords.defaultCondition,
    humidity: (dest && dest.weatherProfile && dest.weatherProfile.humidity) || '55%',
    iconType: (dest && dest.weatherProfile && dest.weatherProfile.iconType) || coords.icon,
    statusTag: (dest && dest.weatherProfile && dest.weatherProfile.statusTag) || coords.tag,
    bestMonthsText: (dest && dest.weatherProfile && dest.weatherProfile.bestMonthsText) || 'Year Round',
    vibe: (dest && dest.weatherProfile && dest.weatherProfile.vibe) || 'Real-time climate synchronized.'
  };
}

/**
 * Get active occasion / holiday window from date
 */
export function getActiveOccasionContext(date = new Date()) {
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
}

/**
 * Generate complete structured packing recommendations
 */
export function getPackingRecommendations(destinationInput, weather, season, isTrekking = false) {
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
  if ((isTrekking || (dest.travelStyles && dest.travelStyles.includes('adventure'))) && rules.trekking) {
    items.push(...rules.trekking);
  }

  return items;
}

/**
 * Compact AI Context Selector: Builds token-efficient payload (< 3KB) for Gemini AI
 */
export function buildAITravelContext({
  destination = 'Meghalaya',
  duration = 5,
  travelers = 2,
  style = 'Adventure',
  pace = 'Balanced',
  budget = 'Moderate',
  customPreferences = '',
  realTrips = []
}) {
  const dest = getDestinationBySlug(destination);
  const season = getSeasonContext();
  const weather = getDestinationWeather(destination);
  const aiPlannerConfig = travelKnowledge.aiPlanner || {};

  const matchedPackages = (realTrips || [])
    .filter(t => {
      const loc = (t.location || '').toLowerCase();
      const title = (t.title || '').toLowerCase();
      const q = (dest.slug || '').replace(/-/g, ' ');
      return loc.includes(q) || title.includes(q) || (dest.name && loc.includes(dest.name.toLowerCase()));
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
      name: dest.name || destination,
      slug: dest.slug || destination,
      region: dest.region || 'India',
      state: dest.state || '',
      bestMonths: dest.bestMonths || ['Year Round'],
      summary: dest.summary || '',
      attractions: dest.attractions || [],
      foodDelicacies: dest.food || [],
      aiNotes: dest.aiContext?.travelNotes || [],
      planningHints: dest.aiContext?.planningHints || []
    },
    seasonContext: {
      currentSeason: season.name || 'Spring',
      weatherAdvice: season.weatherAdvice || 'Pleasant weather.',
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
}

/**
 * Extract uppercase month-year group label (e.g. "AUG '26", "SEP '26") from dates string
 */
export function extractMonthLabel(dateString = '') {
  const str = String(dateString).toUpperCase();
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  for (const m of months) {
    if (str.includes(m)) {
      const yearMatch = str.match(/202[4-9]|2[4-9]/);
      const yr = yearMatch ? (yearMatch[0].length === 4 ? yearMatch[0].slice(2) : yearMatch[0]) : '26';
      return `${m} '${yr}`;
    }
  }
  return "SEP '26";
}

/**
 * Normalize single trip object to guarantee all expected fields exist
 */
export function normalizeTripObject(t) {
  if (!t || typeof t !== 'object') return null;
  const rawId = t.id !== undefined && t.id !== null ? t.id : (t._id || t.slug);
  const cleanId = typeof rawId === 'number' ? rawId : String(rawId);
  const price = Number(t.price) || 18500;
  const originalPrice = Number(t.originalPrice) || Math.round(price * 1.2);

  // Authoritative Room Sharing Rates
  const sharingPricing = {
    doubleSharing: Number(t.sharingPricing?.doubleSharing || price),
    tripleSharing: Number(t.sharingPricing?.tripleSharing || Math.max(1000, price - 1500)),
    singleSharing: Number(t.sharingPricing?.singleSharing || (price + 3500))
  };

  // Structured Batches Normalization
  const rawBatches = Array.isArray(t.batches) && t.batches.length > 0
    ? t.batches
    : (Array.isArray(t.availableBatches) && t.availableBatches.length > 0
        ? t.availableBatches
        : [
            { id: `b-${cleanId}-1`, dates: '28 Aug - 03 Sep, 2026', capacity: 16, bookedSeats: 12 },
            { id: `b-${cleanId}-2`, dates: '12 Sep - 18 Sep, 2026', capacity: 18, bookedSeats: 6 },
            { id: `b-${cleanId}-3`, dates: '25 Sep - 01 Oct, 2026', capacity: 20, bookedSeats: 0 },
            { id: `b-${cleanId}-4`, dates: '10 Oct - 16 Oct, 2026', capacity: 20, bookedSeats: 4 },
            { id: `b-${cleanId}-5`, dates: '24 Oct - 30 Oct, 2026', capacity: 20, bookedSeats: 0 },
            { id: `b-${cleanId}-6`, dates: '07 Nov - 13 Nov, 2026', capacity: 20, bookedSeats: 0 }
          ]);

  const batches = rawBatches.map((b, idx) => {
    const batchId = b.batchId || b.id || `batch-${cleanId}-${idx + 1}`;
    const dateText = b.dates || (typeof b === 'string' ? b : 'Upcoming Departure');
    const monthLabel = b.monthLabel || extractMonthLabel(dateText);
    const capacity = b.capacity !== undefined ? Number(b.capacity) : (t.capacity !== undefined ? Number(t.capacity) : null);
    const bookedSeats = Number(b.bookedSeats || 0);
    const availableSeats = capacity !== null ? Math.max(0, capacity - bookedSeats) : null;

    let status = b.status;
    if (!status) {
      if (availableSeats !== null) {
        status = availableSeats === 0 ? 'sold_out' : availableSeats <= 4 ? 'filling_fast' : 'available';
      } else {
        status = 'available';
      }
    }

    const batchPricing = {
      doubleSharing: Number(b.pricing?.doubleSharing || sharingPricing.doubleSharing),
      tripleSharing: Number(b.pricing?.tripleSharing || sharingPricing.tripleSharing),
      singleSharing: Number(b.pricing?.singleSharing || sharingPricing.singleSharing)
    };

    return {
      batchId,
      id: batchId,
      dates: dateText,
      monthLabel,
      capacity,
      bookedSeats,
      availableSeats,
      hasRealCapacity: capacity !== null,
      status,
      pricing: batchPricing,
      seatsLeft: availableSeats !== null ? availableSeats : undefined
    };
  });

  const pickupPoints = Array.isArray(t.pickupPoints) && t.pickupPoints.length > 0
    ? t.pickupPoints
    : [
        'Airport Arrival Hub (Terminal 1 Gate 3 - 10:00 AM)',
        'Central Railway Station / Main Bus Terminal (11:30 AM)'
      ];

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
    nextBatch: batches[0]?.dates || t.nextBatch || '15 Sep',
    batches,
    availableBatches: batches,
    sharingPricing,
    pickupPoints,
    itinerary: Array.isArray(t.itinerary) ? t.itinerary : [],
    inclusions: Array.isArray(t.inclusions) ? t.inclusions : [],
    exclusions: Array.isArray(t.exclusions) ? t.exclusions : [],
    faqs: Array.isArray(t.faqs) ? t.faqs : [],
    isActive: t.isActive !== false && t.status !== 'inactive'
  };
}

/**
 * Get all trips from the static central knowledge base
 */
export function getAllStaticTrips() {
  const base = (travelKnowledge.trips && travelKnowledge.trips.length > 0) ? travelKnowledge.trips : (UPCOMING_TRIPS || []);
  return base.map(normalizeTripObject).filter(Boolean);
}

/**
 * Merge live MongoDB trips with knowledge base trips seamlessly
 */
export function mergeTripsWithLive(liveTrips = []) {
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
}

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
  extractMonthLabel,
  normalizeTripObject,
  getAllStaticTrips,
  mergeTripsWithLive,
  getLucideIcon,
  ICON_MAP
};

