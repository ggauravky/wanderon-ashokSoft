// ================================================================
// CENTRAL TRAVEL CONTEXT & RECOMMENDATION ENGINE
// ================================================================

import { getCurrentSeason, getDestinationWeather } from './weatherSeasonEngine.js';
import { getRecentlyViewedTrips, getWishlistIds, getSavedAIItineraries } from './userHistory.js';

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
 * 3. Occasion & Calendar Travel Windows
 * Dynamic planning windows (30 days inspiration, 7 days high-priority)
 */
export const OCCASION_CALENDAR = [
  {
    id: 'monsoon_magic',
    name: 'Monsoon Waterfall Season',
    tagline: 'Lush green valleys & roaring rainforest waterfalls',
    startDate: { month: 6, day: 15 },
    endDate: { month: 8, day: 31 },
    leadDays: 30,
    bannerBg: 'from-emerald-900 to-slate-900',
    bannerText: 'Misty Rainforests & Roaring Waterfalls in Meghalaya & Western Ghats',
    recommendedCategories: ['Nature', 'Backpacking'],
    featuredLocations: ['Meghalaya', 'Kerala', 'Goa']
  },
  {
    id: 'independence_long_weekend',
    name: 'Independence Day Long Weekend',
    tagline: 'Take 1 day off, get a 4-day mountain getaway',
    startDate: { month: 8, day: 10 },
    endDate: { month: 8, day: 18 },
    leadDays: 25,
    bannerBg: 'from-amber-900 to-slate-900',
    bannerText: 'Long Weekend Alert: 3-4 Day Mountain & Beach Getaways Booking Fast!',
    recommendedCategories: ['Weekend Trips', 'Adventure'],
    featuredLocations: ['Himachal Pradesh', 'Uttarakhand', 'Goa']
  },
  {
    id: 'autumn_long_weekend',
    name: 'Autumn Long Weekend & Gandhi Jayanti',
    tagline: 'Crisp mountain visibility & clear blue skies',
    startDate: { month: 9, day: 25 },
    endDate: { month: 10, day: 5 },
    leadDays: 30,
    bannerBg: 'from-teal-900 to-slate-900',
    bannerText: 'Autumn Clear Skies: Ideal time for Spiti, Kashmir & Dawki Glass River',
    recommendedCategories: ['Adventure', 'Backpacking'],
    featuredLocations: ['Kashmir', 'Meghalaya', 'Ladakh']
  },
  {
    id: 'diwali_festive_holidays',
    name: 'Diwali Festive Getaways',
    tagline: 'Celebrate the festival of lights amidst starry mountain skies',
    startDate: { month: 10, day: 20 },
    endDate: { month: 11, day: 15 },
    leadDays: 35,
    bannerBg: 'from-orange-950 to-slate-900',
    bannerText: 'Festive Holiday Departures: Royal Rajasthan & Golden Sands Getaways',
    recommendedCategories: ['Culture', 'Nature'],
    featuredLocations: ['Rajasthan', 'Kerala', 'Bali']
  },
  {
    id: 'winter_new_year',
    name: 'Winter Snow & New Year Expeditions',
    tagline: 'Ring in the New Year under snow peaks or tropical beaches',
    startDate: { month: 12, day: 15 },
    endDate: { month: 1, day: 10 },
    leadDays: 45,
    bannerBg: 'from-indigo-950 to-slate-900',
    bannerText: 'Winter White Snow Expeditions & Tropical Bali Escapes Open for Booking',
    recommendedCategories: ['Adventure', 'International'],
    featuredLocations: ['Kashmir', 'Himachal Pradesh', 'Bali']
  },
  {
    id: 'valentine_spring',
    name: 'Valentine’s & Spring Blossom Escapes',
    tagline: 'Romantic retreats, tea gardens, and blooming valleys',
    startDate: { month: 2, day: 1 },
    endDate: { month: 2, day: 20 },
    leadDays: 30,
    bannerBg: 'from-rose-950 to-slate-900',
    bannerText: 'Spring Blossom & Couple-Friendly Retreats in Munnar, Udaipur & Bali',
    recommendedCategories: ['Nature', 'Culture', 'International'],
    featuredLocations: ['Kerala', 'Rajasthan', 'Bali']
  },
  {
    id: 'holi_getaway',
    name: 'Holi Long Weekend',
    tagline: 'Colors, camping, and riverside music festivals',
    startDate: { month: 3, day: 10 },
    endDate: { month: 3, day: 28 },
    leadDays: 25,
    bannerBg: 'from-fuchsia-950 to-slate-900',
    bannerText: 'Holi Long Weekend: Riverside Camping & Mountain Music Escapes',
    recommendedCategories: ['Weekend Trips', 'Adventure'],
    featuredLocations: ['Uttarakhand', 'Himachal Pradesh', 'Rajasthan']
  }
];

export const getActiveOccasionContext = (date = new Date()) => {
  const currentMonth = date.getMonth() + 1;
  const currentDay = date.getDate();

  for (const occasion of OCCASION_CALENDAR) {
    // Check if within active or lead window
    const isInMonthRange = 
      (occasion.startDate.month <= occasion.endDate.month)
        ? (currentMonth >= occasion.startDate.month && currentMonth <= occasion.endDate.month)
        : (currentMonth >= occasion.startDate.month || currentMonth <= occasion.endDate.month);

    if (isInMonthRange) {
      return occasion;
    }
  }

  // Fallback to seasonal occasion
  return OCCASION_CALENDAR[0];
};

/**
 * 4. Deterministic Explainable Recommendation Scoring
 */
export const calculateContextualRecommendations = (trips = [], userPreferences = {}) => {
  try {
    const currentSeason = getCurrentSeason() || { recommendedTypes: [] };
    const activeOccasion = getActiveOccasionContext() || { featuredLocations: [], name: 'Season' };
    const dayContext = getDayOfWeekContext() || { type: 'weekday_planning' };
    const recentlyViewed = getRecentlyViewedTrips() || [];
    const wishlistIds = getWishlistIds() || [];

    // Extract recent locations and categories for collaborative intent
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

      // Signal 1: Wishlist similarity (+35)
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
      const weather = getDestinationWeather(trip.location || '');
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
 */
export const generatePackingChecklist = (trip, weather, season) => {
  const locLower = (trip.location || '').toLowerCase();
  const isCold = locLower.includes('spiti') || locLower.includes('ladakh') || locLower.includes('kashmir') || locLower.includes('auli') || (weather && weather.temp && parseInt(weather.temp) < 16);
  const isRain = locLower.includes('meghalaya') || locLower.includes('kerala') || (weather && weather.condition && weather.condition.toLowerCase().includes('rain'));
  const isBeach = locLower.includes('goa') || locLower.includes('bali') || locLower.includes('varkala');
  const isTrek = (trip.tags || []).some((t) => t.toLowerCase().includes('trek') || t.toLowerCase().includes('altitude'));

  const items = [
    { id: 'p1', category: 'Essential Documents', name: 'Government Photo ID (Aadhaar / Passport)', mandatory: true, defaultChecked: true },
    { id: 'p2', category: 'Essential Documents', name: 'WanderLuxe Booking Pass & QR Voucher', mandatory: true, defaultChecked: true },
    { id: 'p3', category: 'Clothing', name: 'Comfortable Quick-Dry T-Shirts (3-4 pairs)', mandatory: false, defaultChecked: false },
    { id: 'p4', category: 'Clothing', name: 'Trail Cargo Pants / Track Pants', mandatory: false, defaultChecked: false }
  ];

  if (isCold) {
    items.push(
      { id: 'p5', category: 'Cold Weather Gear', name: 'Heavy Down Jacket (-5°C to 10°C rated)', mandatory: true, defaultChecked: false },
      { id: 'p6', category: 'Cold Weather Gear', name: 'Thermal Base Layer (Top & Bottom)', mandatory: true, defaultChecked: false },
      { id: 'p7', category: 'Cold Weather Gear', name: 'Woolen Beanie Cap & Neck Gaiter', mandatory: true, defaultChecked: false },
      { id: 'p8', category: 'Cold Weather Gear', name: 'Waterproof Fleece Gloves', mandatory: true, defaultChecked: false }
    );
  }

  if (isRain) {
    items.push(
      { id: 'p9', category: 'Monsoon Essentials', name: 'Breathable Rain Poncho / Waterproof Jacket', mandatory: true, defaultChecked: false },
      { id: 'p10', category: 'Monsoon Essentials', name: 'Waterproof Phone Case Pouch', mandatory: true, defaultChecked: false },
      { id: 'p11', category: 'Monsoon Essentials', name: 'Quick-Dry Microfiber Towel', mandatory: false, defaultChecked: false }
    );
  }

  if (isBeach) {
    items.push(
      { id: 'p12', category: 'Coastal Essentials', name: 'UV Polarized Sunglasses & Reef-Safe Sunscreen SPF 50+', mandatory: true, defaultChecked: false },
      { id: 'p13', category: 'Coastal Essentials', name: 'Swimwear & Beach Flip-Flops', mandatory: false, defaultChecked: false },
      { id: 'p14', category: 'Coastal Essentials', name: 'Waterproof Dry Bag (10L / 15L)', mandatory: false, defaultChecked: false }
    );
  }

  if (isTrek) {
    items.push(
      { id: 'p15', category: 'Trekking Gear', name: 'Ankle-Support Waterproof Trekking Shoes', mandatory: true, defaultChecked: false },
      { id: 'p16', category: 'Trekking Gear', name: 'Trekking Pole & Headlamp / Flashlight', mandatory: false, defaultChecked: false },
      { id: 'p17', category: 'Trekking Gear', name: '1L Reusable Insulated Water Flask', mandatory: true, defaultChecked: false },
      { id: 'p18', category: 'Medical & Hydration', name: 'Electrolyte ORS Sachets & Personal Medications', mandatory: true, defaultChecked: false }
    );
  } else {
    items.push(
      { id: 'p19', category: 'Footwear & Care', name: 'Comfortable Walking Sneakers / Trail Shoes', mandatory: true, defaultChecked: false },
      { id: 'p20', category: 'Electronics', name: '10,000mAh Power Bank & Universal Charger', mandatory: true, defaultChecked: false }
    );
  }

  return items;
};

/**
 * 6. "Who is this trip for?" Persona Analyzer
 */
export const getTripPersonaBadges = (trip) => {
  const cat = (trip.category || '').toLowerCase();
  const tags = (trip.tags || []).map((t) => t.toLowerCase());

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
  if (trip.grade === 'Easy' || trip.ageGroup === 'All Ages') {
    personas.push({ label: 'Relaxed Getaway', desc: 'Comfortable pace for everyone' });
  }

  return personas.slice(0, 3);
};

/**
 * 7. "Why Visit Now?" Contextual Callout
 */
export const getWhyVisitNow = (trip, season, weather) => {
  const locLower = (trip.location || '').toLowerCase();

  if (locLower.includes('meghalaya')) {
    return {
      title: 'Optimal Water Clarity & Waterfall Plunge',
      reason: 'Natural turquoise pools and living root bridge trails are at peak beauty with pleasant temperatures.'
    };
  }
  if (locLower.includes('spiti') || locLower.includes('ladakh')) {
    return {
      title: 'Clear High Mountain Passes & Galaxy Views',
      reason: 'High altitude mountain passes are open with unhindered crystal clear skies for stargazing at Chandratal and Pangong.'
    };
  }
  if (locLower.includes('bali')) {
    return {
      title: 'Warm Tropical Waves & Golden Sunsets',
      reason: 'Peak tropical surf season with calm turquoise waters for Nusa Penida island speedboat tours.'
    };
  }
  if (locLower.includes('kerala')) {
    return {
      title: 'Misty Tea Hills & Serene Houseboats',
      reason: 'Gentle coastal breeze and fresh green tea plantations in Munnar make for ideal houseboat sailing.'
    };
  }
  if (locLower.includes('goa')) {
    return {
      title: 'Secret Beaches & Waterfalls Season',
      reason: 'Pleasant coastal climate with lively beach cafes and open catamaran sailing.'
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
  
  // Approximate parsing of batch date e.g. "20 Aug - 26 Aug, 2026"
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
