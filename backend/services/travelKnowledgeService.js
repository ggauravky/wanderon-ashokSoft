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

  const matched = travelKnowledge.destinations.find(d => 
    q.includes(d.id) || q.includes(d.slug) || q.includes(d.name.toLowerCase()) || q.includes(d.state.toLowerCase())
  );

  return matched ? matched.slug : 'meghalaya';
};

export const getDestinations = () => travelKnowledge.destinations || [];

export const getDestinationBySlug = (slugOrName = '') => {
  const canonicalSlug = normalizeDestinationSlug(slugOrName);
  return travelKnowledge.destinations.find(d => d.slug === canonicalSlug) || travelKnowledge.destinations[0];
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
  destination = 'Meghalaya',
  duration = 5,
  travelers = 2,
  style = 'Adventure',
  pace = 'Balanced',
  budget = 'Moderate',
  customPreferences = '',
  matchedTrip = null
}) => {
  const dest = getDestinationBySlug(destination);
  const season = getSeasonContext();
  const weather = getDestinationWeather(destination);
  const aiPlannerConfig = travelKnowledge.aiPlanner || {};

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
