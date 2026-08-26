/**
 * =============================================================================
 * DISCOVERY TAXONOMY REGISTRY
 * Authoritative taxonomy, SEO route presets, and filter predicates for WanderLuxe
 * =============================================================================
 * 
 * Rules:
 * 1. Zero empty SEO pages: Every preset maps strictly to >= 3 active catalog items.
 * 2. Stable canonical paths to avoid search duplicate content penalties.
 * 3. Server & client predicate parity.
 */

export const DISCOVERY_PRESETS = [
  // 1. ALL EXPEDITIONS / ROOT CATALOG
  {
    id: 'all-trips',
    name: 'All Expeditions',
    pathPatterns: ['/trips', '/destinations', '/packages', '/destinationspage', '/destination'],
    canonicalPath: '/trips',
    seoTitle: '50+ Verified Travel Packages & Expeditions | WanderLuxe Catalog',
    metaDescription: 'Browse 50+ verified group tours, backpacking expeditions, high-altitude treks, and romantic escapes across India & Bali with fixed departures.',
    heading: 'Explore All Expeditions',
    subheading: 'Handcrafted group adventures, weekend getaways, and iconic circuits with 100% verified batch departures and expert captains.',
    badge: '50 Active Expeditions',
    defaultFilters: {
      category: 'All',
      duration: 'all',
      budget: 'all',
      climate: 'all',
      destination: 'all'
    },
    quickPills: ['Spiti Valley', 'Meghalaya', 'Kashmir', 'Bali', 'Weekend Trips', 'Treks', 'High Altitude'],
    filterPredicate: () => true
  },

  // 2. INDIA TOURS & DOMESTIC EXPEDITIONS (46 trips)
  {
    id: 'india-trips',
    name: 'India Trips',
    pathPatterns: ['/trips/india', '/domestic', '/india-trips'],
    canonicalPath: '/trips/india',
    seoTitle: 'India Tour Packages & Handcrafted Group Trips 2026 | WanderLuxe',
    metaDescription: 'Explore 46 active group trips across Himachal, Uttarakhand, Meghalaya, Kashmir, Ladakh, Goa, Kerala, and Rajasthan with fixed departures.',
    heading: 'India Group Tours & Expeditions',
    subheading: 'Discover the raw beauty of the Himalayas, living root bridges of the Northeast, sun-soaked beaches, and royal desert forts.',
    badge: '46 India Packages',
    defaultFilters: {
      category: 'Domestic',
      duration: 'all',
      budget: 'all',
      climate: 'all',
      destination: 'all'
    },
    quickPills: ['Himachal Pradesh', 'Uttarakhand', 'Meghalaya', 'Kashmir', 'Ladakh', 'Goa', 'Kerala', 'Rajasthan'],
    filterPredicate: (trip) => {
      if (!trip) return false;
      const dest = (trip.destination || trip.location || '').toLowerCase();
      return !dest.includes('bali') && !dest.includes('indonesia');
    }
  },

  // 3. INTERNATIONAL EXPEDITIONS (4 trips)
  {
    id: 'international-trips',
    name: 'International Trips',
    pathPatterns: ['/trips/international', '/international', '/international-trips'],
    canonicalPath: '/trips/international',
    seoTitle: 'International Tour Packages & Island Getaways | WanderLuxe',
    metaDescription: 'Curated international group tours and tropical island adventures in Bali with verified hotel stays, airport transfers, and captain support.',
    heading: 'International Travel & Island Escapes',
    subheading: 'Immerse in tropical volcanic landscapes, sacred cliffside sea temples, and vibrant coastal cafe culture.',
    badge: 'Island & Overseas Escapes',
    defaultFilters: {
      category: 'International',
      duration: 'all',
      budget: 'all',
      climate: 'tropical',
      destination: 'Bali'
    },
    quickPills: ['Bali Island', 'Nusa Penida', 'Ubud Rice Terraces', 'Mount Batur', 'Seminyak'],
    filterPredicate: (trip) => {
      if (!trip) return false;
      const dest = (trip.destination || trip.location || '').toLowerCase();
      const cat = (trip.category || '').toLowerCase();
      return dest.includes('bali') || dest.includes('indonesia') || cat.includes('international');
    }
  },

  // 4. COMMUNITY & GROUP DEPARTURES (50 trips)
  {
    id: 'community-trips',
    name: 'Community Trips',
    pathPatterns: ['/community-trips', '/group-trips'],
    canonicalPath: '/community-trips',
    seoTitle: 'Community & Group Trips for Solo & Social Travelers | WanderLuxe',
    metaDescription: 'Join like-minded travelers on curated group departures across India & Bali. Verified age group 18-35, zero single-supplement pressure.',
    heading: 'Community & Group Departures',
    subheading: 'Travel with a curated tribe of like-minded explorers, led by certified trip leaders who turn strangers into lifelong friends.',
    badge: 'Curated 18-35 Tribe',
    defaultFilters: {
      category: 'All',
      duration: 'all',
      budget: 'all',
      climate: 'all',
      destination: 'all'
    },
    quickPills: ['Spiti Valley', 'Kasol & Tosh', 'Meghalaya', 'Kashmir Great Lakes', 'Goa Social'],
    filterPredicate: () => true
  },

  // 5. WEEKEND GETAWAYS (19 trips)
  {
    id: 'weekend-trips',
    name: 'Weekend Trips',
    pathPatterns: ['/weekend-trips', '/trips/weekend'],
    canonicalPath: '/weekend-trips',
    seoTitle: 'Weekend Trips & Short Himalayan Getaways (2N/3D - 3N/4D) | WanderLuxe',
    metaDescription: 'Recharge with 19 quick weekend departures from Delhi & Chandigarh to Manali, Rishikesh, Kasol, Jibhi, Bir Billing, and Mussoorie.',
    heading: 'Weekend Getaways & Short Breaks',
    subheading: 'Quick 2 to 4-day escapes designed for busy professionals. Depart Friday evening, return refreshed Monday morning.',
    badge: '19 Quick Getaways',
    defaultFilters: {
      category: 'Weekend Trips',
      duration: 'weekend',
      budget: 'all',
      climate: 'all',
      destination: 'all'
    },
    quickPills: ['Bir Billing', 'Kasol & Kheerganga', 'Jibhi & Tirthan', 'Rishikesh Rafting', 'Mussoorie'],
    filterPredicate: (trip) => {
      if (!trip) return false;
      const cat = (trip.category || '').toLowerCase();
      const dur = (trip.duration || '').toLowerCase();
      const tags = Array.isArray(trip.tags) ? trip.tags.map(t => (t || '').toLowerCase()) : [];
      return cat.includes('weekend') || tags.includes('weekend trips') || dur.includes('2n') || dur.includes('3d') || dur.includes('3n/4d');
    }
  },

  // 6. BACKPACKING EXPEDITIONS (15 trips)
  {
    id: 'backpacking-trips',
    name: 'Backpacking Trips',
    pathPatterns: ['/backpacking-trips', '/trips/backpacking'],
    canonicalPath: '/backpacking-trips',
    seoTitle: 'Backpacking Trips & Offbeat Mountain Trails | WanderLuxe',
    metaDescription: 'Authentic backpacking circuits through Spiti Valley, Meghalaya, Zanskar, and Parvati Valley with local homestays and hidden waterfall trails.',
    heading: 'Backpacking Circuits & Offbeat Trails',
    subheading: 'Slow travel across remote mountain valleys, authentic rustic homestays, deep forest trails, and high mountain passes.',
    badge: '15 Offbeat Circuits',
    defaultFilters: {
      category: 'Backpacking',
      duration: 'all',
      budget: 'all',
      climate: 'all',
      destination: 'all'
    },
    quickPills: ['Spiti Circuit', 'Mawlynnong & Dawki', 'Parvati Valley', 'Gurez Valley', 'Zanskar'],
    filterPredicate: (trip) => {
      if (!trip) return false;
      const cat = (trip.category || '').toLowerCase();
      const tags = Array.isArray(trip.tags) ? trip.tags.map(t => (t || '').toLowerCase()) : [];
      return cat.includes('backpacking') || tags.includes('backpacking') || tags.includes('high altitude') || tags.includes('offbeat');
    }
  },

  // 7. ADVENTURE & HIGH-ALTITUDE TREKS (19 trips)
  {
    id: 'adventure-treks',
    name: 'Adventure & Treks',
    pathPatterns: ['/adventure-treks', '/trips/adventure', '/treks'],
    canonicalPath: '/adventure-treks',
    seoTitle: 'Adventure Tours & High Altitude Treks in India | WanderLuxe',
    metaDescription: 'Challenging high-altitude treks and alpine adventures: Hampta Pass, Kashmir Great Lakes, Kuari Pass, Kedarkantha, and Spiti desert.',
    heading: 'Adventure Tours & Himalayan Treks',
    subheading: 'Summit alpine passes, cross glacial streams, camp under starry skies, and push your endurance on certified Himalayan trails.',
    badge: '19 High-Adrenaline Treks',
    defaultFilters: {
      category: 'Adventure',
      duration: 'all',
      budget: 'all',
      climate: 'cold',
      destination: 'all'
    },
    quickPills: ['Hampta Pass', 'Kedarkantha', 'Brahmatal', 'Kashmir Alpine', 'Kunzum Pass'],
    filterPredicate: (trip) => {
      if (!trip) return false;
      const cat = (trip.category || '').toLowerCase();
      const grade = (trip.grade || '').toLowerCase();
      const tags = Array.isArray(trip.tags) ? trip.tags.map(t => (t || '').toLowerCase()) : [];
      return cat.includes('adventure') || 
             tags.includes('adventure') || 
             tags.includes('treks') || 
             tags.includes('trekking') ||
             ['challenging', 'moderate to challenging', 'difficult'].includes(grade);
    }
  },

  // 8. ROMANTIC & HONEYMOON ESCAPES (20 trips)
  {
    id: 'romantic-escapes',
    name: 'Romantic Escapes',
    pathPatterns: ['/romantic-escapes', '/trips/romantic', '/honeymoon-trips'],
    canonicalPath: '/romantic-escapes',
    seoTitle: 'Romantic Getaways & Honeymoon Tour Packages | WanderLuxe',
    metaDescription: 'Handcrafted romantic trips and couple escapes to Bali, Kerala backwaters, Kashmir valleys, and Goa coastal sunsets.',
    heading: 'Romantic Escapes & Couple Retreats',
    subheading: 'Serene houseboats, sunset beaches, private mountain chalets, and tropical private pool villas designed for unforgettable memories.',
    badge: '20 Handcrafted Retreats',
    defaultFilters: {
      category: 'All',
      duration: 'all',
      budget: 'all',
      climate: 'tropical',
      destination: 'all'
    },
    quickPills: ['Bali Private Villas', 'Alleppey Houseboats', 'Munnar Tea Gardens', 'Srinagar Dal Lake', 'South Goa'],
    filterPredicate: (trip) => {
      if (!trip) return false;
      const dest = (trip.destination || trip.location || '').toLowerCase();
      const tags = Array.isArray(trip.tags) ? trip.tags.map(t => (t || '').toLowerCase()) : [];
      return dest.includes('goa') || 
             dest.includes('kerala') || 
             dest.includes('bali') || 
             dest.includes('kashmir') || 
             tags.includes('beach') || 
             tags.includes('lakes') || 
             tags.includes('houseboat');
    }
  },

  // 9. CULTURE & HERITAGE TRAILS (12 trips)
  {
    id: 'culture-heritage',
    name: 'Culture & Heritage',
    pathPatterns: ['/culture-heritage', '/trips/culture', '/heritage-trips'],
    canonicalPath: '/culture-heritage',
    seoTitle: 'Culture & Heritage Tour Packages across India | WanderLuxe',
    metaDescription: 'Immerse in royal palaces, ancient Buddhist monasteries, and historic trails in Rajasthan, Spiti, and Northeast India.',
    heading: 'Cultural Trails & Living Heritage',
    subheading: 'Walk through royal forts of the Thar Desert, thousand-year-old Buddhist gompas, and indigenous tribal traditions.',
    badge: '12 Heritage Trails',
    defaultFilters: {
      category: 'Culture',
      duration: 'all',
      budget: 'all',
      climate: 'all',
      destination: 'all'
    },
    quickPills: ['Jaipur & Udaipur', 'Jaisalmer Dunes', 'UNESCO Tabo Monastery', 'Tibetan Culture Dharamshala'],
    filterPredicate: (trip) => {
      if (!trip) return false;
      const cat = (trip.category || '').toLowerCase();
      const dest = (trip.destination || trip.location || '').toLowerCase();
      const tags = Array.isArray(trip.tags) ? trip.tags.map(t => (t || '').toLowerCase()) : [];
      return cat.includes('culture') || 
             dest.includes('rajasthan') || 
             tags.includes('culture') || 
             tags.includes('heritage') || 
             tags.includes('colonial');
    }
  },

  // -------------------------------------------------------------
  // REGIONAL DESTINATION HUBS (9 Verified Hubs)
  // -------------------------------------------------------------
  {
    id: 'hub-himachal',
    name: 'Himachal Pradesh',
    pathPatterns: ['/trips/himachal-pradesh', '/destinations/himachal-pradesh', '/trips/himachal'],
    canonicalPath: '/trips/himachal-pradesh',
    seoTitle: 'Himachal Pradesh Tour Packages & Spiti Circuits 2026 | WanderLuxe',
    metaDescription: '12 active expeditions in Himachal Pradesh: Spiti Valley Circuit, Manali, Kasol, Jibhi, Bir Billing, Tirthan, and Hampta Pass trek.',
    heading: 'Himachal Pradesh Expeditions',
    subheading: 'Snow-capped Himalayan passes, roaring river valleys, high-altitude moon lakes, and vibrant mountain cafe hubs.',
    badge: '12 Verified Packages',
    defaultFilters: { category: 'All', destination: 'Himachal Pradesh', duration: 'all', budget: 'all', climate: 'cold' },
    quickPills: ['Spiti Valley', 'Manali & Solang', 'Kasol & Kheerganga', 'Jibhi', 'Bir Billing', 'Hampta Pass'],
    filterPredicate: (trip) => (trip?.destination || trip?.location || '').toLowerCase().includes('himachal')
  },
  {
    id: 'hub-uttarakhand',
    name: 'Uttarakhand',
    pathPatterns: ['/trips/uttarakhand', '/destinations/uttarakhand'],
    canonicalPath: '/trips/uttarakhand',
    seoTitle: 'Uttarakhand Tour Packages & Himalayan Treks 2026 | WanderLuxe',
    metaDescription: '8 handcrafted Uttarakhand adventures: Rishikesh white water rafting, Kedarkantha trek, Valley of Flowers, Auli skiing, Chopta Tungnath.',
    heading: 'Uttarakhand Himalayan Trails',
    subheading: 'From the yoga capital on the Ganges to high-altitude bugyals and the highest Shiva temple in the world.',
    badge: '8 Active Packages',
    defaultFilters: { category: 'All', destination: 'Uttarakhand', duration: 'all', budget: 'all', climate: 'cold' },
    quickPills: ['Rishikesh Rafting', 'Kedarkantha Trek', 'Chopta Tungnath', 'Auli Skiing', 'Valley of Flowers'],
    filterPredicate: (trip) => (trip?.destination || trip?.location || '').toLowerCase().includes('uttarakhand')
  },
  {
    id: 'hub-meghalaya',
    name: 'Meghalaya',
    pathPatterns: ['/trips/meghalaya', '/destinations/meghalaya'],
    canonicalPath: '/trips/meghalaya',
    seoTitle: 'Meghalaya Tour Packages: Living Root Bridges & Dawki | WanderLuxe',
    metaDescription: '6 immersive Northeast Meghalaya expeditions: Cherrapunji waterfalls, Double Decker Root Bridge in Nongriat, crystal Dawki river, and Mawlynnong.',
    heading: 'Meghalaya: Abode of Clouds',
    subheading: 'Bio-engineered living root bridges, prehistoric limestone caves, transparent emerald rivers, and roaring plunge waterfalls.',
    badge: '6 Northeast Expeditions',
    defaultFilters: { category: 'All', destination: 'Meghalaya', duration: 'all', budget: 'all', climate: 'rainforest' },
    quickPills: ['Double Decker Bridge', 'Dawki Umngot River', 'Cherrapunji Falls', 'Wei Sawdong', 'Mawlynnong'],
    filterPredicate: (trip) => (trip?.destination || trip?.location || '').toLowerCase().includes('meghalaya')
  },
  {
    id: 'hub-kashmir',
    name: 'Kashmir',
    pathPatterns: ['/trips/kashmir', '/destinations/kashmir'],
    canonicalPath: '/trips/kashmir',
    seoTitle: 'Kashmir Tour Packages & Great Lakes Treks | WanderLuxe',
    metaDescription: '5 classic Kashmir itineraries: Srinagar Dal Lake houseboats, Gulmarg meadows, Pahalgam pine valleys, and Sonamarg glaciers.',
    heading: 'Kashmir: Paradise on Earth',
    subheading: 'Tranquil Dal Lake shikara rides, alpine meadows draped in wildflowers, and snow-draped pine valleys.',
    badge: '5 Alpine Packages',
    defaultFilters: { category: 'All', destination: 'Kashmir', duration: 'all', budget: 'all', climate: 'cold' },
    quickPills: ['Srinagar Dal Lake', 'Gulmarg Gondola', 'Pahalgam Betaab Valley', 'Sonamarg Thajiwas Glacier'],
    filterPredicate: (trip) => (trip?.destination || trip?.location || '').toLowerCase().includes('kashmir')
  },
  {
    id: 'hub-ladakh',
    name: 'Ladakh',
    pathPatterns: ['/trips/ladakh', '/destinations/ladakh'],
    canonicalPath: '/trips/ladakh',
    seoTitle: 'Ladakh Tour Packages & Pangong Lake Roadtrips | WanderLuxe',
    metaDescription: '4 high-altitude Ladakh circuits: Leh monasteries, Khardung La Pass (17,982 ft), Nubra Valley sand dunes, and Pangong Tso.',
    heading: 'Ladakh: The Land of High Passes',
    subheading: 'Traverse the highest motorable passes on earth, double-humped camel dunes in Nubra, and the color-shifting Pangong Tso.',
    badge: '4 High-Altitude Circuits',
    defaultFilters: { category: 'All', destination: 'Ladakh', duration: 'all', budget: 'all', climate: 'cold' },
    quickPills: ['Pangong Tso', 'Nubra Valley Hunder', 'Khardung La Pass', 'Leh Palace', 'Magnetic Hill'],
    filterPredicate: (trip) => (trip?.destination || trip?.location || '').toLowerCase().includes('ladakh')
  },
  {
    id: 'hub-goa',
    name: 'Goa',
    pathPatterns: ['/trips/goa', '/destinations/goa'],
    canonicalPath: '/trips/goa',
    seoTitle: 'Goa Tour Packages: North & South Beach Escapes | WanderLuxe',
    metaDescription: '4 curated Goa getaways: North Goa beach hopping, heritage Latin Quarter Fontainhas in Panaji, and serene South Goa hidden coves.',
    heading: 'Goa Coastal & Heritage Escapes',
    subheading: 'Sun-drenched beaches, vibrant night markets, Portuguese colonial heritage, and oceanfront sunset dinners.',
    badge: '4 Coastal Getaways',
    defaultFilters: { category: 'All', destination: 'Goa', duration: 'all', budget: 'all', climate: 'tropical' },
    quickPills: ['North Goa Beach Hopping', 'Fontainhas Heritage Walk', 'South Goa Palolem', 'Dudhsagar Waterfalls'],
    filterPredicate: (trip) => (trip?.destination || trip?.location || '').toLowerCase().includes('goa')
  },
  {
    id: 'hub-kerala',
    name: 'Kerala',
    pathPatterns: ['/trips/kerala', '/destinations/kerala'],
    canonicalPath: '/trips/kerala',
    seoTitle: 'Kerala Tour Packages: Munnar Tea & Alleppey Backwaters | WanderLuxe',
    metaDescription: '4 serene Kerala expeditions: Munnar rolling tea hills, Alleppey private houseboat cruises, and coastal cliffs in Varkala.',
    heading: 'Kerala: God’s Own Country',
    subheading: 'Glide through palm-fringed backwaters on traditional houseboats, walk through misty tea plantations, and unwind on cliffside beaches.',
    badge: '4 Backwater Getaways',
    defaultFilters: { category: 'All', destination: 'Kerala', duration: 'all', budget: 'all', climate: 'tropical' },
    quickPills: ['Alleppey Houseboat', 'Munnar Tea Hills', 'Varkala Cliff Beach', 'Thekkady Spice Plantations'],
    filterPredicate: (trip) => (trip?.destination || trip?.location || '').toLowerCase().includes('kerala')
  },
  {
    id: 'hub-rajasthan',
    name: 'Rajasthan',
    pathPatterns: ['/trips/rajasthan', '/destinations/rajasthan'],
    canonicalPath: '/trips/rajasthan',
    seoTitle: 'Rajasthan Tour Packages: Jaipur, Udaipur & Jaisalmer | WanderLuxe',
    metaDescription: '3 royal Rajasthan journeys: Pink City Jaipur, romantic lake palaces of Udaipur, and golden Thar desert camps in Jaisalmer.',
    heading: 'Rajasthan: The Land of Kings',
    subheading: 'Regal hilltop palaces, romantic sunset boat rides on Lake Pichola, and overnight camel glamping under Thar desert stars.',
    badge: '3 Royal Expeditions',
    defaultFilters: { category: 'Culture', destination: 'Rajasthan', duration: 'all', budget: 'all', climate: 'all' },
    quickPills: ['Jaipur Forts', 'Udaipur Lake Pichola', 'Jaisalmer Sam Dunes', 'Jodhpur Blue City'],
    filterPredicate: (trip) => (trip?.destination || trip?.location || '').toLowerCase().includes('rajasthan')
  },
  {
    id: 'hub-bali',
    name: 'Bali',
    pathPatterns: ['/trips/bali', '/destinations/bali'],
    canonicalPath: '/trips/bali',
    seoTitle: 'Bali Tour Packages: Ubud, Nusa Penida & Beach Clubs | WanderLuxe',
    metaDescription: '4 comprehensive Bali group trips: Mount Batur sunrise hike, sacred Uluwatu cliff temple, Ubud rice terraces, and Nusa Penida T-Rex cliff.',
    heading: 'Bali: Island of the Gods',
    subheading: 'Sacred water temples, lush emerald jungle swings, volcanic sunrise summits, and stunning turquoise island cliffs in Nusa Penida.',
    badge: '4 Island Packages',
    defaultFilters: { category: 'International', destination: 'Bali', duration: 'all', budget: 'all', climate: 'tropical' },
    quickPills: ['Nusa Penida Kelingking', 'Mount Batur Sunrise', 'Ubud Rice Terraces', 'Uluwatu Sunset Temple', 'Canggu Beach Clubs'],
    filterPredicate: (trip) => (trip?.destination || trip?.location || '').toLowerCase().includes('bali')
  }
];

/**
 * Match current URL pathname to the most accurate taxonomy preset
 * @param {string} pathname 
 * @returns {object} Matching Preset
 */
export const getPresetByPath = (pathname = '') => {
  const cleanPath = (pathname || '').toLowerCase().trim().replace(/\/$/, '') || '/trips';

  // 1. Direct Pattern Match
  for (const preset of DISCOVERY_PRESETS) {
    if (preset.pathPatterns.some(pattern => pattern.toLowerCase() === cleanPath)) {
      return preset;
    }
  }

  // 2. Destination Slug Sub-route Match (e.g. /trips/meghalaya or /destinations/spiti-valley)
  if (cleanPath.startsWith('/trips/') || cleanPath.startsWith('/destinations/')) {
    const slug = cleanPath.split('/')[2];
    if (slug) {
      const matchedHub = DISCOVERY_PRESETS.find(p => 
        p.id.startsWith('hub-') && (
          p.id.includes(slug) || 
          p.canonicalPath.endsWith(slug) ||
          p.pathPatterns.some(pat => pat.endsWith(slug))
        )
      );
      if (matchedHub) return matchedHub;
    }
  }

  // 3. Fallback to All Trips Root Preset
  return DISCOVERY_PRESETS[0];
};

/**
 * Returns all active presets for testing and sitemap generation
 */
export const getAllPresets = () => DISCOVERY_PRESETS;
