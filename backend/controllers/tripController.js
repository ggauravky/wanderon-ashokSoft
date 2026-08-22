import mongoose from 'mongoose';
import Trip from '../models/Trip.js';

const INITIAL_TRIPS_CATALOG = [
  {
    title: 'Meghalaya Backpacking Living Root Bridges',
    slug: 'meghalaya-backpacking-living-root-bridges',
    location: 'Meghalaya',
    destination: 'Northeast India',
    duration: '5D/4N',
    price: 18500,
    originalPrice: 22500,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=800',
    rating: 4.9,
    reviews: 28,
    tags: ['Backpacking', 'Waterfalls', 'Trekking'],
    nextBatch: '15 Sep - 19 Sep',
    overview: 'Explore the land of clouds, crystal-clear Dawki river, natural living root bridges, and majestic waterfalls of Cherrapunji.',
    itinerary: [
      { day: 1, title: 'Arrival in Guwahati & Drive to Shillong', description: 'Meet the trip captain at Guwahati airport. Scenic drive to Shillong with stop at Umiam Lake.' },
      { day: 2, title: 'Shillong to Cherrapunji Waterfalls', description: 'Visit Elephant Falls, Nohkalikai Falls, and Seven Sisters Waterfalls.' },
      { day: 3, title: 'Double Decker Living Root Bridge Trek', description: 'Trek down to Tyrna village to witness the ancient Double Decker Living Root Bridge in Nongriat.' },
      { day: 4, title: 'Dawki Boating & Shnongpdeng Camping', description: 'Crystal clear boating at Umngot river in Dawki, followed by riverside camping & bonfire in Shnongpdeng.' },
      { day: 5, title: 'Laitlum Canyons & Departure', description: 'Morning sunrise at Laitlum Canyons before dropping back to Guwahati.' }
    ],
    inclusions: ['Trip Captain & Local Guide', 'All Stay Accommodations', 'Breakfast & Dinner', 'Internal Transfers in Tempo Traveler', 'Dawki Boating & Camping Permits'],
    exclusions: ['Flights/Train to Guwahati', 'Lunch & Personal Expenses', 'Extra Adventure Activities'],
    faqs: [
      { question: 'Is physical fitness required for Double Decker Trek?', answer: 'Basic walking fitness is required as it involves ~3000 steps descend and ascend.' },
      { question: 'Is Dawki river transparent year round?', answer: 'The best transparency is between October and April.' }
    ],
    seo: {
      seoTitle: 'Meghalaya Backpacking Trip | Dawki, Cherrapunji & Living Root Bridges',
      metaDescription: 'Book 5-Day Meghalaya Backpacking Tour. Visit Dawki clear river, Nohkalikai falls, Nongriat living root bridges with expert captains.',
      canonicalUrl: 'https://wanderluxe.in/trip/meghalaya-backpacking-living-root-bridges',
      indexingDirective: 'index, follow',
      ogTitle: 'Meghalaya Backpacking Tour | WanderLuxe',
      ogDescription: 'Experience the magic of Meghalaya with WanderLuxe group departures.',
      ogImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=800',
      structuredSchemaType: 'Product'
    }
  },
  {
    title: 'Spiti Valley Circuit High Altitude Roadtrip',
    slug: 'spiti-valley-circuit-high-altitude-roadtrip',
    location: 'Spiti Valley',
    destination: 'Himachal Pradesh',
    duration: '7D/6N',
    price: 22000,
    originalPrice: 26000,
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800',
    rating: 4.8,
    reviews: 42,
    tags: ['Roadtrip', 'High Altitude', 'Monasteries'],
    nextBatch: '20 Sep - 26 Sep',
    overview: 'Drive through the cold desert of Spiti Valley, visit Key Monastery, highest post office Hikkim, and moon-shaped Chandratal Lake.',
    itinerary: [
      { day: 1, title: 'Shimla to Kalpa via Narkanda', description: 'Drive along the Sutlej river into Kinnaur valley. Overnight stay in Kalpa with Kinnaur Kailash views.' },
      { day: 2, title: 'Kalpa to Kaza via Nako & Tabo Monastery', description: 'Visit 1000-year-old Tabo monastery and Nako lake.' },
      { day: 3, title: 'Key Monastery, Kibber & Chicham Bridge', description: 'Explore iconic Key Gompa and cross Asia’s highest bridge Chicham.' },
      { day: 4, title: 'Hikkim, Komic & Langza Fossil Village', description: 'Post postcard from world’s highest post office in Hikkim (14,567 ft).' },
      { day: 5, title: 'Kaza to Chandratal Lake via Kunzum Pass', description: 'Cross Kunzum La pass and camp under starlit sky at Chandratal.' },
      { day: 6, title: 'Chandratal to Manali via Atal Tunnel', description: 'Drive through Batal, Gramphu, and Atal Tunnel into Manali.' },
      { day: 7, title: 'Manali Local & Departure', description: 'Free morning in Old Manali before evening bus to Delhi.' }
    ],
    inclusions: ['Force Traveler 4x4 Support Vehicle', 'Experienced Mountain Captain', 'Stay in Homestays & Camps', 'Breakfast & Dinner', 'Inner Line Permits'],
    exclusions: ['Travel to Shimla/Manali', 'Personal Medical Kit & Oxygen Extra', 'Unforeseen Weather Delays'],
    faqs: [
      { question: 'What is the altitude of Spiti?', answer: 'Average altitude ranges between 10,000 to 14,500 feet.' }
    ],
    seo: {
      seoTitle: 'Spiti Valley 7 Days Roadtrip Package | Key Monastery & Chandratal',
      metaDescription: 'Book Spiti Valley group departure tour. Includes Hikkim post office, Chicham bridge, Key monastery, and Chandratal Lake camping.',
      canonicalUrl: 'https://wanderluxe.in/trip/spiti-valley-circuit-high-altitude-roadtrip',
      indexingDirective: 'index, follow',
      ogTitle: 'Spiti Valley Circuit Roadtrip | WanderLuxe',
      ogDescription: 'Conquer the cold desert valley of Spiti with WanderLuxe.',
      ogImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800',
      structuredSchemaType: 'Product'
    }
  },
  {
    title: 'Goa Sun Beach and Party Getaway',
    slug: 'goa-sun-beach-and-party-getaway',
    location: 'Goa',
    destination: 'Goa Coast',
    duration: '4D/3N',
    price: 14500,
    originalPrice: 17500,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
    rating: 4.7,
    reviews: 35,
    tags: ['Beach', 'Nightlife', 'Water Sports'],
    nextBatch: '25 Sep - 28 Sep',
    overview: 'Unwind at North & South Goa beaches, water sports at Calangute, sunset catamaran cruise, and legendary nightlife.',
    itinerary: [
      { day: 1, title: 'Arrival & North Goa Beach Vibe', description: 'Check-in to beach resort, relax at Baga & Anjuna beach.' },
      { day: 2, title: 'Scuba Diving & Water Sports at Grand Island', description: 'Boat ride, scuba diving with video, jet ski & banana rides.' },
      { day: 3, title: 'South Goa Heritage & Sunset Cruise', description: 'Basilica of Bom Jesus, Fontainhas Latin Quarter walk, Mandovi river cruise.' },
      { day: 4, title: 'Shopping & Farewell', description: 'Souvenir shopping at Panjim market before departure.' }
    ],
    inclusions: ['3-Star Beach Resort Stay', 'Scuba Diving + Water Sports Combo', 'Daily Breakfast', 'Mandovi Sunset Cruise', 'Airport Transfers'],
    exclusions: ['Flight Tickets', 'Alcohol & Nightclub Entry Fees', 'Personal Shopping'],
    faqs: [
      { question: 'Do I need swimming skills for Scuba?', answer: 'No swimming experience needed as certified dive instructors accompany you.' }
    ],
    seo: {
      seoTitle: 'Goa 4 Days Tour Package | Scuba Diving, Beaches & Nightlife',
      metaDescription: 'Book Goa 4D/3N beach getaway with water sports, Grand Island scuba diving, and resort stay. Best deals guaranteed.',
      canonicalUrl: 'https://wanderluxe.in/trip/goa-sun-beach-and-party-getaway',
      indexingDirective: 'index, follow',
      ogTitle: 'Goa Sun Beach & Party Getaway | WanderLuxe',
      ogDescription: 'Experience Goa like never before with WanderLuxe.',
      ogImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
      structuredSchemaType: 'Product'
    }
  },
  {
    title: 'Bali Island Escape Beaches and Culture',
    slug: 'bali-island-escape-beaches-and-culture',
    location: 'Bali',
    destination: 'Indonesia',
    duration: '6D/5N',
    price: 45000,
    originalPrice: 52000,
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800',
    rating: 4.9,
    reviews: 50,
    tags: ['International', 'Tropical', 'Culture'],
    nextBatch: '01 Oct - 06 Oct',
    overview: 'Tropical paradise awaits! Ubud rice terraces, Nusa Penida Kelingking beach, Tanah Lot temple, and beach club sunsets.',
    itinerary: [
      { day: 1, title: 'Welcome to Denpasar, Bali', description: 'Traditional Balinese welcome garland, transfer to Kuta beach hotel.' },
      { day: 2, title: 'Full Day Nusa Penida Island Speedboat Tour', description: 'Visit Kelingking T-Rex cliff, Broken Beach, Angel’s Billabong, Crystal Bay.' },
      { day: 3, title: 'Ubud Swing, Tegalalang & Monkey Forest', description: 'Fly over jungle on famous Bali Swing and explore Ubud art market.' },
      { day: 4, title: 'Kintamani Volcano & Ulun Danu Beratan Temple', description: 'Breathtaking Mount Batur views and floating temple on Lake Beratan.' },
      { day: 5, title: 'Tanah Lot Sunset & Finns Beach Club Party', description: 'Iconic offshore rock temple Tanah Lot followed by evening beach club party.' },
      { day: 6, title: 'Balinese Spa Massage & Departure', description: 'Complimentary 1-hour Balinese massage before airport drop.' }
    ],
    inclusions: ['4-Star Villa / Hotel Stay', 'Nusa Penida Island Tour with Lunch', 'Bali Swing Entry Pass', '1-Hour Balinese Massage', 'Private AC Car Transfers'],
    exclusions: ['International Flights', 'Indonesia Visa on Arrival ($35 USD)', 'Personal Spending'],
    faqs: [
      { question: 'Is Visa required for Indians?', answer: 'Visa on Arrival (VoA) is available at Denpasar Airport for ~$35 USD.' }
    ],
    seo: {
      seoTitle: 'Bali 6 Days Luxury Vacation Package | Nusa Penida & Ubud',
      metaDescription: 'Book 6-Day Bali international vacation package. Includes Nusa Penida speedboat tour, Bali swing, Ubud rice terraces, and 4-star villa.',
      canonicalUrl: 'https://wanderluxe.in/trip/bali-island-escape-beaches-and-culture',
      indexingDirective: 'index, follow',
      ogTitle: 'Bali Island Escape | WanderLuxe',
      ogDescription: 'Discover the island of gods with WanderLuxe.',
      ogImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800',
      structuredSchemaType: 'Product'
    }
  }
];

// @desc    Get all trip packages with filter, search, & pagination
// @route   GET /api/trips
// @access  Public
export const getTrips = async (req, res) => {
  try {
    const { destination, location, tag, search, minPrice, maxPrice, sort } = req.query;

    let filter = {};

    if (destination) {
      filter.destination = new RegExp(destination, 'i');
    }
    if (location) {
      filter.location = new RegExp(location, 'i');
    }
    if (tag) {
      filter.tags = new RegExp(tag, 'i');
    }
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') },
        { destination: new RegExp(search, 'i') },
        { overview: new RegExp(search, 'i') }
      ];
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let trips = [];
    try {
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        trips = await Trip.find(filter).sort(sort === 'price_low' ? { price: 1 } : sort === 'price_high' ? { price: -1 } : { createdAt: -1 });
      }
    } catch (dbErr) {
      console.warn('Trips DB query warning:', dbErr.message);
    }

    // Fallback to initial catalog if DB returned no results
    if (trips.length === 0 && Object.keys(filter).length === 0) {
      trips = INITIAL_TRIPS_CATALOG;
    }

    res.json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server Error fetching trips' });
  }
};

// @desc    Get single trip package details by ID or Slug
// @route   GET /api/trips/:idOrSlug
// @access  Public
export const getTripByIdOrSlug = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const cleanId = String(idOrSlug).trim().toLowerCase();

    let trip = null;

    try {
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        if (mongoose.Types.ObjectId.isValid(cleanId)) {
          trip = await Trip.findById(cleanId);
        }
        if (!trip) {
          trip = await Trip.findOne({ slug: cleanId });
        }
      }
    } catch (dbErr) {
      console.warn('Trip query warning:', dbErr.message);
    }

    if (!trip) {
      trip = INITIAL_TRIPS_CATALOG.find(
        (t, idx) => t.slug === cleanId || String(t.id || '') === cleanId || String(t._id || '') === cleanId || String(idx + 1) === cleanId
      );
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip package not found' });
    }

    res.json({
      success: true,
      data: trip
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server Error fetching trip details' });
  }
};

// @desc    Create a new trip package
// @route   POST /api/trips
// @access  Private/Admin
export const createTrip = async (req, res) => {
  try {
    const { title, slug, location, destination, duration, price, image } = req.body;

    if (!title || !location || !duration || !price || !image) {
      return res.status(400).json({ message: 'Title, location, duration, price, and image are required.' });
    }

    const cleanSlug = (slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newTrip = await Trip.create({
      title: title.trim(),
      slug: cleanSlug,
      location: location.trim(),
      destination: destination || 'India',
      duration: duration.trim(),
      price: Number(price),
      originalPrice: req.body.originalPrice ? Number(req.body.originalPrice) : Math.round(Number(price) * 1.2),
      image: image.trim(),
      rating: req.body.rating || 4.8,
      reviews: req.body.reviews || 12,
      tags: req.body.tags || ['Backpacking', 'Adventure'],
      nextBatch: req.body.nextBatch || '15 Sep',
      overview: req.body.overview || '',
      itinerary: req.body.itinerary || [],
      inclusions: req.body.inclusions || [],
      exclusions: req.body.exclusions || [],
      faqs: req.body.faqs || [],
      seo: req.body.seo || {
        seoTitle: `${title} | WanderLuxe Travel`,
        metaDescription: req.body.overview || `Book ${title} with WanderLuxe.`,
        canonicalUrl: `https://wanderluxe.in/trip/${cleanSlug}`,
        indexingDirective: 'index, follow'
      }
    });

    res.status(201).json({ success: true, data: newTrip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server Error creating trip' });
  }
};

// @desc    Update trip package
// @route   PUT /api/trips/:id
// @access  Private/Admin
export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip package not found' });
    }

    Object.assign(trip, req.body);
    await trip.save();

    res.json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server Error updating trip' });
  }
};

// @desc    Delete trip package
// @route   DELETE /api/trips/:id
// @access  Private/Admin
export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip package not found' });
    }

    await trip.deleteOne();
    res.json({ success: true, message: 'Trip deleted successfully', id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server Error deleting trip' });
  }
};

// @desc    Seed initial catalog into database
// @route   POST /api/trips/seed
// @access  Private/Admin
export const seedTrips = async (req, res) => {
  try {
    const count = await Trip.countDocuments();
    if (count > 0) {
      return res.json({ message: `Database already has ${count} trips. Seeding skipped.`, count });
    }

    const created = await Trip.insertMany(INITIAL_TRIPS_CATALOG);
    res.status(201).json({ message: `Successfully seeded ${created.length} initial trip packages.`, count: created.length });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error seeding trips' });
  }
};
