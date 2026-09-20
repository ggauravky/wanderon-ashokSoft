// ================================================================
// DYNAMIC EXPEDITION INTELLIGENCE & DESTINATION KNOWLEDGE ENGINE
// Generates terrain-adaptive travel metadata, contextual options,
// verified media, dynamic elevation topography, and day-by-day stops.
// ================================================================

export const DESTINATION_PROFILES = {
  'spiti-valley': {
    name: 'Spiti Valley',
    brandName: 'NomadSpiti',
    region: 'Trans-Himalaya · 32°N Circuit',
    circuitTitle: 'TRANS-HIMALAYAN ODYSSEY + SHIMLA TO MANALI LOOP',
    quote: '"Where giants sleep & rivers carve stone"',
    logId: 'NOMAD FIELD LOG #74',
    primeWindow: 'June — Mid October',
    passStatus: 'Kunzum Pass: Open',
    baseAltitude: '3,650m Alt (11,980 ft)',
    peakLandmark: 'Kunzum Pass Summit (15,060 ft / 4,590m)',
    peakAltitudeFt: 15060,
    peakAltitudeM: 4590,
    totalDistanceKm: 820,
    terrainType: 'High Desert',
    terrainDesc: 'Moderate - High Alt.',
    paceSpeed: '5–7 hrs/day',
    paceDesc: 'Scenic Mountain Pace',
    coordinates: '32.2276° N, 78.0710° E',
    environment: 'high_altitude',
    heroImage: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1800&auto=format&fit=crop&q=85',
    highlights: [
      { id: 'hl-1', title: 'Pin Valley & Mud Village', category: 'WILDLIFE & MUD', altitude: '12,450 ft', day: 'Day 5', subtitle: 'Kungri Monastery & Ibex trails', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-2', title: 'Chandratal Moon Lake', category: 'STARGAZING', altitude: '14,100 ft', day: 'Day 6', subtitle: 'Bortle Class 1 night skies', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-3', title: 'Key Gompa & Tea Rite', category: 'MONASTIC PUJA', altitude: '13,440 ft', day: 'Day 5', subtitle: '1000-year cliff monastery', image: 'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-4', title: 'Chicham Bridge & Canyon', category: 'HIGHEST SUSPENSION', altitude: '13,596 ft', day: 'Day 6', subtitle: "Asia's highest suspension span", image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80' }
    ],
    defaultStops: [
      { day: 1, stage: 'HIMALAYAN FOOTHILLS', distance: '140 km · 5 hrs', name: 'Shimla → Narkanda Apple Orchards', altitudeBadge: '+2,000 ft', details: 'Metalled NH5 · Pine forests', altitudeNum: 7100, elevationLabel: '7,100 ft' },
      { day: 2, stage: 'KINNAUR GATEWAY', distance: '220 km · 7 hrs', name: 'Narkanda → Kalpa & Kinner Kailash', altitudeBadge: '9,700 ft', details: 'Satluj River Gorge cutout', altitudeNum: 9700, elevationLabel: '9,700 ft' },
      { day: 3, stage: 'COLD DESERT ENTRY', distance: '110 km · 4.5 hrs', name: 'Kalpa → Nako Sacred Lake & Gompa', altitudeBadge: '11,900 ft', details: 'Maling Nullah gravel sector', altitudeNum: 11900, elevationLabel: '11,900 ft' },
      { day: 4, stage: 'UNESCO HERITAGE', distance: '90 km · 3.5 hrs', name: 'Nako → Tabo & Gue Mummy Shrine', altitudeBadge: '10,760 ft', details: '996 AD Murals · Mud-brick homestays', altitudeNum: 10760, elevationLabel: '10,760 ft' },
      { day: 5, stage: 'SPITI HEARTLAND', distance: '70 km · 3 hrs', name: 'Tabo → Dhankar Cliff & Kaza Capital', altitudeBadge: '12,500 ft', details: "Fuel stop · World's highest cafe", altitudeNum: 12500, elevationLabel: '12,500 ft' },
      { day: 6, stage: 'SELECTED KEY STAGE', distance: '120 km · 4 hrs', name: 'Kaza → Kunzum La → Chandratal', altitudeBadge: '14,100 ft', details: 'Batal Glacial Camping · High Pass', altitudeNum: 15060, elevationLabel: '15,060 ft', isKeyStage: true },
      { day: 7, stage: 'ROHTANG DESCENT', distance: '180 km · 7.5 hrs', name: 'Chandratal → Batal → Atal Tunnel → Manali', altitudeBadge: 'Descend to 6,700 ft', details: 'Chandra boulder riverbed & lush valley', altitudeNum: 6700, elevationLabel: '6,700 ft' }
    ]
  },
  'ladakh': {
    name: 'Ladakh',
    brandName: 'NomadLadakh',
    region: 'High Altitude Silk Route · 34°N',
    circuitTitle: 'TRANS-HIMALAYAN ODYSSEY + LEH, NUBRA & PANGONG CIRCUIT',
    quote: '"Land of high passes & sapphire skies"',
    logId: 'NOMAD FIELD LOG #108',
    primeWindow: 'May — Late September',
    passStatus: 'Khardung La: Open',
    baseAltitude: '3,500m Alt (11,500 ft)',
    peakLandmark: 'Khardung La Pass (17,982 ft / 5,359m)',
    peakAltitudeFt: 17982,
    peakAltitudeM: 5359,
    totalDistanceKm: 940,
    terrainType: 'Alpine Desert',
    terrainDesc: 'Extreme High Alt.',
    paceSpeed: '4–6 hrs/day',
    paceDesc: 'Acclimatized Plateau Pace',
    coordinates: '34.1526° N, 77.5771° E',
    environment: 'high_altitude',
    heroImage: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=1800&auto=format&fit=crop&q=85',
    highlights: [
      { id: 'hl-1', title: 'Pangong Tso Crystal Shores', category: 'COLOR-CHANGING LAKE', altitude: '14,270 ft', day: 'Day 5', subtitle: 'Breathtaking 134km turquoise waters', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-2', title: 'Nubra Valley & Hunder Dunes', category: 'BACTRIAN CAMELS', altitude: '10,000 ft', day: 'Day 4', subtitle: 'Double-humped camel desert dunes', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-3', title: 'Thiksey Monastery Morning Prayer', category: 'SACRED CHANTS', altitude: '11,800 ft', day: 'Day 2', subtitle: 'Mini Potala palace replica', image: 'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-4', title: 'Khardung La Highest Motorway', category: 'ROOF OF THE WORLD', altitude: '17,982 ft', day: 'Day 3', subtitle: 'World-famous high motorable summit', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80' }
    ],
    defaultStops: [
      { day: 1, stage: 'ARRIVAL & REST', distance: '15 km · 1 hr', name: 'Leh Airport Arrival & Deep Acclimatization', altitudeBadge: '11,500 ft', details: 'Hydration & zero physical exertion', altitudeNum: 11500, elevationLabel: '11,500 ft' },
      { day: 2, stage: 'INDUS VALLEY', distance: '85 km · 3.5 hrs', name: 'Leh → Thiksey, Shey & Shanti Stupa', altitudeBadge: '11,800 ft', details: 'Ancient monastery murals & sunset stupa', altitudeNum: 11800, elevationLabel: '11,800 ft' },
      { day: 3, stage: 'HIGH PASS CROSSING', distance: '125 km · 5 hrs', name: 'Leh → Khardung La → Diskit', altitudeBadge: '17,982 ft', details: 'Highest motorable summit crossing', altitudeNum: 17982, elevationLabel: '17,982 ft', isKeyStage: true },
      { day: 4, stage: 'NUBRA DUNES', distance: '90 km · 3.5 hrs', name: 'Diskit → Hunder Sand Dunes → Turtuk', altitudeBadge: '9,800 ft', details: 'Bactrian camels & Baltic heritage village', altitudeNum: 9800, elevationLabel: '9,800 ft' },
      { day: 5, stage: 'SHYOK RIVER ROUTE', distance: '160 km · 6 hrs', name: 'Hunder → Shyok Valley → Pangong Tso', altitudeBadge: '14,270 ft', details: 'Wild water crossing & lakeside glamping', altitudeNum: 14270, elevationLabel: '14,270 ft' },
      { day: 6, stage: 'CHANG LA PASS', distance: '150 km · 5.5 hrs', name: 'Pangong Tso → Chang La → Leh Town', altitudeBadge: '17,590 ft', details: 'Glacial crest & marmot meadows', altitudeNum: 17590, elevationLabel: '17,590 ft' },
      { day: 7, stage: 'EXPEDITION FAREWELL', distance: '20 km · 1 hr', name: 'Leh Market Souvenirs & Departure Flight', altitudeBadge: '11,500 ft', details: 'Tibetan handicraft shopping & flyout', altitudeNum: 11500, elevationLabel: '11,500 ft' }
    ]
  },
  'meghalaya': {
    name: 'Meghalaya',
    brandName: 'NomadMeghalaya',
    region: 'Abode of Clouds · 25°N Rainforest Circuit',
    circuitTitle: 'SUBTROPICAL CANYON & LIVING ROOT BRIDGES EXPEDITION',
    quote: '"Where rainforest clouds meet crystal turquoise emeralds"',
    logId: 'NOMAD FIELD LOG #42',
    primeWindow: 'October — May',
    passStatus: 'Cherrapunji Valleys: Clear',
    baseAltitude: '1,500m Alt (4,920 ft)',
    peakLandmark: 'Shillong Peak (6,449 ft / 1,965m)',
    peakAltitudeFt: 6449,
    peakAltitudeM: 1965,
    totalDistanceKm: 460,
    terrainType: 'Subtropical Rainforest',
    terrainDesc: 'Cloud Forests & Gorges',
    paceSpeed: '3–5 hrs/day',
    paceDesc: 'Scenic Canyon Pace',
    coordinates: '25.5788° N, 91.8933° E',
    environment: 'rainforest',
    heroImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1800&auto=format&fit=crop&q=85',
    highlights: [
      { id: 'hl-1', title: 'Double Decker Living Root Bridge', category: 'BIO-ENGINEERING', altitude: '2,200 ft', day: 'Day 3', subtitle: 'Ancient 250-year-old living ficus bridge', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-2', title: 'Umngot Crystal River', category: 'GLASS BOATING', altitude: '700 ft', day: 'Day 4', subtitle: 'Transparent waters on Bangladesh border', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-3', title: 'Wei Sawdong Three-Tier Falls', category: 'TURQUOISE POOLS', altitude: '3,800 ft', day: 'Day 2', subtitle: 'Pristine hidden canyon lagoon', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-4', title: 'Mawlynnong & Balancing Rock', category: 'HERITAGE VILLAGE', altitude: '1,600 ft', day: 'Day 5', subtitle: "Asia's cleanest village community", image: 'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=800&auto=format&fit=crop&q=80' }
    ],
    defaultStops: [
      { day: 1, stage: 'HIGHLAND ENTRY', distance: '100 km · 3.5 hrs', name: 'Guwahati → Umiam Lake → Shillong', altitudeBadge: '4,900 ft', details: 'Pine groves & rock music cafes', altitudeNum: 4900, elevationLabel: '4,900 ft' },
      { day: 2, stage: 'CANYON PLUNGES', distance: '65 km · 2.5 hrs', name: 'Shillong → Wei Sawdong & Nohkalikai Falls', altitudeBadge: '4,100 ft', details: 'Roaring plunge waterfall viewpoints', altitudeNum: 4100, elevationLabel: '4,100 ft' },
      { day: 3, stage: 'SACRED JUNGLE TREK', distance: '40 km · 5 hrs trek', name: 'Cherrapunji → Nongriat Living Root Bridge', altitudeBadge: '2,200 ft', details: '3,500 stone steps & Rainbow Falls', altitudeNum: 2200, elevationLabel: '2,200 ft', isKeyStage: true },
      { day: 4, stage: 'CRYSTAL RIVER', distance: '90 km · 3.5 hrs', name: 'Cherrapunji → Dawki & Umngot River', altitudeBadge: '700 ft', details: 'Glass bottom boating & cliff jumping', altitudeNum: 700, elevationLabel: '700 ft' },
      { day: 5, stage: 'CLEANEST VILLAGE', distance: '85 km · 3 hrs', name: 'Dawki → Mawlynnong & Krang Suri Falls', altitudeBadge: '1,800 ft', details: 'Natural swimming pool & bamboo treehouses', altitudeNum: 1800, elevationLabel: '1,800 ft' },
      { day: 6, stage: 'FOSSIL CAVES', distance: '60 km · 2.5 hrs', name: 'Jowai → Arwah Caves → Shillong Laitlum', altitudeBadge: '5,400 ft', details: 'Limestone fossils & grand canyon rim', altitudeNum: 5400, elevationLabel: '5,400 ft' },
      { day: 7, stage: 'RIVER RETURN', distance: '110 km · 3.5 hrs', name: 'Shillong → Police Bazar → Guwahati Airport', altitudeBadge: '180 ft', details: 'Local tea shopping & departure flight', altitudeNum: 180, elevationLabel: '180 ft' }
    ]
  },
  'kerala': {
    name: 'Kerala',
    brandName: 'NomadKerala',
    region: 'Malabar Coast & Western Ghats · 10°N',
    circuitTitle: 'EMERALD BACKWATERS & SPICE HIGHLANDS JOURNEY',
    quote: '"Where palm shadows drift on serene backwaters"',
    logId: 'NOMAD FIELD LOG #19',
    primeWindow: 'September — March',
    passStatus: 'Vembanad Waterways: Open',
    baseAltitude: '10m Alt (30 ft)',
    peakLandmark: 'Anamudi Peak (8,842 ft / 2,695m)',
    peakAltitudeFt: 8842,
    peakAltitudeM: 2695,
    totalDistanceKm: 520,
    terrainType: 'Tropical Coastal & Highlands',
    terrainDesc: 'Tea Hills & Lagoons',
    paceSpeed: '3–4 hrs/day',
    paceDesc: 'Relaxed Scenic Drive',
    coordinates: '9.9312° N, 76.2673° E',
    environment: 'coastal',
    heroImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1800&auto=format&fit=crop&q=85',
    highlights: [
      { id: 'hl-1', title: 'Alleppey Heritage Houseboat', category: 'PRIVATE CRUISE', altitude: '20 ft', day: 'Day 4', subtitle: 'Overnight cruise on serene backwaters', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-2', title: 'Munnar Rolling Tea Estates', category: 'MISTY HILLS', altitude: '5,200 ft', day: 'Day 2', subtitle: 'Endless emerald green tea carpets', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-3', title: 'Thekkady Periyar Wildlife', category: 'SPICE TRAILS', altitude: '3,000 ft', day: 'Day 3', subtitle: 'Elephant lake boat safari & cardamom trails', image: 'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-4', title: 'Varkala Red Cliff Sunset', category: 'ARABIAN SEA', altitude: '80 ft', day: 'Day 5', subtitle: 'Ocean cliff cafes & beach sunset yoga', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' }
    ],
    defaultStops: [
      { day: 1, stage: 'HERITAGE PORT', distance: '40 km · 1.5 hrs', name: 'Cochin Airport → Fort Kochi & Chinese Nets', altitudeBadge: '10 ft', details: 'Colonial streets, cafes & Kathakali dance', altitudeNum: 10, elevationLabel: '10 ft' },
      { day: 2, stage: 'TEA HIGHLANDS', distance: '130 km · 4 hrs', name: 'Kochi → Cheeyappara Falls → Munnar', altitudeBadge: '5,200 ft', details: 'Lush tea plantations & mist viewpoints', altitudeNum: 5200, elevationLabel: '5,200 ft', isKeyStage: true },
      { day: 3, stage: 'SPICE PLANTATIONS', distance: '90 km · 3 hrs', name: 'Munnar → Periyar Tiger Reserve Thekkady', altitudeBadge: '3,000 ft', details: 'Elephant reserve boating & spice tour', altitudeNum: 3000, elevationLabel: '3,000 ft' },
      { day: 4, stage: 'BACKWATERS EMBARK', distance: '135 km · 3.5 hrs', name: 'Thekkady → Alleppey Luxury Houseboat', altitudeBadge: '20 ft', details: 'Traditional Kettuvalam & sunset toddy trail', altitudeNum: 20, elevationLabel: '20 ft' },
      { day: 5, stage: 'CLIFFTOP SUNSET', distance: '110 km · 3 hrs', name: 'Alleppey → Varkala Helipad Cliffs', altitudeBadge: '80 ft', details: 'Arabian sea panoramic cafes & beach walk', altitudeNum: 80, elevationLabel: '80 ft' },
      { day: 6, stage: 'COASTAL RETREAT', distance: '50 km · 1.5 hrs', name: 'Varkala → Kovalam Lighthouse Beach', altitudeBadge: '30 ft', details: 'Ayurvedic massage & seafood sunset dinner', altitudeNum: 30, elevationLabel: '30 ft' },
      { day: 7, stage: 'AIRPORT FAREWELL', distance: '25 km · 45 mins', name: 'Kovalam → Trivandrum Airport Departure', altitudeBadge: '15 ft', details: 'Cashew & spice souvenirs & flyout', altitudeNum: 15, elevationLabel: '15 ft' }
    ]
  },
  'kashmir': {
    name: 'Kashmir',
    brandName: 'NomadKashmir',
    region: 'Pir Panjal & Great Himalayas · 34°N',
    circuitTitle: 'PARADISE ON EARTH + SRINAGAR, GULMARG & PAHALGAM LOOP',
    quote: '"If there is a paradise on earth, it is this"',
    logId: 'NOMAD FIELD LOG #33',
    primeWindow: 'April — October',
    passStatus: 'Sinthan Top: Open',
    baseAltitude: '1,585m Alt (5,200 ft)',
    peakLandmark: 'Gulmarg Apharwat Peak (14,400 ft / 4,390m)',
    peakAltitudeFt: 14400,
    peakAltitudeM: 4390,
    totalDistanceKm: 420,
    terrainType: 'Alpine Valleys & Lakes',
    terrainDesc: 'Pine Valleys & Glaciers',
    paceSpeed: '2–4 hrs/day',
    paceDesc: 'Relaxed Valley Pace',
    coordinates: '34.0837° N, 74.7973° E',
    environment: 'alpine_lake',
    heroImage: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1800&auto=format&fit=crop&q=85',
    highlights: [
      { id: 'hl-1', title: 'Dal Lake Floating Shikara', category: 'HERITAGE HOUSEBOAT', altitude: '5,200 ft', day: 'Day 1', subtitle: 'Sunrise floating vegetable market & shikara ride', image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-2', title: 'Gulmarg Gondola Phase 2', category: 'HIGHEST CABLE CAR', altitude: '14,400 ft', day: 'Day 3', subtitle: 'Snowline skiing & Apharwat alpine bowl', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-3', title: 'Betaab Valley & Baisaran', category: 'PINE MEADOWS', altitude: '7,200 ft', day: 'Day 4', subtitle: 'Mini Switzerland pony ride & Lidder river', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-4', title: 'Sonamarg Thajiwas Glacier', category: 'MEADOW OF GOLD', altitude: '8,950 ft', day: 'Day 5', subtitle: 'Glacial sledging & Sindh river trout fishing', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' }
    ],
    defaultStops: [
      { day: 1, stage: 'LAKE EMBARKATION', distance: '25 km · 1 hr', name: 'Srinagar Airport → Dal Lake Houseboat', altitudeBadge: '5,200 ft', details: 'Sunset Shikara ride & Kahwa welcome tea', altitudeNum: 5200, elevationLabel: '5,200 ft' },
      { day: 2, stage: 'MUGHAL SPLENDOR', distance: '35 km · 1.5 hrs', name: 'Shalimar, Nishat Bagh & Shankaracharya', altitudeBadge: '5,700 ft', details: 'Terraced Mughal fountains & hill temple', altitudeNum: 5700, elevationLabel: '5,700 ft' },
      { day: 3, stage: 'ALPINE SKI RIDGE', distance: '55 km · 2 hrs', name: 'Srinagar → Gulmarg Gondola & Kongdoori', altitudeBadge: '14,400 ft', details: 'Phase 2 snow summit & pine golf course', altitudeNum: 14400, elevationLabel: '14,400 ft', isKeyStage: true },
      { day: 4, stage: 'VALLEY OF SHEPHERDS', distance: '90 km · 3 hrs', name: 'Gulmarg → Saffron Fields → Pahalgam', altitudeBadge: '7,200 ft', details: 'Pampore saffron farms & Lidder river resort', altitudeNum: 7200, elevationLabel: '7,200 ft' },
      { day: 5, stage: 'PINE HIGHLANDS', distance: '40 km · 2 hrs', name: 'Pahalgam → Aru & Betaab Valleys', altitudeBadge: '8,000 ft', details: 'Glacial pine meadows & trout streams', altitudeNum: 8000, elevationLabel: '8,000 ft' },
      { day: 6, stage: 'MEADOW OF GOLD', distance: '120 km · 3.5 hrs', name: 'Pahalgam → Sonamarg Thajiwas Glacier', altitudeBadge: '8,950 ft', details: 'Zero Point pass gateway & pony sledge', altitudeNum: 8950, elevationLabel: '8,950 ft' },
      { day: 7, stage: 'VALLEY FAREWELL', distance: '80 km · 2.5 hrs', name: 'Sonamarg → Srinagar Airport Flyout', altitudeBadge: '5,200 ft', details: 'Pashmina & walnut wood shopping & departure', altitudeNum: 5200, elevationLabel: '5,200 ft' }
    ]
  },
  'rajasthan': {
    name: 'Rajasthan',
    brandName: 'NomadRajasthan',
    region: 'Royal Desert Kingdom · 27°N',
    circuitTitle: 'ROYAL RAJPUTANA + JAIPUR, JODHPUR, UDAIPUR & THAR DUNES',
    quote: '"Where forts rise from golden sands & legends live in stone"',
    logId: 'NOMAD FIELD LOG #88',
    primeWindow: 'October — March',
    passStatus: 'Thar Desert Trails: Clear',
    baseAltitude: '220m Alt (720 ft)',
    peakLandmark: 'Mehrangarh & Mount Abu Guru Shikhar (5,650 ft / 1,722m)',
    peakAltitudeFt: 5650,
    peakAltitudeM: 1722,
    totalDistanceKm: 780,
    terrainType: 'Thar Desert & Aravalli Hills',
    terrainDesc: 'Desert Dunes & Heritage Palaces',
    paceSpeed: '4–5 hrs/day',
    paceDesc: 'Royal Overland Pace',
    coordinates: '26.9124° N, 75.7873° E',
    environment: 'desert',
    heroImage: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1800&auto=format&fit=crop&q=85',
    highlights: [
      { id: 'hl-1', title: 'Amber Fort & Hawa Mahal', category: 'ROYAL PALACE', altitude: '1,410 ft', day: 'Day 1', subtitle: 'Pink City architecture & mirror palace', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-2', title: 'Jodhpur Mehrangarh Clifftop', category: 'BLUE CITY', altitude: '1,200 ft', day: 'Day 3', subtitle: 'Panoramic fortress & blue alley walks', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-3', title: 'Sam Sand Dunes Camel Safari', category: 'THAR DESERT', altitude: '740 ft', day: 'Day 4', subtitle: 'Golden sunset dune safari & folk music', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-4', title: 'Udaipur Lake Pichola Palace', category: 'VENICE OF THE EAST', altitude: '1,960 ft', day: 'Day 6', subtitle: 'Sunset boat cruise & City Palace courtyard', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80' }
    ],
    defaultStops: [
      { day: 1, stage: 'ROYAL CAPITAL', distance: '30 km · 1 hr', name: 'Jaipur Airport → Amber Fort & City Palace', altitudeBadge: '1,410 ft', details: 'Hawa Mahal photography & Johari Bazar', altitudeNum: 1410, elevationLabel: '1,410 ft' },
      { day: 2, stage: 'HERITAGE HIGHWAY', distance: '150 km · 3.5 hrs', name: 'Jaipur → Pushkar Holy Lake & Brahma Temple', altitudeBadge: '1,670 ft', details: 'Desert ghats & rose garden trails', altitudeNum: 1670, elevationLabel: '1,670 ft' },
      { day: 3, stage: 'BLUE CITADEL', distance: '190 km · 4 hrs', name: 'Pushkar → Jodhpur Mehrangarh & Jaswant Thada', altitudeBadge: '1,200 ft', details: 'Blue City rooftop dinner & fort museum', altitudeNum: 1200, elevationLabel: '1,200 ft' },
      { day: 4, stage: 'GOLDEN THAR DUNES', distance: '280 km · 5 hrs', name: 'Jodhpur → Jaisalmer Fort & Sam Dunes Glamping', altitudeBadge: '740 ft', details: 'Camel ride, bonfire folk dance & desert stars', altitudeNum: 740, elevationLabel: '740 ft', isKeyStage: true },
      { day: 5, stage: 'HAVELI HERITAGE', distance: '40 km · 1.5 hrs', name: 'Sam Dunes → Patwon Ki Haveli & Gadisar Lake', altitudeBadge: '780 ft', details: 'Carved sandstone havelis & sunset boating', altitudeNum: 780, elevationLabel: '780 ft' },
      { day: 6, stage: 'LAKE CITY ENTRY', distance: '300 km · 5.5 hrs', name: 'Jaisalmer → Ranakpur Jain Temples → Udaipur', altitudeBadge: '1,960 ft', details: '1,444 marble carved pillars & Pichola arrival', altitudeNum: 1960, elevationLabel: '1,960 ft' },
      { day: 7, stage: 'LAKE CRUISE & FAREWELL', distance: '25 km · 45 mins', name: 'Lake Pichola Boat Cruise → Udaipur Airport', altitudeBadge: '1,960 ft', details: 'Jag Mandir island cafe & departure flight', altitudeNum: 1960, elevationLabel: '1,960 ft' }
    ]
  },
  'goa': {
    name: 'Goa',
    brandName: 'NomadGoa',
    region: 'Konkan Sun Coast · 15°N',
    circuitTitle: 'TROPICAL COASTAL & HERITAGE PALM CIRCUIT',
    quote: '"Where golden sands meet azure tides & Portuguese charm"',
    logId: 'NOMAD FIELD LOG #12',
    primeWindow: 'October — April',
    passStatus: 'Coastal Ferries: Open',
    baseAltitude: '5m Alt (16 ft)',
    peakLandmark: 'Sonsogor Western Ghats (3,369 ft / 1,027m)',
    peakAltitudeFt: 3369,
    peakAltitudeM: 1027,
    totalDistanceKm: 280,
    terrainType: 'Tropical Coastal',
    terrainDesc: 'Sun Coast & Palm Groves',
    paceSpeed: '2–3 hrs/day',
    paceDesc: 'Susegad Coastal Flow',
    coordinates: '15.2993° N, 74.1240° E',
    environment: 'tropical_beach',
    heroImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1800&auto=format&fit=crop&q=85',
    highlights: [
      { id: 'hl-1', title: 'Fontainhas Latin Quarter', category: 'PORTUGUESE HERITAGE', altitude: '20 ft', day: 'Day 1', subtitle: 'Pastel heritage villas & artisanal cafes', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-2', title: 'Dudhsagar Four-Tier Falls', category: 'JUNGLE SAFARI', altitude: '1,010 ft', day: 'Day 3', subtitle: 'Sea of milk cascade & Bhagwan Mahavir safari', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-3', title: 'Palolem & Butterfly Beach', category: 'CRESCENT BAY', altitude: '10 ft', day: 'Day 5', subtitle: 'Dolphin boat safari & cliff sunset drinks', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-4', title: 'Anjuna & Chapora Sunset Fort', category: 'CLIFFTOP VIBE', altitude: '180 ft', day: 'Day 2', subtitle: 'Dil Chahta Hai clifftop view & beach clubs', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' }
    ],
    defaultStops: [
      { day: 1, stage: 'SUNSHINE ARRIVAL', distance: '35 km · 1 hr', name: 'Goa MOPA/Dabolim Airport → Panjim Latin Quarter', altitudeBadge: '20 ft', details: 'Fontainhas heritage walk & Mandovi sunset cruise', altitudeNum: 20, elevationLabel: '20 ft' },
      { day: 2, stage: 'NORTH COAST VIBE', distance: '45 km · 1.5 hrs', name: 'Panjim → Vagator, Chapora Fort & Anjuna Beach', altitudeBadge: '180 ft', details: 'Clifftop sunset views & coastal seafood dinner', altitudeNum: 180, elevationLabel: '180 ft' },
      { day: 3, stage: 'WESTERN GHATS JUNGLE', distance: '80 km · 2.5 hrs', name: 'North Goa → Dudhsagar Waterfalls & Spice Farm', altitudeBadge: '1,010 ft', details: '4x4 jungle stream crossing & traditional buffet', altitudeNum: 1010, elevationLabel: '1,010 ft', isKeyStage: true },
      { day: 4, stage: 'OLD GOA UNESCO', distance: '50 km · 1.5 hrs', name: 'Basilica of Bom Jesus → Se Cathedral → Divar Island', altitudeBadge: '40 ft', details: '16th century cathedrals & serene river ferry', altitudeNum: 40, elevationLabel: '40 ft' },
      { day: 5, stage: 'SOUTH GOA SERENITY', distance: '70 km · 2 hrs', name: 'Panjim → Agonda & Palolem Crescent Beach', altitudeBadge: '15 ft', details: 'Kayaking in backwater mangrove & beach yoga', altitudeNum: 15, elevationLabel: '15 ft' },
      { day: 6, stage: 'COASTAL FORTS & SUNSET', distance: '30 km · 1 hr', name: 'Palolem → Cabo de Rama Clifftop Fort', altitudeBadge: '200 ft', details: 'Panoramic ocean edge views & seafood barbecue', altitudeNum: 200, elevationLabel: '200 ft' },
      { day: 7, stage: 'GOAN MEMORIES', distance: '40 km · 1 hr', name: 'South Goa Beach Breakfast → Airport Departure', altitudeBadge: '10 ft', details: 'Cashew feni & bebinca souvenirs & flyout', altitudeNum: 10, elevationLabel: '10 ft' }
    ]
  },
  'bali': {
    name: 'Bali',
    brandName: 'NomadBali',
    region: 'Island of the Gods · 8°S',
    circuitTitle: 'SACRED TEMPLES, EMERALD RICE CANOPIES & OCEAN CLIFFS',
    quote: '"Where volcanic ridges meet ocean temples and spiritual serenity"',
    logId: 'NOMAD FIELD LOG #121',
    primeWindow: 'April — October',
    passStatus: 'Mount Batur Trails: Open',
    baseAltitude: '10m Alt (33 ft)',
    peakLandmark: 'Mount Agung Summit (9,944 ft / 3,031m)',
    peakAltitudeFt: 9944,
    peakAltitudeM: 3031,
    totalDistanceKm: 380,
    terrainType: 'Volcanic Island & Tropical Reefs',
    terrainDesc: 'Terraced Valleys & Surf Shores',
    paceSpeed: '2–4 hrs/day',
    paceDesc: 'Island Cruiser Pace',
    coordinates: '8.3405° S, 115.0920° E',
    environment: 'tropical_beach',
    heroImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1800&auto=format&fit=crop&q=85',
    highlights: [
      { id: 'hl-1', title: 'Tegalalang Emerald Terraces', category: 'RICE VALLEYS', altitude: '2,000 ft', day: 'Day 2', subtitle: 'Jungle swings & traditional Subak canals', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-2', title: 'Mount Batur Sunrise Trek', category: 'VOLCANO CRATER', altitude: '5,633 ft', day: 'Day 3', subtitle: 'First light caldera trek & volcanic steam breakfast', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-3', title: 'Uluwatu Sunset Clifftop Temple', category: 'KECACK FIRE DANCE', altitude: '230 ft', day: 'Day 5', subtitle: 'Indian Ocean cliff temple & sacred fire dance', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-4', title: 'Nusa Penida Kelingking T-Rex', category: 'ISLAND CLIFFS', altitude: '650 ft', day: 'Day 4', subtitle: 'Iconic turquoise bay & manta ray snorkel', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80' }
    ],
    defaultStops: [
      { day: 1, stage: 'TROPICAL ARRIVAL', distance: '35 km · 1.5 hrs', name: 'Denpasar Airport → Ubud Rainforest Villa', altitudeBadge: '700 ft', details: 'Monkey Forest sanctuary & organic welcome dinner', altitudeNum: 700, elevationLabel: '700 ft' },
      { day: 2, stage: 'UBUD CULTURAL HEART', distance: '40 km · 2 hrs', name: 'Tegalalang Rice Terraces & Tirta Empul Temple', altitudeBadge: '2,000 ft', details: 'Sacred water purification rite & jungle cafe', altitudeNum: 2000, elevationLabel: '2,000 ft' },
      { day: 3, stage: 'VOLCANIC FIRST LIGHT', distance: '60 km · 3 hrs', name: 'Ubud → Mount Batur Sunrise → Kintamani', altitudeBadge: '5,633 ft', details: 'Caldera ridge sunrise & natural hot springs', altitudeNum: 5633, elevationLabel: '5,633 ft', isKeyStage: true },
      { day: 4, stage: 'OCEAN ISLAND ESCAPE', distance: '45 km speed boat', name: 'Sanur Harbor → Nusa Penida Kelingking & Broken Beach', altitudeBadge: '650 ft', details: 'T-Rex cliff viewpoint & crystal bay snorkeling', altitudeNum: 650, elevationLabel: '650 ft' },
      { day: 5, stage: 'CLIFFTOP TEMPLE & SURF', distance: '50 km · 2 hrs', name: 'Nusa Penida → Seminyak & Uluwatu Cliff Temple', altitudeBadge: '230 ft', details: 'Kecak sunset fire dance & Jimbaran seafood bay', altitudeNum: 230, elevationLabel: '230 ft' },
      { day: 6, stage: 'BEACH CLUBS & SPA', distance: '25 km · 1 hr', name: 'Canggu Coastal Cafes & Balinese Spa Massage', altitudeBadge: '20 ft', details: 'Sunset beach club lounge & boutique market', altitudeNum: 20, elevationLabel: '20 ft' },
      { day: 7, stage: 'BALI FAREWELL', distance: '20 km · 45 mins', name: 'Kuta/Seminyak Souvenir Shopping → Airport Flyout', altitudeBadge: '15 ft', details: 'Kopi Luwak coffee & handmade crafts departure', altitudeNum: 15, elevationLabel: '15 ft' }
    ]
  },
  'vietnam': {
    name: 'Vietnam',
    brandName: 'NomadVietnam',
    region: 'Indochina Emerald Corridor · 16°N',
    circuitTitle: 'EMERALD KARSTS, ANCIENT LANTERNS & NORTH-TO-SOUTH OVERLAND',
    quote: '"Where limestone dragons rise from emerald waters and old world lanterns glow"',
    logId: 'NOMAD FIELD LOG #145',
    primeWindow: 'September — April',
    passStatus: 'Ha Long Bay Nav: Clear',
    baseAltitude: '15m Alt (50 ft)',
    peakLandmark: 'Fansipan Indochina Roof (10,312 ft / 3,143m)',
    peakAltitudeFt: 10312,
    peakAltitudeM: 3143,
    totalDistanceKm: 650,
    terrainType: 'Karst Bays & Tropical Highlands',
    terrainDesc: 'Limestone Bays & Ancient Towns',
    paceSpeed: '3–5 hrs/day',
    paceDesc: 'Scenic Discovery Pace',
    coordinates: '14.0583° N, 108.2772° E',
    environment: 'coastal',
    heroImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1800&auto=format&fit=crop&q=85',
    highlights: [
      { id: 'hl-1', title: 'Ha Long Bay Overnight Cruise', category: 'UNESCO WONDER', altitude: '20 ft', day: 'Day 2', subtitle: 'Emerald waters & karst cave kayaking', image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-2', title: 'Hoi An Lantern Old Town', category: 'ANCIENT HERITAGE', altitude: '30 ft', day: 'Day 4', subtitle: 'Glowing silk lanterns & river longboat rides', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-3', title: 'Ba Na Hills Golden Bridge', category: 'GIANT HANDS', altitude: '4,640 ft', day: 'Day 5', subtitle: 'Colossal stone hands holding the sky bridge', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-4', title: 'Hanoi Train Street & Pho', category: 'OLD QUARTER', altitude: '40 ft', day: 'Day 1', subtitle: 'Egg coffee, close-call train passage & street delicacies', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' }
    ],
    defaultStops: [
      { day: 1, stage: 'OLD QUARTER CHARM', distance: '30 km · 1 hr', name: 'Hanoi Noi Bai Airport → Old Quarter & Train Street', altitudeBadge: '40 ft', details: 'Egg coffee tasting & Hoan Kiem lake stroll', altitudeNum: 40, elevationLabel: '40 ft' },
      { day: 2, stage: 'EMERALD BAY CRUISE', distance: '160 km · 3 hrs', name: 'Hanoi → Ha Long Bay / Lan Ha Luxury Cruise', altitudeBadge: '20 ft', details: 'Kayaking in Sung Sot cave & sunset deck cocktail', altitudeNum: 20, elevationLabel: '20 ft', isKeyStage: true },
      { day: 3, stage: 'CENTRAL VIETNAM FLIGHT', distance: 'Flight + 30 km', name: 'Ha Long Bay → Hanoi Airport → Da Nang Coastal Bay', altitudeBadge: '30 ft', details: 'Dragon Bridge fire show & My Khe beach walk', altitudeNum: 30, elevationLabel: '30 ft' },
      { day: 4, stage: 'LANTERN ILLUMINATION', distance: '35 km · 1 hr', name: 'Da Nang → Hoi An Ancient Riverside Town', altitudeBadge: '25 ft', details: 'Japanese Covered Bridge & night lantern boat release', altitudeNum: 25, elevationLabel: '25 ft' },
      { day: 5, stage: 'GIANT HANDS IN CLOUDS', distance: '45 km · 1.5 hrs', name: 'Hoi An → Ba Na Hills Golden Hands Bridge', altitudeBadge: '4,640 ft', details: 'Cable car ascent & French village gardens', altitudeNum: 4640, elevationLabel: '4,640 ft' },
      { day: 6, stage: 'MARBLE MOUNTAIN CAVES', distance: '25 km · 45 mins', name: 'Marble Mountains & Cham Island Boat Tour', altitudeBadge: '350 ft', details: 'Subterranean Buddhist shrines & coral reef dive', altitudeNum: 350, elevationLabel: '350 ft' },
      { day: 7, stage: 'INDOCHINA FAREWELL', distance: '20 km · 30 mins', name: 'Da Nang Market & Airport Departure Flyout', altitudeBadge: '20 ft', details: 'Vietnamese robusta coffee & silk souvenir shopping', altitudeNum: 20, elevationLabel: '20 ft' }
    ]
  },
  'dubai': {
    name: 'Dubai',
    brandName: 'NomadDubai',
    region: 'Arabian Gulf Oasis · 25°N',
    circuitTitle: 'FUTURE METROPOLIS & ARABIAN DESERT DUNE EXPEDITION',
    quote: '"Where futuristic towers touch the stars and desert sands glow golden"',
    logId: 'NOMAD FIELD LOG #55',
    primeWindow: 'November — March',
    passStatus: 'Dune Circuits: Open',
    baseAltitude: '5m Alt (16 ft)',
    peakLandmark: 'Burj Khalifa Top (2,722 ft / 828m)',
    peakAltitudeFt: 2722,
    peakAltitudeM: 828,
    totalDistanceKm: 240,
    terrainType: 'Hypermodern Oasis & Desert Dunes',
    terrainDesc: 'Futuristic Skyline & Red Sands',
    paceSpeed: '2–3 hrs/day',
    paceDesc: 'Metropolitan Luxury Flow',
    coordinates: '25.2048° N, 55.2708° E',
    environment: 'desert',
    heroImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1800&auto=format&fit=crop&q=85',
    highlights: [
      { id: 'hl-1', title: 'Burj Khalifa Level 148', category: 'ROOF OF ARCHITECTURE', altitude: '2,722 ft', day: 'Day 2', subtitle: "World's tallest observation lounge & fountain show", image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-2', title: 'Red Dunes Desert Safari & BBQ', category: 'BEDOUIN EXPEDITION', altitude: '850 ft', day: 'Day 3', subtitle: '4x4 dune bashing, quad biking & fire show dinner', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-3', title: 'Palm Jumeirah & Atlantis Aquaventure', category: 'MAN-MADE WONDER', altitude: '30 ft', day: 'Day 4', subtitle: 'Iconic palm archipelago & waterpark slides', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-4', title: 'Dubai Marina Luxury Yacht Cruise', category: 'SUPERYACHT GLAMOUR', altitude: '10 ft', day: 'Day 5', subtitle: 'Sunset private yacht cruise along skyline channels', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' }
    ],
    defaultStops: [
      { day: 1, stage: 'GLAMOUR ARRIVAL', distance: '25 km · 30 mins', name: 'Dubai DXB Airport → Downtown Hotel Check-In', altitudeBadge: '30 ft', details: 'Dubai Mall & evening fountain dance spectacle', altitudeNum: 30, elevationLabel: '30 ft' },
      { day: 2, stage: 'SKYSCRAPER SUMMITS', distance: '20 km · 45 mins', name: 'Burj Khalifa Observation Deck & Museum of Future', altitudeBadge: '2,722 ft', details: 'Hypermodern exhibits & Level 148 lounge', altitudeNum: 2722, elevationLabel: '2,722 ft', isKeyStage: true },
      { day: 3, stage: 'RED DUNE CONQUEST', distance: '70 km · 1.5 hrs', name: 'Downtown → Lahbab Red Dunes 4x4 Safari Camp', altitudeBadge: '850 ft', details: 'Sandboarding, camel ride & stargazing banquet', altitudeNum: 850, elevationLabel: '850 ft' },
      { day: 4, stage: 'PALM ARCHIPELAGO', distance: '35 km · 45 mins', name: 'The View at The Palm & Atlantis Lost Chambers', altitudeBadge: '780 ft', details: 'Monorail panoramic ride & beach resort lounge', altitudeNum: 780, elevationLabel: '780 ft' },
      { day: 5, stage: 'MARINA SUPERYACHT', distance: '25 km · 30 mins', name: 'Dubai Marina Yacht Sunset Cruise & JBR Walk', altitudeBadge: '10 ft', details: 'Skyline sunset photography & waterfront dining', altitudeNum: 10, elevationLabel: '10 ft' },
      { day: 6, stage: 'OLD DUBAI HERITAGE', distance: '30 km · 45 mins', name: 'Al Fahidi Fort, Abra Creek Ferry & Gold Souk', altitudeBadge: '20 ft', details: 'Traditional spice bargaining & historic windtowers', altitudeNum: 20, elevationLabel: '20 ft' },
      { day: 7, stage: 'EMIRATES FAREWELL', distance: '15 km · 20 mins', name: 'Dubai Frame Morning Walk → Airport Departure', altitudeBadge: '492 ft', details: 'Glass floor bridge & flight departure', altitudeNum: 492, elevationLabel: '492 ft' }
    ]
  },
  'himachal': {
    name: 'Himachal',
    brandName: 'NomadHimachal',
    region: 'Western Himalayas · 31°N',
    circuitTitle: 'PINE VALLEYS, PARAGLIDING & SACRED HOT SPRINGS',
    quote: '"Where cedar forests echo with river torrents and snow peaks touch the sky"',
    logId: 'NOMAD FIELD LOG #99',
    primeWindow: 'Year-Round (March — June & Dec — Feb)',
    passStatus: 'Atal Tunnel: Open',
    baseAltitude: '2,050m Alt (6,725 ft)',
    peakLandmark: 'Rohtang Pass (13,058 ft / 3,980m)',
    peakAltitudeFt: 13058,
    peakAltitudeM: 3980,
    totalDistanceKm: 490,
    terrainType: 'Pine Valleys & Alpine Slopes',
    terrainDesc: 'Lush Cedars & Snow Peaks',
    paceSpeed: '3–4 hrs/day',
    paceDesc: 'Mountain Serenity Pace',
    coordinates: '31.1048° N, 77.1734° E',
    environment: 'high_altitude',
    heroImage: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1800&auto=format&fit=crop&q=85',
    highlights: [
      { id: 'hl-1', title: 'Solang Valley & Atal Tunnel', category: 'SNOW ADVENTURE', altitude: '10,000 ft', day: 'Day 3', subtitle: 'Snow quad biking & high altitude engineering wonder', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-2', title: 'Kasol & Parvati River Cafes', category: 'ISRAELI VIBE', altitude: '5,180 ft', day: 'Day 4', subtitle: 'Pine forest trails & riverside falafel cafes', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-3', title: 'Bir Billing Paragliding Takeoff', category: 'WORLD CUP SITE', altitude: '8,000 ft', day: 'Day 6', subtitle: 'Tandem paragliding flight over tea gardens', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-4', title: 'Old Manali Apple Orchards', category: 'WOODEN VILLAGE', altitude: '6,700 ft', day: 'Day 2', subtitle: 'Hadimba temple & live acoustic music lounges', image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop&q=80' }
    ],
    defaultStops: [
      { day: 1, stage: 'FOOTHILL ASCENT', distance: '120 km · 4 hrs', name: 'Chandigarh / Bhuntar → Kullu Valley → Manali', altitudeBadge: '6,700 ft', details: 'Beas River drive & Himalayan apple orchards', altitudeNum: 6700, elevationLabel: '6,700 ft' },
      { day: 2, stage: 'CEDAR HERITAGE', distance: '25 km · 1.5 hrs', name: 'Hadimba Temple, Vashisht Springs & Old Manali', altitudeBadge: '7,100 ft', details: 'Natural hot sulphur baths & bohemian cafes', altitudeNum: 7100, elevationLabel: '7,100 ft' },
      { day: 3, stage: 'HIGH PASS TUNNEL', distance: '70 km · 3 hrs', name: 'Manali → Solang Valley → Atal Tunnel → Sissu', altitudeBadge: '10,170 ft', details: 'Lahaul waterfall & snow activity meadow', altitudeNum: 10170, elevationLabel: '10,170 ft', isKeyStage: true },
      { day: 4, stage: 'PARVATI MYSTIQUE', distance: '85 km · 3.5 hrs', name: 'Manali → Kasol & Manikaran Sahib Gurudwara', altitudeBadge: '5,700 ft', details: 'Riverside camping & natural hot geyser meal rite', altitudeNum: 5700, elevationLabel: '5,700 ft' },
      { day: 5, stage: 'SECRET JIBHI VALLEY', distance: '60 km · 2.5 hrs', name: 'Kasol → Jibhi Wooden Cottages & Chehni Kothi', altitudeBadge: '6,400 ft', details: 'Ancient 1500-year-old wooden tower & stream walk', altitudeNum: 6400, elevationLabel: '6,400 ft' },
      { day: 6, stage: 'SKY FLYING GLORY', distance: '110 km · 4 hrs', name: 'Jibhi → Bir Billing Paragliding Valley', altitudeBadge: '8,000 ft', details: 'World Cup takeoff site & Tibetan monastery stupas', altitudeNum: 8000, elevationLabel: '8,000 ft' },
      { day: 7, stage: 'MOUNTAIN FAREWELL', distance: '70 km · 2.5 hrs', name: 'Bir Billing → Dharamshala / Kangra Flyout', altitudeBadge: '4,500 ft', details: 'Kangra green tea shopping & departure flight', altitudeNum: 4500, elevationLabel: '4,500 ft' }
    ]
  },
  'uttarakhand': {
    name: 'Uttarakhand',
    brandName: 'NomadUttarakhand',
    region: 'Garhwal & Kumaon Himalayas · 30°N',
    circuitTitle: 'YOGA CAPITAL, HIGH MEADOWS & ALPINE BUGYAL ODYSSEY',
    quote: '"Where holy rivers originate from sacred glaciers & silence reigns"',
    logId: 'NOMAD FIELD LOG #67',
    primeWindow: 'March — June & September — November',
    passStatus: 'Tungnath Trek: Open',
    baseAltitude: '1,400m Alt (4,600 ft)',
    peakLandmark: 'Chandrashila Peak (12,110 ft / 3,690m)',
    peakAltitudeFt: 12110,
    peakAltitudeM: 3690,
    totalDistanceKm: 510,
    terrainType: 'Sacred Gorges & Alpine Meadows',
    terrainDesc: 'Bugyal Meadows & River Gorges',
    paceSpeed: '3–4 hrs/day',
    paceDesc: 'High Valley Expedition',
    coordinates: '30.0668° N, 79.0193° E',
    environment: 'high_altitude',
    heroImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1800&auto=format&fit=crop&q=85',
    highlights: [
      { id: 'hl-1', title: 'Rishikesh Ganga Aarti & Rafting', category: 'HOLY RIVER', altitude: '1,120 ft', day: 'Day 1', subtitle: 'Triveni Ghat spiritual aarti & Grade 4 rapids', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-2', title: 'Chopta & Chandrashila Summit', category: 'HIGHEST SHIVA TEMPLE', altitude: '12,110 ft', day: 'Day 4', subtitle: '360° Himalayan peaks & rhododendron forest', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-3', title: 'Auli Alpine Ski Slopes & Ropeway', category: 'SNOW MEADOWS', altitude: '9,500 ft', day: 'Day 5', subtitle: 'Asia longest cable car & Nanda Devi panoramic view', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-4', title: 'Deoria Tal Reflection Lake', category: 'SACRED WATERS', altitude: '7,998 ft', day: 'Day 3', subtitle: 'Chaukhamba mirror reflections & pine camping', image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop&q=80' }
    ],
    defaultStops: [
      { day: 1, stage: 'RIVER SPIRIT', distance: '30 km · 1 hr', name: 'Dehradun Airport → Rishikesh Ashram & River Raft', altitudeBadge: '1,120 ft', details: 'Laxman Jhula walk & Parmarth Niketan Ganga Aarti', altitudeNum: 1120, elevationLabel: '1,120 ft' },
      { day: 2, stage: 'PINE GORGE DRIVE', distance: '140 km · 4.5 hrs', name: 'Rishikesh → Devprayag Sangam → Sari Village', altitudeBadge: '6,500 ft', details: 'Confluence of Alaknanda & Bhagirathi holy rivers', altitudeNum: 6500, elevationLabel: '6,500 ft' },
      { day: 3, stage: 'MIRROR LAKE TREK', distance: '30 km · 3 hrs trek', name: 'Sari Village → Deoria Tal Lake Forest Camp', altitudeBadge: '7,998 ft', details: 'Emerald lake reflecting Chaukhamba massif', altitudeNum: 7998, elevationLabel: '7,998 ft' },
      { day: 4, stage: 'HIGHEST TEMPLE SUMMIT', distance: '40 km · 5 hrs trek', name: 'Chopta Mini Switzerland → Tungnath → Chandrashila', altitudeBadge: '12,110 ft', details: 'Ancient cliff temple & breathtaking 360° summit', altitudeNum: 12110, elevationLabel: '12,110 ft', isKeyStage: true },
      { day: 5, stage: 'ALPINE SKI RIDGE', distance: '90 km · 3.5 hrs', name: 'Chopta → Joshimath → Auli Snow Meadow Cable Car', altitudeBadge: '9,500 ft', details: 'Nanda Devi panoramic sunset & ski slope cabins', altitudeNum: 9500, elevationLabel: '9,500 ft' },
      { day: 6, stage: 'PILGRIM DESCENT', distance: '120 km · 4 hrs', name: 'Auli → Rudraprayag → Rishikesh Riverside Resort', altitudeBadge: '1,200 ft', details: 'Himalayan organic cafe & sound healing meditation', altitudeNum: 1200, elevationLabel: '1,200 ft' },
      { day: 7, stage: 'GARHWAL FAREWELL', distance: '35 km · 1 hr', name: 'Rishikesh Riverfront Breakfast → Dehradun Flyout', altitudeBadge: '1,120 ft', details: 'Ayurvedic oils & singing bowl shopping departure', altitudeNum: 1120, elevationLabel: '1,120 ft' }
    ]
  },
  'bhutan': {
    name: 'Bhutan',
    brandName: 'NomadBhutan',
    region: 'Eastern Himalayas · 27°N',
    circuitTitle: 'KINGDOM OF GROSS NATIONAL HAPPINESS & DZONG MONASTERIES',
    quote: '"Where prayer flags flutter over pristine mountain valleys"',
    logId: 'NOMAD FIELD LOG #118',
    primeWindow: 'September — November & March — May',
    passStatus: 'Dochula Pass: Clear',
    baseAltitude: '2,320m Alt (7,610 ft)',
    peakLandmark: "Tiger's Nest Cliff Monastery (10,240 ft / 3,120m)",
    peakAltitudeFt: 10240,
    peakAltitudeM: 3120,
    totalDistanceKm: 390,
    terrainType: 'Himalayan Kingdom & Pine Forests',
    terrainDesc: 'Dzongs & Cliff Shrines',
    paceSpeed: '2–4 hrs/day',
    paceDesc: 'Mindful Cultural Flow',
    coordinates: '27.5142° N, 90.4336° E',
    environment: 'high_altitude',
    heroImage: 'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=1800&auto=format&fit=crop&q=85',
    highlights: [
      { id: 'hl-1', title: "Paro Taktsang Tiger's Nest", category: 'SACRED CLIFF SHRINE', altitude: '10,240 ft', day: 'Day 5', subtitle: 'Hanging 3,000 ft cliffside temple monastery', image: 'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-2', title: 'Punakha Dzong & Iron Bridge', category: 'PALACE OF HAPPINESS', altitude: '4,000 ft', day: 'Day 3', subtitle: 'Jacaranda blooms & confluence of Pho & Mo rivers', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-3', title: 'Dochula Pass 108 Chortens', category: 'HIMALAYAN PANORAMA', altitude: '10,170 ft', day: 'Day 2', subtitle: 'Snow-capped peak backdrop & sacred stupas', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-4', title: 'Thimphu Buddha Dordenma', category: 'COLOSSAL STATUE', altitude: '8,200 ft', day: 'Day 1', subtitle: '169 ft golden bronze Buddha overlooking capital', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' }
    ],
    defaultStops: [
      { day: 1, stage: 'DRAGON AIR ARRIVAL', distance: '55 km · 1.5 hrs', name: 'Paro Airport → Thimphu Capital & Buddha Dordenma', altitudeBadge: '7,610 ft', details: 'Scenic Himalayan landing & Tashichho Dzong visit', altitudeNum: 7610, elevationLabel: '7,610 ft' },
      { day: 2, stage: 'SACRED PASS CROSSING', distance: '75 km · 3 hrs', name: 'Thimphu → Dochula Pass 108 Stupas → Punakha', altitudeBadge: '10,170 ft', details: 'High mountain prayer flags & warm valley descent', altitudeNum: 10170, elevationLabel: '10,170 ft' },
      { day: 3, stage: 'PALACE OF BLISS', distance: '40 km · 1.5 hrs', name: 'Punakha Dzong & Chimi Lhakhang Fertility Temple', altitudeBadge: '4,000 ft', details: 'Longest suspension bridge & traditional farmhouse dinner', altitudeNum: 4000, elevationLabel: '4,000 ft' },
      { day: 4, stage: 'VALLEY TRANSITION', distance: '125 km · 4 hrs', name: 'Punakha Valley → Paro Cultural Heritage Valley', altitudeBadge: '7,200 ft', details: 'National Museum & archery competition lawn', altitudeNum: 7200, elevationLabel: '7,200 ft' },
      { day: 5, stage: 'TIGERS NEST ASCENT', distance: '20 km · 5 hrs trek', name: "Paro Valley → Taktsang Tiger's Nest Monastery", altitudeBadge: '10,240 ft', details: 'Epic cliffside pilgrimage & butter lamp offering', altitudeNum: 10240, elevationLabel: '10,240 ft', isKeyStage: true },
      { day: 6, stage: 'CULTURAL IMMERSION', distance: '30 km · 1.5 hrs', name: 'Paro Rinpung Dzong & Traditional Hot Stone Bath', altitudeBadge: '7,200 ft', details: 'Fortress monastery tour & healing herbal bath', altitudeNum: 7200, elevationLabel: '7,200 ft' },
      { day: 7, stage: 'DRAGON KINGDOM FAREWELL', distance: '10 km · 30 mins', name: 'Paro Morning Market → Airport Departure', altitudeBadge: '7,300 ft', details: 'Bhutanese handicraft shopping & departure flight', altitudeNum: 7300, elevationLabel: '7,300 ft' }
    ]
  },
  'chennai': {
    name: 'Chennai',
    brandName: 'NomadChennai',
    region: 'Coromandel Coast & Dravidian Capital · 13°N',
    circuitTitle: 'COASTAL TEMPLES, MARINA PROMENADE & UNESCO SHORE CIRCUIT',
    quote: '"Where ancient temple bells blend with gentle sea breezes"',
    logId: 'NOMAD CITY LOG #44',
    primeWindow: 'November — March',
    passStatus: 'ECR Highway: Clear & Scenic',
    baseAltitude: '6m Alt (20 ft)',
    peakLandmark: 'St. Thomas Mount & Light House (260 ft / 80m)',
    peakAltitudeFt: 260,
    peakAltitudeM: 80,
    totalDistanceKm: 220,
    terrainType: 'Coastal City & Heritage Shores',
    terrainDesc: 'Sun Coast, Temples & Bazaars',
    paceSpeed: '2–4 hrs/day',
    paceDesc: 'Relaxed Cultural Flow',
    coordinates: '13.0827° N, 80.2707° E',
    environment: 'coastal_city',
    heroImage: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1800&auto=format&fit=crop&q=85',
    highlights: [
      { id: 'hl-1', title: 'Kapaleeshwarar Temple & Mylapore', category: 'DRAVIDIAN HERITAGE', altitude: '30 ft', day: 'Day 2', subtitle: '7th-century rainbow gopuram & sacred tank', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-2', title: 'Marina Beach Sunset Promenade', category: 'SEASIDE PROMENADE', altitude: '10 ft', day: 'Day 1', subtitle: "World's second longest natural urban beach", image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-3', title: 'Mahabalipuram UNESCO Shore Temple', category: 'ROCK-CUT MONOLITH', altitude: '20 ft', day: 'Day 4', subtitle: 'Pancha Rathas & 7th-century seaside temple', image: 'https://images.unsplash.com/photo-1600100397608-f463993d3958?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-4', title: 'DakshinaChitra Living Heritage', category: 'ARTS & ARCHITECTURE', altitude: '25 ft', day: 'Day 3', subtitle: 'Traditional South Indian craft village on ECR', image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop&q=80' }
    ],
    defaultStops: [
      { day: 1, stage: 'COASTAL ARRIVAL', distance: '20 km · 45 mins', name: 'Chennai Airport → Marina Beach & San Thome Cathedral', altitudeBadge: '20 ft', details: 'Sunset coastal walk & authentic filter coffee tasting', altitudeNum: 20, elevationLabel: '20 ft' },
      { day: 2, stage: 'SACRED MYLAPORE', distance: '15 km · 30 mins', name: 'Kapaleeshwarar Temple, Mylapore Tank & Tiffin Trail', altitudeBadge: '30 ft', details: 'Ancient Dravidian carvings, brass bells & crispy ghee dosas', altitudeNum: 30, elevationLabel: '30 ft' },
      { day: 3, stage: 'HERITAGE HIGHWAY', distance: '40 km · 1 hr', name: 'ECR Scenic Drive → DakshinaChitra & Cholamandal Artists', altitudeBadge: '25 ft', details: 'Living traditional craft museum & artisan seaside studios', altitudeNum: 25, elevationLabel: '25 ft' },
      { day: 4, stage: 'UNESCO SHORE WONDER', distance: '60 km · 1.5 hrs', name: 'Mahabalipuram Shore Temple, Arjuna Penance & Butter Ball', altitudeBadge: '20 ft', details: 'Monolithic granite cave temples & seaside seafood dinner', altitudeNum: 20, elevationLabel: '20 ft', isKeyStage: true },
      { day: 5, stage: 'SILK & TEMPLE CITY', distance: '75 km · 2 hrs', name: 'Day Excursion to Kanchipuram Weavers & Kailasanathar', altitudeBadge: '275 ft', details: 'Handwoven pure mulberry silk sarees & 1000-pillar shrines', altitudeNum: 275, elevationLabel: '275 ft' },
      { day: 6, stage: 'COLONIAL CITADEL', distance: '25 km · 45 mins', name: 'Fort St. George, High Court & Besant Nagar Elliot Beach', altitudeBadge: '20 ft', details: 'Old British fort museum & evening beachside cafes', altitudeNum: 20, elevationLabel: '20 ft' },
      { day: 7, stage: 'COROMANDEL FAREWELL', distance: '15 km · 30 mins', name: 'Pondy Bazaar Souvenir Shopping → Airport Flyout', altitudeBadge: '20 ft', details: 'Kanchipuram silk, filter coffee decoction & departure', altitudeNum: 20, elevationLabel: '20 ft' }
    ]
  },
  'mumbai': {
    name: 'Mumbai',
    brandName: 'NomadMumbai',
    region: 'Konkan Arabian Coast & Financial Capital · 19°N',
    circuitTitle: 'CITY OF DREAMS, QUEEN’S NECKLACE & ELEPHANTA CAVES CIRCUIT',
    quote: '"Where historic stone arches greet the vast Arabian tides"',
    logId: 'NOMAD CITY LOG #11',
    primeWindow: 'October — March',
    passStatus: 'Sea Link & Coastal Expressways: Open',
    baseAltitude: '8m Alt (26 ft)',
    peakLandmark: 'Malabar Hill Hanging Gardens (180 ft / 55m)',
    peakAltitudeFt: 180,
    peakAltitudeM: 55,
    totalDistanceKm: 190,
    terrainType: 'Metropolitan Coastline',
    terrainDesc: 'Colonial Heritage & Sea Promenades',
    paceSpeed: '2–3 hrs/day',
    paceDesc: 'Vibrant Urban Pace',
    coordinates: '18.9220° N, 72.8347° E',
    environment: 'coastal_city',
    heroImage: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1800&auto=format&fit=crop&q=85',
    highlights: [
      { id: 'hl-1', title: 'Gateway of India & Taj Mahal Palace', category: 'COLONIAL ICON', altitude: '20 ft', day: 'Day 1', subtitle: '1924 basalt waterfront monument & harbor view', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-2', title: "Marine Drive & Queen's Necklace", category: 'COASTAL BOULEVARD', altitude: '15 ft', day: 'Day 2', subtitle: 'C-shaped Arabian sea curve & sunset lights', image: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-3', title: 'Elephanta UNESCO Cave Shrines', category: 'ROCK-CUT SCULPTURE', altitude: '100 ft', day: 'Day 3', subtitle: '5th-century Trimurti Shiva island cave complex', image: 'https://images.unsplash.com/photo-1600100397608-f463993d3958?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-4', title: 'Bandra Bandstand & Portuguese Fort', category: 'COSMOPOLITAN VIBE', altitude: '40 ft', day: 'Day 4', subtitle: 'Seaside cafes, Mount Mary church & promenade', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' }
    ],
    defaultStops: [
      { day: 1, stage: 'SOUTH MUMBAI HERITAGE', distance: '25 km · 1 hr', name: 'CSMT Station, Gateway of India & Colaba Causeway', altitudeBadge: '20 ft', details: 'Gothic architecture walk & cafe culture', altitudeNum: 20, elevationLabel: '20 ft' },
      { day: 2, stage: 'QUEENS NECKLACE SUNSET', distance: '20 km · 45 mins', name: 'Marine Drive, Girgaon Chowpatty & Malabar Hill', altitudeBadge: '180 ft', details: 'Hanging gardens panorama & sunset kulfi tasting', altitudeNum: 180, elevationLabel: '180 ft' },
      { day: 3, stage: 'ISLAND CAVE VOYAGE', distance: 'Harbor Ferry + 10 km', name: 'Gateway Ferry → Elephanta Island Rock Caves', altitudeBadge: '100 ft', details: 'Ancient monolithic Shiva reliefs & island train', altitudeNum: 100, elevationLabel: '100 ft', isKeyStage: true },
      { day: 4, stage: 'BANDRA VIBE & SEA LINK', distance: '30 km · 1 hr', name: 'Bandra-Worli Sea Link → Bandstand & Linking Road', altitudeBadge: '40 ft', details: 'Boutique shopping, street food & ocean cafes', altitudeNum: 40, elevationLabel: '40 ft' },
      { day: 5, stage: 'ARTS & CINEMA', distance: '25 km · 1 hr', name: 'Kala Ghoda Art Precinct & Bollywood Studio Tour', altitudeBadge: '25 ft', details: 'Contemporary art galleries & cinema museum', altitudeNum: 25, elevationLabel: '25 ft' },
      { day: 6, stage: 'NATURE IN THE CITY', distance: '35 km · 1.5 hrs', name: 'Sanjay Gandhi National Park & Kanheri Caves', altitudeBadge: '350 ft', details: 'Ancient Buddhist rock-cut monasteries in forest', altitudeNum: 350, elevationLabel: '350 ft' },
      { day: 7, stage: 'MAXIMUM CITY FAREWELL', distance: '15 km · 30 mins', name: 'Crawford Market Spices → Mumbai Airport Departure', altitudeBadge: '20 ft', details: 'Alphonso mango/spice shopping & flyout', altitudeNum: 20, elevationLabel: '20 ft' }
    ]
  },
  'delhi': {
    name: 'Delhi',
    brandName: 'NomadDelhi',
    region: 'Historic Capital & Yamuna Plains · 28°N',
    circuitTitle: 'SEVEN CITIES OF DELHI + MUGHAL SPLENDOR & MODERN BOULEVARDS',
    quote: '"Where millennia of empires echo in red sandstone"',
    logId: 'NOMAD CITY LOG #01',
    primeWindow: 'October — March',
    passStatus: 'All Heritage Monuments: Open',
    baseAltitude: '216m Alt (708 ft)',
    peakLandmark: 'Qutub Minar Tower (240 ft / 73m)',
    peakAltitudeFt: 708,
    peakAltitudeM: 216,
    totalDistanceKm: 180,
    terrainType: 'Historic Metropolis & Garden Boulevards',
    terrainDesc: 'Mughal Citadels & Bazaars',
    paceSpeed: '2–3 hrs/day',
    paceDesc: 'Grand Capital Exploration',
    coordinates: '28.6139° N, 77.2090° E',
    environment: 'urban_heritage',
    heroImage: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1800&auto=format&fit=crop&q=85',
    highlights: [
      { id: 'hl-1', title: 'Qutub Minar & Mehrauli Ruins', category: 'UNESCO TOWER', altitude: '708 ft', day: 'Day 2', subtitle: '73m fluted brick minaret & 4th-century iron pillar', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-2', title: 'Humayun’s Tomb Persian Garden', category: 'MUGHAL GARDEN', altitude: '690 ft', day: 'Day 3', subtitle: 'Inspiration for the Taj Mahal with red sandstone arches', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-3', title: 'Old Delhi Chandni Chowk & Jama Masjid', category: 'CULINARY BAZAAR', altitude: '700 ft', day: 'Day 1', subtitle: 'Rickshaw ride through spice alleys & Paranthe Wali Gali', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-4', title: 'India Gate & Kartavya Path', category: 'NATIONAL BOULEVARD', altitude: '710 ft', day: 'Day 4', subtitle: 'Illuminated arch memorial & Rashtrapati Bhavan', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' }
    ],
    defaultStops: [
      { day: 1, stage: 'SHAHJAHANABAD ROOTS', distance: '20 km · 1 hr', name: 'Red Fort, Jama Masjid & Chandni Chowk Food Tour', altitudeBadge: '700 ft', details: 'Rickshaw spice tour & Daulat ki Chaat tasting', altitudeNum: 700, elevationLabel: '700 ft' },
      { day: 2, stage: 'ANCIENT MINARETS', distance: '25 km · 1 hr', name: 'Qutub Minar, Mehrauli Archaeological Park & Hauz Khas', altitudeBadge: '708 ft', details: '12th-century Sultanate architecture & lakeside cafes', altitudeNum: 708, elevationLabel: '708 ft' },
      { day: 3, stage: 'MUGHAL GARDEN TOMBS', distance: '20 km · 45 mins', name: 'Humayun’s Tomb, Sunder Nursery & Lodhi Art District', altitudeBadge: '690 ft', details: 'Persian pavilions, heritage gardens & mural street art', altitudeNum: 690, elevationLabel: '690 ft', isKeyStage: true },
      { day: 4, stage: 'IMPERIAL BOULEVARDS', distance: '15 km · 30 mins', name: 'India Gate, National War Memorial & Kartavya Path', altitudeBadge: '710 ft', details: 'Lutyens colonial design & twilight fountain walk', altitudeNum: 710, elevationLabel: '710 ft' },
      { day: 5, stage: 'SPIRITUAL ARCHITECTURE', distance: '30 km · 1 hr', name: 'Akshardham Temple, Lotus Temple & Bangla Sahib', altitudeBadge: '680 ft', details: 'Carved sandstone boat ride & sacred community kitchen', altitudeNum: 680, elevationLabel: '680 ft' },
      { day: 6, stage: 'SHOPPING & TEXTILES', distance: '20 km · 45 mins', name: 'Dilli Haat Crafts, Khan Market & Janpath Bazaars', altitudeBadge: '700 ft', details: 'All-India regional handicraft stalls & artisanal lunch', altitudeNum: 700, elevationLabel: '700 ft' },
      { day: 7, stage: 'CAPITAL FAREWELL', distance: '15 km · 30 mins', name: 'Aerocity Morning Breakfast → IGI Airport Flyout', altitudeBadge: '750 ft', details: 'Spices and souvenir collection departure', altitudeNum: 750, elevationLabel: '750 ft' }
    ]
  },
  'varanasi': {
    name: 'Varanasi',
    brandName: 'NomadVaranasi',
    region: 'Sacred Ganges Ghats · 25°N',
    circuitTitle: 'ETERNAL CITY OF LIGHT, GANGA AARTI & SARNATH PILGRIMAGE',
    quote: '"Older than history, older than tradition, older even than legend"',
    logId: 'NOMAD SACRED LOG #07',
    primeWindow: 'October — March',
    passStatus: 'Ganges Boat Cruises: Operating Smoothly',
    baseAltitude: '80m Alt (260 ft)',
    peakLandmark: 'Chaukhandi Stupa Sarnath (310 ft / 95m)',
    peakAltitudeFt: 310,
    peakAltitudeM: 95,
    totalDistanceKm: 140,
    terrainType: 'Sacred River Ghats & Ancient Lanes',
    terrainDesc: 'Holy Ghats, Temples & Silk Weavers',
    paceSpeed: '2–3 hrs/day',
    paceDesc: 'Mindful Spiritual Flow',
    coordinates: '25.3176° N, 82.9739° E',
    environment: 'urban_heritage',
    heroImage: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1800&auto=format&fit=crop&q=85',
    highlights: [
      { id: 'hl-1', title: 'Dashashwamedh Grand Ganga Aarti', category: 'SACRED EVENING RITE', altitude: '260 ft', day: 'Day 1', subtitle: 'Synchronized brass lamps, conch shells & incense', image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-2', title: 'Sunrise Boat Row on Holy Ganges', category: 'MORNING SUNRISE', altitude: '250 ft', day: 'Day 2', subtitle: 'First golden rays touching 84 ancient ghats', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-3', title: 'Sarnath Deer Park & Dhamek Stupa', category: 'BUDDHIST CRADLE', altitude: '280 ft', day: 'Day 3', subtitle: 'Where Buddha delivered his first turning of the wheel sermon', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' },
      { id: 'hl-4', title: 'Banarasi Silk Weaving & Street Chaat', category: 'ARTISAN HERITAGE', altitude: '260 ft', day: 'Day 4', subtitle: 'Zari gold thread looms, Tamatar Chaat & Banarasi Paan', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80' }
    ],
    defaultStops: [
      { day: 1, stage: 'SACRED ARRIVAL', distance: '25 km · 1 hr', name: 'Varanasi Airport → Ghat Hotel Check-in & Evening Aarti', altitudeBadge: '260 ft', details: 'Dashashwamedh Ghat brass lamp ceremony & clay-pot chai', altitudeNum: 260, elevationLabel: '260 ft' },
      { day: 2, stage: 'SUNRISE ROWING', distance: '15 km · 2 hrs boat', name: 'Assi Ghat to Manikarnika Sunrise Boat → Kashi Vishwanath', altitudeBadge: '260 ft', details: 'Golden hour ghat photography & golden temple darshan', altitudeNum: 260, elevationLabel: '260 ft', isKeyStage: true },
      { day: 3, stage: 'BUDDHIST PILGRIMAGE', distance: '20 km · 45 mins', name: 'Day Excursion to Sarnath Stupa & Archaeological Museum', altitudeBadge: '280 ft', details: 'Ashoka Lion Capital, Dhamek Stupa & deer park meditation', altitudeNum: 280, elevationLabel: '280 ft' },
      { day: 4, stage: 'SILK & GASTRONOMY', distance: '15 km · 30 mins', name: 'Madanpura Silk Looms, Godowlia Market & Chaat Trail', altitudeBadge: '260 ft', details: 'Pure Banarasi zari silk sarees & Tamatar Chaat tasting', altitudeNum: 260, elevationLabel: '260 ft' },
      { day: 5, stage: 'RIVERFORT MAJESTY', distance: '25 km · 1 hr', name: 'Ramnagar Fort & Museum Across the River', altitudeBadge: '290 ft', details: '18th-century cream sandstone fort & royal vintage cars', altitudeNum: 290, elevationLabel: '290 ft' },
      { day: 6, stage: 'SACRED MUSIC & YOGA', distance: '10 km · 30 mins', name: 'Subah-e-Banaras Yoga, Classical Sitar & Akharas', altitudeBadge: '260 ft', details: 'Dawn raga sitar recital & traditional mud wrestling visit', altitudeNum: 260, elevationLabel: '260 ft' },
      { day: 7, stage: 'KASHI FAREWELL', distance: '25 km · 45 mins', name: 'Thandai & Paan Morning Tasting → Airport Flyout', altitudeBadge: '260 ft', details: 'Holy Ganga water souvenir & departure flight', altitudeNum: 260, elevationLabel: '260 ft' }
    ]
  }
};

/**
 * Dynamically resolves an expedition profile for any searched destination
 */
export function getExpeditionProfile(destInput = 'Spiti Valley', duration = 7) {
  const clean = String(destInput || '').toLowerCase().trim();
  let baseKey = null;

  if (clean.includes('chennai') || clean.includes('madras') || clean.includes('mahabalipuram') || clean.includes('kanchipuram') || clean.includes('tamil nadu') || clean.includes('pondicherry')) {
    baseKey = 'chennai';
  } else if (clean.includes('mumbai') || clean.includes('bombay') || clean.includes('pune') || clean.includes('lonavala')) {
    baseKey = 'mumbai';
  } else if (clean.includes('delhi') || clean.includes('ncr') || clean.includes('noida') || clean.includes('gurgaon')) {
    baseKey = 'delhi';
  } else if (clean.includes('varanasi') || clean.includes('kashi') || clean.includes('banaras') || clean.includes('sarnath') || clean.includes('ayodhya') || clean.includes('prayagraj')) {
    baseKey = 'varanasi';
  } else if (clean.includes('spiti') || clean.includes('kaza') || clean.includes('kalpa') || clean.includes('tabo') || clean.includes('chandratal') || clean.includes('kinnaur')) {
    baseKey = 'spiti-valley';
  } else if (clean.includes('ladakh') || clean.includes('leh') || clean.includes('nubra') || clean.includes('pangong') || clean.includes('zanskar')) {
    baseKey = 'ladakh';
  } else if (clean.includes('meghalaya') || clean.includes('shillong') || clean.includes('cherrapunji') || clean.includes('dawki') || clean.includes('guwahati') || clean.includes('kaziranga') || clean.includes('assam')) {
    baseKey = 'meghalaya';
  } else if (clean.includes('kerala') || clean.includes('munnar') || clean.includes('alleppey') || clean.includes('kochi') || clean.includes('varkala') || clean.includes('wayanad')) {
    baseKey = 'kerala';
  } else if (clean.includes('kashmir') || clean.includes('srinagar') || clean.includes('gulmarg') || clean.includes('pahalgam') || clean.includes('sonamarg') || clean.includes('doodhpathri')) {
    baseKey = 'kashmir';
  } else if (clean.includes('rajasthan') || clean.includes('jaipur') || clean.includes('jodhpur') || clean.includes('udaipur') || clean.includes('jaisalmer') || clean.includes('pushkar') || clean.includes('bikaner')) {
    baseKey = 'rajasthan';
  } else if (clean.includes('goa') || clean.includes('panaji') || clean.includes('calangute') || clean.includes('anjuna') || clean.includes('palolem') || clean.includes('vagator')) {
    baseKey = 'goa';
  } else if (clean.includes('bali') || clean.includes('ubud') || clean.includes('canggu') || clean.includes('seminyak') || clean.includes('kuta') || clean.includes('nusa penida')) {
    baseKey = 'bali';
  } else if (clean.includes('vietnam') || clean.includes('hanoi') || clean.includes('ha long') || clean.includes('da nang') || clean.includes('hoi an') || clean.includes('saigon') || clean.includes('ho chi minh')) {
    baseKey = 'vietnam';
  } else if (clean.includes('dubai') || clean.includes('abu dhabi') || clean.includes('uae') || clean.includes('burj')) {
    baseKey = 'dubai';
  } else if (clean.includes('himachal') || clean.includes('manali') || clean.includes('kasol') || clean.includes('jibhi') || clean.includes('shimla') || clean.includes('dharamshala') || clean.includes('bir billing') || clean.includes('tirthan')) {
    baseKey = 'himachal';
  } else if (clean.includes('uttarakhand') || clean.includes('rishikesh') || clean.includes('chopta') || clean.includes('auli') || clean.includes('mussoorie') || clean.includes('nainital') || clean.includes('kedarnath') || clean.includes('badrinath')) {
    baseKey = 'uttarakhand';
  } else if (clean.includes('bhutan') || clean.includes('paro') || clean.includes('thimphu') || clean.includes('punakha')) {
    baseKey = 'bhutan';
  }

  // Dynamic Fallback Generator for unknown places
  let base = null;
  if (baseKey && DESTINATION_PROFILES[baseKey]) {
    base = DESTINATION_PROFILES[baseKey];
  } else {
    // Intelligent environment classifier: only set high_altitude if explicitly mountain-related
    let env = 'urban_heritage';
    let terrainType = 'Heritage City & Cultural Trails';
    let terrainDesc = 'Iconic Landmarks & Local Delicacies';
    let peakAlt = 350;
    let baseAlt = '50m Alt (160 ft)';
    let passStatus = 'All Sightseeing Circuits: Open & Clear';
    let heroImg = 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1800&auto=format&fit=crop&q=85';

    const isMountain = /spiti|ladakh|himalaya|mountain|pass|trek|altitude|leh|zanskar|alps|snow|glacier|peak|everest|kedarnath|badrinath|tungnath/i.test(clean);
    const isBeach = /beach|island|sea|ocean|coast|andaman|maldives|phuket|krabi|sri lanka|pondicherry|gokarna|lake/i.test(clean);
    const isDesert = /desert|dune|safari|egypt|jordan|oman|thar/i.test(clean);
    const isForest = /forest|jungle|rainforest|falls|waterfall|coorg|wayanad|national park|wildlife/i.test(clean);

    if (isMountain) {
      env = 'high_altitude';
      terrainType = 'Alpine Valleys & Mountain Trails';
      terrainDesc = 'Scenic Mountain Terrain';
      peakAlt = 10500;
      baseAlt = '1,800m Alt (5,900 ft)';
      passStatus = 'High Passes Open & Verified';
      heroImg = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1800&auto=format&fit=crop&q=85';
    } else if (isBeach) {
      env = 'tropical_beach';
      terrainType = 'Tropical Island & Coastline';
      terrainDesc = 'Sun Shores & Turquoise Waters';
      peakAlt = 200;
      baseAlt = '10m Alt (33 ft)';
      passStatus = 'Coastal Ferries & Beaches: Open';
      heroImg = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1800&auto=format&fit=crop&q=85';
    } else if (isDesert) {
      env = 'desert';
      terrainType = 'Desert Sands & Oasis Trails';
      terrainDesc = 'Golden Dunes & Starlit Nights';
      peakAlt = 850;
      baseAlt = '250m Alt (820 ft)';
      passStatus = 'Dune Safari Trails: Clear';
      heroImg = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1800&auto=format&fit=crop&q=85';
    } else if (isForest) {
      env = 'rainforest';
      terrainType = 'Tropical Evergreen Valleys';
      terrainDesc = 'Mist Forests & River Cascades';
      peakAlt = 3500;
      baseAlt = '900m Alt (2,950 ft)';
      passStatus = 'Nature Trails & Waterfalls: Clear';
      heroImg = 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1800&auto=format&fit=crop&q=85';
    }

    const fallbackName = destInput && destInput.trim() ? destInput.trim() : 'Custom Expedition';
    base = {
      name: fallbackName,
      brandName: `Nomad${fallbackName.replace(/[^a-zA-Z0-9]/g, '')}`,
      region: `${fallbackName} Exploration Circuit`,
      circuitTitle: `${fallbackName.toUpperCase()} EXPLORATION ITINERARY`,
      quote: `"Where every street, sunset and horizon reveals new wonder"`,
      logId: `NOMAD FIELD LOG #${Math.floor(10 + Math.random() * 89)}`,
      primeWindow: 'Best Season Active',
      passStatus,
      baseAltitude: baseAlt,
      peakLandmark: `${fallbackName} Central Viewpoint (${peakAlt.toLocaleString()} ft)`,
      peakAltitudeFt: peakAlt,
      peakAltitudeM: Math.round(peakAlt * 0.3048),
      totalDistanceKm: 280,
      terrainType,
      terrainDesc,
      paceSpeed: '2–4 hrs/day',
      paceDesc: 'Balanced Sightseeing Flow',
      coordinates: '20.0000° N, 78.0000° E',
      environment: env,
      heroImage: heroImg,
      highlights: [
        { id: 'hl-1', title: `${fallbackName} Signature Landmark`, category: 'TOP HIGHLIGHT', altitude: `${Math.round(peakAlt * 0.75)} ft`, day: 'Day 2', subtitle: 'Iconic must-see cultural monument', image: heroImg },
        { id: 'hl-2', title: `${fallbackName} Scenic Sunset Vista`, category: 'GOLDEN HOUR', altitude: `${Math.round(peakAlt * 0.85)} ft`, day: 'Day 3', subtitle: 'Panoramic sunset view & pristine ambience', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
        { id: 'hl-3', title: `${fallbackName} Heritage & Food Trail`, category: 'LOCAL FLAVORS', altitude: `${Math.round(peakAlt * 0.5)} ft`, day: 'Day 4', subtitle: 'Authentic local cuisine and historic bazaars', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80' },
        { id: 'hl-4', title: `${fallbackName} Hidden Retreat`, category: 'SECRET DISCOVERY', altitude: `${peakAlt} ft`, day: 'Day 5', subtitle: 'Offbeat gem curated by local specialists', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' }
      ],
      defaultStops: [
        { day: 1, stage: 'ARRIVAL & ORIENTATION', distance: '25 km · 45 mins', name: `Arrival in ${fallbackName} & Landmark Stroll`, altitudeBadge: 'Arrival Stage', details: 'Check-in, orientation & local welcome cuisine', altitudeNum: Math.round(peakAlt * 0.3), elevationLabel: `${Math.round(peakAlt * 0.3)} ft` },
        { day: 2, stage: 'ICONIC HIGHLIGHTS', distance: '35 km · 1.5 hrs', name: `${fallbackName} Main Attractions & Heritage`, altitudeBadge: 'Heritage Stage', details: 'Curated architectural & cultural landmarks', altitudeNum: Math.round(peakAlt * 0.6), elevationLabel: `${Math.round(peakAlt * 0.6)} ft` },
        { day: 3, stage: 'PANORAMIC VIEWS', distance: '40 km · 2 hrs', name: `${fallbackName} Panoramic Vistas & Sunset`, altitudeBadge: 'Key Stage', details: 'Scenic viewpoint & relaxation', altitudeNum: peakAlt, elevationLabel: `${peakAlt} ft`, isKeyStage: true },
        { day: 4, stage: 'LOCAL CULTURE & TASTES', distance: '30 km · 1 hr', name: `${fallbackName} Historic Markets & Food Tour`, altitudeBadge: 'Immersion', details: 'Traditional delicacy tasting & artisan bazaars', altitudeNum: Math.round(peakAlt * 0.5), elevationLabel: `${Math.round(peakAlt * 0.5)} ft` },
        { day: 5, stage: 'OFFBEAT EXCURSION', distance: '50 km · 2 hrs', name: `${fallbackName} Countryside / Coastal Day Excursion`, altitudeBadge: 'Discovery', details: 'Peaceful scenic retreat away from crowds', altitudeNum: Math.round(peakAlt * 0.4), elevationLabel: `${Math.round(peakAlt * 0.4)} ft` },
        { day: 6, stage: 'CELEBRATORY EVENING', distance: '30 km · 1 hr', name: `${fallbackName} Fine Dining & Twilight Walk`, altitudeBadge: 'Farewell Eve', details: 'Celebratory dinner & shopping', altitudeNum: Math.round(peakAlt * 0.35), elevationLabel: `${Math.round(peakAlt * 0.35)} ft` },
        { day: 7, stage: 'DEPARTURE FAREWELL', distance: '20 km · 40 mins', name: `Departure from ${fallbackName}`, altitudeBadge: 'Departure', details: 'Souvenir collection & airport/station transfer', altitudeNum: Math.round(peakAlt * 0.3), elevationLabel: `${Math.round(peakAlt * 0.3)} ft` }
      ]
    };
  }

  const formattedName = destInput && destInput.trim() ? destInput.trim() : base.name;
  const brandName = `Nomad${formattedName.replace(/[^a-zA-Z0-9]/g, '')}`;

  const env = base.environment || 'high_altitude';
  const isHighAlt = env === 'high_altitude';
  const isCoastal = env === 'coastal_city' || env === 'coastal' || env === 'tropical_beach';

  // Ensure high-density highlights for carousel (at least 6-8 items)
  const extraHighlights = isCoastal ? [
    { id: 'hl-extra-1', title: `${formattedName} Sunset Promenade & Pier`, category: 'COASTAL VIBES', altitude: `${base.peakAltitudeFt || 40} ft`, day: 'Day 3', subtitle: 'Twilight ocean breeze, golden sands and street delicacies', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80' },
    { id: 'hl-extra-2', title: `${formattedName} Artisan & Spice Bazaar`, category: 'LOCAL CUISINE', altitude: `${Math.round((base.peakAltitudeFt || 50) * 0.7)} ft`, day: 'Day 4', subtitle: 'Crispy tiffin delicacies, filter coffee & aromatic spice markets', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80' },
    { id: 'hl-extra-3', title: `${formattedName} Silk Weavers & Craft Studios`, category: 'LIVING HERITAGE', altitude: `${Math.round((base.peakAltitudeFt || 50) * 0.5)} ft`, day: 'Day 5', subtitle: 'Centuries-old handloom mastery, brass bells and stone sculptures', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80' },
    { id: 'hl-extra-4', title: `${formattedName} Seaside Lighthouse Lookout`, category: 'PANORAMIC SHORE', altitude: `${base.peakAltitudeFt || 80} ft`, day: 'Day 2', subtitle: 'Bird-eye ocean views, maritime history and harbor sunset', image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop&q=80' }
  ] : [
    { id: 'hl-extra-1', title: `${formattedName} Starlit Ridge Vista`, category: 'NIGHT SKIES', altitude: `${base.peakAltitudeFt || 10000} ft`, day: 'Day 3', subtitle: 'Pristine dark sky stargazing and astro-photography', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
    { id: 'hl-extra-2', title: `${formattedName} Mountain Cafe Trail`, category: 'LOCAL CUISINE', altitude: `${base.peakAltitudeFt ? Math.round(base.peakAltitudeFt * 0.7) : 7000} ft`, day: 'Day 4', subtitle: 'Steaming local delicacies, organic teas & panoramic cafe decks', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80' },
    { id: 'hl-extra-3', title: `${formattedName} Hidden Riverside Sanctuary`, category: 'PRISTINE NATURE', altitude: `${base.peakAltitudeFt ? Math.round(base.peakAltitudeFt * 0.5) : 5000} ft`, day: 'Day 5', subtitle: 'Crystal clear freshwater streams & peaceful canyon relaxation', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' },
    { id: 'hl-extra-4', title: `${formattedName} Heritage Artisan Quarter`, category: 'CULTURAL ARTS', altitude: `${base.peakAltitudeFt ? Math.round(base.peakAltitudeFt * 0.6) : 6000} ft`, day: 'Day 2', subtitle: 'Centuries-old stone alleys, local craft makers & authentic souvenirs', image: 'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=800&auto=format&fit=crop&q=80' }
  ];

  const expandedHighlights = [
    ...(base.highlights || []),
    ...extraHighlights
  ].slice(0, 8);

  // Adjust stops according to requested duration (supports 1 to 30 days)
  const targetDays = Math.max(1, Math.min(Number(duration) || 7, 30));
  const stops = [];
  const sourceStops = base.defaultStops || [];

  const famousPlacesPool = isCoastal ? [
    `${formattedName} Waterfront Promenade & Bay Vista`,
    `${formattedName} Ancient Shoreline Temple & Shrines`,
    `${formattedName} Colonial Citadel & Historic High Court`,
    `${formattedName} Silk Weavers Quarter & Artisan Looms`,
    `${formattedName} Coastal Estuary & Mangrove Lagoons`,
    `${formattedName} Beachside Boulevard & Twilight Cafes`,
    `${formattedName} Heritage Art Village & Sculpture Park`,
    `${formattedName} Sunset Lighthouse & Ocean Pier`
  ] : [
    `${formattedName} Sacred Gompa & High Ridge View`,
    `${formattedName} Canyon Bridge & Cliff Lookout`,
    `${formattedName} Crystal Lake & Glacial Moraine`,
    `${formattedName} Ancient Valley Monastic Shrine`,
    `${formattedName} Historic Old Quarter & Craft Bazaar`,
    `${formattedName} High Summit Pass & Prayer Flags`,
    `${formattedName} Riverside Pine Orchard & Alpine Meadow`,
    `${formattedName} Hidden Canyon Waterfall & Cave System`
  ];

  for (let i = 0; i < targetDays; i++) {
    const templateStop = sourceStops[i % sourceStops.length] || {
      stage: `STAGE ${i + 1}`,
      distance: '45 km · 2 hrs',
      details: 'Curated scenic explorer stop',
      altitudeNum: isCoastal ? 30 : 2000,
      elevationLabel: isCoastal ? '30 ft' : '2,000 ft'
    };

    const stopName = i < sourceStops.length ? templateStop.name : `${formattedName} Scenic Explorer Stage ${i + 1}`;
    const famousPlace = templateStop.famousPlace || (templateStop.name.includes('→') ? templateStop.name.split('→')[1].trim() : famousPlacesPool[i % famousPlacesPool.length]);
    
    // Create crisp 2-line summary
    const summary2Lines = templateStop.summary2Lines || `Explore iconic ${famousPlace} with breathtaking panoramic viewpoints and authentic local cultural landmarks.\nExperience smooth scenic transit, fresh regional cuisine, and verified photo stops.`;

    const activities = templateStop.activities || [
      `Visit iconic ${famousPlace.split('&')[0].trim()}`,
      `Scenic photo stop & local refreshment break`,
      `Sunset viewpoint walk and regional dinner`
    ];

    const transitTime = templateStop.distance.includes('·') ? templateStop.distance.split('·')[1].trim() : '2–3 hrs transit';
    const roadCondition = templateStop.details || 'Smooth scenic highway & comfortable travel corridor';

    stops.push({
      ...templateStop,
      day: i + 1,
      name: stopName,
      famousPlace,
      summary2Lines,
      activities,
      transitTime,
      roadCondition,
      photo: templateStop.photo || expandedHighlights[i % expandedHighlights.length]?.image || base.heroImage,
      isKeyStage: i === Math.floor(targetDays * 0.6)
    });
  }

  // Enriched Map Metadata for Top Buttons (Checkpoints & Passes)
  const passesData = isHighAlt ? [
    { name: base.peakLandmark || `${formattedName} High Crest Pass`, altitude: `${base.peakAltitudeFt || 14000} ft`, status: 'Open & Vetted', permit: 'Inner Line Permit OK', medical: 'Oxygen Station at Base', day: `Day ${Math.floor(targetDays * 0.6) + 1}` },
    { name: `${formattedName} Ridge Saddle Pass`, altitude: `${Math.round((base.peakAltitudeFt || 12000) * 0.85)} ft`, status: 'Clear Weather', permit: 'No Permit Needed', medical: 'First Aid Post Active', day: 'Day 2' },
    { name: `${formattedName} Canyon Overlook Pass`, altitude: `${Math.round((base.peakAltitudeFt || 10000) * 0.7)} ft`, status: 'All-Weather Metalled', permit: 'Standard Entry', medical: 'Emergency SOS Box', day: 'Day 4' }
  ] : [
    { name: `${formattedName} Scenic Highway & Coastway Checkpoint`, altitude: `${base.peakAltitudeFt || 260} ft`, status: 'Open & Scenic', permit: 'Fastag / Entry Verified', medical: 'Medical Station Active', day: 'Day 1' },
    { name: `${formattedName} Heritage Circuit Toll & Transit Point`, altitude: `${Math.round((base.peakAltitudeFt || 200) * 0.9)} ft`, status: 'Clear Corridor', permit: 'Tourist Pass Valid', medical: 'Tourist Assistance Center', day: 'Day 3' },
    { name: `${formattedName} Panoramic Viewpoint & Shore Waypoint`, altitude: `${Math.round((base.peakAltitudeFt || 200) * 0.75)} ft`, status: 'All-Weather Clear', permit: 'Open Public Access', medical: 'First Aid & Lifeguard Post', day: 'Day 5' }
  ];

  const fuelData = isHighAlt ? [
    { name: `${formattedName} Central High-Altitude HP Pump`, type: 'Petrol & Diesel', status: 'Active 24/7', notes: "Region's primary fuel station with clean fuel supply", distance: 'Main Hub Center' },
    { name: `${formattedName} Highway EV Fast Charger (60kW)`, type: 'CCS2 EV Fast Charger', status: 'Online & Monitored', notes: 'Solar-backed charging station with lounge and cafe', distance: 'Km 45 Marker' },
    { name: 'Eco Homestay & Wilderness Medical Post', type: 'Certified Oxygen & Stay', status: 'Verified Partner', notes: '24/7 geyser, heated bedding, local meals & emergency O2 kits', distance: 'Night Halt Waypoint' }
  ] : [
    { name: `${formattedName} Highway Multi-Fuel Hub & Service Plaza`, type: 'Petrol, Diesel & CNG', status: 'Open 24/7', notes: 'Full service station, air, convenience store & cafe', distance: 'City Outer Ring Road' },
    { name: `${formattedName} Expressway 120kW DC Fast Charger`, type: 'CCS2 / Type 2 EV Fast Hub', status: 'Operational 24/7', notes: 'High-speed multi-bay charging with food court & restroom', distance: 'Km 28 Highway Marker' },
    { name: 'Verified Boutique Stay & Hospitality Hub', type: 'Premium Stay & Valet', status: 'Verified Partner', notes: 'Secure parking, multi-cuisine dining, concierge & travel desk', distance: 'Central Heritage Sector' }
  ];

  const flyoverWaypoints = stops.map((s, idx) => ({
    step: idx + 1,
    title: s.famousPlace,
    elevation: s.elevationLabel || `${s.altitudeNum || 5000} ft`,
    highlight: s.summary2Lines.split('\n')[0] || s.details,
    image: s.photo
  }));

  return {
    ...base,
    name: formattedName,
    brandName,
    circuitTitle: `YOUR ${formattedName.toUpperCase()} EXPEDITION — ${targetDays} DAYS`,
    totalDistanceKm: Math.round((base.totalDistanceKm / (sourceStops.length || 7)) * targetDays),
    highlights: expandedHighlights,
    stops,
    passesData,
    fuelData,
    flyoverWaypoints
  };
}

/**
 * Returns contextual experience options calibrated for the destination
 */
export function getContextualExperiences(destination = 'Spiti Valley') {
  const profile = getExpeditionProfile(destination);
  const env = profile.environment || 'high_altitude';

  if (env === 'coastal_city') {
    return [
      { id: 'temple_walks', title: 'Temple & Heritage Walks', desc: 'Ancient Dravidian gopurams, sacred tanks & colonial churches', badge: 'Sacred Heritage', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80' },
      { id: 'beach_sunsets', title: 'Beach Sunsets & Promenades', desc: 'Golden hour along the coastal shoreline & seaside cafes', badge: 'Golden Hour', image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop&q=80' },
      { id: 'seafood_trails', title: 'Seafood & Local Cuisine', desc: 'Authentic coastal curries, filter coffee & street food trails', badge: 'Culinary Trail', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80' },
      { id: 'heritage_museums', title: 'Heritage Museums & Art', desc: 'Living craft museums, art districts & colonial architecture', badge: 'Arts & Culture', image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop&q=80' },
      { id: 'silk_shopping', title: 'Silk & Artisan Shopping', desc: 'Handwoven silk sarees, brass crafts & local textile bazaars', badge: 'Artisan Markets', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80' },
      { id: 'coastal_photography', title: 'Coastal Photography', desc: 'UNESCO shore temples, fishing villages & sunrise boat rides', badge: 'Photo Moments', image: 'https://images.unsplash.com/photo-1600100397608-f463993d3958?w=800&auto=format&fit=crop&q=80' }
    ];
  }

  if (env === 'urban_heritage') {
    return [
      { id: 'monument_trails', title: 'Monument & Fort Trails', desc: 'UNESCO heritage sites, ancient citadels & royal gardens', badge: 'Heritage Walk', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&auto=format&fit=crop&q=80' },
      { id: 'street_food', title: 'Street Food & Gastronomy', desc: 'Legendary bazaar food lanes, chaats & regional specialties', badge: 'Culinary Immersion', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80' },
      { id: 'bazaar_shopping', title: 'Bazaar & Artisan Markets', desc: 'Historic market lanes, handcrafted textiles & spice stalls', badge: 'Local Crafts', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80' },
      { id: 'museum_visits', title: 'Museum & Gallery Tours', desc: 'Ancient artifacts, contemporary art & cultural exhibitions', badge: 'Art & History', image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop&q=80' },
      { id: 'cultural_evenings', title: 'Cultural Evenings & Ceremonies', desc: 'Sacred rituals, classical music recitals & folk performances', badge: 'Live Culture', image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&auto=format&fit=crop&q=80' },
      { id: 'skyline_photography', title: 'Skyline & Architecture Photography', desc: 'Iconic cityscapes, grand boulevards & twilight panoramas', badge: 'Photo Moments', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' }
    ];
  }

  if (env === 'desert') {
    return [
      { id: 'desert_safari', title: 'Dune Bashing & Camels', desc: 'Golden dunes and desert horizon sunset', badge: 'Thar Safari', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
      { id: 'heritage_forts', title: 'Royal Forts & Palaces', desc: 'Centuries of Rajput architectural splendor', badge: 'UNESCO Heritage', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80' },
      { id: 'stargazing', title: 'Desert Stargazing', desc: 'Crystal clear night skies over open dunes', badge: 'Zero Light Pollution', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
      { id: 'folk_music', title: 'Folk Music & Bonfires', desc: 'Kalbelia dance & live manganiyar melodies', badge: 'Cultural Evening', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80' },
      { id: 'royal_food', title: 'Royal Cuisine Tasting', desc: 'Authentic regional curries, daal baati & sweets', badge: 'Royal Kitchens', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80' },
      { id: 'artisan_bazaars', title: 'Artisan Bazaars', desc: 'Handcrafted leather, textiles & jewelry', badge: 'Local Crafts', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80' }
    ];
  }

  if (env === 'tropical_beach') {
    return [
      { id: 'ocean_sunsets', title: 'Ocean Sunsets & Cafes', desc: 'Golden hour clifftop & beachside dining', badge: 'Golden Hour', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80' },
      { id: 'water_sports', title: 'Scuba & Snorkeling', desc: 'Turquoise waters, coral reefs & marine life', badge: 'PADI Certified', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
      { id: 'island_hopping', title: 'Island Hopping Speedboats', desc: 'Hidden secret coves & private sandbanks', badge: 'Private Boat', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80' },
      { id: 'coastal_wellness', title: 'Beach Yoga & Spa', desc: 'Morning meditation & tropical rejuvenation', badge: 'Mind & Body', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80' },
      { id: 'heritage_towns', title: 'Heritage Quarter Walks', desc: 'Colonial architecture, art cafes & galleries', badge: 'Culture Trail', image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop&q=80' },
      { id: 'coastal_seafood', title: 'Coastal Seafood Grills', desc: 'Fresh catch of the day with tropical spices', badge: 'Fresh Catch', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80' }
    ];
  }

  if (env === 'rainforest') {
    return [
      { id: 'living_bridges', title: 'Living Root Bridges', desc: 'Bio-engineered ficus canopy trails', badge: 'Ancient Wonder', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' },
      { id: 'crystal_rivers', title: 'Crystal River Boating', desc: 'Transparent turquoise riverbed', badge: 'Glass Boat Water', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
      { id: 'waterfall_plunges', title: 'Waterfall Lagoons', desc: 'Roaring plunge pools & caves', badge: 'Natural Lagoons', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80' },
      { id: 'local_khasi_food', title: 'Khasi Cuisine & Tea', desc: 'Steaming bamboo rice & teas', badge: 'Tribal Delicacies', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80' },
      { id: 'village_walks', title: 'Cleanest Villages', desc: 'Eco-treehouses & balancing rocks', badge: 'Heritage Trails', image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop&q=80' },
      { id: 'fossil_caves', title: 'Fossil Limestone Caves', desc: 'Ancient subterranean waterways', badge: 'Spelunking', image: 'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=800&auto=format&fit=crop&q=80' }
    ];
  }

  if (env === 'coastal') {
    return [
      { id: 'houseboat_cruise', title: 'Houseboat Cruise', desc: 'Private drifting backwaters', badge: 'Overnight Cruise', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop&q=80' },
      { id: 'tea_plantations', title: 'Tea Hill Treks', desc: 'Emerald carpets & misty peaks', badge: 'High Elevation', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' },
      { id: 'coastal_sunsets', title: 'Clifftop Sunsets', desc: 'Arabian sea red cliff views', badge: 'Golden Hour', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
      { id: 'ayurvedic_spa', title: 'Ayurvedic Wellness', desc: 'Herbal therapies & spice baths', badge: 'Rejuvenation', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80' },
      { id: 'spice_trails', title: 'Spice Trails', desc: 'Fresh cardamom, pepper & vanilla', badge: 'Farm Tasting', image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop&q=80' },
      { id: 'coastal_dining', title: 'Coastal Dining', desc: 'Coconut fish curries & appams', badge: 'Coastal Dining', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80' }
    ];
  }

  // Default Mountain / High Altitude
  return [
    { id: 'monasteries', title: 'Monasteries & Shrines', desc: 'Ancient cliffside shrines & chants', badge: 'Sacred Sites Mapped', image: 'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=800&auto=format&fit=crop&q=80' },
    { id: 'stargazing', title: 'Star Gazing', desc: 'Billion star night sky & Milky Way', badge: 'Zero Light Pollution', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
    { id: 'photography', title: 'Photography Expeditions', desc: 'Stunning mountain light & golden hours', badge: 'Golden Hour Focus', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&auto=format&fit=crop&q=80' },
    { id: 'local_food', title: 'Himalayan Feasts', desc: 'Steaming thukpa, momos & mountain chai', badge: 'Regional Delicacies', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' },
    { id: 'village_walks', title: 'Heritage Village Trails', desc: 'Clay homes, apple orchards & trails', badge: 'Local Life', image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop&q=80' },
    { id: 'high_pass_treks', title: 'High-Pass Treks', desc: 'Panoramic ridges & suspension bridges', badge: 'High-Pass Treks', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80' }
  ];
}

// Media pool for general option selections
export const OPTION_MEDIA = {
  party: {
    solo: { image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80', title: 'Solo', badge: '1 Traveler', subtitle: 'Just me and the road', tags: ['Self-Paced', 'Flexible Route'] },
    couple: { image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80', title: 'Couple', badge: 'SELECTED', subtitle: 'Two for the mountains', tags: ['Private 4x4', 'Cozy Retreats'] },
    family: { image: 'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=800&auto=format&fit=crop&q=80', title: 'Family', badge: 'All Ages', subtitle: 'All generations together', tags: ['Gentle Acclimatization', 'Child-Friendly'] },
    friends: { image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80', title: 'Friends', badge: 'Small Squad', subtitle: 'Good vibes and laughs', tags: ['Shared Adventure', 'Bonfire Nights'] }
  },
  transit: {
    rent_car: { id: 'rent_car', title: 'Rent a Car (Self-Drive)', badge: 'Self-Drive', subtitle: 'Rent a 4x4 SUV or Car to drive yourself', tags: ['Self-Drive Rental', 'Autonomous Pace', 'GPS Navigation'], image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80', vehicleType: 'car' },
    rent_bike: { id: 'rent_bike', title: 'Rent a Bike (Motorcycle)', badge: 'Expedition Ride', subtitle: 'Royal Enfield Himalayan / 450cc Dual-Sport', tags: ['Rental Bike & Helmet', 'Riding Gear Included', 'Chase Backup'], image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80', vehicleType: 'bike' },
    with_driver: { id: 'with_driver', title: 'Car with Private Driver', badge: 'RECOMMENDED', subtitle: 'Dedicated 4x4 SUV with local veteran chauffeur', tags: ['Local Terrain Driver', '100% Scenic Focus', 'Zero Driving Stress'], image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80', vehicleType: 'chauffeur' }
  },
  routine: {
    chill: { id: 'chill', title: 'Chill Starts (9:00 AM)', desc: 'Slow breakfast & scenic views. Relaxed morning sun before heading out.', tags: ['Solar Warmth', 'Fresh Chai & Breakfast'], image: 'https://images.unsplash.com/photo-1517840901100-8179e982acb7?w=800&auto=format&fit=crop&q=80' },
    early: { id: 'early', title: 'Early Starts (5:30 AM)', desc: 'First light over peaks and valleys. Clear roads before midday traffic.', tags: ['Golden Hour Alpenglow', 'Beat Traffic'], image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' }
  },
  acclimatization: {
    gentle: { id: 'gentle', title: 'Keep it Gentle', desc: 'Gradual ascent curve with deliberate rest tactics. Zero rushed jumps.', tags: ['Gradual Pace', 'Deep Rest Days'], image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80' },
    adventure: { id: 'adventure', title: 'Full Adventure', desc: 'Direct passes and dynamic daily targets. For active explorers.', tags: ['Direct Crossing', 'Fast Transitions'], image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80' }
  },
  stays: {
    homestay: { id: 'homestay', title: 'Homestay 🏡', badge: 'Authentic', desc: 'Warm local family stay with traditional home-cooked cuisine.', tags: ['Local Host', 'Home Dinners'], image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop&q=80' },
    boutique: { id: 'boutique', title: 'Boutique Hotel 🏨', badge: 'Scenic Views', desc: 'Handcrafted interior comfort, ambient lounges, and panoramic decks.', tags: ['Heated/AC', 'Panoramic Decks'], image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80' },
    standard: { id: 'standard', title: 'Standard Hotel 🛏️', badge: 'Dependable', desc: 'Reliable modern guestrooms with guaranteed backup utilities.', tags: ['24/7 Geyser', 'Backup Power'], image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80' }
  },
  rooms: {
    double: { id: 'double', title: 'Double Bed', badge: 'Popular', desc: 'Private retreat designed for restful recovery.', tags: ['Ensuite bath', 'Uninterrupted rest'], image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80' },
    bunk: { id: 'bunk', title: 'Bunk Bed', desc: 'Cozy backpacker vibe suited for solo explorers & trail friends.', tags: ['Social evenings', 'Shared lodge'], image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&auto=format&fit=crop&q=80' },
    family: { id: 'family', title: 'Family Room', desc: 'Spacious multi-bed suite built for overland parties & families.', tags: ['Interconnected comfort', 'Group setting'], image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80' }
  },
  dining: {
    veg: { id: 'veg', title: 'Vegetarian', badge: 'Pure Veg', desc: 'Fresh local staples, daal, seasonal greens & regional breads.', tag: 'Fresh farm produce', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80' },
    non_veg: { id: 'non_veg', title: 'Non-vegetarian', badge: 'High Protein', desc: 'Wholesome regional fare with local curries & broths.', tag: 'Thermal nutrition', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80' },
    jain: { id: 'jain', title: 'Jain', badge: 'No Root Veg', desc: 'Strict root-free meals freshly cooked with devotion.', tag: 'Clean cookware policy', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80' },
    all: { id: 'all', title: 'No Preference', badge: 'All In', desc: 'Open to tasting everything the destination has to offer.', tag: 'Traditional regional curations', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80' }
  },
  budget: {
    backpacker: { id: 'backpacker', icon: '🎒', title: 'Backpacker', desc: 'Simple & authentic', price: '₹1,800 – ₹2,500', period: '/ day per person', notes: 'Cozy shared local homestays & traveler dorms, public transit or shared transfers.' },
    comfort: { id: 'comfort', icon: '😁', title: 'Comfort', badge: 'Recommended', desc: 'Balanced & relaxing', price: '₹3,800 – ₹5,200', period: '/ day per person', notes: 'Heated cottages & boutique lodges, private transfers, freshly cooked meals.' },
    premium: { id: 'premium', icon: '✨', title: 'Premium', desc: 'Best luxury & suites', price: '₹8,000 – ₹12,000', period: '/ day per person', notes: 'Luxury glamping, top retreats, premium chauffeurs & custom culinary setups.' }
  }
};
