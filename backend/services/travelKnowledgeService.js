import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../data/travelKnowledge.json');
const rawData = fs.readFileSync(jsonPath, 'utf8');
const travelKnowledge = JSON.parse(rawData);

/**
 * Normalize any arbitrary destination string into canonical slug
 */
export const normalizeDestinationSlug = (input = '') => {
  const q = String(input || '').toLowerCase().trim();
  if (!q) return null;

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

  // Fallback to closest match — or return raw query slug for dynamic synthesis
  const matched = travelKnowledge.destinations.find(d => 
    q.includes(d.id) || q.includes(d.slug) || q.includes(d.name.toLowerCase()) || q.includes(d.state.toLowerCase())
  );

  return matched ? matched.slug : q.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

export const getDestinations = () => travelKnowledge.destinations || [];

export const getDestinationBySlug = (slugOrName = '') => {
  const canonicalSlug = normalizeDestinationSlug(slugOrName);
  if (!canonicalSlug) return travelKnowledge.destinations[0];
  const found = travelKnowledge.destinations.find(d => d.slug === canonicalSlug);
  if (found) return found;

  // Backend dynamic synthesis for unknown destinations
  const name = slugOrName.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  const slug = slugOrName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    id: slug, slug, name, country: 'Unknown', region: name, state: name,
    summary: `Discover the vibrant culture, iconic landmarks, and local flavors of ${name}.`,
    description: `${name} offers a rich tapestry of history, art, architecture, and gastronomy. A curated travel experience through the best this destination has to offer.`,
    heroImage: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&auto=format&fit=crop&q=80',
    gallery: [],
    bestMonths: ['October', 'November', 'December', 'January', 'February', 'March'],
    seasons: ['autumn', 'winter', 'spring'],
    travelStyles: ['culture', 'heritage', 'gastronomy'],
    weatherSuitability: { sunny: 0.90, cloudy: 0.85, rainy: 0.70, snow: 0.0 },
    weatherProfile: { temp: '28°C', condition: 'Pleasant & Clear', humidity: '55%', iconType: 'Sun', statusTag: 'Great Travel Window', bestMonthsText: 'Year Round', vibe: `Ideal weather for exploring ${name}.` },
    recommendedDurations: [4, 5, 6, 7],
    budgetLevel: ['budget', 'mid-range', 'luxury'],
    defaultDailyCost: { budget: '₹2,000 - ₹3,500', 'mid-range': '₹4,000 - ₹6,000', luxury: '₹8,000 - ₹12,000' },
    attractions: [
      { name: `${name} Signature Landmark`, location: name, type: 'Top Highlight' },
      { name: `${name} Heritage Quarter`, location: name, type: 'Cultural Walk' },
      { name: `${name} Scenic Viewpoint`, location: name, type: 'Panoramic Vista' },
      { name: `${name} Local Market & Food Trail`, location: name, type: 'Gastronomy' },
      { name: `${name} Hidden Gem`, location: name, type: 'Offbeat Discovery' }
    ],
    activities: ['heritage-walks', 'food-tours', 'museum-visits', 'local-market-exploration'],
    food: [`Authentic ${name} regional cuisine`, 'Local street food specialties', 'Traditional sweets & desserts'],
    packingTags: ['comfortable-shoes', 'light-layers', 'sunscreen', 'camera'],
    _synthesized: true
  };
};

export const getTravelStyles = () => travelKnowledge.travelStyles || [];

export const getSeasonContext = (date = new Date()) => {
  const month = date.getMonth() + 1;
  for (const season of Object.values(travelKnowledge.seasons || {})) {
    if (season.months.includes(month)) {
      return season;
    }
  }
  return travelKnowledge.seasons.spring;
};

export const getDestinationWeather = (locationString = '') => {
  const dest = getDestinationBySlug(locationString);
  return dest?.weatherProfile || {
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
 * Compact AI Context Selector: Builds token-efficient payload (< 3KB) for Gemini AI
 */
export const buildAITravelContext = ({
  destination = '',
  duration = 5,
  travelers = 2,
  style = 'Adventure',
  pace = 'Balanced',
  budget = 'Moderate',
  interests = [],
  customPreferences = '',
  matchedTrip = null
}) => {
  const dest = getDestinationBySlug(destination);
  const season = getSeasonContext();
  const weather = getDestinationWeather(destination);
  const aiPlannerConfig = travelKnowledge.aiPlanner || {};

  let prioritizedAttractions = [...(dest.attractions || [])];
  const userInterests = Array.isArray(interests) ? interests : [];
  if (userInterests.length > 0 && prioritizedAttractions.length > 0) {
    const isCulture = userInterests.some(i => typeof i === 'string' && /culture|heritage|food|history/i.test(i));
    const isNature = userInterests.some(i => typeof i === 'string' && /nature|photography|wildlife|view/i.test(i));
    const isAdventure = userInterests.some(i => typeof i === 'string' && /adventure|trek/i.test(i));

    prioritizedAttractions.sort((a, b) => {
      const aText = `${a.name} ${a.location || ''}`.toLowerCase();
      const bText = `${b.name} ${b.location || ''}`.toLowerCase();
      let aScore = 0;
      let bScore = 0;
      if (isCulture) {
        if (/museum|culture|heritage|bazar|market|craft|village|temple|monastery|palace|fort/i.test(aText)) aScore += 5;
        if (/museum|culture|heritage|bazar|market|craft|village|temple|monastery|palace|fort/i.test(bText)) bScore += 5;
      }
      if (isNature) {
        if (/waterfall|falls|lake|river|valley|canyon|root bridge|view|peak/i.test(aText)) aScore += 5;
        if (/waterfall|falls|lake|river|valley|canyon|root bridge|view|peak/i.test(bText)) bScore += 5;
      }
      if (isAdventure) {
        if (/trek|hike|cave|rafting|bridge|pass/i.test(aText)) aScore += 5;
        if (/trek|hike|cave|rafting|bridge|pass/i.test(bText)) bScore += 5;
      }
      return bScore - aScore;
    });
  }

  return {
    destinationContext: {
      name: dest.name,
      slug: dest.slug,
      region: dest.region,
      state: dest.state,
      bestMonths: dest.bestMonths,
      summary: dest.summary,
      attractions: prioritizedAttractions,
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
      interests: userInterests,
      customPreferences: customPreferences
    },
    planningRules: aiPlannerConfig.basePlanningRules || [],
    availableCatalogPackage: matchedTrip ? {
      title: matchedTrip.title,
      price: matchedTrip.price,
      duration: matchedTrip.duration
    } : null
  };
};

export default {
  getDestinations,
  getDestinationBySlug,
  normalizeDestinationSlug,
  getTravelStyles,
  getSeasonContext,
  getDestinationWeather,
  buildAITravelContext
};
