// ================================================================
// CENTRAL TRAVEL CONTEXT & RECOMMENDATION ENGINE
// Consumes Central Travel Knowledge Base
// ================================================================

import { 
  getSeasonContext, 
  getDestinationWeather, 
  getActiveOccasionContext as getCentralOccasionContext,
  getPackingRecommendations,
  getDestinationBySlug,
  normalizeDestinationSlug
} from '../services/travelKnowledgeService.js';
import { getRecentlyViewedTrips, getWishlistIds } from './userHistory.js';

/**
 * 1. Time-of-Day Context
 */
export const getTimeOfDayContext = (date = new Date()) => {
  const hours = date.getHours();

  if (hours >= 5 && hours < 12) {
    return {
      period: 'Morning',
      greeting: 'Good Morning, Explorer',
      heroTitle: 'Start Your Morning Dreaming of Mountain Sunrises',
      heroSubtitle: 'Fresh alpine air, morning mist over living root bridges, and high mountain roadtrips await.',
      ctaText: 'Explore Sunrise Expeditions',
      suggestedQuery: 'Mountains',
      moodVibe: 'Active Exploration'
    };
  } else if (hours >= 12 && hours < 17) {
    return {
      period: 'Afternoon',
      greeting: 'Good Afternoon, Adventurer',
      heroTitle: 'Need a Break? Discover Refreshing Quick Getaways',
      heroSubtitle: 'Escape the routine. Browse verified weekend departures with certified captains and luxury stays.',
      ctaText: 'Browse Quick Getaways',
      suggestedQuery: 'Weekend Trips',
      moodVibe: 'Rejuvenation'
    };
  } else if (hours >= 17 && hours < 22) {
    return {
      period: 'Evening',
      greeting: 'Good Evening, Wanderer',
      heroTitle: 'Your Next Adventure Starts Where the Road Meets the Sunset',
      heroSubtitle: 'Golden hour at Dal Lake, sunset beach clubs in Bali, and star-filled night camps in Spiti.',
      ctaText: 'Plan Your Sunset Trip',
      suggestedQuery: 'Beach',
      moodVibe: 'Golden Hour & Stargazing'
    };
  } else {
    return {
      period: 'Late Night',
      greeting: 'Late Night Travel Dreams',
      heroTitle: 'Where Will Your Dreams Take You Next?',
      heroSubtitle: 'Build a custom multi-day travel route in seconds with our intelligent AI Travel Planner.',
      ctaText: 'Plan with AI Assistant',
      suggestedQuery: 'Adventure',
      moodVibe: 'Bucket-List Dreaming'
    };
  }
};

/**
 * 2. Day-of-Week Context (Weekend vs Weekday planning)
 */
export const getDayOfWeekContext = (date = new Date()) => {
  const day = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const isWeekendPrep = day === 4 || day === 5 || day === 6; // Thu, Fri, Sat

  if (isWeekendPrep) {
    return {
      type: 'weekend_prep',
      badge: 'Weekend Escape Window',
      headline: 'Weekend is Almost Here — 2-3 Day Quick Escapes',
      subtitle: 'Handpicked short weekend trails starting this batch with zero booking hassle.',
      recommendedDurations: ['2N/3D', '3N/4D'],
      primaryCategory: 'Weekend Trips'
    };
  } else {
    return {
      type: 'weekday_planning',
      badge: 'Upcoming Expeditions',
      headline: 'Plan Ahead: Verified 5 to 7-Day Group Departures',
      subtitle: 'Curated trans-Himalayan circuits, tropical beach escapes, and rainforest odysseys.',
      recommendedDurations: ['4N/5D', '5N/6D', '6N/7D', '7N/8D'],
      primaryCategory: 'Adventure'
    };
  }
};

/**
 * 3. Occasion & Calendar Travel Windows from Central Knowledge
 */
export const getActiveOccasionContext = (date = new Date()) => {
  return getCentralOccasionContext(date);
};

/**
 * 4. Deterministic Explainable Recommendation Scoring
 */
export const calculateContextualRecommendations = (trips = [], userPreferences = {}) => {
  try {
    const currentSeason = getSeasonContext() || { recommendedTypes: [] };
    const activeOccasion = getActiveOccasionContext() || { featuredLocations: [], name: 'Season' };
    const dayContext = getDayOfWeekContext() || { type: 'weekday_planning' };
    const recentlyViewed = getRecentlyViewedTrips() || [];
    const wishlistIds = getWishlistIds() || [];

    const recentLocations = (recentlyViewed || [])
      .filter(Boolean)
      .map((t) => (typeof t === 'object' && t?.location ? String(t.location).toLowerCase() : ''))
      .filter(Boolean);

    const preferredMood = userPreferences?.mood ? String(userPreferences.mood).toLowerCase() : '';

    return (trips || []).filter(Boolean).map((trip) => {
      let score = 50; // Base score
      let explainableBadge = null;

      const tripLoc = String(trip.location || '').toLowerCase();
      const tripDest = String(trip.destination || '').toLowerCase();
      const tripCat = String(trip.category || '').toLowerCase();
      const tripTags = (Array.isArray(trip.tags) ? trip.tags : []).map((t) => String(t || '').toLowerCase());

      // Signal 1: Wishlist match (+35)
      if (wishlistIds.some((id) => String(id) === String(trip.id))) {
        score += 35;
        explainableBadge = 'Saved in Wishlist';
      }

      // Signal 2: Recently viewed location match (+25)
      if (recentLocations.some((loc) => loc && (tripLoc.includes(loc) || loc.includes(tripDest)))) {
        score += 25;
        if (!explainableBadge) explainableBadge = 'Based on Your Views';
      }

      // Signal 3: Preferred Mood / Travel Style Match (+30)
      if (preferredMood && (tripCat.includes(preferredMood) || tripTags.some((tag) => tag.includes(preferredMood)))) {
        score += 30;
        if (!explainableBadge) explainableBadge = `Matches Your ${userPreferences.mood} Vibe`;
      }

      // Signal 4: Season match (+20)
      const isSeasonMatch = (currentSeason.recommendedTypes || []).some((type) => {
        const typeLower = String(type || '').toLowerCase();
        return tripTags.includes(typeLower) || tripCat.includes(typeLower);
      });
      if (isSeasonMatch) {
        score += 20;
        if (!explainableBadge) explainableBadge = 'Best This Season';
      }

      // Signal 5: Active Occasion Match (+20)
      if ((activeOccasion.featuredLocations || []).some((loc) => {
        const locLower = String(loc || '').toLowerCase();
        return locLower && (tripLoc.includes(locLower) || tripDest.includes(locLower));
      })) {
        score += 20;
        if (!explainableBadge) explainableBadge = `Great for ${activeOccasion.name ? activeOccasion.name.split(' ')[0] : 'Occasion'}`;
      }

      // Signal 6: Weekend Fit (+15 on Thu-Sat for 2-3D trips)
      if (dayContext.type === 'weekend_prep' && trip.duration && (String(trip.duration).includes('2N/3D') || String(trip.duration).includes('3N/4D'))) {
        score += 15;
        if (!explainableBadge) explainableBadge = 'Perfect Weekend Fit';
      }

      // Signal 7: Weather condition check (+10)
      const weather = getDestinationWeather(trip.location || trip.destination || '');
      if (weather && weather.condition && (String(weather.condition).toLowerCase().includes('sunny') || String(weather.condition).toLowerCase().includes('pleasant'))) {
        score += 10;
        if (!explainableBadge) explainableBadge = 'Great Weather Now';
      }

      // Signal 8: Urgency bonus (+10)
      const isFillingFast = Array.isArray(trip.availableBatches) && trip.availableBatches.some((b) => b && (b.status === 'Filling Fast' || (b.seatsLeft && b.seatsLeft <= 4)));
      if (isFillingFast) {
        score += 10;
        if (!explainableBadge) explainableBadge = 'Filling Fast';
      }

      // Fallback badge
      if (!explainableBadge) {
        explainableBadge = (Number(trip.rating) || 4.8) >= 4.9 ? 'Top Rated 4.9★' : 'Trending Pick';
      }

      return {
        ...trip,
        recommendationScore: score,
        explainableBadge,
        weather
      };
    }).sort((a, b) => (Number(b.recommendationScore) || 0) - (Number(a.recommendationScore) || 0));
  } catch (err) {
    console.warn('Recommendation scoring fallback to raw catalog:', err);
    return trips || [];
  }
};

/**
 * 5. Interactive Dynamic Packing Checklist Generator
 * Sourced directly from Central Travel Knowledge Base
 */
export const generatePackingChecklist = (trip, weather, season) => {
  const loc = trip?.location || trip?.destination || '';
  const isTrekking = (trip?.tags || []).some((t) => String(t).toLowerCase().includes('trek') || String(t).toLowerCase().includes('altitude'));
  const rawItems = getPackingRecommendations(loc, weather, season, isTrekking);

  return rawItems.map((item, idx) => ({
    id: item.id || `p-${idx + 1}`,
    category: item.category || 'Travel Gear',
    name: item.name || item.label || 'Item',
    mandatory: Boolean(item.mandatory),
    defaultChecked: Boolean(item.mandatory && idx < 2),
    icon: item.icon
  }));
};

/**
 * 6. "Who is this trip for?" Persona Analyzer
 */
export const getTripPersonaBadges = (trip) => {
  const cat = String(trip?.category || '').toLowerCase();
  const tags = (trip?.tags || []).map((t) => String(t).toLowerCase());

  const personas = [];
  if (tags.includes('backpacking') || cat === 'backpacking') {
    personas.push({ label: 'Solo Backpackers', desc: '60%+ solo traveler community' });
  }
  if (tags.includes('adventure') || tags.includes('treks') || tags.includes('high altitude')) {
    personas.push({ label: 'Adventure Seekers', desc: 'Certified captain-led trails' });
  }
  if (tags.includes('beach') || tags.includes('nature') || tags.includes('houseboat')) {
    personas.push({ label: 'Couples & Friends', desc: 'Scenic boutique stays & private cabs' });
  }
  if (tags.includes('culture') || tags.includes('royal') || tags.includes('heritage')) {
    personas.push({ label: 'Cultural Explorers', desc: 'Heritage walks & authentic local cuisine' });
  }
  if (trip?.grade === 'Easy' || trip?.ageGroup === 'All Ages') {
    personas.push({ label: 'Relaxed Getaway', desc: 'Comfortable pace for everyone' });
  }

  return personas.slice(0, 3);
};

/**
 * 7. "Why Visit Now?" Contextual Callout (from Central Knowledge)
 */
export const getWhyVisitNow = (trip, season, weather) => {
  const loc = trip?.location || trip?.destination || '';
  const destMeta = getDestinationBySlug(loc);

  if (destMeta && destMeta.aiContext?.travelNotes && destMeta.aiContext.travelNotes.length > 0) {
    return {
      title: `${season.name.split(' ')[0]} Travel Window: ${destMeta.name}`,
      reason: destMeta.aiContext.travelNotes[0]
    };
  }

  return {
    title: `${season.name.split(' ')[0]} Travel Window`,
    reason: `${weather.condition} with ${weather.temp} temperatures — perfectly aligned for outdoor sightseeing.`
  };
};

/**
 * 8. Pre-Trip Countdown & Dashboard Helper
 */
export const getPreTripDashboard = (booking) => {
  if (!booking) return null;

  const targetDateStr = booking.batchDate || booking.tripSnapshot?.batchDates || '2026-09-15';
  const now = new Date();
  
  let departureDate = new Date(2026, 7, 20); // Default fallback
  try {
    const yearMatch = targetDateStr.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0], 10) : 2026;
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthMatch = targetDateStr.toLowerCase().match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);
    const dayMatch = targetDateStr.match(/\b\d{1,2}\b/);

    if (monthMatch && dayMatch) {
      const monthIndex = monthNames.indexOf(monthMatch[0]);
      const dayNum = parseInt(dayMatch[0], 10);
      departureDate = new Date(year, monthIndex, dayNum);
    }
  } catch (e) {
    // Keep fallback
  }

  const diffTime = departureDate.getTime() - now.getTime();
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const tripTitle = booking.tripTitle || booking.tripSnapshot?.title || 'Himalayan Expedition';
  const weather = getDestinationWeather(tripTitle);

  return {
    daysRemaining: diffDays > 0 ? diffDays : 0,
    departureDateFormatted: departureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    tripTitle,
    weather,
    pickupPoint: booking.pickupPoint || 'Guwahati Airport (10:30 AM) / Majnu Ka Tila (06:00 PM)',
    captainName: 'Gaurav Kumar Yadav (Certified Expedition Lead)',
    captainPhone: '+91 85420 36499',
    bookingId: booking.bookingId || booking.id || 'WLX-2026-CONFIRMED',
    status: booking.bookingStatus || 'CONFIRMED'
  };
};

export default {
  getTimeOfDayContext,
  getDayOfWeekContext,
  getActiveOccasionContext,
  calculateContextualRecommendations,
  generatePackingChecklist,
  getTripPersonaBadges,
  getWhyVisitNow,
  getPreTripDashboard
};
