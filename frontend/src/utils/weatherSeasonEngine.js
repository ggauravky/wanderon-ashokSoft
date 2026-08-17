// ================================================================
// DYNAMIC WEATHER & SEASONAL PERSONALIZATION ENGINE
// ================================================================

/**
 * Get current season metadata based on active date
 */
export const getCurrentSeason = (date = new Date()) => {
  const month = date.getMonth() + 1; // 1-12

  if (month >= 3 && month <= 5) {
    return {
      key: 'spring',
      name: 'Spring / Early Summer',
      tagline: 'Blooming Valleys & High Mountain Passes',
      greeting: 'Pleasant Weather Across North & Northeast',
      heroTag: 'Spring & Summer Expeditions 2026',
      badgeColor: 'from-amber-500 to-orange-500',
      accentColor: 'text-amber-500',
      bgGradient: 'from-amber-500/10 via-emerald-500/5 to-transparent',
      recommendedTypes: ['Trekking', 'Mountains', 'Nature', 'Backpacking'],
      weatherAdvice: 'Clear blue skies and pleasant day temperatures — perfect for high-altitude roadtrips.'
    };
  } else if (month >= 6 && month <= 8) {
    return {
      key: 'monsoon',
      name: 'Monsoon / High Summer',
      tagline: 'Lush Green Valleys, Roaring Waterfalls & High Passes',
      greeting: 'Magical Rainforests & Himalayan Roadtrips',
      heroTag: 'Monsoon & Summer Getaways 2026',
      badgeColor: 'from-emerald-600 to-teal-600',
      accentColor: 'text-emerald-500',
      bgGradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      recommendedTypes: ['Waterfalls', 'High Altitude', 'Lakes', 'Relaxation'],
      weatherAdvice: 'Lush green valleys in Meghalaya and clear rain-shadow skies in Spiti Valley.'
    };
  } else if (month >= 9 && month <= 11) {
    return {
      key: 'autumn',
      name: 'Autumn / Post-Monsoon',
      tagline: 'Crystal Transparent Waters & Golden Himalayan Ridges',
      greeting: 'Crystal Clear Rivers & High Mountain Views',
      heroTag: 'Autumn Adventure Season 2026',
      badgeColor: 'from-amber-600 to-rose-600',
      accentColor: 'text-amber-600',
      bgGradient: 'from-amber-500/10 via-rose-500/5 to-transparent',
      recommendedTypes: ['Backpacking', 'Crystal Waters', 'Photography', 'International'],
      weatherAdvice: 'Pristine emerald rivers in Dawki, crisp mountain visibility, and pleasant beach weather.'
    };
  } else {
    return {
      key: 'winter',
      name: 'Winter / Snow Season',
      tagline: 'Snow-Capped Peaks, Cozy Bonfires & Tropical Escapes',
      greeting: 'Snowy Peaks & Sunny Tropical Beaches',
      heroTag: 'Winter & New Year Expeditions 2026',
      badgeColor: 'from-sky-600 to-indigo-600',
      accentColor: 'text-sky-500',
      bgGradient: 'from-sky-500/10 via-indigo-500/5 to-transparent',
      recommendedTypes: ['Snow', 'Beach', 'Luxury', 'International'],
      weatherAdvice: 'Pristine snow in Himalayas and peak sunshine on Bali and tropical beaches.'
    };
  }
};

/**
 * Destination-specific real-time contextual weather data
 */
export const DESTINATION_WEATHER_PROFILES = {
  meghalaya: {
    temp: '21°C',
    condition: 'Pleasant & Mist',
    iconType: 'CloudRain',
    statusTag: 'Roaring Waterfalls',
    humidity: '78%',
    bestMonths: 'Oct - May',
    vibe: 'Misty rainforests, living root bridges, and turquoise natural pools.'
  },
  spiti: {
    temp: '14°C',
    condition: 'Sunny & Crisp Air',
    iconType: 'Sun',
    statusTag: 'Clear Stargazing Skies',
    humidity: '34%',
    bestMonths: 'Jun - Oct',
    vibe: 'High-altitude cold desert, ancient monasteries, and moon lake.'
  },
  bali: {
    temp: '28°C',
    condition: 'Tropical Sunshine',
    iconType: 'Sun',
    statusTag: 'Warm Surf Waters',
    humidity: '72%',
    bestMonths: 'Apr - Nov',
    vibe: 'Lush rice terraces, cliffside ocean temples, and sunset beach clubs.'
  },
  kerala: {
    temp: '26°C',
    condition: 'Gentle Coastal Breeze',
    iconType: 'CloudSun',
    statusTag: 'Serene Backwaters',
    humidity: '82%',
    bestMonths: 'Sep - Mar',
    vibe: 'Floating luxury houseboats, emerald tea estates, and spice hills.'
  },
  himachal: {
    temp: '18°C',
    condition: 'Cool Mountain Air',
    iconType: 'Wind',
    statusTag: 'Fresh Pine Breezes',
    humidity: '52%',
    bestMonths: 'Mar - Nov',
    vibe: 'Riverside cafes, alpine pine forests, and thrilling mountain passes.'
  },
  uttarakhand: {
    temp: '19°C',
    condition: 'Sunny & Refreshing',
    iconType: 'Sun',
    statusTag: 'Pristine Himalayan Views',
    humidity: '48%',
    bestMonths: 'Apr - Dec',
    vibe: 'Holy river confluences, bugyal meadows, and scenic mountain trails.'
  },
  kashmir: {
    temp: '16°C',
    condition: 'Mild Valley Breeze',
    iconType: 'CloudSun',
    statusTag: 'Blooming Meadows',
    humidity: '55%',
    bestMonths: 'Apr - Oct',
    vibe: 'Dal Lake shikaras, pine-fringed alpine valleys, and saffron fields.'
  },
  goa: {
    temp: '29°C',
    condition: 'Sunny Beach Weather',
    iconType: 'Sun',
    statusTag: 'Golden Hour Waves',
    humidity: '76%',
    bestMonths: 'Oct - Apr',
    vibe: 'Sun-kissed beaches, coastal cafes, and vibrant nightlife.'
  },
  ladakh: {
    temp: '15°C',
    condition: 'Crisp High-Altitude Sun',
    iconType: 'Sun',
    statusTag: 'Azure Blue Skies',
    humidity: '28%',
    bestMonths: 'Jun - Sep',
    vibe: 'Towering mountain passes, trans-boundary lakes, and ancient gompas.'
  },
  rajasthan: {
    temp: '28°C',
    condition: 'Warm Golden Sunshine',
    iconType: 'Sun',
    statusTag: 'Desert Camp Nights',
    humidity: '35%',
    bestMonths: 'Oct - Mar',
    vibe: 'Majestic living forts, royal lake palaces, and golden sand dunes.'
  },
  dubai: {
    temp: '32°C',
    condition: 'Warm Desert Sun',
    iconType: 'Sun',
    statusTag: 'Luxury City & Dunes',
    humidity: '45%',
    bestMonths: 'Nov - Apr',
    vibe: 'Modern architectural marvels, desert safari, and skyline dining.'
  }
};

/**
 * Helper to get weather profile by location string safely
 */
export const getDestinationWeather = (locationString = '') => {
  const locLower = (locationString || '').toLowerCase();

  if (locLower.includes('meghalaya') || locLower.includes('shillong') || locLower.includes('cherrapunji')) {
    return DESTINATION_WEATHER_PROFILES.meghalaya;
  }
  if (locLower.includes('spiti') || locLower.includes('kaza') || locLower.includes('himachal')) {
    return DESTINATION_WEATHER_PROFILES.spiti;
  }
  if (locLower.includes('bali') || locLower.includes('indonesia')) {
    return DESTINATION_WEATHER_PROFILES.bali;
  }
  if (locLower.includes('kerala') || locLower.includes('munnar') || locLower.includes('alleppey')) {
    return DESTINATION_WEATHER_PROFILES.kerala;
  }
  if (locLower.includes('kashmir') || locLower.includes('srinagar') || locLower.includes('gulmarg')) {
    return DESTINATION_WEATHER_PROFILES.kashmir;
  }
  if (locLower.includes('goa')) {
    return DESTINATION_WEATHER_PROFILES.goa;
  }
  if (locLower.includes('ladakh') || locLower.includes('leh') || locLower.includes('zanskar') || locLower.includes('pangong')) {
    return DESTINATION_WEATHER_PROFILES.ladakh;
  }
  if (locLower.includes('rajasthan') || locLower.includes('udaipur') || locLower.includes('jaisalmer') || locLower.includes('jaipur')) {
    return DESTINATION_WEATHER_PROFILES.rajasthan;
  }
  if (locLower.includes('dubai') || locLower.includes('uae')) {
    return DESTINATION_WEATHER_PROFILES.dubai;
  }
  if (locLower.includes('uttarakhand') || locLower.includes('rishikesh') || locLower.includes('kedarnath') || locLower.includes('auli')) {
    return DESTINATION_WEATHER_PROFILES.uttarakhand;
  }

  // Generic resilient fallback
  return {
    temp: '23°C',
    condition: 'Pleasant Weather',
    iconType: 'Sun',
    statusTag: 'Ideal for Travel',
    humidity: '60%',
    bestMonths: 'Year Round',
    vibe: 'Curated boutique stays and unforgettable guided excursions.'
  };
};

/**
 * Dynamic Trending Score Calculation based on authentic data points
 */
export const calculateTrendingTrips = (trips = []) => {
  const currentSeason = getCurrentSeason();

  return [...trips].map((trip) => {
    let score = (trip.rating || 4.5) * 20; // 0-100 base from rating
    score += Math.min(trip.reviews || 0, 500) * 0.1; // reviews popularity weight

    // Season match bonus
    const tags = (trip.tags || []).map((t) => t.toLowerCase());
    const isSeasonMatch = currentSeason.recommendedTypes.some((type) =>
      tags.includes(type.toLowerCase())
    );
    if (isSeasonMatch) {
      score += 25;
    }

    // Availability urgency bonus
    const hasFillingFast = trip.availableBatches?.some(
      (b) => b.status === 'Filling Fast' || b.status === 'Almost Full' || (b.seatsLeft && b.seatsLeft <= 4)
    );
    if (hasFillingFast) {
      score += 15;
    }

    return {
      ...trip,
      trendingScore: Math.round(score),
      isSeasonalPick: isSeasonMatch,
      seasonalBadge: isSeasonMatch ? `${currentSeason.name.split(' ')[0]} Pick` : 'Trending',
      weather: getDestinationWeather(trip.location)
    };
  }).sort((a, b) => b.trendingScore - a.trendingScore);
};
