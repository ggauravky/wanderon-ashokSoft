// ================================================================
// AUTHORITATIVE TRAVEL CATALOG & DESTINATIONS DATASET
// ================================================================

export const UPCOMING_TRIPS = [
  // -------------------------------------------------------------
  // HIMACHAL PRADESH EXPEDITIONS (12 Distinct Active Packages)
  // -------------------------------------------------------------
  {
    id: 1,
    title: 'Spiti Valley Circuit: The Himalayan Odyssey',
    shortTitle: 'Spiti Valley Circuit',
    slug: 'spiti-valley-circuit',
    duration: '6N/7D',
    price: 22000,
    originalPrice: 26000,
    location: 'Spiti Valley, Himachal Pradesh',
    destination: 'Himachal Pradesh',
    category: 'Adventure',
    image: 'https://images.pexels.com/photos/6239996/pexels-photo-6239996.jpeg',
    rating: 4.9,
    reviews: 312,
    trending: true,
    tags: ['Adventure', 'High Altitude', 'Mountains'],
    nextBatch: '20 Aug',
    startingPoint: 'Shimla / Manali',
    endingPoint: 'Manali / Chandigarh',
    altitude: '14,000 ft',
    grade: 'Challenging',
    ageGroup: '18 - 38 Years',
    gallery: [
      'https://images.pexels.com/photos/6239996/pexels-photo-6239996.jpeg',
      'https://images.unsplash.com/photo-1626714486950-c63bf1084b64?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop'
    ],
    overview: 'Traverse the rugged cold desert of Spiti Valley over Kunzum Pass. Visit ancient thousand-year-old monasteries at Key and Tabo, send postcards from Hikkim (14,567 ft), and camp under the starry Milky Way at Chandratal Moon Lake.',
    highlights: [
      'Visit Key Monastery perched on a conical hill & 1000-yr old Tabo Monastery',
      'Send a physical postcard from the World\'s Highest Post Office in Hikkim (14,567 ft)',
      'Marvel at the giant golden Buddha overlooking snow peaks in Langza',
      'Camp under the stars by turquoise crescent-shaped Chandratal Lake'
    ],
    inclusions: [
      '6 Nights accommodation (Hotels, Homestays & Swiss Tents on sharing basis)',
      'Breakfasts & Dinners included throughout the circuit',
      'Private 4x4 / Tempo Traveler transfers from Shimla to Manali',
      'Experienced Mountaineer Captain & Oxygen Cylinder Support'
    ],
    exclusions: ['Flights to Chandigarh/Delhi', 'Lunch & Personal Snacks', 'GST (5%)'],
    availableBatches: [
      { id: 'b1-1', dates: '20 Aug - 26 Aug, 2026', seatsLeft: 4, status: 'Filling Fast' },
      { id: 'b1-2', dates: '05 Sep - 11 Sep, 2026', seatsLeft: 8, status: 'Available' }
    ],
    itinerary: [
      { day: 1, title: 'Shimla to Kalpa via Kinnaur Valley', desc: 'Scenic drive through rock-cut highways. Sunset view of Kinnaur Kailash peak.' },
      { day: 2, title: 'Kalpa to Kaza via Nako Lake & Tabo Monastery', desc: 'Cross into Spiti Valley. Visit UNESCO Tabo Monastery.' },
      { day: 3, title: 'Kaza Local: Key, Hikkim, Komic & Langza', desc: 'Visit Key Monastery, world\'s highest post office, and fossil village.' },
      { day: 4, title: 'Kaza to Chandratal Moon Lake via Kunzum Pass', desc: 'Cross 15,060 ft Kunzum Pass. Camp under the Milky Way at Chandratal.' },
      { day: 5, title: 'Chandratal to Manali via Atal Tunnel', desc: 'Drive through Atal Tunnel into lush Manali valley. Farewell dinner.' },
      { day: 6, title: 'Manali Local Exploration & Departure', desc: 'Old Manali cafe hopping and evening Volvo bus drop to Delhi.' }
    ]
  },
  {
    id: 2,
    title: 'Manali & Solang Valley Snow & Adventure Getaway',
    shortTitle: 'Manali & Solang Getaway',
    slug: 'manali-solang-adventure',
    duration: '4N/5D',
    price: 13500,
    originalPrice: 16500,
    location: 'Manali, Himachal Pradesh',
    destination: 'Himachal Pradesh',
    category: 'Weekend Trips',
    image: 'https://images.unsplash.com/photo-1586796676774-c93004ae009f?q=80&w=1200&auto=format&fit=crop',
    rating: 4.8,
    reviews: 198,
    tags: ['Mountains', 'Adventure', 'Weekend Trips'],
    nextBatch: '25 Aug',
    startingPoint: 'Delhi / Chandigarh',
    endingPoint: 'Delhi / Chandigarh',
    altitude: '6,725 ft',
    grade: 'Easy to Moderate',
    ageGroup: 'All Ages',
    gallery: [
      'https://images.unsplash.com/photo-1586796676774-c93004ae009f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop'
    ],
    overview: 'Escape Delhi heat to cedar-forested Manali. Experience thrilling paragliding and zorbing in Solang Valley, drive through the modern engineering marvel Atal Tunnel into Sissu waterfall, and explore vibrant Old Manali cafes.',
    highlights: [
      'Drive through 9.02 km long Atal Tunnel to Sissu waterfall in Lahaul',
      'Paragliding, quad biking & ziplining in Solang Valley',
      'Cafe hopping, live music, and shopping in Old Manali',
      'Bonfire and stargazing at Riverside Apple Orchard Camp'
    ],
    inclusions: ['4 Nights Boutique Hotel/Camp Stay', 'Breakfast & Dinner', 'AC Volvo & Local Transfers', 'Trip Captain'],
    exclusions: ['Personal adventure activity tickets', 'Lunch', 'GST (5%)'],
    availableBatches: [
      { id: 'b2-1', dates: '25 Aug - 29 Aug, 2026', seatsLeft: 6, status: 'Available' },
      { id: 'b2-2', dates: '08 Sep - 12 Sep, 2026', seatsLeft: 10, status: 'Available' }
    ],
    itinerary: [
      { day: 1, title: 'Overnight Volvo from Delhi to Manali', desc: 'Board luxury semi-sleeper Volvo bus from Majnu Ka Tila.' },
      { day: 2, title: 'Manali Arrival & Old Manali Cafe Trail', desc: 'Check into hotel. Visit Hadimba Temple and explore vibrant cafes.' },
      { day: 3, title: 'Solang Valley & Atal Tunnel to Sissu', desc: 'Adventure sports in Solang, cross Atal Tunnel to Lahaul valley.' },
      { day: 4, title: 'Jogini Waterfalls Hike & Vashisht Hot Springs', desc: 'Scenic forest hike to Jogini falls and natural sulfur baths.' },
      { day: 5, title: 'Mall Road Shopping & Departure', desc: 'Souvenir shopping and evening departure Volvo to Delhi.' }
    ]
  },
  {
    id: 3,
    title: 'Kasol, Kheerganga & Tosh Parvati Valley Backpacking',
    shortTitle: 'Kasol & Kheerganga Trek',
    slug: 'kasol-kheerganga-tosh-backpacking',
    duration: '3N/4D',
    price: 9500,
    originalPrice: 12000,
    location: 'Parvati Valley, Himachal Pradesh',
    destination: 'Himachal Pradesh',
    category: 'Backpacking',
    image: 'https://images.unsplash.com/photo-1596761611076-02720db1b4f8?q=80&w=1200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 245,
    trending: true,
    tags: ['Backpacking', 'Treks', 'Hot Springs'],
    nextBatch: '28 Aug',
    startingPoint: 'Delhi / Chandigarh',
    endingPoint: 'Delhi / Chandigarh',
    altitude: '9,700 ft',
    grade: 'Moderate',
    ageGroup: '18 - 35 Years',
    gallery: [
      'https://images.unsplash.com/photo-1596761611076-02720db1b4f8?q=80&w=1200&auto=format&fit=crop'
    ],
    overview: 'Backpack through the mystical Parvati Valley. Trek to Kheerganga natural hot water springs, stay in traditional wooden homestays in Tosh village, and relish Israeli cuisine along the roaring Parvati river in Kasol.',
    highlights: [
      'Trek through pine forests and waterfalls to Kheerganga mountain top',
      'Take a dip in sacred natural hot sulphur springs overlooking snow peaks',
      'Explore offbeat village life and wooden architecture in Tosh and Chalal',
      'Riverside camping with live acoustic music and bonfire'
    ],
    inclusions: ['3 Nights Stay (Kasol Camp, Kheerganga Dome Tents, Tosh Homestay)', 'Breakfast & Dinner', 'Transfers & Trek Guide'],
    exclusions: ['Personal trekking gear', 'Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b3-1', dates: '28 Aug - 31 Aug, 2026', seatsLeft: 5, status: 'Filling Fast' }],
    itinerary: [
      { day: 1, title: 'Delhi to Kasol & Chalal Riverside Walk', desc: 'Arrive in Kasol. Stroll to Chalal village through pine trees.' },
      { day: 2, title: 'Trek from Barshaini to Kheerganga Hot Springs', desc: '12 km scenic forest trek to Kheerganga. Evening hot bath under stars.' },
      { day: 3, title: 'Kheerganga Descent & Stay in Tosh Village', desc: 'Trek back down to Barshaini and transfer to cliffside Tosh village.' },
      { day: 4, title: 'Manikaran Sahib Gurudwara & Return Drive', desc: 'Visit Manikaran Sahib and board return Volvo to Delhi.' }
    ]
  },
  {
    id: 4,
    title: 'Dharamshala, McLeodganj & Triund Ridge Trek',
    shortTitle: 'Dharamshala & Triund Trek',
    slug: 'dharamshala-triund-trek',
    duration: '3N/4D',
    price: 10500,
    originalPrice: 13500,
    location: 'Dharamshala, Himachal Pradesh',
    destination: 'Himachal Pradesh',
    category: 'Weekend Trips',
    image: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?q=80&w=1200&auto=format&fit=crop',
    rating: 4.8,
    reviews: 167,
    tags: ['Mountains', 'Treks', 'Tibetan Culture'],
    nextBatch: '01 Sep',
    startingPoint: 'Delhi / Pathankot',
    endingPoint: 'Delhi / Pathankot',
    altitude: '9,350 ft',
    grade: 'Moderate',
    ageGroup: '18 - 38 Years',
    gallery: ['https://images.unsplash.com/photo-1598091383021-15ddea10925d?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Experience the Tibetan culture of Little Lhasa in McLeodganj, visit the Dalai Lama Temple, and summit the breathtaking Triund ridge for a 360-degree panorama of the Dhauladhar snow wall.',
    highlights: [
      'Summit Triund ridge overlooking towering Dhauladhar mountains',
      'Camp under the stars on Triund top with valley views',
      'Visit Namgyal Monastery and Bhagsu Nag waterfall',
      'Sample authentic Tibetan momos, thukpa and bakery treats'
    ],
    inclusions: ['3 Nights stay (Boutique Hotel & Ridge Camp)', 'Breakfast & Dinner', 'Certified Trek Captain'],
    exclusions: ['Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b4-1', dates: '01 Sep - 04 Sep, 2026', seatsLeft: 8, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Arrival in McLeodganj & Dalai Lama Temple', desc: 'Explore Tibetan monasteries and Bhagsu waterfall.' },
      { day: 2, title: 'Trek to Triund Ridge (9,350 ft)', desc: '9 km mountain ascent through oak and rhododendron forests.' },
      { day: 3, title: 'Sunrise on Dhauladhar & Descent to Dharamkot', desc: 'Panoramic sunrise photo session, descend to Dharamkot.' },
      { day: 4, title: 'Norbulingka Institute & Departure', desc: 'Visit traditional Tibetan craft center and board return bus.' }
    ]
  },
  {
    id: 5,
    title: 'Jibhi & Tirthan Valley Hidden Trails Expedition',
    shortTitle: 'Jibhi & Tirthan Valley',
    slug: 'jibhi-tirthan-valley',
    duration: '3N/4D',
    price: 11500,
    originalPrice: 14500,
    location: 'Tirthan Valley, Himachal Pradesh',
    destination: 'Himachal Pradesh',
    category: 'Nature',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 142,
    tags: ['Offbeat', 'Riverside', 'Nature'],
    nextBatch: '05 Sep',
    startingPoint: 'Delhi / Chandigarh',
    endingPoint: 'Delhi / Chandigarh',
    altitude: '5,800 ft',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Discover the untamed beauty of the Great Himalayan National Park eco-zone. Hike to serene Serolsar Lake over Jalori Pass, visit ancient wooden Chehni Kothi tower, and unwind in handcrafted river cottages.',
    highlights: [
      'Hike to sacred Serolsar Lake through Jalori Pass alpine meadows',
      'Marvel at the 1,500-year-old wooden architecture of Chehni Kothi',
      'Trout fishing and waterfall trails along the crystal Tirthan river',
      'Stay in traditional pine-and-stone riverside cottages'
    ],
    inclusions: ['3 Nights Wooden Cottage Stay', 'Breakfast & Dinner', 'Private Transfers', 'Local Guide'],
    exclusions: ['Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b5-1', dates: '05 Sep - 08 Sep, 2026', seatsLeft: 6, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Delhi to Jibhi & Jibhi Waterfall Walk', desc: 'Scenic mountain drive. Check in and visit Jibhi stone bridge.' },
      { day: 2, title: 'Jalori Pass & Serolsar Lake Trek', desc: 'Drive to Jalori Pass (10,800 ft) and 5 km walk to emerald Serolsar Lake.' },
      { day: 3, title: 'Chehni Kothi Tower & Tirthan River Walk', desc: 'Visit ancient indigenous tower temple and trout stream.' },
      { day: 4, title: 'Choie Waterfall Hike & Departure', desc: 'Short jungle trek to hidden waterfall and departure.' }
    ]
  },
  {
    id: 6,
    title: 'Bir Billing Paragliding & Tibetan Monastery Circuit',
    shortTitle: 'Bir Billing Paragliding',
    slug: 'bir-billing-paragliding',
    duration: '3N/4D',
    price: 12500,
    originalPrice: 15500,
    location: 'Bir Billing, Himachal Pradesh',
    destination: 'Himachal Pradesh',
    category: 'Adventure',
    image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 184,
    tags: ['Adventure', 'Paragliding', 'Monasteries'],
    nextBatch: '10 Sep',
    startingPoint: 'Delhi / Pathankot',
    endingPoint: 'Delhi / Pathankot',
    altitude: '8,000 ft (Billing)',
    grade: 'Moderate',
    ageGroup: '18 - 40 Years',
    gallery: ['https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Fly like a bird in Asia\'s #1 Paragliding site. Take off from Billing (8,000 ft) and land in Bir valley. Explore Dzongsar Shedra monastery, cycle through tea gardens, and watch golden Himalayan sunsets from landing ground cafes.',
    highlights: [
      'Tandem 20-30 min paragliding flight from Billing with certified pilots',
      'Cycling through Baijnath tea gardens and Chokling Monastery',
      'Sunset gatherings and music at Bir Landing Site',
      'Boutique eco-camp stay with organic farm meals'
    ],
    inclusions: ['Tandem Paragliding Flight with GoPro Video', '3 Nights Camp/Resort', 'Breakfast & Dinner'],
    exclusions: ['Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b6-1', dates: '10 Sep - 13 Sep, 2026', seatsLeft: 4, status: 'Filling Fast' }],
    itinerary: [
      { day: 1, title: 'Delhi to Bir & Landing Site Sunset', desc: 'Arrive in Bir. Evening stroll at sunset landing ground.' },
      { day: 2, title: 'Billing Paragliding Flight & Gunehar Waterfall', desc: 'Drive to Billing takeoff point, glide over valleys. Hike to waterfall.' },
      { day: 3, title: 'Monastery Bicycle Trail & Tea Tasting', desc: 'Visit Chokling and Sherab Ling monasteries.' },
      { day: 4, title: 'Baijnath Temple & Return Journey', desc: 'Visit 13th-century Shiva temple and board return bus.' }
    ]
  },
  {
    id: 7,
    title: 'Kinnaur Valley: Sangla, Chitkul & Kalpa Border Circuit',
    shortTitle: 'Kinnaur & Chitkul Circuit',
    slug: 'kinnaur-chitkul-circuit',
    duration: '5N/6D',
    price: 18500,
    originalPrice: 22000,
    location: 'Kinnaur, Himachal Pradesh',
    destination: 'Himachal Pradesh',
    category: 'Backpacking',
    image: 'https://images.unsplash.com/photo-1626714486950-c63bf1084b64?q=80&w=1200&auto=format&fit=crop',
    rating: 4.8,
    reviews: 112,
    tags: ['Border Trail', 'Mountains', 'Culture'],
    nextBatch: '12 Sep',
    startingPoint: 'Shimla / Chandigarh',
    endingPoint: 'Shimla / Chandigarh',
    altitude: '11,300 ft (Chitkul)',
    grade: 'Moderate',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1626714486950-c63bf1084b64?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Journey to the edge of the Indo-Tibetan border. Explore Chitkul, the last inhabited village on the old Hindustan-Tibet road, walk through Sangla apple orchards, and gaze upon the sacred Kinnaur Kailash peak from Kalpa.',
    highlights: [
      'Visit Chitkul (11,319 ft) - India\'s Last Inhabited Village near Tibet border',
      'Walk along the turquoise Baspa River and Kamru Fort in Sangla',
      'Panoramic view of Kinnaur Kailash (shiva lingam rock formation)',
      'Stay in heritage wooden riverside camps'
    ],
    inclusions: ['5 Nights accommodation', 'Breakfast & Dinner', 'Private Tempo Traveler', 'Trip Captain'],
    exclusions: ['Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b7-1', dates: '12 Sep - 17 Sep, 2026', seatsLeft: 8, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Shimla to Sarahan via Narkanda', desc: 'Visit historic Bhimakali temple in Sarahan.' },
      { day: 2, title: 'Sarahan to Sangla Valley & Baspa River', desc: 'Drive through deep gorge into fertile apple valley.' },
      { day: 3, title: 'Chitkul Last Village Exploration', desc: 'Walk along river to Indo-Tibet border checkpost.' },
      { day: 4, title: 'Sangla to Kalpa & Roghi Cliff Walk', desc: 'View Kinnaur Kailash peak and suicide point cliff.' },
      { day: 5, title: 'Kalpa to Narkanda Sunset Point', desc: 'Drive back to Hatu Peak in Narkanda.' },
      { day: 6, title: 'Narkanda to Shimla & Departure', desc: 'Transfer to Shimla/Chandigarh for onward return.' }
    ]
  },
  {
    id: 8,
    title: 'Shimla, Kufri & Mashobra Heritage Colonial Getaway',
    shortTitle: 'Shimla & Mashobra Getaway',
    slug: 'shimla-mashobra-getaway',
    duration: '3N/4D',
    price: 11000,
    originalPrice: 13500,
    location: 'Shimla, Himachal Pradesh',
    destination: 'Himachal Pradesh',
    category: 'Weekend Trips',
    image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=1200&auto=format&fit=crop',
    rating: 4.7,
    reviews: 95,
    tags: ['Colonial', 'Heritage', 'Weekend Trips'],
    nextBatch: '15 Sep',
    startingPoint: 'Delhi / Chandigarh',
    endingPoint: 'Delhi / Chandigarh',
    altitude: '7,200 ft',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Experience the colonial charm of the Queen of Hills. Walk along the historic Ridge and Mall Road, ride the UNESCO Kalka-Shimla toy train, and stay in tranquil cedar woods in Mashobra.',
    highlights: [
      'Stroll along the historic Christ Church, Gaiety Theatre & Mall Road',
      'Forest pine trail walk in serene Mashobra and Craignano',
      'Panoramic Himalayan view from Jakhoo Temple hill',
      'Heritage estate stay with local Himachali Dham cuisine'
    ],
    inclusions: ['3 Nights Heritage Hotel Stay', 'Breakfast & Dinner', 'Private Cab Sightseeing'],
    exclusions: ['Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b8-1', dates: '15 Sep - 18 Sep, 2026', seatsLeft: 10, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Arrival in Shimla & Ridge Walk', desc: 'Check in, explore Lakkar Bazaar and Mall Road.' },
      { day: 2, title: 'Kufri Snow Viewpoint & Mahasu Peak', desc: 'Visit high ridge viewpoints and nature park.' },
      { day: 3, title: 'Mashobra Pine Woods & Craignano Nature Park', desc: 'Peaceful forest picnic and heritage apple walk.' },
      { day: 4, title: 'Viceregal Lodge & Return Departure', desc: 'Visit Indian Institute of Advanced Study & return.' }
    ]
  },
  {
    id: 9,
    title: 'Dalhousie & Khajjiar Mini Switzerland Forest Circuit',
    shortTitle: 'Dalhousie & Khajjiar',
    slug: 'dalhousie-khajjiar-circuit',
    duration: '4N/5D',
    price: 13000,
    originalPrice: 16000,
    location: 'Dalhousie, Himachal Pradesh',
    destination: 'Himachal Pradesh',
    category: 'Nature',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    rating: 4.8,
    reviews: 110,
    tags: ['Nature', 'Meadows', 'Colonial'],
    nextBatch: '18 Sep',
    startingPoint: 'Delhi / Pathankot',
    endingPoint: 'Delhi / Pathankot',
    altitude: '6,500 ft',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Walk through deodar meadows and Victorian stone churches. Visit Khajjiar, recognized as the Mini Switzerland of India with its saucer-shaped lake surrounded by dense cedar woods and Chamba valley views.',
    highlights: [
      'Explore the lush alpine meadow and lake of Khajjiar',
      'Hike to Dainkund Peak (highest peak in Dalhousie) with singing winds',
      'Visit Kalatop Wildlife Sanctuary and St. John\'s stone church',
      'Chamba historical town and river rafting'
    ],
    inclusions: ['4 Nights Boutique Resort', 'Breakfast & Dinner', 'Sightseeing & Transfers'],
    exclusions: ['Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b9-1', dates: '18 Sep - 22 Sep, 2026', seatsLeft: 7, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Delhi/Pathankot to Dalhousie', desc: 'Scenic mountain climb into colonial hill station.' },
      { day: 2, title: 'Khajjiar Mini Switzerland Day Trip', desc: 'Explore meadow, zorbing, and pine forest trails.' },
      { day: 3, title: 'Dainkund Peak Hike & Kalatop Sanctuary', desc: '360-degree Pir Panjal mountain panorama.' },
      { day: 4, title: 'Chamba Heritage Town & Ravi River', desc: 'Visit ancient temples and handicraft markets.' },
      { day: 5, title: 'Subhash Baoli & Departure', desc: 'Morning nature walk and departure to Pathankot.' }
    ]
  },
  {
    id: 10,
    title: 'Hampta Pass & Chandratal Alpine Crossover Trek',
    shortTitle: 'Hampta Pass Trek',
    slug: 'hampta-pass-trek',
    duration: '5N/6D',
    price: 15500,
    originalPrice: 19000,
    location: 'Manali to Spiti, Himachal Pradesh',
    destination: 'Himachal Pradesh',
    category: 'Adventure',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 175,
    tags: ['Trekking', 'High Altitude', 'Crossover'],
    nextBatch: '20 Sep',
    startingPoint: 'Manali',
    endingPoint: 'Manali',
    altitude: '14,065 ft',
    grade: 'Moderate to Challenging',
    ageGroup: '18 - 40 Years',
    gallery: ['https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop'],
    overview: 'The most dramatic crossover trek in the Himalayas. Start from lush green valleys of Kullu, climb over Hampta Pass (14,065 ft), and descend into the barren moonscapes of Lahaul & Spiti with a visit to Chandratal Lake.',
    highlights: [
      'Cross from green alpine valleys into barren Spiti cold desert in a single day',
      'Camp at beautiful meadows of Balu Ka Ghera and Shea Goru riverside',
      'Summit Hampta Pass at 14,065 ft with view of Indrasan peak',
      'Excursion to turquoise Chandratal Moon Lake'
    ],
    inclusions: ['5 Nights Trek Camping & Homestay', 'All Meals on Trek', 'Trek Guide, Mules, Oxygen Kit'],
    exclusions: ['Backpack offloading charges', 'GST (5%)'],
    availableBatches: [{ id: 'b10-1', dates: '20 Sep - 25 Sep, 2026', seatsLeft: 6, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Manali to Jobra & Trek to Chika', desc: 'Drive to Jobra dam, trek through pine forests to Chika.' },
      { day: 2, title: 'Chika to Balu Ka Ghera', desc: 'Walk along riverbed to alpine base camp.' },
      { day: 3, title: 'Balu Ka Ghera to Shea Goru via Hampta Pass (14,065 ft)', desc: 'Steep summit climb over pass and descent to Spiti side.' },
      { day: 4, title: 'Shea Goru to Chatru & Chandratal Drive', desc: 'Cross glacier river to Chatru, drive to Chandratal.' },
      { day: 5, title: 'Chandratal to Manali via Atal Tunnel', desc: 'Drive back through Atal Tunnel to Manali.' },
      { day: 6, title: 'Manali Departure', desc: 'Free morning in Manali and onward journey.' }
    ]
  },
  {
    id: 11,
    title: 'Pin Parvati Pass High-Altitude Wilderness Expedition',
    shortTitle: 'Pin Parvati Pass Trek',
    slug: 'pin-parvati-pass-expedition',
    duration: '7N/8D',
    price: 32000,
    originalPrice: 38000,
    location: 'Parvati to Spiti, Himachal Pradesh',
    destination: 'Himachal Pradesh',
    category: 'Adventure',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
    rating: 5.0,
    reviews: 64,
    tags: ['Extreme', 'Trekking', 'Glaciers'],
    nextBatch: '25 Sep',
    startingPoint: 'Kasol / Kullu',
    endingPoint: 'Kaza / Manali',
    altitude: '17,450 ft',
    grade: 'Difficult',
    ageGroup: '20 - 45 Years',
    gallery: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop'],
    overview: 'One of the ultimate trans-Himalayan challenges. Connecting the lush green Parvati Valley with the high cold desert of Pin Valley National Park in Spiti over the 17,450 ft glaciated pass.',
    highlights: [
      'Glacier walk and crevasses crossing over Pin Parvati Pass (17,450 ft)',
      'Traverse high-altitude lakes of Mantalai and Pin river delta',
      'Spot rare Himalayan ibex, snow leopards, and Tibetan wolves',
      'Conclude with celebratory dinner in Kaza'
    ],
    inclusions: ['7 Nights Expedition Alpine Tents', 'High-Altitude Porter & Guide Support', 'All Meals & Technical Gear'],
    exclusions: ['Personal insurance', 'GST (5%)'],
    availableBatches: [{ id: 'b11-1', dates: '25 Sep - 02 Oct, 2026', seatsLeft: 4, status: 'Filling Fast' }],
    itinerary: [
      { day: 1, title: 'Kasol to Barsheni & Kheerganga', desc: 'Start trek from Parvati valley.' },
      { day: 2, title: 'Kheerganga to Tunda Bhuj', desc: 'Trail through birch forests and cliff bridges.' },
      { day: 3, title: 'Tunda Bhuj to Thakur Kuan', desc: 'Crossing roaring Parvati river over pulley bridges.' },
      { day: 4, title: 'Thakur Kuan to Mantalai Sacred Lake (13,400 ft)', desc: 'Reaching glacier source lake.' },
      { day: 5, title: 'Mantalai to Pass Base Camp', desc: 'Steep moraine ascent to high camp.' },
      { day: 6, title: 'Summit Pin Parvati Pass (17,450 ft) to Pin Valley', desc: 'Epic pass crossover to Spiti valley.' },
      { day: 7, title: 'Pin Valley to Mudh Village & Kaza', desc: 'Walk down to Mudh village and jeep transfer to Kaza.' },
      { day: 8, title: 'Kaza to Manali Departure', desc: 'Return drive over Kunzum Pass to Manali.' }
    ]
  },
  {
    id: 12,
    title: 'Spiti Winter White Expedition & Snow Leopard Trail',
    shortTitle: 'Spiti Winter Expedition',
    slug: 'spiti-winter-white-expedition',
    duration: '6N/7D',
    price: 28000,
    originalPrice: 34000,
    location: 'Spiti Valley, Himachal Pradesh',
    destination: 'Himachal Pradesh',
    category: 'Adventure',
    image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 88,
    tags: ['Winter', 'Snow Leopard', 'Extreme'],
    nextBatch: '15 Dec',
    startingPoint: 'Shimla',
    endingPoint: 'Shimla',
    altitude: '13,500 ft',
    grade: 'Challenging',
    ageGroup: '18 - 40 Years',
    gallery: ['https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Experience the magic of frozen Spiti in sub-zero temperatures. Walk on frozen Spiti riverbeds, track elusive snow leopards with local wildlife trackers in Kibber, and experience authentic homestays with traditional bukhari heaters.',
    highlights: [
      'Witness Spiti transformed into a frozen white wonderland (-15°C)',
      'Snow leopard wildlife tracking in Kibber Wildlife Sanctuary',
      'Frozen Chicham suspension bridge (Highest in Asia)',
      'Cozy traditional homestays with local Spitian families'
    ],
    inclusions: ['6 Nights Heated Homestays', 'All Meals & Hot Soups', 'Heavy-Duty 4x4 Gypsy', 'Wildlife Guide'],
    exclusions: ['Personal extreme winter clothing', 'GST (5%)'],
    availableBatches: [{ id: 'b12-1', dates: '15 Dec - 21 Dec, 2026', seatsLeft: 4, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Shimla to Kalpa Winter Drive', desc: 'Drive past snow-capped Kinnaur pine forests.' },
      { day: 2, title: 'Kalpa to Kaza Frozen Odyssey', desc: 'Enter frozen Spiti valley.' },
      { day: 3, title: 'Kibber Wildlife Sanctuary Snow Leopard Tracking', desc: 'Spot blue sheep and snow leopards with spotting scopes.' },
      { day: 4, title: 'Chicham Bridge & Key Monastery in Snow', desc: 'Visit monasteries surrounded by deep white snow.' },
      { day: 5, title: 'Kaza to Tabo & Nako Frozen Lake', desc: 'Walk on frozen Nako lake.' },
      { day: 6, title: 'Nako to Rampur', desc: 'Descent to lower altitudes.' },
      { day: 7, title: 'Rampur to Shimla & Departure', desc: 'Drop off in Shimla with lifelong winter memories.' }
    ]
  },

  // -------------------------------------------------------------
  // UTTARAKHAND EXPEDITIONS (8 Distinct Active Packages)
  // -------------------------------------------------------------
  {
    id: 13,
    title: 'Kedarnath & Badrinath Sacred Himalayan Circuit',
    shortTitle: 'Kedarnath & Badrinath',
    slug: 'kedarnath-badrinath-circuit',
    duration: '5N/6D',
    price: 19500,
    originalPrice: 24000,
    location: 'Kedarnath, Uttarakhand',
    destination: 'Uttarakhand',
    category: 'Culture',
    image: 'https://images.pexels.com/photos/442579/pexels-photo-442579.jpeg',
    rating: 4.9,
    reviews: 280,
    trending: true,
    tags: ['Spiritual', 'Mountains', 'Culture'],
    nextBatch: '01 Sep',
    startingPoint: 'Haridwar / Rishikesh',
    endingPoint: 'Haridwar / Rishikesh',
    altitude: '11,755 ft',
    grade: 'Moderate',
    ageGroup: 'All Ages',
    gallery: ['https://images.pexels.com/photos/442579/pexels-photo-442579.jpeg'],
    overview: 'Pilgrimage to the abode of Lord Shiva in Kedarnath (11,755 ft) tucked against the towering Kedarnath peak, followed by holy darshan at Badrinath temple and a visit to Mana, the last Indian village before Tibet.',
    highlights: [
      'Trek to ancient 8th-century Kedarnath Temple standing amidst snow walls',
      'Attend evening Aarti at Badrinath and take a dip in Tapt Kund hot spring',
      'Visit Mana Village, Vyas Gufa, and Bhim Pul over Saraswati river',
      'Witness Sangam confluence of Alaknanda & Mandakini rivers at Rudraprayag'
    ],
    inclusions: ['5 Nights Hotel & Cottage Stay', 'Breakfast & Dinner', 'Private AC Vehicle', 'Captain Support'],
    exclusions: ['Helicopter tickets', 'Pony/Palki', 'Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b13-1', dates: '01 Sep - 06 Sep, 2026', seatsLeft: 5, status: 'Filling Fast' }],
    itinerary: [
      { day: 1, title: 'Rishikesh to Guptkashi via Devprayag', desc: 'Witness holy confluence of Bhagirathi and Alaknanda.' },
      { day: 2, title: 'Guptkashi to Gaurikund & Kedarnath Trek (16 km)', desc: 'Scenic mountain climb to Kedarnath temple.' },
      { day: 3, title: 'Kedarnath Morning Darshan & Descent to Guptkashi', desc: 'Attend morning prayer and descend back.' },
      { day: 4, title: 'Guptkashi to Badrinath via Joshimath', desc: 'Scenic drive to Badrinath valley.' },
      { day: 5, title: 'Badrinath Darshan, Mana Village & Pipalkoti', desc: 'Visit last Indian village and descend to Pipalkoti.' },
      { day: 6, title: 'Pipalkoti to Rishikesh & Departure', desc: 'Return drive to Rishikesh/Haridwar.' }
    ]
  },
  {
    id: 14,
    title: 'Rishikesh Whitewater Rafting & Riverside Camping',
    shortTitle: 'Rishikesh Rafting & Camp',
    slug: 'rishikesh-rafting-camping',
    duration: '2N/3D',
    price: 6500,
    originalPrice: 8500,
    location: 'Rishikesh, Uttarakhand',
    destination: 'Uttarakhand',
    category: 'Weekend Trips',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
    rating: 4.8,
    reviews: 320,
    trending: true,
    tags: ['Rafting', 'Adventure', 'Weekend Trips'],
    nextBatch: '04 Sep',
    startingPoint: 'Rishikesh',
    endingPoint: 'Rishikesh',
    altitude: '1,200 ft',
    grade: 'Easy',
    ageGroup: '18 - 40 Years',
    gallery: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop'],
    overview: 'The quintessential adventure weekend in India\'s yoga and rafting capital. Conquer Grade III/IV rapids on the Ganga, jump from 25-ft cliffs, relax at luxury riverside camps, and experience the divine Ganga Aarti at Triveni Ghat.',
    highlights: [
      '16 km / 24 km Whitewater rafting through rapids like Roller Coaster & Golf Course',
      'Cliff jumping, body surfing, and bungee jumping (optional)',
      'Luxury Swiss camp stay by the river with swimming pool and DJ night',
      'Evening spiritual Ganga Aarti at Parmarth Niketan'
    ],
    inclusions: ['2 Nights Luxury Camp', 'All Meals (2 Breakfast, 2 Lunch, 2 Dinner)', '16 km Rafting with Gear'],
    exclusions: ['Bungee jumping tickets', 'Transfers to Rishikesh', 'GST (5%)'],
    availableBatches: [{ id: 'b14-1', dates: '04 Sep - 06 Sep, 2026', seatsLeft: 12, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Arrival in Rishikesh Camp & Evening Aarti', desc: 'Check in to riverside camp. Attend Ganga Aarti.' },
      { day: 2, title: 'Whitewater Rafting & Cliff Jumping', desc: 'Thrilling 16 km rafting expedition from Shivpuri to Rishikesh.' },
      { day: 3, title: 'Beatles Ashram Visit & Departure', desc: 'Visit historic ashram, cafe hopping in Laxman Jhula.' }
    ]
  },
  {
    id: 15,
    title: 'Chopta Tungnath & Chandrashila Peak Trek',
    shortTitle: 'Chopta Tungnath Trek',
    slug: 'chopta-tungnath-chandrashila',
    duration: '3N/4D',
    price: 9500,
    originalPrice: 12500,
    location: 'Chopta, Uttarakhand',
    destination: 'Uttarakhand',
    category: 'Weekend Trips',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 215,
    trending: true,
    tags: ['Treks', 'High Altitude', 'Mountains'],
    nextBatch: '05 Sep',
    startingPoint: 'Rishikesh / Haridwar',
    endingPoint: 'Rishikesh / Haridwar',
    altitude: '13,100 ft (Chandrashila)',
    grade: 'Moderate',
    ageGroup: '18 - 38 Years',
    gallery: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Trek through the Mini Switzerland of Uttarakhand. Hike to Tungnath (World\'s Highest Shiva Temple at 12,073 ft) and summit Chandrashila Peak (13,100 ft) for jaw-dropping views of Nanda Devi, Trishul, and Chaukhamba peaks.',
    highlights: [
      'Visit the 1,000-year-old Tungnath Temple (highest Shiva shrine on Earth)',
      'Reach the summit of Chandrashila Peak (13,100 ft) for 360° Garhwal panorama',
      'Camp amidst the lush meadows (Bugyals) of Chopta',
      'Visit pristine high-altitude Deoria Tal lake'
    ],
    inclusions: ['3 Nights Stay (Chopta Camps & Sari Homestay)', 'Breakfast & Dinner', 'Trek Leader & Permits'],
    exclusions: ['Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b15-1', dates: '05 Sep - 08 Sep, 2026', seatsLeft: 8, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Rishikesh to Sari & Deoria Tal Hike', desc: 'Drive along Alaknanda river, 2 km hike to reflection lake.' },
      { day: 2, title: 'Sari to Chopta Meadows', desc: 'Transfer to Chopta base camp, acclimatization walk.' },
      { day: 3, title: 'Summit Tungnath & Chandrashila (13,100 ft)', desc: 'Early morning summit trek for golden sunrise.' },
      { day: 4, title: 'Chopta to Rishikesh Return', desc: 'Return drive to Rishikesh with rafting memories.' }
    ]
  },
  {
    id: 16,
    title: 'Auli Skiing, Ropeway & Valley of Flowers Trek',
    shortTitle: 'Auli & Valley of Flowers',
    slug: 'auli-valley-of-flowers',
    duration: '5N/6D',
    price: 18000,
    originalPrice: 22500,
    location: 'Auli, Uttarakhand',
    destination: 'Uttarakhand',
    category: 'Nature',
    image: 'https://images.unsplash.com/photo-1596761611076-02720db1b4f8?q=80&w=1200&auto=format&fit=crop',
    rating: 4.8,
    reviews: 140,
    tags: ['Nature', 'Flowers', 'Skiing'],
    nextBatch: '10 Sep',
    startingPoint: 'Rishikesh',
    endingPoint: 'Rishikesh',
    altitude: '12,000 ft',
    grade: 'Moderate',
    ageGroup: '18 - 45 Years',
    gallery: ['https://images.unsplash.com/photo-1596761611076-02720db1b4f8?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Discover UNESCO World Heritage Valley of Flowers blooming with hundreds of endemic Himalayan alpine species. Ride Asia\'s longest cable car ropeway in Auli and gaze upon the majestic Nanda Devi peak.',
    highlights: [
      'Trek into the UNESCO Valley of Flowers carpeted with rare blue poppies and orchids',
      'Ride the 4 km Joshimath-Auli ropeway cable car overlooking snow peaks',
      'Hike to sacred Hemkund Sahib holy lake at 14,200 ft',
      'Artificial lake and ski slopes in Auli'
    ],
    inclusions: ['5 Nights Hotel & Eco Lodge Stay', 'Breakfast & Dinner', 'Private Transfers', 'Forest Permits'],
    exclusions: ['Ropeway tickets', 'Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b16-1', dates: '10 Sep - 15 Sep, 2026', seatsLeft: 6, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Rishikesh to Govindghat via Joshimath', desc: 'Drive through Garhwal mountain highway.' },
      { day: 2, title: 'Govindghat to Ghangaria Base Camp (10 km)', desc: 'Trek along Pushpawati river to Ghangaria.' },
      { day: 3, title: 'Trek into Valley of Flowers & Return', desc: 'Full day flower photography in blooming valley.' },
      { day: 4, title: 'Ghangaria to Hemkund Sahib (14,200 ft)', desc: 'Steep climb to glacial lake and golden gurudwara.' },
      { day: 5, title: 'Ghangaria to Auli Ski Slopes', desc: 'Descent to Govindghat and transfer to Auli resort.' },
      { day: 6, title: 'Auli to Rishikesh Departure', desc: 'Scenic morning in Auli and return drive to Rishikesh.' }
    ]
  },
  {
    id: 17,
    title: 'Nainital & Jim Corbett Wilderness Tiger Safari',
    shortTitle: 'Nainital & Corbett Safari',
    slug: 'nainital-corbett-safari',
    duration: '4N/5D',
    price: 14500,
    originalPrice: 18000,
    location: 'Corbett & Nainital, Uttarakhand',
    destination: 'Uttarakhand',
    category: 'Nature',
    image: 'https://images.unsplash.com/photo-1586796676774-c93004ae009f?q=80&w=1200&auto=format&fit=crop',
    rating: 4.7,
    reviews: 132,
    tags: ['Wildlife', 'Lakes', 'Safari'],
    nextBatch: '15 Sep',
    startingPoint: 'Delhi',
    endingPoint: 'Delhi',
    altitude: '6,837 ft (Nainital)',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1586796676774-c93004ae009f?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Experience the best of Kumaon. Sail across emerald Naini Lake, explore colonial viewpoints, and embark on an open 4x4 Jeep Safari through the dense sal forests of India\'s oldest national park in Jim Corbett.',
    highlights: [
      'Open 4x4 Jeep Safari in Jim Corbett Tiger Reserve (Bijrani/Dhela Zone)',
      'Boating and yachting in the crescent-shaped Naini Lake',
      'Visit Naina Peak, Cave Garden, and Snow Viewpoint',
      'Stay in luxury jungle resort with riverside deck'
    ],
    inclusions: ['4 Nights Stay (2N Nainital Resort + 2N Corbett Jungle Resort)', 'Breakfast & Dinner', '1 Jeep Safari'],
    exclusions: ['Personal camera fees', 'Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b17-1', dates: '15 Sep - 19 Sep, 2026', seatsLeft: 8, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Delhi to Nainital & Mall Road', desc: 'Drive to Kumaon hills. Evening boating on Naini Lake.' },
      { day: 2, title: 'Nainital Lake Tour: Bhimtal & Sattal', desc: 'Visit peaceful surrounding lakes and tea points.' },
      { day: 3, title: 'Nainital to Jim Corbett Jungle Resort', desc: 'Drive down to Ramnagar forest buffer zone.' },
      { day: 4, title: 'Early Morning 4x4 Tiger Jeep Safari', desc: 'Jungle safari tracking tigers, elephants, and deer.' },
      { day: 5, title: 'Corbett Falls & Delhi Departure', desc: 'Visit forest waterfall and return to Delhi.' }
    ]
  },
  {
    id: 18,
    title: 'Mussoorie, Landour & Dhanaulti Misty Hills',
    shortTitle: 'Mussoorie & Landour',
    slug: 'mussoorie-landour-dhanaulti',
    duration: '3N/4D',
    price: 11000,
    originalPrice: 14000,
    location: 'Mussoorie, Uttarakhand',
    destination: 'Uttarakhand',
    category: 'Weekend Trips',
    image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1200&auto=format&fit=crop',
    rating: 4.8,
    reviews: 160,
    tags: ['Colonial', 'Weekend Trips', 'Nature'],
    nextBatch: '20 Sep',
    startingPoint: 'Delhi / Dehradun',
    endingPoint: 'Delhi / Dehradun',
    altitude: '7,000 ft',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Walk under tall deodars in Ruskin Bond\'s charming Landour. Taste handmade cheese and apple pies at Char Dukan, explore Kempty Falls and George Everest Peak, and walk through eco-parks in Dhanaulti.',
    highlights: [
      'Heritage walk in quiet Landour visiting Char Dukan & Sister\'s Bazaar',
      'Hike to Sir George Everest Peak for panoramic Doon Valley view',
      'Visit Kempty Falls and Dhanaulti Eco Park deodar forest',
      'Colonial boutique hotel stay with evening fireplace'
    ],
    inclusions: ['3 Nights Boutique Stay', 'Breakfast & Dinner', 'Private Cab for all sights'],
    exclusions: ['Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b18-1', dates: '20 Sep - 23 Sep, 2026', seatsLeft: 10, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Delhi/Dehradun to Mussoorie Mall Road', desc: 'Climb into misty Queen of the Hills.' },
      { day: 2, title: 'Landour Heritage Trail & Char Dukan', desc: 'Walk under pine canopy, visit Lal Tibba viewpoint.' },
      { day: 3, title: 'Dhanaulti Deodar Woods & Surkanda Devi Temple', desc: 'Visit high mountain temple and eco park.' },
      { day: 4, title: 'George Everest Estate & Departure', desc: 'Panoramic ridge hike and transfer to Dehradun.' }
    ]
  },
  {
    id: 19,
    title: 'Dayara Bugyal High-Altitude Alpine Meadow Trek',
    shortTitle: 'Dayara Bugyal Trek',
    slug: 'dayara-bugyal-trek',
    duration: '4N/5D',
    price: 11500,
    originalPrice: 14500,
    location: 'Uttarkashi, Uttarakhand',
    destination: 'Uttarakhand',
    category: 'Adventure',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 98,
    tags: ['Treks', 'Meadows', 'Himalayas'],
    nextBatch: '22 Sep',
    startingPoint: 'Dehradun',
    endingPoint: 'Dehradun',
    altitude: '12,000 ft',
    grade: 'Easy to Moderate',
    ageGroup: '18 - 40 Years',
    gallery: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Rated as one of the most breathtaking alpine meadow treks in India. Spread across 28 sq km of lush green tableland, Dayara Bugyal offers uninterrupted vistas of Bandarpoonch, Gangotri, and Draupadi Ka Danda peaks.',
    highlights: [
      'Walk across expansive green rolling tablelands at 12,000 ft',
      'Spectacular close-up views of Mt. Bandarpoonch and Kala Nag',
      'Camp at Gui and Barnala high-altitude campsites',
      'Experience traditional shepherd trails and local Garhwali homestays'
    ],
    inclusions: ['4 Nights Trek Tents & Homestay', 'All Meals on Trek', 'Certified Trek Leader', 'Permits'],
    exclusions: ['Backpack offloading', 'GST (5%)'],
    availableBatches: [{ id: 'b19-1', dates: '22 Sep - 26 Sep, 2026', seatsLeft: 6, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Dehradun to Raithal Village (7,400 ft)', desc: 'Scenic Bhagirathi river drive to base village.' },
      { day: 2, title: 'Raithal to Gui Campsite (9,500 ft)', desc: 'Trek through oak and rhododendron forest.' },
      { day: 3, title: 'Gui to Dayara Bugyal Summit (12,000 ft)', desc: 'Explore endless velvet meadows and snow view.' },
      { day: 4, title: 'Dayara Bugyal to Barsu Village', desc: 'Descent through village terraces.' },
      { day: 5, title: 'Barsu to Dehradun Departure', desc: 'Return drive to Dehradun railway station.' }
    ]
  },
  {
    id: 20,
    title: 'Nag Tibba Weekend Backpacker Summit Trek',
    shortTitle: 'Nag Tibba Summit Trek',
    slug: 'nag-tibba-weekend-trek',
    duration: '2N/3D',
    price: 6500,
    originalPrice: 8500,
    location: 'Pantwari, Uttarakhand',
    destination: 'Uttarakhand',
    category: 'Weekend Trips',
    image: 'https://images.unsplash.com/photo-1596761611076-02720db1b4f8?q=80&w=1200&auto=format&fit=crop',
    rating: 4.8,
    reviews: 185,
    tags: ['Weekend Trips', 'Treks', 'Beginner'],
    nextBatch: '25 Sep',
    startingPoint: 'Dehradun',
    endingPoint: 'Dehradun',
    altitude: '9,915 ft',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1596761611076-02720db1b4f8?q=80&w=1200&auto=format&fit=crop'],
    overview: 'The highest peak in the Lesser Himalayan region of Garhwal (9,915 ft). Perfect 2-day beginner trek with sunset camping, bonfire music, and clear panoramas of Kedarnath, Gangotri, and Swargarohini peaks.',
    highlights: [
      'Summit Nag Tibba (9,915 ft) in a convenient weekend escape',
      'Watch surreal sunset and sunrise from high alpine base camp',
      'Bonfire and stargazing under pollution-free mountain skies',
      'Ideal for solo travelers, beginner backpackers, and corporate groups'
    ],
    inclusions: ['2 Nights Alpine Camps', 'All Meals on Trek', 'Dehradun to Pantwari Transfers', 'Trek Guide'],
    exclusions: ['Personal gear', 'GST (5%)'],
    availableBatches: [{ id: 'b20-1', dates: '25 Sep - 27 Sep, 2026', seatsLeft: 12, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Dehradun to Pantwari & Trek to Base Camp', desc: 'Drive to Pantwari village, 4 km forest hike to camp.' },
      { day: 2, title: 'Summit Nag Tibba Peak (9,915 ft) & Sunset', desc: 'Climb to summit ridge for Garhwal mountain views.' },
      { day: 3, title: 'Descent to Pantwari & Return to Dehradun', desc: 'Walk down to base and return drive to Dehradun.' }
    ]
  },

  // -------------------------------------------------------------
  // MEGHALAYA EXPEDITIONS (6 Distinct Active Packages)
  // -------------------------------------------------------------
  {
    id: 21,
    title: 'Meghalaya Backpacking: Land of Clouds & Living Root Bridges',
    shortTitle: 'Meghalaya Backpacking',
    slug: 'meghalaya-backpacking-living-root-bridges',
    duration: '5N/6D',
    price: 18500,
    originalPrice: 22500,
    location: 'Meghalaya, India',
    destination: 'Meghalaya',
    category: 'Backpacking',
    image: 'https://images.pexels.com/photos/17334314/pexels-photo-17334314.jpeg',
    rating: 4.9,
    reviews: 240,
    trending: true,
    tags: ['Backpacking', 'Waterfalls', 'Living Root Bridges'],
    nextBatch: '15 Aug',
    startingPoint: 'Guwahati Airport / ISBT',
    endingPoint: 'Guwahati Airport',
    altitude: '4,900 ft',
    grade: 'Moderate',
    ageGroup: '18 - 35 Years',
    gallery: [
      'https://images.pexels.com/photos/17334314/pexels-photo-17334314.jpeg',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop'
    ],
    overview: 'Experience the mystical state of Meghalaya, home to living root bridges, crystal clear rivers of Dawki, cloud-filled valleys of Cherrapunji, and Asia\'s cleanest village. Hike down the 3,000 steps to the iconic Double Decker Living Root Bridge and cliff-jump into pristine blue lagoons.',
    highlights: [
      'Trek to the famous Double Decker Living Root Bridge in Nongriat',
      'Cliff jumping & boat ride on crystal clear waters of Umngot River in Dawki',
      'Explore Wei Sawdong three-tiered waterfall & Nohkalikai Falls',
      'Stay in cozy bamboo cottages surrounded by pine forests'
    ],
    inclusions: ['Accommodations for 5 Nights', 'Breakfast & Dinners included', 'Private AC vehicle transfers', 'Trip Captain'],
    exclusions: ['Flight / Train to Guwahati', 'Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b21-1', dates: '15 Aug - 20 Aug, 2026', seatsLeft: 4, status: 'Filling Fast' }],
    itinerary: [
      { day: 1, title: 'Arrival in Guwahati & Transfer to Shillong', desc: 'Scenic drive with halt at Umiam Lake.' },
      { day: 2, title: 'Shillong to Cherrapunji via Waterfalls', desc: 'Visit Elephant Falls, Wei Sawdong & Nohkalikai.' },
      { day: 3, title: 'The Great Nongriat Trek - Double Decker Root Bridge', desc: '3,500 steps descent into rainforest.' },
      { day: 4, title: 'Cherrapunji to Dawki & Mawlynnong Village', desc: 'Boat ride on transparent Umngot River.' },
      { day: 5, title: 'Krang Suri Waterfalls & Jaintia Hills', desc: 'Swimming in natural turquoise pool.' },
      { day: 6, title: 'Return to Guwahati & Departure', desc: 'Drop off at Guwahati Airport.' }
    ]
  },
  {
    id: 22,
    title: 'Cherrapunji (Sohra) Waterfalls & Cave Odyssey',
    shortTitle: 'Cherrapunji Waterfalls & Caves',
    slug: 'cherrapunji-waterfalls-caves',
    duration: '4N/5D',
    price: 16000,
    originalPrice: 19500,
    location: 'Cherrapunji, Meghalaya',
    destination: 'Meghalaya',
    category: 'Nature',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
    rating: 4.8,
    reviews: 135,
    tags: ['Waterfalls', 'Caving', 'Nature'],
    nextBatch: '22 Aug',
    startingPoint: 'Guwahati Airport',
    endingPoint: 'Guwahati Airport',
    altitude: '4,690 ft',
    grade: 'Moderate',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Explore the wettest place on Earth. Stand before roaring waterfalls like Nohkalikai, Dainthlen, and Seven Sisters, explore ancient limestone fossil formations in Arwah and Mawsmai caves, and hike along the rim of Mawkdok canyon.',
    highlights: [
      'Explore prehistoric limestone fossils in Arwah & Mawsmai cave systems',
      'Walk on the natural rock formation of Dainthlen Falls',
      'Stay in cliffside resort overlooking Bangladesh plains',
      'Taste traditional Khasi pork and bamboo shoot delicacies'
    ],
    inclusions: ['4 Nights Boutique Stays', 'Breakfast & Dinner', 'Private Cab', 'Cave Entry Permits'],
    exclusions: ['Flights', 'Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b22-1', dates: '22 Aug - 26 Aug, 2026', seatsLeft: 7, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Guwahati to Sohra via Mawkdok Bridge', desc: 'Ziplining over deep canyon.' },
      { day: 2, title: 'Nohkalikai, Wei Sawdong & Dainthlen Waterfalls', desc: 'Full day waterfall chasing.' },
      { day: 3, title: 'Arwah & Mawsmai Limestone Caves', desc: 'Spelunking through natural caverns.' },
      { day: 4, title: 'Garden of Caves & Laitlum Canyons', desc: 'Panoramic sunset over rolling canyons.' },
      { day: 5, title: 'Sohra to Guwahati Departure', desc: 'Airport transfer with memories.' }
    ]
  },
  {
    id: 23,
    title: 'Dawki Glass River & Mawlynnong Eco Trail',
    shortTitle: 'Dawki Glass River',
    slug: 'dawki-glass-river-mawlynnong',
    duration: '3N/4D',
    price: 13500,
    originalPrice: 16500,
    location: 'Dawki, Meghalaya',
    destination: 'Meghalaya',
    category: 'Weekend Trips',
    image: 'https://images.pexels.com/photos/17334314/pexels-photo-17334314.jpeg',
    rating: 4.8,
    reviews: 154,
    tags: ['Riverside', 'Camping', 'Eco Trail'],
    nextBatch: '28 Aug',
    startingPoint: 'Guwahati',
    endingPoint: 'Guwahati',
    altitude: '2,500 ft',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.pexels.com/photos/17334314/pexels-photo-17334314.jpeg'],
    overview: 'Experience the magic of crystal clear water where boats appear to fly in mid-air. Camp on pebble beaches of Shnongpdeng, enjoy kayaking, cliff jumping, and explore flower-paved streets of Mawlynnong village.',
    highlights: [
      'Transparent boat ride on the crystal waters of Umngot River',
      'Riverside Swiss tent camping with bonfire and acoustic music',
      'Kayaking, cliff jumping & snorkeling in river lagoons',
      'Walk through Mawlynnong (Asia\'s Cleanest Village)'
    ],
    inclusions: ['3 Nights Riverside Camp & Boutique Stay', 'Breakfast & Dinner', 'Boating in Dawki'],
    exclusions: ['Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b23-1', dates: '28 Aug - 31 Aug, 2026', seatsLeft: 8, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Guwahati to Shnongpdeng River Camp', desc: 'Scenic drive to Indo-Bangladesh border.' },
      { day: 2, title: 'Umngot Boating, Cliff Diving & Kayaking', desc: 'Full day water activities on clear river.' },
      { day: 3, title: 'Mawlynnong Village & Single Root Bridge', desc: 'Walk in clean village and bamboo sky walk.' },
      { day: 4, title: 'Shillong Peak & Guwahati Departure', desc: 'Viewpoint halt and airport drop.' }
    ]
  },
  {
    id: 24,
    title: 'Kongthong Whistling Village & Bamboo Trail',
    shortTitle: 'Kongthong Whistling Village',
    slug: 'kongthong-whistling-village',
    duration: '4N/5D',
    price: 15500,
    originalPrice: 19000,
    location: 'East Khasi Hills, Meghalaya',
    destination: 'Meghalaya',
    category: 'Culture',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 82,
    tags: ['Culture', 'Offbeat', 'Indigenous'],
    nextBatch: '05 Sep',
    startingPoint: 'Guwahati',
    endingPoint: 'Guwahati',
    altitude: '4,200 ft',
    grade: 'Moderate',
    ageGroup: '18 - 45 Years',
    gallery: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Immerse yourself in Kongthong, where every villager has a unique musical tune assigned at birth instead of a name. Trek the breathtaking Mawryngkhang Bamboo Trail hanging over deep river gorges.',
    highlights: [
      'Learn the ancient musical naming tradition (Jingrwai Iawbei) in Kongthong',
      'Walk the thrilling Mawryngkhang Bamboo Trail over 100-ft cliff gorges',
      'Stay in indigenous eco homestays with local village leaders',
      'Swim in secret natural forest pools'
    ],
    inclusions: ['4 Nights Eco Homestays', 'All Meals', 'Local Khasi Guide', 'Village Cultural Fees'],
    exclusions: ['Flights', 'GST (5%)'],
    availableBatches: [{ id: 'b24-1', dates: '05 Sep - 09 Sep, 2026', seatsLeft: 6, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Guwahati to Shillong Cafe Trail', desc: 'Arrive and explore Shillong town.' },
      { day: 2, title: 'Shillong to Kongthong Village', desc: 'Meet villagers and experience the tune calling tradition.' },
      { day: 3, title: 'Mawryngkhang Bamboo Trail Trek', desc: 'Walk along the sky bridge made entirely of bamboo.' },
      { day: 4, title: 'Phea Phea Waterfalls Exploration', desc: 'Hike to secluded multi-tier waterfall.' },
      { day: 5, title: 'Kongthong to Guwahati Departure', desc: 'Airport transfer with unique cultural memories.' }
    ]
  },
  {
    id: 25,
    title: 'Jaintia Hills Krang Suri Blue Lagoon Circuit',
    shortTitle: 'Jaintia Hills & Krang Suri',
    slug: 'jaintia-hills-krang-suri',
    duration: '3N/4D',
    price: 12500,
    originalPrice: 15500,
    location: 'Jowai, Meghalaya',
    destination: 'Meghalaya',
    category: 'Nature',
    image: 'https://images.pexels.com/photos/17334314/pexels-photo-17334314.jpeg',
    rating: 4.8,
    reviews: 95,
    tags: ['Waterfalls', 'Lagoon', 'Nature'],
    nextBatch: '12 Sep',
    startingPoint: 'Guwahati',
    endingPoint: 'Guwahati',
    altitude: '4,500 ft',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.pexels.com/photos/17334314/pexels-photo-17334314.jpeg'],
    overview: 'Escape to the pristine Jaintia Hills. Swim in the azure lagoon of Krang Suri waterfall, explore Tyrshi terrace waterfall, and marvel at the 500-year-old Monoliths of Nartiang.',
    highlights: [
      'Swim behind the natural curtain of Krang Suri blue waterfall',
      'Visit the ancient giant monolith park at Nartiang',
      'Walk through Tyrshi terraced paddy field waterfalls',
      'Stay in serene eco cottages overlooking river valleys'
    ],
    inclusions: ['3 Nights Eco Stay', 'Breakfast & Dinner', 'Private Vehicle', 'Life Jackets & Permits'],
    exclusions: ['Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b25-1', dates: '12 Sep - 15 Sep, 2026', seatsLeft: 9, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Guwahati to Jowai via Nartiang Monoliths', desc: 'Visit ancient Khasi kingdom relics.' },
      { day: 2, title: 'Krang Suri Waterfall & Blue Lagoon Swimming', desc: 'Full day at natural swimming lagoon.' },
      { day: 3, title: 'Ialong Park & Tyrshi Falls Hike', desc: 'Paddy terrace walk and valley viewpoint.' },
      { day: 4, title: 'Jowai to Guwahati Departure', desc: 'Airport transfer for return flight.' }
    ]
  },
  {
    id: 26,
    title: 'Garo Hills Nokrek Biosphere & Siju Cave Expedition',
    shortTitle: 'Garo Hills & Nokrek',
    slug: 'garo-hills-nokrek-biosphere',
    duration: '5N/6D',
    price: 19500,
    originalPrice: 24000,
    location: 'Garo Hills, Meghalaya',
    destination: 'Meghalaya',
    category: 'Adventure',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 68,
    tags: ['Wildlife', 'Caves', 'Biosphere'],
    nextBatch: '18 Sep',
    startingPoint: 'Guwahati',
    endingPoint: 'Guwahati',
    altitude: '4,650 ft (Nokrek Peak)',
    grade: 'Moderate',
    ageGroup: '18 - 45 Years',
    gallery: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Venture into the untamed western frontier of Meghalaya. Hike through Nokrek UNESCO Biosphere (home of the Red Panda and citrus gene sanctuary), explore the underground river in Siju Bat Cave, and witness the roaring Pelga Falls.',
    highlights: [
      'Trek to Nokrek Peak in UNESCO World Biosphere Reserve',
      'Spelunking through Siju Cave (India\'s 3rd longest cave with limestone stalactites)',
      'Discover wild citrus gene pools and ancient Garo tribal villages',
      'Jungle cottage stay with organic Garo smoked cuisine'
    ],
    inclusions: ['5 Nights Jungle Lodges', 'All Meals', 'Forest Permits & Tribal Guides'],
    exclusions: ['Personal expenses', 'GST (5%)'],
    availableBatches: [{ id: 'b26-1', dates: '18 Sep - 23 Sep, 2026', seatsLeft: 5, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Guwahati to Tura (West Garo Hills)', desc: 'Drive through Assam tea estates into Garo hills.' },
      { day: 2, title: 'Nokrek Biosphere Reserve Hike', desc: 'Jungle trek spotting rare birds and red pandas.' },
      { day: 3, title: 'Pelga Falls & Chibragre Confluence', desc: 'Visit suspension bridge and river pools.' },
      { day: 4, title: 'Siju Cave & Simsang River Exploration', desc: 'Enter 4 km long bat cave with subterranean river.' },
      { day: 5, title: 'Wari Chora Natural Canyon Kayaking', desc: 'Hidden emerald canyon boat ride.' },
      { day: 6, title: 'Return Drive to Guwahati Departure', desc: 'Airport transfer with offbeat memories.' }
    ]
  },

  // -------------------------------------------------------------
  // KASHMIR EXPEDITIONS (5 Distinct Active Packages)
  // -------------------------------------------------------------
  {
    id: 27,
    title: 'Kashmir Paradise: Srinagar, Gulmarg & Pahalgam',
    shortTitle: 'Kashmir Paradise',
    slug: 'kashmir-srinagar-gulmarg-pahalgam',
    duration: '5N/6D',
    price: 21500,
    originalPrice: 26000,
    location: 'Srinagar, Kashmir',
    destination: 'Kashmir',
    category: 'Nature',
    image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=2070&auto=format&fit=crop',
    rating: 4.9,
    reviews: 310,
    trending: true,
    tags: ['Paradise', 'Houseboat', 'Snow'],
    nextBatch: '20 Aug',
    startingPoint: 'Srinagar Airport (SXR)',
    endingPoint: 'Srinagar Airport',
    altitude: '8,825 ft (Gulmarg)',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=2070&auto=format&fit=crop'],
    overview: 'Experience heaven on Earth. Stay in handcrafted wooden houseboats on Dal Lake, ride the world-famous Gulmarg Gondola to 13,780 ft snow peaks, and explore Betaab & Aru valleys in Pahalgam along the roaring Lidder river.',
    highlights: [
      'Stay in luxury carved Cedar Houseboat on Dal Lake with Shikara ride',
      'Ride the Phase 2 Gulmarg Gondola up to 13,780 ft Apharwat Peak',
      'Pony ride through Betaab Valley and Aru Valley in Pahalgam',
      'Savor authentic Kashmiri Wazwan feast and Kehwa saffron tea'
    ],
    inclusions: ['5 Nights Stay (1N Houseboat + 2N Gulmarg + 2N Pahalgam)', 'Breakfast & Dinner', 'Private Cab', 'Shikara Ride'],
    exclusions: ['Gondola tickets', 'Pony charges', 'Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b27-1', dates: '20 Aug - 25 Aug, 2026', seatsLeft: 5, status: 'Filling Fast' }],
    itinerary: [
      { day: 1, title: 'Arrival in Srinagar & Dal Lake Shikara Ride', desc: 'Check in to luxury houseboat, evening sunset shikara.' },
      { day: 2, title: 'Srinagar to Gulmarg Meadow of Flowers', desc: 'Visit world\'s highest golf course and ski slopes.' },
      { day: 3, title: 'Gulmarg Gondola Ride to Apharwat Peak', desc: 'Touch snow at 13,780 ft, transfer back to Srinagar.' },
      { day: 4, title: 'Srinagar to Pahalgam Valley of Shepherds', desc: 'Visit saffron fields of Pampore and Apple valley.' },
      { day: 5, title: 'Betaab Valley, Chandanwari & Aru Valley', desc: 'Full day exploration along Lidder river.' },
      { day: 6, title: 'Pahalgam to Srinagar Airport Departure', desc: 'Morning drive to airport for return flight.' }
    ]
  },
  {
    id: 28,
    title: 'Kashmir Great Lakes Alpine High Altitude Trek',
    shortTitle: 'Kashmir Great Lakes Trek',
    slug: 'kashmir-great-lakes-trek',
    duration: '7N/8D',
    price: 24500,
    originalPrice: 29000,
    location: 'Sonamarg to Naranag, Kashmir',
    destination: 'Kashmir',
    category: 'Adventure',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    rating: 5.0,
    reviews: 145,
    trending: true,
    tags: ['Trekking', 'Alpine Lakes', 'High Altitude'],
    nextBatch: '28 Aug',
    startingPoint: 'Srinagar',
    endingPoint: 'Srinagar',
    altitude: '13,800 ft (Gadsar Pass)',
    grade: 'Moderate to Challenging',
    ageGroup: '18 - 40 Years',
    gallery: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Widely acclaimed as the most beautiful trek in India. Traverse seven breathtaking turquoise alpine lakes (Vishansar, Kishansar, Gadsar, Satsar, Gangabal, Nundkol) flanked by snow-capped peaks and endless wildflower meadows.',
    highlights: [
      'Camp beside turquoise glacial lakes of Vishansar, Kishansar & Gangabal',
      'Summit Gadsar Pass (13,800 ft) for twin-lake bird-eye panorama',
      'Views of Mt. Harmukh towering over Nundkol lake',
      'Complete high-altitude camping experience with warm Kashmiri meals'
    ],
    inclusions: ['7 Nights Trek Tents', 'All Meals on Trek', 'Trek Leader, Porters, Mules & Army Permits'],
    exclusions: ['Personal gear', 'GST (5%)'],
    availableBatches: [{ id: 'b28-1', dates: '28 Aug - 04 Sep, 2026', seatsLeft: 4, status: 'Filling Fast' }],
    itinerary: [
      { day: 1, title: 'Srinagar to Sonamarg Base Camp (7,800 ft)', desc: 'Drive to Shitkadi base camp along Sindh river.' },
      { day: 2, title: 'Sonamarg to Nichnai via Shekdur', desc: 'Trek through silver birch forest to Nichnai valley.' },
      { day: 3, title: 'Nichnai to Vishansar & Kishansar Lakes', desc: 'Cross Nichnai pass (13,100 ft) to twin turquoise lakes.' },
      { day: 4, title: 'Vishansar to Gadsar via Gadsar Pass (13,800 ft)', desc: 'Highest point of trek overlooking floating ice lake.' },
      { day: 5, title: 'Gadsar to Satsar (Seven Lakes)', desc: 'Walk along military border trail to collection of 7 lakes.' },
      { day: 6, title: 'Satsar to Gangabal & Nundkol Lakes', desc: 'Cross Zaj Pass with spectacular Mt. Harmukh view.' },
      { day: 7, title: 'Rest Day at Gangabal Lake', desc: 'Trout fishing and photo walk around lake.' },
      { day: 8, title: 'Gangabal to Naranag & Srinagar Return', desc: 'Descent to Naranag temple ruins and drive to Srinagar.' }
    ]
  },
  {
    id: 29,
    title: 'Sonamarg Glacier & Doodhpathri Valley of Milk',
    shortTitle: 'Sonamarg & Doodhpathri',
    slug: 'sonamarg-doodhpathri-kashmir',
    duration: '4N/5D',
    price: 17500,
    originalPrice: 21000,
    location: 'Sonamarg, Kashmir',
    destination: 'Kashmir',
    category: 'Nature',
    image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=2070&auto=format&fit=crop',
    rating: 4.8,
    reviews: 92,
    tags: ['Glaciers', 'Meadows', 'Nature'],
    nextBatch: '05 Sep',
    startingPoint: 'Srinagar Airport',
    endingPoint: 'Srinagar Airport',
    altitude: '8,950 ft',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=2070&auto=format&fit=crop'],
    overview: 'Explore the golden meadow of Sonamarg with pony trek to Thajiwas Glacier, followed by Doodhpathri (Valley of Milk), a pristine carpet of rolling green meadows with gushing stream waters.',
    highlights: [
      'Walk on perpetual snow and ice at Thajiwas Glacier in Sonamarg',
      'Pony ride and picnic on emerald meadows of Doodhpathri',
      'Visit Zero Point and Zojila Pass viewpoint (gateway to Ladakh)',
      'Stay in boutique wooden riverside chalet'
    ],
    inclusions: ['4 Nights Boutique Resorts', 'Breakfast & Dinner', 'Private Cab', 'Shikara Ride'],
    exclusions: ['Pony charges', 'Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b29-1', dates: '05 Sep - 09 Sep, 2026', seatsLeft: 8, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Srinagar Arrival & Nigeen Lake Stay', desc: 'Check in to serene heritage houseboat.' },
      { day: 2, title: 'Srinagar to Sonamarg Meadow of Gold', desc: 'Drive along Sindh river with glacier views.' },
      { day: 3, title: 'Thajiwas Glacier Trek & Zojila Pass View', desc: 'Snow trekking and mountain sledging.' },
      { day: 4, title: 'Doodhpathri Valley of Milk Day Trip', desc: 'Picnic by Shaliganga river and meadows.' },
      { day: 5, title: 'Srinagar Airport Departure', desc: 'Transfer to SXR airport.' }
    ]
  },
  {
    id: 30,
    title: 'Gurez Valley Offbeat Himalayan Border Circuit',
    shortTitle: 'Gurez Valley Expedition',
    slug: 'gurez-valley-kashmir',
    duration: '5N/6D',
    price: 22500,
    originalPrice: 27000,
    location: 'Gurez Valley, Kashmir',
    destination: 'Kashmir',
    category: 'Adventure',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 74,
    tags: ['Offbeat', 'Border', 'Dardic Culture'],
    nextBatch: '10 Sep',
    startingPoint: 'Srinagar Airport',
    endingPoint: 'Srinagar Airport',
    altitude: '8,000 ft (Dawar)',
    grade: 'Moderate',
    ageGroup: '18 - 45 Years',
    gallery: ['https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Discover Kashmir\'s best-kept secret. Hidden behind the 11,672 ft Razdan Pass lies Gurez Valley, carved by the Kishanganga river. Gaze at the pyramid Habba Khatoon peak and experience Dardic tribal hospitality.',
    highlights: [
      'Cross high-altitude Razdan Pass (11,672 ft) with view of Harmukh peak',
      'Watch sunset over the iconic Habba Khatoon pyramid mountain',
      'Explore pristine wooden border villages of Dawar and Tulail',
      'Camp on Kishanganga riverbank with bonfire'
    ],
    inclusions: ['5 Nights Homestay & Riverside Tents', 'All Meals', '4x4 Vehicle', 'Border Permits'],
    exclusions: ['Flights', 'GST (5%)'],
    availableBatches: [{ id: 'b30-1', dates: '10 Sep - 15 Sep, 2026', seatsLeft: 6, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Srinagar to Dawar (Gurez) via Razdan Pass', desc: 'Scenic mountain climb into remote border valley.' },
      { day: 2, title: 'Habba Khatoon Spring & Peak Walk', desc: 'Visit sacred spring and pyramid rock face.' },
      { day: 3, title: 'Tulail Valley & Sheikhpura Border Villages', desc: 'Explore traditional log houses near LoC.' },
      { day: 4, title: 'Kishanganga River Camping & Stargazing', desc: 'Riverside barbecue and night sky photography.' },
      { day: 5, title: 'Gurez to Srinagar via Wular Lake', desc: 'Return drive visiting Asia\'s largest freshwater lake.' },
      { day: 6, title: 'Srinagar Departure', desc: 'Airport transfer with offbeat memories.' }
    ]
  },
  {
    id: 31,
    title: 'Winter Gulmarg Skiing & Snowboarding Retreat',
    shortTitle: 'Winter Gulmarg Skiing',
    slug: 'winter-gulmarg-ski-retreat',
    duration: '4N/5D',
    price: 26000,
    originalPrice: 32000,
    location: 'Gulmarg, Kashmir',
    destination: 'Kashmir',
    category: 'Adventure',
    image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=2070&auto=format&fit=crop',
    rating: 5.0,
    reviews: 110,
    tags: ['Winter', 'Skiing', 'Snow'],
    nextBatch: '15 Jan',
    startingPoint: 'Srinagar Airport',
    endingPoint: 'Srinagar Airport',
    altitude: '13,780 ft',
    grade: 'Moderate',
    ageGroup: '18 - 45 Years',
    gallery: ['https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=2070&auto=format&fit=crop'],
    overview: 'Gulmarg turns into the Powder Capital of Asia in winter. Enjoy world-class skiing, snowboarding, and snowmobiling on deep powder snow with certified ski instructors and luxury heated resort stays.',
    highlights: [
      'Professional 2-day ski & snowboard coaching with equipment included',
      'Phase 1 & Phase 2 Gondola ride into deep winter alpine powder',
      'Stay in luxury heated alpine resort with mountain views',
      'Cozy fireplace dinners with hot Kashmiri Wazwan'
    ],
    inclusions: ['4 Nights Luxury Heated Resort', 'Breakfast & Dinner', 'Ski Equipment & Certified Instructor', '4x4 Snow Chains Transfer'],
    exclusions: ['Gondola passes', 'Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b31-1', dates: '15 Jan - 19 Jan, 2027', seatsLeft: 4, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Srinagar to Gulmarg in Snow', desc: '4x4 drive through snow-covered pine forests.' },
      { day: 2, title: 'Ski Coaching: Basics & Slope Balancing', desc: 'Full day ski practice with instructor.' },
      { day: 3, title: 'Gondola Ride & Advanced Powder Skiing', desc: 'Skiing down from Phase 1 Kongdoori slopes.' },
      { day: 4, title: 'Snowmobiling & Igloo Cafe Experience', desc: 'Snow adventure rides and hot chocolate in igloo.' },
      { day: 5, title: 'Gulmarg to Srinagar Airport', desc: 'Airport transfer with winter thrill memories.' }
    ]
  },

  // -------------------------------------------------------------
  // GOA & COASTAL EXPEDITIONS (4 Distinct Active Packages)
  // -------------------------------------------------------------
  {
    id: 32,
    title: 'South Goa Heritage, Hidden Waterfalls & Secret Beaches',
    shortTitle: 'South Goa Secret Beaches',
    slug: 'south-goa-hidden-beaches',
    duration: '3N/4D',
    price: 12500,
    originalPrice: 15000,
    location: 'South Goa, India',
    destination: 'Goa',
    category: 'Weekend Trips',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=60',
    rating: 4.8,
    reviews: 195,
    trending: true,
    tags: ['Beach', 'Waterfalls', 'Heritage'],
    nextBatch: '20 Aug',
    startingPoint: 'Goa Airport / Madgaon Station',
    endingPoint: 'Goa Airport / Madgaon Station',
    altitude: 'Sea Level',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=60'],
    overview: 'Discover the peaceful, bohemian side of Goa. Explore secret white-sand coves at Butterfly and Cola beach, swim in freshwater lagoons, visit Portuguese heritage mansions, and kayak through mangrove backwaters.',
    highlights: [
      'Boat trip to secluded Butterfly Beach and Cola lagoon beach',
      'Kayak through peaceful Sal backwaters and mangrove channels',
      'Explore Portuguese mansions of Fontainhas Latin Quarter',
      'Sunset drinks and acoustic music at Palolem beachfront shack'
    ],
    inclusions: ['3 Nights Boutique Beach Resort', 'Breakfast Included', 'Private Scooters / Cab', 'Boat Safari'],
    exclusions: ['Lunch & Dinner', 'GST (5%)'],
    availableBatches: [{ id: 'b32-1', dates: '20 Aug - 23 Aug, 2026', seatsLeft: 8, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Arrival in South Goa & Palolem Sunset', desc: 'Check in to beachfront cottage, relax at Palolem.' },
      { day: 2, title: 'Secret Beach Boat Ride: Butterfly & Cola', desc: 'Boat safari to hidden coves and freshwater lagoon.' },
      { day: 3, title: 'Fontainhas Latin Quarter & Spice Plantation', desc: 'Walk through colorful Portuguese heritage lanes.' },
      { day: 4, title: 'Cabo de Rama Fort & Departure', desc: 'Cliffside ocean view and airport drop.' }
    ]
  },
  {
    id: 33,
    title: 'North Goa Beachside Backpacking & Sunset Cruise',
    shortTitle: 'North Goa Backpacking',
    slug: 'north-goa-backpacking',
    duration: '4N/5D',
    price: 13500,
    originalPrice: 16500,
    location: 'North Goa, India',
    destination: 'Goa',
    category: 'Backpacking',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&auto=format&fit=crop&q=60',
    rating: 4.7,
    reviews: 210,
    tags: ['Beach', 'Nightlife', 'Cruise'],
    nextBatch: '25 Aug',
    startingPoint: 'MOPA Airport / Thivim',
    endingPoint: 'MOPA Airport / Thivim',
    altitude: 'Sea Level',
    grade: 'Easy',
    ageGroup: '18 - 35 Years',
    gallery: ['https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&auto=format&fit=crop&q=60'],
    overview: 'Experience the electric energy of North Goa. Sunset at Chapora Fort (Dil Chahta Hai point), beach hopping across Vagator, Anjuna, and Morjim, luxury catamaran sunset cruise, and lively night markets.',
    highlights: [
      'Sunset Catamaran Cruise on Mandovi River with DJ and drinks',
      'Beach hopping across Vagator, Anjuna, and Ashvem white sands',
      'Sunset cliff views at Chapora Fort and Aguada Fort',
      'Vibrant beach clubs like Thalassa and Curlies'
    ],
    inclusions: ['4 Nights Boutique Hostel/Resort with Pool', 'Daily Breakfast', 'Sunset Cruise Ticket'],
    exclusions: ['Personal club entries', 'Lunch & Dinner', 'GST (5%)'],
    availableBatches: [{ id: 'b33-1', dates: '25 Aug - 29 Aug, 2026', seatsLeft: 10, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Arrival in Vagator & Beach Club Sunset', desc: 'Check in and evening drinks overlooking ocean.' },
      { day: 2, title: 'Chapora Fort & Anjuna Flea Market', desc: 'Explore historical fort and bohemian beach market.' },
      { day: 3, title: 'Mandovi Sunset Catamaran Cruise', desc: '2-hour luxury sailing with DJ and dolphin spotting.' },
      { day: 4, title: 'Morjim & Ashvem Olive Ridley Beach', desc: 'Tranquil white sand beach day and watersports.' },
      { day: 5, title: 'Aguada Lighthouse & Airport Departure', desc: 'Historic lighthouse visit and airport drop.' }
    ]
  },
  {
    id: 34,
    title: 'Gokarna & South Goa Dual Coastline Circuit',
    shortTitle: 'Gokarna & Goa Coast',
    slug: 'gokarna-south-goa-circuit',
    duration: '4N/5D',
    price: 14500,
    originalPrice: 18000,
    location: 'Gokarna & Goa, India',
    destination: 'Goa',
    category: 'Backpacking',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=60',
    rating: 4.9,
    reviews: 178,
    tags: ['Beach Trek', 'Backpacking', 'Coastal'],
    nextBatch: '01 Sep',
    startingPoint: 'Goa Airport / Gokarna Road',
    endingPoint: 'Goa Airport',
    altitude: 'Sea Level',
    grade: 'Moderate',
    ageGroup: '18 - 35 Years',
    gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=60'],
    overview: 'The ultimate coastal beach-trek. Hike across Gokarna\'s 5 iconic beaches (Kudle, Om, Half Moon, Paradise, Nirvana), explore Yana giant karst rock monoliths, and cross over into South Goa for beachside cottages.',
    highlights: [
      'Gokarna 5-Beach Cliff Trek crossing Om Beach and Paradise Beach',
      'Trek through dense jungle to ancient Yana Karst Rock Formations',
      'Mirjan Fort 16th-century laterite stone architecture',
      'Beach camping under the stars on Nirvana Beach'
    ],
    inclusions: ['4 Nights Beach Stays & Camps', 'Breakfast & Dinner', 'Private Cab for Transfers', 'Trek Guide'],
    exclusions: ['Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b34-1', dates: '01 Sep - 05 Sep, 2026', seatsLeft: 6, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Goa to Gokarna & Kudle Beach Sunset', desc: 'Scenic coastal drive, check in at Kudle.' },
      { day: 2, title: 'Gokarna 5-Beach Cliff Trek', desc: 'Hike from Om Beach to Half Moon and Paradise.' },
      { day: 3, title: 'Yana Rocks & Mirjan Fort Exploration', desc: 'Visit massive natural monolithic rock towers.' },
      { day: 4, title: 'Gokarna to Palolem Beach (South Goa)', desc: 'Transfer back to Goa for seafood dinner.' },
      { day: 5, title: 'Cabo de Rama & Goa Airport Drop', desc: 'Cliff viewpoint and return flight.' }
    ]
  },
  {
    id: 35,
    title: 'Dudhsagar Waterfalls & Spice Plantation 4x4 Jeep Safari',
    shortTitle: 'Dudhsagar Jeep Safari',
    slug: 'dudhsagar-waterfalls-safari',
    duration: '2N/3D',
    price: 8500,
    originalPrice: 11000,
    location: 'Mollem, Goa',
    destination: 'Goa',
    category: 'Weekend Trips',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&auto=format&fit=crop&q=60',
    rating: 4.8,
    reviews: 145,
    tags: ['Waterfalls', 'Safari', 'Nature'],
    nextBatch: '05 Sep',
    startingPoint: 'Goa',
    endingPoint: 'Goa',
    altitude: '1,017 ft',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&auto=format&fit=crop&q=60'],
    overview: 'Witness the sea of milk. Embark on a thrilling 4x4 Jeep jungle safari through Bhagwan Mahavir Wildlife Sanctuary to the foot of the 4-tiered 1,017 ft Dudhsagar Falls. Swim in the freshwater pool and tour an organic spice farm.',
    highlights: [
      '4x4 Offroad Jeep Safari through riverbeds of Bhagwan Mahavir Wildlife Sanctuary',
      'Swim in the natural pool at the base of roaring Dudhsagar Falls',
      'Guided organic spice plantation walk with traditional Goan lunch',
      'Feed friendly wild monkeys and spot exotic forest birds'
    ],
    inclusions: ['2 Nights Eco Resort Stay', 'Breakfast & Traditional Spice Farm Lunch', 'Jeep Safari & Life Jackets'],
    exclusions: ['Dinner', 'GST (5%)'],
    availableBatches: [{ id: 'b35-1', dates: '05 Sep - 07 Sep, 2026', seatsLeft: 10, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Arrival in Goa Eco Resort & Nature Walk', desc: 'Check in near Mollem national park.' },
      { day: 2, title: 'Dudhsagar 4x4 Jeep Safari & Spice Farm', desc: 'Full day waterfall plunge and spice tour.' },
      { day: 3, title: 'Tambdi Surla 12th-Century Temple & Departure', desc: 'Visit ancient basalt stone temple and airport drop.' }
    ]
  },

  // -------------------------------------------------------------
  // KERALA EXPEDITIONS (4 Distinct Active Packages)
  // -------------------------------------------------------------
  {
    id: 36,
    title: 'Kerala Backwaters, Munnar & Alleppey Luxury Houseboat',
    shortTitle: 'Kerala Backwaters & Munnar',
    slug: 'kerala-backwaters-munnar-alleppey',
    duration: '4N/5D',
    price: 15500,
    originalPrice: 18900,
    location: 'Munnar & Alleppey, Kerala',
    destination: 'Kerala',
    category: 'Nature',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=2069&auto=format&fit=crop',
    rating: 4.8,
    reviews: 210,
    trending: true,
    tags: ['Relaxation', 'Nature', 'Houseboat'],
    nextBatch: '25 Aug',
    startingPoint: 'Cochin Airport / Ernakulam',
    endingPoint: 'Cochin Airport',
    altitude: '5,200 ft (Munnar)',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=2069&auto=format&fit=crop'],
    overview: 'Escape to God\'s Own Country! Experience lush green tea plantations of Munnar, wildlife in Thekkady, and an overnight luxury houseboat cruise through the serene palm-fringed backwaters of Alleppey.',
    highlights: [
      'Overnight stay in private luxury Alleppey Houseboat with freshly cooked Keralite meals',
      'Tea tasting & plantation stroll in Munnar hills',
      'Kathakali cultural dance & Kalaripayattu martial arts show',
      'Spice plantation tour & elephant sanctuary visit in Thekkady'
    ],
    inclusions: ['4 Nights accommodation (3N Resorts + 1N Deluxe Houseboat)', 'Breakfast at resorts + All Meals on Houseboat', 'Private AC Cab'],
    exclusions: ['Flights to Kochi', 'Entry tickets', 'GST (5%)'],
    availableBatches: [{ id: 'b36-1', dates: '25 Aug - 29 Aug, 2026', seatsLeft: 7, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Cochin Arrival to Munnar Hill Station', desc: 'Drive past Cheeyappara & Valara waterfalls.' },
      { day: 2, title: 'Munnar Sightseeing: Mattupetty Dam & Eravikulam', desc: 'Visit Eravikulam National Park & Tea Museum.' },
      { day: 3, title: 'Munnar to Thekkady Spice Trails', desc: 'Spice plantation tour & Kalaripayattu show.' },
      { day: 4, title: 'Thekkady to Alleppey Houseboat Cruise', desc: 'Board traditional Kettuvallam houseboat at noon.' },
      { day: 5, title: 'Alleppey to Cochin Drop', desc: 'Visit Fort Kochi Chinese Fishing Nets before airport drop.' }
    ]
  },
  {
    id: 37,
    title: 'Wayanad Rainforest, Bamboo Rafting & Treehouse Stay',
    shortTitle: 'Wayanad Rainforest & Treehouse',
    slug: 'wayanad-rainforest-treehouse',
    duration: '3N/4D',
    price: 13500,
    originalPrice: 16500,
    location: 'Wayanad, Kerala',
    destination: 'Kerala',
    category: 'Nature',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 142,
    tags: ['Rainforest', 'Treehouse', 'Rafting'],
    nextBatch: '30 Aug',
    startingPoint: 'Calicut (Kozhikode)',
    endingPoint: 'Calicut (Kozhikode)',
    altitude: '3,000 ft',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Stay in luxury elevated treehouses high in the canopy of the Western Ghats rainforest. Bamboo rafting on Kuruva Island, explore 6,000-year-old Edakkal rock engravings, and hike to heart-shaped Chembra Peak lake.',
    highlights: [
      'Stay in luxury wooden Treehouses surrounded by mist and birdsong',
      'Bamboo rafting on crystal clear Kabini river around Kuruva Island',
      'Trek to heart-shaped natural lake atop Chembra Peak (6,890 ft)',
      'Explore prehistoric petroglyphs in Edakkal Caves'
    ],
    inclusions: ['3 Nights Luxury Treehouse/Resort', 'Breakfast & Dinner', 'Private Cab Sightseeing'],
    exclusions: ['Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b37-1', dates: '30 Aug - 02 Sep, 2026', seatsLeft: 6, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Calicut to Wayanad Rainforest Treehouse', desc: 'Scenic mountain climb into mist-laden tea hills.' },
      { day: 2, title: 'Chembra Peak & Heart Lake Trek', desc: 'Hike through tea plantations to perennial heart lake.' },
      { day: 3, title: 'Kuruva Island Bamboo Rafting & Edakkal Caves', desc: 'Rafting on forest streams and stone age caves.' },
      { day: 4, title: 'Banasura Sagar Dam & Calicut Departure', desc: 'Visit Asia\'s 2nd largest earth dam & return.' }
    ]
  },
  {
    id: 38,
    title: 'Varkala Cliffside Surf, Yoga & Sunset Retreat',
    shortTitle: 'Varkala Cliffside Surf & Yoga',
    slug: 'varkala-cliff-surf-retreat',
    duration: '3N/4D',
    price: 11500,
    originalPrice: 14000,
    location: 'Varkala, Kerala',
    destination: 'Kerala',
    category: 'Weekend Trips',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=60',
    rating: 4.8,
    reviews: 125,
    tags: ['Surf', 'Yoga', 'Cliffs'],
    nextBatch: '05 Sep',
    startingPoint: 'Trivandrum Airport (TRV)',
    endingPoint: 'Trivandrum Airport',
    altitude: 'Sea Level',
    grade: 'Easy',
    ageGroup: '18 - 38 Years',
    gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=60'],
    overview: 'Perched on dramatic red laterite cliffs jutting out into the Arabian Sea. Learn to catch waves with certified surf instructors, practice sunrise cliff yoga, and relax at bohemian open-air cafes.',
    highlights: [
      'Beginner surfing lesson with certified ISA instructors at Black Beach',
      'Daily morning sunrise yoga and meditation session overlooking ocean',
      'Sunset dinner at cliffside cafes with live music and fresh seafood',
      'Visit 2,000-year-old Janardhanaswamy Temple and natural mineral springs'
    ],
    inclusions: ['3 Nights Cliffside Boutique Stay', 'Daily Breakfast', '1 Surf Lesson with Board', '1 Yoga Session'],
    exclusions: ['Lunch & Dinner', 'GST (5%)'],
    availableBatches: [{ id: 'b38-1', dates: '05 Sep - 08 Sep, 2026', seatsLeft: 8, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Arrival in Varkala & North Cliff Sunset', desc: 'Check in to cliff resort, watch golden hour sunset.' },
      { day: 2, title: 'Morning Surf Lesson & Black Beach Walk', desc: 'Catch waves with instructor, cafe hopping.' },
      { day: 3, title: 'Kappil Beach & Backwater Lake Kayaking', desc: 'Where backwaters meet the sea, kayaking tour.' },
      { day: 4, title: 'Jatayu Earth Center & Trivandrum Drop', desc: 'Visit world\'s largest bird sculpture & airport drop.' }
    ]
  },
  {
    id: 39,
    title: 'Thekkady Periyar Tiger Reserve & Spice Trails',
    shortTitle: 'Thekkady Tiger Reserve',
    slug: 'thekkady-tiger-reserve-kerala',
    duration: '3N/4D',
    price: 12000,
    originalPrice: 15000,
    location: 'Thekkady, Kerala',
    destination: 'Kerala',
    category: 'Nature',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=2069&auto=format&fit=crop',
    rating: 4.7,
    reviews: 98,
    tags: ['Wildlife', 'Safari', 'Spices'],
    nextBatch: '10 Sep',
    startingPoint: 'Cochin / Madurai',
    endingPoint: 'Cochin / Madurai',
    altitude: '3,000 ft',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=2069&auto=format&fit=crop'],
    overview: 'Explore the verdant Cardamom Hills. Take a bamboo rafting cruise on Periyar Lake inside the tiger sanctuary, watch herds of wild elephants swimming, and experience authentic Ayurvedic rejuvenation massages.',
    highlights: [
      'Bamboo rafting and jungle trekking in Periyar Tiger Reserve',
      'Spot wild elephants, gaur, sambar deer, and otters along lake banks',
      'Walk through fragrant cardamom, clove, and cinnamon plantations',
      'Traditional 60-min Kerala Ayurvedic Abhyanga massage'
    ],
    inclusions: ['3 Nights Jungle Resort', 'Breakfast & Dinner', 'Periyar Lake Boat Cruise', 'Ayurvedic Massage'],
    exclusions: ['Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b39-1', dates: '10 Sep - 13 Sep, 2026', seatsLeft: 9, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Cochin to Thekkady Cardamom Hills', desc: 'Scenic mountain climb to spice town.' },
      { day: 2, title: 'Periyar Lake Wildlife Cruise & Elephant Sanctuary', desc: 'Boat safari and elephant interaction.' },
      { day: 3, title: 'Bamboo Rafting & Spice Plantation Walk', desc: 'Guided jungle walk and spice shopping.' },
      { day: 4, title: 'Ayurvedic Massage & Departure', desc: 'Rejuvenation therapy and return transfer to Cochin.' }
    ]
  },

  // -------------------------------------------------------------
  // LADAKH EXPEDITIONS (4 Distinct Active Packages)
  // -------------------------------------------------------------
  {
    id: 40,
    title: 'Ladakh Leh, Pangong Tso & Nubra Valley Circuit',
    shortTitle: 'Ladakh Leh & Pangong Circuit',
    slug: 'ladakh-leh-pangong-nubra',
    duration: '6N/7D',
    price: 24500,
    originalPrice: 29500,
    location: 'Leh Ladakh, India',
    destination: 'Ladakh',
    category: 'Adventure',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=60',
    rating: 4.9,
    reviews: 290,
    trending: true,
    tags: ['High Altitude', 'Mountains', 'Lakes'],
    nextBatch: '20 Aug',
    startingPoint: 'Leh Kushok Bakula Airport (IXL)',
    endingPoint: 'Leh Kushok Bakula Airport',
    altitude: '17,582 ft (Khardung La)',
    grade: 'Challenging',
    ageGroup: '18 - 40 Years',
    gallery: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=60'],
    overview: 'The ultimate high-altitude dream trip. Cross Khardung La (17,582 ft), ride double-humped Bactrian camels on Hunder white sand dunes in Nubra Valley, and watch Pangong Lake shift colors from blue to turquoise under snow peaks.',
    highlights: [
      'Drive over Khardung La Pass (17,582 ft) - One of the highest motorable roads',
      'Double-humped camel safari on cold desert dunes of Hunder in Nubra',
      'Camp beside the 134 km long trans-boundary Pangong Tso Lake (14,270 ft)',
      'Visit Thiksey Monastery (Mini Potala) and magnetic hill phenomenon'
    ],
    inclusions: ['6 Nights (Hotels & Luxury Camps on sharing basis)', 'Breakfast & Dinner', 'Private Tempo Traveler/Innova', 'Oxygen & Permits'],
    exclusions: ['Flights to Leh', 'Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b40-1', dates: '20 Aug - 26 Aug, 2026', seatsLeft: 5, status: 'Filling Fast' }],
    itinerary: [
      { day: 1, title: 'Arrival in Leh & Complete Rest for Acclimatization', desc: 'Rest at 11,500 ft. Evening walk to Shanti Stupa.' },
      { day: 2, title: 'Sham Valley: Magnetic Hill, Sangam & Hall of Fame', desc: 'See Indus & Zanskar river confluence.' },
      { day: 3, title: 'Leh to Nubra Valley via Khardung La (17,582 ft)', desc: 'Cross mountain pass to Hunder sand dunes.' },
      { day: 4, title: 'Turtuk India-Pakistan Border Village Day Trip', desc: 'Visit unique Balti tribal village with apricot trees.' },
      { day: 5, title: 'Nubra Valley to Pangong Tso via Shyok River', desc: 'Scenic offroad drive to iconic blue lake.' },
      { day: 6, title: 'Pangong to Leh via Chang La (17,590 ft)', desc: 'Sunrise at Pangong, cross Chang La back to Leh.' },
      { day: 7, title: 'Leh Airport Departure', desc: 'Flight back with unforgettable Himalayan memories.' }
    ]
  },
  {
    id: 41,
    title: 'Zanskar Valley Offbeat Rugged Expedition',
    shortTitle: 'Zanskar Valley Offbeat',
    slug: 'zanskar-valley-expedition',
    duration: '7N/8D',
    price: 29500,
    originalPrice: 35000,
    location: 'Zanskar, Ladakh',
    destination: 'Ladakh',
    category: 'Adventure',
    image: 'https://images.unsplash.com/photo-1626714486950-c63bf1084b64?q=80&w=1200&auto=format&fit=crop',
    rating: 5.0,
    reviews: 86,
    tags: ['Extreme', 'Glaciers', 'Offbeat'],
    nextBatch: '01 Sep',
    startingPoint: 'Leh / Kargil',
    endingPoint: 'Leh / Kargil',
    altitude: '16,703 ft (Shinku La)',
    grade: 'Challenging',
    ageGroup: '18 - 45 Years',
    gallery: ['https://images.unsplash.com/photo-1626714486950-c63bf1084b64?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Venture into the most isolated valley in the Indian Himalayas. Marvel at the giant monolithic Gumbo Ranjan rock, visit the cliff-hanging Phugtal Monastery built inside a natural cave, and witness Drang-Drung glacier.',
    highlights: [
      'Hike to Phugtal Monastery clinging precariously inside a massive cliff cavern',
      'Gaze upon the giant natural pyramid monolith of Gumbo Ranjan (17,500 ft)',
      'Witness the winding river of ice at Drang-Drung Glacier over Pensi La',
      'Camp in remote Padum and Darcha villages'
    ],
    inclusions: ['7 Nights Homestays & Camps', 'All Meals', '4x4 Heavy-Duty Vehicles', 'Trek Guide & Oxygen'],
    exclusions: ['Flights', 'GST (5%)'],
    availableBatches: [{ id: 'b41-1', dates: '01 Sep - 08 Sep, 2026', seatsLeft: 4, status: 'Filling Fast' }],
    itinerary: [
      { day: 1, title: 'Leh to Kargil via Lamayuru Moonland', desc: 'Visit ancient Lamayuru monastery.' },
      { day: 2, title: 'Kargil to Padum (Zanskar) via Pensi La', desc: 'Pass Drang-Drung glacier into heart of Zanskar.' },
      { day: 3, title: 'Phugtal Cave Monastery Hike (12 km)', desc: 'Trek along Tsarap river to monastery in cave.' },
      { day: 4, title: 'Padum Local: Karsha & Stongdey Monasteries', desc: 'Explore oldest Buddhist temples in Zanskar.' },
      { day: 5, title: 'Padum to Gumbo Ranjan Holy Monolith', desc: 'Camp under the towering sacred rock face.' },
      { day: 6, title: 'Gumbo Ranjan to Darcha & Jispa', desc: 'Cross Shinku La pass (16,703 ft) into Lahaul.' },
      { day: 7, title: 'Jispa to Leh via Baralacha La', desc: 'Scenic drive along high-altitude mountain passes.' },
      { day: 8, title: 'Leh Airport Drop', desc: 'Departure flight home.' }
    ]
  },
  {
    id: 42,
    title: 'Markha Valley High Altitude Trekking Odyssey',
    shortTitle: 'Markha Valley Trek',
    slug: 'markha-valley-trek',
    duration: '6N/7D',
    price: 22000,
    originalPrice: 26500,
    location: 'Hemis National Park, Ladakh',
    destination: 'Ladakh',
    category: 'Adventure',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 115,
    tags: ['Trekking', 'High Altitude', 'Wildlife'],
    nextBatch: '05 Sep',
    startingPoint: 'Leh',
    endingPoint: 'Leh',
    altitude: '17,060 ft (Kongmaru La)',
    grade: 'Moderate to Challenging',
    ageGroup: '18 - 40 Years',
    gallery: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Trek inside Hemis National Park, the premier snow leopard habitat in the world. Cross waist-deep glacial rivers, climb over Kongmaru La pass (17,060 ft), and witness the towering Kang Yatse peak (20,997 ft).',
    highlights: [
      'Cross Kongmaru La Pass (17,060 ft) with view of Karakoram range',
      'Trek beneath the majestic peak of Kang Yatse (6,400 m)',
      'Stay in authentic Ladakhi homestays in remote Markha and Hankar',
      'Spot blue sheep, golden eagles, and Himalayan marmots'
    ],
    inclusions: ['6 Nights Homestays & Trek Tents', 'All Meals on Trek', 'Trek Guide, Mules & Permits'],
    exclusions: ['Flights', 'GST (5%)'],
    availableBatches: [{ id: 'b42-1', dates: '05 Sep - 11 Sep, 2026', seatsLeft: 6, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Leh to Chilling & Trek to Skiu', desc: 'Cross Zanskar river, enter Markha gorge.' },
      { day: 2, title: 'Skiu to Sara (10 km)', desc: 'Trail through arid canyons and wild rose bushes.' },
      { day: 3, title: 'Sara to Markha Village (12,400 ft)', desc: 'Reach largest village in valley with ruined fort.' },
      { day: 4, title: 'Markha to Thachungtse Base', desc: 'Cross Markha river, climb towards high pasture.' },
      { day: 5, title: 'Thachungtse to Nimaling Plateau (15,400 ft)', desc: 'High meadow under Kang Yatse peak.' },
      { day: 6, title: 'Nimaling to Shang Sumdo via Kongmaru La (17,060 ft)', desc: 'Pass crossing and descent.' },
      { day: 7, title: 'Shang Sumdo to Leh Departure', desc: 'Transfer back to Leh hotel.' }
    ]
  },
  {
    id: 43,
    title: 'Sham Valley Apricot Blossom & Heritage Trail',
    shortTitle: 'Sham Valley Apricot Trail',
    slug: 'sham-valley-apricot-trail',
    duration: '4N/5D',
    price: 16500,
    originalPrice: 20000,
    location: 'Lower Ladakh, India',
    destination: 'Ladakh',
    category: 'Culture',
    image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=60',
    rating: 4.8,
    reviews: 84,
    tags: ['Culture', 'Apricot', 'Heritage'],
    nextBatch: '10 Sep',
    startingPoint: 'Leh',
    endingPoint: 'Leh',
    altitude: '10,500 ft',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=60'],
    overview: 'A gentle, culturally enriching exploration of lower Ladakh. Known as the Baby Trek, walk along fruit orchards, stay in traditional solar-heated homes in Hemis Shukpachan, and taste freshly picked apricots and walnuts.',
    highlights: [
      'Gentle village walks through blooming apricot and apple orchards',
      'Stay in traditional mud-brick Ladakhi homestays with home-cooked meals',
      'Visit Alchi Monastery (11th century Kashmiri-Buddhist murals)',
      'Likir Monastery and giant outdoor Maitreya Buddha'
    ],
    inclusions: ['4 Nights Heritage Homestays & Hotel', 'Breakfast & Dinner', 'Private Vehicle', 'Local Guide'],
    exclusions: ['Flights', 'GST (5%)'],
    availableBatches: [{ id: 'b43-1', dates: '10 Sep - 14 Sep, 2026', seatsLeft: 8, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Arrival in Leh & Acclimatization', desc: 'Rest and evening visit to Leh Market.' },
      { day: 2, title: 'Leh to Likir & Yangthang Village', desc: 'Visit Likir monastery and walk through cedar trail.' },
      { day: 3, title: 'Yangthang to Hemis Shukpachan', desc: 'Walk past cedar forest to most picturesque village.' },
      { day: 4, title: 'Hemis Shukpachan to Temisgam & Alchi', desc: 'Visit Alchi temple murals and return to Leh.' },
      { day: 5, title: 'Leh Airport Drop', desc: 'Flight back home with apricot memories.' }
    ]
  },

  // -------------------------------------------------------------
  // BALI & INTERNATIONAL EXPEDITIONS (4 Distinct Active Packages)
  // -------------------------------------------------------------
  {
    id: 44,
    title: 'Bali Island & Nusa Penida Tropical Escape',
    shortTitle: 'Bali & Nusa Penida Escape',
    slug: 'bali-island-nusa-penida-escape',
    duration: '5N/6D',
    price: 45000,
    originalPrice: 52000,
    location: 'Bali, Indonesia',
    destination: 'Bali',
    category: 'International',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1938&auto=format&fit=crop',
    rating: 4.9,
    reviews: 340,
    trending: true,
    tags: ['Tropical', 'International', 'Beach'],
    nextBatch: '05 Sep',
    startingPoint: 'Denpasar Airport (DPS)',
    endingPoint: 'Denpasar Airport',
    altitude: 'Sea Level',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1938&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop'
    ],
    overview: 'Experience the Island of the Gods. Fly over emerald rice terraces in Ubud, take a fastboat to iconic Kelingking T-Rex cliff in Nusa Penida, watch the hypnotic sunset Kecak fire dance at Uluwatu, and relax in luxury pool villas.',
    highlights: [
      'Full-day Nusa Penida Island fastboat tour: Kelingking Beach & Broken Beach',
      'Fly over lush river canyons on the famous Bali Jungle Swing',
      'Sunset Kecak Fire Dance on 70-meter cliff at Uluwatu Temple',
      'Private pool villa stay in Seminyak & Ubud rainforest resort'
    ],
    inclusions: ['5 Nights (3N Seminyak Pool Villa + 2N Ubud Resort)', 'Breakfast Included', 'Nusa Penida Fastboat & Tour', 'Airport Transfers'],
    exclusions: ['International Flights', 'Lunch & Dinner', 'Visa on Arrival ($35)', 'GST (5%)'],
    availableBatches: [{ id: 'b44-1', dates: '05 Sep - 10 Sep, 2026', seatsLeft: 5, status: 'Filling Fast' }],
    itinerary: [
      { day: 1, title: 'Arrival in Denpasar & Transfer to Seminyak', desc: 'Flower garland welcome, check in to private pool villa.' },
      { day: 2, title: 'Ubud Rice Terraces, Jungle Swing & Tirta Empul', desc: 'Holy spring water temple and jungle swing.' },
      { day: 3, title: 'Nusa Penida Fastboat Island Excursion', desc: 'Visit Kelingking T-Rex cliff, Angel Billabong & Crystal Bay.' },
      { day: 4, title: 'Uluwatu Sunset Temple & Jimbaran Seafood Feast', desc: 'Cliffside temple, Kecak dance & candlelight dinner.' },
      { day: 5, title: 'Balinese Spa Massage & Beach Club Day', desc: '2-hour traditional massage, relax at Potato Head.' },
      { day: 6, title: 'Krisna Souvenir Shopping & Airport Drop', desc: 'Shopping and private transfer to DPS airport.' }
    ]
  },
  {
    id: 45,
    title: 'Ubud Spiritual Retreat, Rice Terraces & Waterfall Sanctuary',
    shortTitle: 'Ubud Spiritual Retreat',
    slug: 'ubud-spiritual-retreat',
    duration: '4N/5D',
    price: 38000,
    originalPrice: 44000,
    location: 'Ubud, Bali, Indonesia',
    destination: 'Bali',
    category: 'International',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
    rating: 4.8,
    reviews: 165,
    tags: ['Culture', 'Spa', 'Yoga'],
    nextBatch: '10 Sep',
    startingPoint: 'Denpasar Airport (DPS)',
    endingPoint: 'Denpasar Airport',
    altitude: '650 ft',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Immerse in the cultural and spiritual heart of Bali. Practice yoga in open-air bamboo shalas, walk through sacred Monkey Forest, trek the Campuhan Ridge at sunrise, and swim under hidden rainforest waterfalls at Tibumana.',
    highlights: [
      'Sunrise walk along the scenic Campuhan Ridge trail',
      'Sacred Monkey Forest sanctuary and Ubud Royal Palace',
      'Swim under pristine secluded waterfalls at Tibumana and Tukad Cepung',
      'Traditional sound healing session at Pyramids of Chi'
    ],
    inclusions: ['4 Nights Luxury Rainforest Villa', 'Breakfast Included', 'Private Car with Driver', 'Sound Healing Pass'],
    exclusions: ['International Flights', 'Lunch & Dinner', 'GST (5%)'],
    availableBatches: [{ id: 'b45-1', dates: '10 Sep - 14 Sep, 2026', seatsLeft: 8, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'DPS Airport to Ubud Rainforest Resort', desc: 'Scenic transfer into lush jungle hills.' },
      { day: 2, title: 'Campuhan Ridge Sunrise & Sacred Monkey Forest', desc: 'Early morning ridge hike, meet friendly macaques.' },
      { day: 3, title: 'Tibumana & Tukad Cepung Waterfall Trail', desc: 'Hidden sunbeam waterfall cavern exploration.' },
      { day: 4, title: 'Tegalalang Rice Walk & Pyramids of Chi Healing', desc: 'Sound bath vibration therapy.' },
      { day: 5, title: 'Ubud Art Market & Airport Departure', desc: 'Handicraft shopping and private airport drop.' }
    ]
  },
  {
    id: 46,
    title: 'Gili Islands Coral Reef & Sea Turtle Snorkeling Cruise',
    shortTitle: 'Gili Islands Coral Cruise',
    slug: 'gili-islands-snorkeling-cruise',
    duration: '4N/5D',
    price: 39000,
    originalPrice: 46000,
    location: 'Gili Trawangan, Indonesia',
    destination: 'Bali',
    category: 'International',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 142,
    tags: ['Islands', 'Snorkeling', 'Turtles'],
    nextBatch: '15 Sep',
    startingPoint: 'Bali (Padang Bai)',
    endingPoint: 'Bali (Padang Bai)',
    altitude: 'Sea Level',
    grade: 'Easy',
    ageGroup: '18 - 38 Years',
    gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop'],
    overview: 'Escape to motorized-vehicle-free tropical islands. Bicycle around white sand beaches, snorkel with wild sea turtles at Gili Meno, explore underwater statues (Nest), and watch epic sunsets from beachfront swings.',
    highlights: [
      'Snorkel with giant green sea turtles and swim among Jason deCaires underwater statues',
      'Cycle around car-free Gili Trawangan island on vintage bicycles',
      'Sunset horseback riding along the beach',
      'Beachfront seafood barbecues under lantern-lit palm trees'
    ],
    inclusions: ['4 Nights Beachfront Resort with Pool', 'Breakfast Included', 'Speedboat from Bali', 'Snorkeling Gear & Boat'],
    exclusions: ['Flights', 'Lunch & Dinner', 'GST (5%)'],
    availableBatches: [{ id: 'b46-1', dates: '15 Sep - 19 Sep, 2026', seatsLeft: 6, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Bali to Gili Trawangan via Speedboat', desc: 'Fast boat crossing, bicycle check-in.' },
      { day: 2, title: '3-Island Snorkeling Tour (Gili Meno & Air)', desc: 'Sea turtle sanctuary and underwater statues.' },
      { day: 3, title: 'Bicycle Exploration & Sunset Beach Swings', desc: 'Ride around island, sunset cocktails.' },
      { day: 4, title: 'Scuba Diving / Free Diving Experience', desc: 'Explore vibrant coral reefs with instructor.' },
      { day: 5, title: 'Gili T to Bali Speedboat & Airport Drop', desc: 'Return boat to Bali and transfer to airport.' }
    ]
  },
  {
    id: 47,
    title: 'Mount Batur Sunrise Volcano Trek & Natural Hot Springs',
    shortTitle: 'Mount Batur Sunrise Trek',
    slug: 'mount-batur-sunrise-trek',
    duration: '3N/4D',
    price: 34000,
    originalPrice: 40000,
    location: 'Kintamani, Bali, Indonesia',
    destination: 'Bali',
    category: 'International',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1938&auto=format&fit=crop',
    rating: 4.8,
    reviews: 180,
    tags: ['Volcano', 'Sunrise', 'Hot Springs'],
    nextBatch: '20 Sep',
    startingPoint: 'Denpasar Airport (DPS)',
    endingPoint: 'Denpasar Airport',
    altitude: '5,633 ft',
    grade: 'Moderate',
    ageGroup: '18 - 45 Years',
    gallery: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1938&auto=format&fit=crop'],
    overview: 'Climb an active volcano in the dark to watch a breathtaking sunrise over Mount Agung and Lake Batur. Cook volcanic steam eggs, soak your muscles in natural lakeside hot springs, and visit traditional coffee plantations.',
    highlights: [
      'Pre-dawn guided hike to summit of active volcano Mount Batur (5,633 ft)',
      'Watch golden sunrise over clouds with breakfast cooked in volcanic steam',
      'Soak in Toya Devasya natural geothermal hot springs on Lake Batur',
      'Taste rare Luwak coffee and ginger tea at spice plantation'
    ],
    inclusions: ['3 Nights Boutique Resort Stay', 'Breakfast & Trek Meal', 'Mountain Guide & Flashlights', 'Hot Spring Passes'],
    exclusions: ['Flights', 'Lunch & Dinner', 'GST (5%)'],
    availableBatches: [{ id: 'b47-1', dates: '20 Sep - 23 Sep, 2026', seatsLeft: 7, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Arrival in Bali & Transfer to Kintamani Caldera', desc: 'Check in overlooking volcanic lake.' },
      { day: 2, title: '03:30 AM Summit Mount Batur Sunrise Trek', desc: 'Climb volcano, sunrise breakfast, hot spring bath.' },
      { day: 3, title: 'Kintamani Coffee Plantation & Seminyak Beach', desc: 'Transfer to beach town, sunset dinner.' },
      { day: 4, title: 'Seminyak Shopping & Airport Departure', desc: 'Airport transfer for flight home.' }
    ]
  },

  // -------------------------------------------------------------
  // RAJASTHAN EXPEDITIONS (3 Distinct Active Packages)
  // -------------------------------------------------------------
  {
    id: 48,
    title: 'Udaipur & Mount Abu Royal Lakes Expedition',
    shortTitle: 'Udaipur & Mount Abu',
    slug: 'udaipur-mount-abu-royal-lakes',
    duration: '4N/5D',
    price: 15500,
    originalPrice: 19000,
    location: 'Udaipur, Rajasthan',
    destination: 'Rajasthan',
    category: 'Culture',
    image: 'https://images.unsplash.com/photo-1609137144822-77eb5782782e?w=600&auto=format&fit=crop&q=60',
    rating: 4.8,
    reviews: 145,
    trending: true,
    tags: ['Royal', 'Lakes', 'Heritage'],
    nextBatch: '01 Oct',
    startingPoint: 'Udaipur Airport / Railway Station',
    endingPoint: 'Udaipur Airport / Abu Road',
    altitude: '4,000 ft (Mount Abu)',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1609137144822-77eb5782782e?w=600&auto=format&fit=crop&q=60'],
    overview: 'Experience the Venice of the East. Sail across Lake Pichola past white marble City Palace, explore Jag Mandir island, and ascend into Rajasthan\'s only hill station at Mount Abu visiting Dilwara marble Jain temples.',
    highlights: [
      'Sunset boat cruise on Lake Pichola with view of Taj Lake Palace',
      'Explore Udaipur City Palace, Bagore Ki Haveli folk dance show',
      'Visit intricately carved marble ceilings of Dilwara Temples in Mount Abu',
      'Stay in heritage Haveli overlooking illuminated lake'
    ],
    inclusions: ['4 Nights Heritage Haveli & Resort', 'Breakfast & Dinner', 'Private Cab for all sights', 'Lake Cruise'],
    exclusions: ['Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b48-1', dates: '01 Oct - 05 Oct, 2026', seatsLeft: 8, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Arrival in Udaipur & Lake Pichola Sunset', desc: 'Check in to lake haveli, evening boat cruise.' },
      { day: 2, title: 'City Palace, Saheliyon Ki Bari & Folk Dance', desc: 'Full day royal architecture and Dharohar show.' },
      { day: 3, title: 'Udaipur to Mount Abu Hill Station', desc: 'Drive up Aravalli hills, visit Nakki Lake.' },
      { day: 4, title: 'Dilwara Marble Temples & Guru Shikhar', desc: 'Highest peak in Rajasthan and marble temples.' },
      { day: 5, title: 'Mount Abu / Udaipur Departure', desc: 'Transfer for return journey.' }
    ]
  },
  {
    id: 49,
    title: 'Jaisalmer Golden Sand Dunes & Desert Camping',
    shortTitle: 'Jaisalmer Desert Camping',
    slug: 'jaisalmer-golden-desert-camp',
    duration: '3N/4D',
    price: 12500,
    originalPrice: 15500,
    location: 'Jaisalmer, Rajasthan',
    destination: 'Rajasthan',
    category: 'Culture',
    image: 'https://images.unsplash.com/photo-1609137144822-77eb5782782e?w=600&auto=format&fit=crop&q=60',
    rating: 4.9,
    reviews: 180,
    tags: ['Desert', 'Camping', 'Safari'],
    nextBatch: '05 Oct',
    startingPoint: 'Jaisalmer Railway Station',
    endingPoint: 'Jaisalmer Railway Station',
    altitude: '738 ft',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1609137144822-77eb5782782e?w=600&auto=format&fit=crop&q=60'],
    overview: 'Live the Arabian Nights in the Thar Desert. Camel safari on undulating golden Sam sand dunes, sleep under the stars in Swiss desert camps, watch Kalbelia gypsy dancers around campfire, and explore the living golden fort.',
    highlights: [
      'Sunset camel trek and 4x4 dune bashing in Sam Sand Dunes',
      'Overnight Swiss luxury desert tent stay with cultural folk performance',
      'Explore the living Golden Fort (Sonar Qila) with carved stone havelis',
      'Visit abandoned haunted village of Kuldhara and Gadisar Lake'
    ],
    inclusions: ['3 Nights (1N Heritage Hotel + 2N Luxury Desert Camp)', 'Breakfast & Traditional Rajasthani Dinners', 'Camel & Jeep Safari'],
    exclusions: ['Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b49-1', dates: '05 Oct - 08 Oct, 2026', seatsLeft: 10, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Arrival in Jaisalmer & Living Fort Walk', desc: 'Explore golden sandstone fort and Patwon ki Haveli.' },
      { day: 2, title: 'Kuldhara Ghost Village & Sam Sand Dunes', desc: 'Sunset camel safari, desert camp cultural night.' },
      { day: 3, title: 'Thar 4x4 Dune Bashing & Gadisar Lake', desc: 'Thrilling offroad ride on dunes, evening lake light show.' },
      { day: 4, title: 'War Museum Visit & Departure', desc: 'Transfer to Jaisalmer station.' }
    ]
  },
  {
    id: 50,
    title: 'Jaipur, Jodhpur & Pushkar Cultural Heritage Odyssey',
    shortTitle: 'Jaipur Jodhpur & Pushkar',
    slug: 'jaipur-jodhpur-pushkar-heritage',
    duration: '5N/6D',
    price: 17500,
    originalPrice: 21500,
    location: 'Jaipur to Jodhpur, Rajasthan',
    destination: 'Rajasthan',
    category: 'Culture',
    image: 'https://images.unsplash.com/photo-1609137144822-77eb5782782e?w=600&auto=format&fit=crop&q=60',
    rating: 4.8,
    reviews: 165,
    tags: ['Forts', 'Heritage', 'Culture'],
    nextBatch: '10 Oct',
    startingPoint: 'Jaipur Airport / Station',
    endingPoint: 'Jodhpur Airport / Station',
    altitude: '1,400 ft',
    grade: 'Easy',
    ageGroup: 'All Ages',
    gallery: ['https://images.unsplash.com/photo-1609137144822-77eb5782782e?w=600&auto=format&fit=crop&q=60'],
    overview: 'Journey through the Pink City of Jaipur, holy lake town of Pushkar, and Blue City of Jodhpur. Stand atop massive Mehrangarh Fort, explore Amer Fort, and witness sacred evening aarti at Pushkar Lake.',
    highlights: [
      'Amer Fort elephant ride and Hawa Mahal photo stop in Jaipur',
      'Visit sacred Brahma Temple and holy lake ghats in Pushkar',
      'Explore mighty Mehrangarh Fort and blue houses of old Jodhpur',
      'Stay in authentic heritage havelis with traditional Kathputli puppet shows'
    ],
    inclusions: ['5 Nights Heritage Hotel Stay', 'Breakfast & Dinner', 'Private AC Cab for all inter-city transfers'],
    exclusions: ['Monument entry fees', 'Lunch', 'GST (5%)'],
    availableBatches: [{ id: 'b50-1', dates: '10 Oct - 15 Oct, 2026', seatsLeft: 8, status: 'Available' }],
    itinerary: [
      { day: 1, title: 'Arrival in Jaipur Pink City & Chokhi Dhani', desc: 'Visit Hawa Mahal and traditional village resort.' },
      { day: 2, title: 'Amer Fort, Nahargarh & City Palace', desc: 'Full day fort exploration and sunset at Nahargarh.' },
      { day: 3, title: 'Jaipur to Pushkar Holy Lake & Brahma Temple', desc: 'Visit sacred lake ghats and rose gardens.' },
      { day: 4, title: 'Pushkar to Jodhpur Blue City', desc: 'Drive to Jodhpur, explore blue alleys of old city.' },
      { day: 5, title: 'Mehrangarh Fort & Jaswant Thada', desc: 'Visit one of the largest forts in India.' },
      { day: 6, title: 'Umaid Bhawan Palace & Jodhpur Departure', desc: 'Royal museum visit and airport drop.' }
    ]
  }
];

// ================================================================
// DYNAMIC DESTINATIONS REGISTRY (Zero Hardcoded Counts)
// ================================================================
export const DESTINATIONS = [
  {
    id: 1,
    name: 'Himachal Pradesh',
    slug: 'himachal-pradesh',
    category: 'Domestic',
    region: 'North India',
    image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 2,
    name: 'Uttarakhand',
    slug: 'uttarakhand',
    category: 'Domestic',
    region: 'North India',
    image: 'https://images.pexels.com/photos/442579/pexels-photo-442579.jpeg'
  },
  {
    id: 3,
    name: 'Meghalaya',
    slug: 'meghalaya',
    category: 'Domestic',
    region: 'North East India',
    image: 'https://images.pexels.com/photos/17334314/pexels-photo-17334314.jpeg'
  },
  {
    id: 4,
    name: 'Kashmir',
    slug: 'kashmir',
    category: 'Domestic',
    region: 'North India',
    image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 5,
    name: 'Goa',
    slug: 'goa',
    category: 'Domestic',
    region: 'West Coast',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 6,
    name: 'Kerala',
    slug: 'kerala',
    category: 'Domestic',
    region: 'South India',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=2069&auto=format&fit=crop'
  },
  {
    id: 7,
    name: 'Ladakh',
    slug: 'ladakh',
    category: 'Domestic',
    region: 'Himalayas',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 8,
    name: 'Bali',
    slug: 'bali',
    category: 'International',
    region: 'Southeast Asia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1938&auto=format&fit=crop'
  },
  {
    id: 9,
    name: 'Rajasthan',
    slug: 'rajasthan',
    category: 'Domestic',
    region: 'West India',
    image: 'https://images.unsplash.com/photo-1609137144822-77eb5782782e?w=600&auto=format&fit=crop&q=60'
  }
];

/**
 * Authoritative Dynamic Destination Package Count Calculator
 * Rule: Count MUST equal the actual query result of active trips for that destination.
 */
export const getDestinationPackageCount = (destinationName, trips = UPCOMING_TRIPS) => {
  if (!destinationName) return 0;
  const clean = destinationName.toLowerCase().trim();
  return trips.filter((t) => {
    if (t.isActive === false) return false;
    const loc = (t.location || '').toLowerCase();
    const dest = (t.destination || '').toLowerCase();
    const title = (t.title || '').toLowerCase();
    return loc.includes(clean) || dest.includes(clean) || title.includes(clean);
  }).length;
};

// ================================================================
// VERIFIED TESTIMONIALS & COMMUNITY REVIEWS
// ================================================================
export const TESTIMONIALS = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    role: 'Solo Traveler',
    content: 'The Spiti Valley trip was easily the best travel experience of my life. The organization was flawless, and our trip captain made sure everyone was comfortable despite the harsh terrain.',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  {
    id: 2,
    name: 'Rohit Sharma',
    role: 'Frequent Backpacker',
    content: 'I have traveled with WanderLuxe three times now, and they never disappoint. The community you travel with is always amazing, and the itineraries are perfectly balanced.',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: 3,
    name: 'Emily Davis',
    role: 'Couples Retreat',
    content: 'We booked our Bali island trip through WanderLuxe. The customized package was exactly what we wanted - a mix of luxury private pool stays and adventurous activities without any stress.',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg'
  }
];

// ================================================================
// EDITORIAL BLOG POSTS
// ================================================================
export const BLOG_POSTS = [
  {
    id: 1,
    title: 'The Ultimate Guide to Backpacking Meghalaya: Living Root Bridges & Emerald Rivers',
    category: 'Backpacking Tips',
    readTime: '6 min read',
    date: 'August 04, 2026',
    image: 'https://images.pexels.com/photos/17334314/pexels-photo-17334314.jpeg',
    author: {
      name: 'Gaurav Kumar Yadav',
      role: 'Lead Expedition Captain',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
    },
    excerpt: 'Discover why Meghalaya is called the Abode of Clouds. Here is everything you need to know about hiking 3,500 steps to Nongriat, cliff jumping in Dawki, and exploring Asia\'s cleanest village.',
    content: `
Meghalaya, tucked away in North-East India, is one of the most magical landscapes on Earth. From living root bridges shaped over centuries by Khasi tribes to rivers so transparent that boats appear to float in mid-air, this state offers an adventure like no other.

### 1. The Hike to Nongriat Double Decker Root Bridge
Descending 3,500 stone steps into the heart of Cherrapunji's rainforests leads you to Nongriat. The Double Decker Living Root Bridge is a marvel of bio-engineering. Rubber tree roots trained across rivers form natural suspension bridges that grow stronger over time.

### 2. Cliff Jumping at Shnongpdeng & Dawki
The Umngot River in Dawki is famous for its emerald glass-like clarity during autumn and winter. Rent a wooden canoe or try cliff jumping from 20-foot rocks into pristine lagoons.

### Key Travel Tips:
- **Best Season**: October to April for clear waters; July to September for roaring waterfalls.
- **Fitness Level**: Moderate physical stamina is required for the Nongriat staircase trek.
- **Gear Essentials**: Sturdy trail shoes, quick-dry clothes, and a waterproof phone pouch.
    `
  },
  {
    id: 2,
    title: '10 Things You Must Know Before Preparing for the Spiti Valley Circuit',
    category: 'Himalayan Expeditions',
    readTime: '8 min read',
    date: 'July 28, 2026',
    image: 'https://images.pexels.com/photos/6239996/pexels-photo-6239996.jpeg',
    author: {
      name: 'Ananya Roy',
      role: 'High Altitude Trek Guide',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    excerpt: 'Planning your road trip through cold desert monastries and 15,000 ft mountain passes? Here is your complete checklist on altitude acclimatization, permits, and clothing layers.',
    content: `
Spiti Valley is a high-altitude cold desert located in Himachal Pradesh. With average elevations above 12,000 feet, proper preparation is crucial to ensure a safe and enjoyable journey.

### 1. Acclimatization is Non-Negotiable
Ascending rapidly to Kaza (12,500 ft) or Chandratal Lake (14,100 ft) can trigger Acute Mountain Sickness (AMS). Take at least 2 days to acclimate slowly in Shimla or Kalpa before reaching Kaza.

### 2. Postcards from Hikkim
Visit the world's highest post office in Hikkim (14,567 ft). Post a physical postcard to your loved ones from this remote Himalayan village!

### 3. Essential Packing List
- Thermal base layers & heavy down jacket (-5°C to 10°C).
- Diamox / Oxygen cylinder on standby.
- Cash in hand (ATMs in Kaza are often offline).
    `
  }
];

export const TEAM_MEMBERS = [
  {
    id: 1,
    name: 'Gaurav Kumar Yadav',
    role: 'Founder & Head of Expeditions',
    image: 'https://kommodo.ai/i/a002dp67vtAEhL4IfgAX',
    bio: 'Passionate mountaineer & travel architect with 8+ years experience leading 150+ group departures across Himalayas & South East Asia.',
    tripsLed: '150+ Expeditions'
  }
];
