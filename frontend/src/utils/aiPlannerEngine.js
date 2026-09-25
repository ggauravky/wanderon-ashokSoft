// ================================================================
// DYNAMIC AI ITINERARY & TRAVEL PLANNER GENERATION ENGINE
// Sourced from Central Travel Knowledge Base
// ================================================================

import * as apiService from '../services/api.js';

const { generateAIItineraryApi } = apiService;

/**
 * Generate a complete, intelligent, personalized travel itinerary
 * Calls secure Backend Gemini API first, falling back to central travel knowledge
 */
export const generateAIItinerary = async ({
  destination = '',
  days = 5,
  travelers = 2,
  pace = 'Balanced',
  mood = 'Adventure',
  budgetLevel = 'Moderate',
  customPreferences = '',
  origin = '',
  interests = [],
  budgetAmount = null,
  travelersBreakdown = null,
  dietary = [],
  stayPreference = '',
  transportPreference = '',
  mobilityConstraints = [],
  mustInclude = [],
  avoid = [],
  plannerContext = {}
}) => {
  try {
    const serverResult = await generateAIItineraryApi({
      destination,
      days: Number(days),
      travelers: Number(travelers),
      pace,
      mood,
      budgetLevel,
      customPreferences,
      origin,
      interests,
      budgetAmount,
      travelersBreakdown,
      dietary,
      stayPreference,
      transportPreference,
      mobilityConstraints,
      mustInclude,
      avoid,
      plannerContext
    });

    if (serverResult && serverResult.days && serverResult.days.length > 0) {
      return {
        ...serverResult,
        daysCount: serverResult.duration || Number(days),
        itineraryDays: serverResult.days,
        plannerContext: serverResult.plannerContext || plannerContext,
        weather: serverResult.weather || {}
      };
    }
    throw new Error('The generated plan was not persisted. Please retry.');
  } catch (apiErr) {
    throw new Error(apiErr.message || 'The itinerary could not be safely stored. Please retry.');
  }
};

/**
 * Natural language prompt parser that extracts travel parameters
 */
export const extractTripInfoFromPrompt = (promptText = '') => {
  const raw = (promptText || '').trim();
  const text = raw.toLowerCase();
  const result = {
    destination: '',
    duration: 7,
    travelers: { adults: 2, children: 0, infants: 0, seniors: 0 },
    tripType: 'Couple',
    startDate: '',
    flexibleMonth: 'July 2026',
    budgetTier: 'Comfort',
    budgetAmount: 45000,
    budgetLevel: 'Moderate',
    pace: 'Balanced',
    paceRhythm: 'Chill Starts (9:00 AM)',
    interests: ['monasteries', 'scenic viewpoints', 'photography'],
    stayPreference: 'Homestay 🏡',
    customPreferences: raw,
    missingFields: []
  };

  if (!raw) return result;

  // Comprehensive destinations dictionary
  const destMap = [
    { key: 'spiti valley', name: 'Spiti Valley' },
    { key: 'spiti', name: 'Spiti Valley' },
    { key: 'bali & penida', name: 'Bali' },
    { key: 'nusa penida', name: 'Bali' },
    { key: 'bali', name: 'Bali' },
    { key: 'meghalaya', name: 'Meghalaya' },
    { key: 'shillong', name: 'Meghalaya' },
    { key: 'cherrapunji', name: 'Meghalaya' },
    { key: 'dawki', name: 'Meghalaya' },
    { key: 'kashmir', name: 'Kashmir' },
    { key: 'srinagar', name: 'Kashmir' },
    { key: 'gulmarg', name: 'Kashmir' },
    { key: 'pahalgam', name: 'Kashmir' },
    { key: 'ladakh', name: 'Ladakh' },
    { key: 'leh', name: 'Ladakh' },
    { key: 'pangong', name: 'Ladakh' },
    { key: 'nubra', name: 'Ladakh' },
    { key: 'kasol', name: 'Himachal' },
    { key: 'jibhi', name: 'Himachal' },
    { key: 'manali', name: 'Himachal' },
    { key: 'tirthan', name: 'Himachal' },
    { key: 'dharamshala', name: 'Himachal' },
    { key: 'bir billing', name: 'Himachal' },
    { key: 'shimla', name: 'Himachal' },
    { key: 'himachal', name: 'Himachal' },
    { key: 'kerala', name: 'Kerala' },
    { key: 'munnar', name: 'Kerala' },
    { key: 'alleppey', name: 'Kerala' },
    { key: 'varkala', name: 'Kerala' },
    { key: 'wayanad', name: 'Kerala' },
    { key: 'thailand', name: 'Thailand' },
    { key: 'phuket', name: 'Thailand' },
    { key: 'bangkok', name: 'Thailand' },
    { key: 'krabi', name: 'Thailand' },
    { key: 'japan', name: 'Japan' },
    { key: 'tokyo', name: 'Japan' },
    { key: 'kyoto', name: 'Japan' },
    { key: 'maldives', name: 'Maldives' },
    { key: 'vietnam', name: 'Vietnam' },
    { key: 'hanoi', name: 'Vietnam' },
    { key: 'da nang', name: 'Vietnam' },
    { key: 'dubai', name: 'Dubai' },
    { key: 'uae', name: 'Dubai' },
    { key: 'australia', name: 'Australia' },
    { key: 'melbourne', name: 'Australia' },
    { key: 'sydney', name: 'Australia' },
    { key: 'bhutan', name: 'Bhutan' },
    { key: 'sri lanka', name: 'Sri Lanka' },
    { key: 'nepal', name: 'Nepal' },
    { key: 'goa', name: 'Goa' },
    { key: 'gokarna', name: 'Goa' },
    { key: 'rishikesh', name: 'Uttarakhand' },
    { key: 'kedarnath', name: 'Uttarakhand' },
    { key: 'chopta', name: 'Uttarakhand' },
    { key: 'auli', name: 'Uttarakhand' },
    { key: 'nainital', name: 'Uttarakhand' },
    { key: 'mussoorie', name: 'Uttarakhand' },
    { key: 'uttarakhand', name: 'Uttarakhand' },
    { key: 'jaipur', name: 'Rajasthan' },
    { key: 'udaipur', name: 'Rajasthan' },
    { key: 'jodhpur', name: 'Rajasthan' },
    { key: 'jaisalmer', name: 'Rajasthan' },
    { key: 'pushkar', name: 'Rajasthan' },
    { key: 'rajasthan', name: 'Rajasthan' },
    { key: 'andaman', name: 'Andaman' },
    { key: 'havelock', name: 'Andaman' },
    { key: 'varanasi', name: 'Varanasi' },
    { key: 'hampi', name: 'Hampi' },
    { key: 'coorg', name: 'Coorg' },
    { key: 'pondicherry', name: 'Pondicherry' }
  ];

  let detectedDest = null;
  for (const item of destMap) {
    if (text.includes(item.key)) {
      detectedDest = item.name;
      break;
    }
  }

  // Fallback candidate extraction for custom destinations
  if (!detectedDest) {
    const rawClean = raw.replace(/[^a-zA-Z\s]/g, ' ').trim();
    const words = rawClean.split(/\s+/).filter(w => {
      const lower = w.toLowerCase();
      return !['trip', 'tour', 'day', 'days', 'road', 'weekend', 'the', 'a', 'an', 'to', 'for', 'in', 'with', 'plan', 'planner', 'my', 'custom', 'explore', 'visit', 'book'].includes(lower) && w.length > 1;
    });
    if (words.length > 0 && words.length <= 3) {
      detectedDest = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }

  result.destination = detectedDest || 'Spiti Valley';

  // Duration extraction
  const daysMatch = text.match(/(\d+)\s*(?:days?|d|nights?|n)/i);
  if (daysMatch && daysMatch[1]) {
    const num = parseInt(daysMatch[1], 10);
    if (num >= 1 && num <= 30) result.duration = num;
  } else if (text.includes('weekend')) {
    result.duration = 3;
  } else if (text.includes('fortnight') || text.includes('2 weeks') || text.includes('two weeks')) {
    result.duration = 14;
  } else if (text.includes('week') || text.includes('1 week') || text.includes('one week')) {
    result.duration = 7;
  }

  // Travelers & Trip Type
  if (text.includes('solo') || text.includes('myself') || text.includes('alone') || text.includes('single')) {
    result.tripType = 'Solo';
    result.travelers = { adults: 1, children: 0, infants: 0, seniors: 0 };
  } else if (text.includes('couple') || text.includes('partner') || text.includes('wife') || text.includes('husband') || text.includes('romantic') || text.includes('honeymoon')) {
    result.tripType = 'Couple';
    result.travelers = { adults: 2, children: 0, infants: 0, seniors: 0 };
  } else if (text.includes('friends') || text.includes('friend') || text.includes('buddies') || text.includes('gang') || text.includes('squad') || text.includes('group') || text.includes('boys') || text.includes('girls')) {
    result.tripType = 'Friends';
    result.travelers = { adults: 4, children: 0, infants: 0, seniors: 0 };
  } else if (text.includes('family') || text.includes('kids') || text.includes('children') || text.includes('parents')) {
    result.tripType = 'Family';
    result.travelers = { adults: 2, children: 1, infants: 0, seniors: 0 };
  }

  // Budget
  if (text.includes('luxury') || text.includes('premium') || text.includes('5 star') || text.includes('resort') || text.includes('villa')) {
    result.budgetTier = 'Luxury';
    result.budgetLevel = 'Luxury';
    result.budgetAmount = 85000;
  } else if (text.includes('budget') || text.includes('cheap') || text.includes('backpacker') || text.includes('hostel') || text.includes('pocket')) {
    result.budgetTier = 'Backpacker';
    result.budgetLevel = 'Budget';
    result.budgetAmount = 22000;
  }

  // Pace
  if (text.includes('relaxed') || text.includes('chill') || text.includes('slow') || text.includes('peaceful') || text.includes('leisure') || text.includes('calm')) {
    result.pace = 'Relaxed';
    result.paceRhythm = 'Chill Starts (9:00 AM)';
  } else if (text.includes('packed') || text.includes('intense') || text.includes('fast') || text.includes('adventure') || text.includes('trek')) {
    result.pace = 'Packed';
    result.paceRhythm = 'Sunrise Early (6:00 AM)';
  }

  // Interests
  const interestKeywords = [
    { key: 'trek', tag: 'trekking' },
    { key: 'hike', tag: 'trekking' },
    { key: 'monaster', tag: 'monasteries' },
    { key: 'temple', tag: 'heritage' },
    { key: 'culture', tag: 'culture' },
    { key: 'beach', tag: 'beaches' },
    { key: 'water sport', tag: 'water sports' },
    { key: 'scuba', tag: 'scuba diving' },
    { key: 'snorkel', tag: 'snorkeling' },
    { key: 'cafe', tag: 'cafe hopping' },
    { key: 'food', tag: 'local cuisine' },
    { key: 'photo', tag: 'photography' },
    { key: 'stargaz', tag: 'stargazing' },
    { key: 'sunset', tag: 'sunset viewpoints' },
    { key: 'wildlife', tag: 'wildlife' },
    { key: 'safari', tag: 'safari' },
    { key: 'road trip', tag: 'road trip' },
    { key: 'pass', tag: 'high passes' }
  ];

  const foundInterests = [];
  for (const item of interestKeywords) {
    if (text.includes(item.key)) {
      foundInterests.push(item.tag);
    }
  }
  if (foundInterests.length > 0) {
    result.interests = Array.from(new Set(foundInterests));
  }

  // Stays
  if (text.includes('homestay')) result.stayPreference = 'Homestay 🏡';
  else if (text.includes('resort')) result.stayPreference = 'Luxury Resort 🏨';
  else if (text.includes('camp') || text.includes('glamping') || text.includes('tent')) result.stayPreference = 'Glamping / Camp ⛺';
  else if (text.includes('hostel')) result.stayPreference = 'Boutique Hostel 🎒';
  else if (text.includes('hotel')) result.stayPreference = 'Boutique Hotel ✨';

  return result;
};

export default {
  generateAIItinerary,
  extractTripInfoFromPrompt
};
