import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Trip from '../models/Trip.js';
import Booking from '../models/Booking.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load travel knowledge base fallback packages
const getStaticKnowledgeTrips = () => {
  try {
    const tripsPath = path.join(__dirname, '../data/trips.json');
    if (fs.existsSync(tripsPath)) {
      const raw = fs.readFileSync(tripsPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    const filePath = path.join(__dirname, '../data/travelKnowledge.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.trips)) {
        return parsed.trips;
      }
    }
  } catch (err) {
    console.warn('Could not read static trips data:', err.message);
  }
  return [];
};

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

// @desc    Get all trip packages with filtering, search, and pagination
// @route   GET /api/trips
// @access  Public (or Admin if includeDrafts=true)
export const getTrips = async (req, res) => {
  try {
    const { 
      search, destination, category, mood, 
      minPrice, maxPrice, sort, includeDrafts,
      country, tag, duration, preset 
    } = req.query;

    const filter = {};

    // Only exclude drafts and inactive trips for public storefront queries
    if (includeDrafts !== 'true') {
      filter.status = { $ne: 'draft' };
      filter.isActive = { $ne: false };
    }

    if (destination && destination !== 'All' && destination !== 'all') {
      filter.destination = new RegExp(destination, 'i');
    }

    if (country && country !== 'All') {
      if (country.toLowerCase() === 'india' || country.toLowerCase() === 'domestic') {
        filter.destination = { $nin: [/bali/i, /indonesia/i] };
      } else if (country.toLowerCase() === 'international') {
        filter.$or = [{ destination: /bali/i }, { category: /international/i }];
      }
    }

    if (category && category !== 'All') {
      filter.category = new RegExp(category, 'i');
    }

    if (tag) {
      filter.tags = new RegExp(tag, 'i');
    }

    if (duration === 'weekend') {
      filter.duration = new RegExp('2N|3D|3N/4D', 'i');
    }

    if (mood && mood !== 'All') {
      filter.mood = new RegExp(mood, 'i');
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') },
        { destination: new RegExp(search, 'i') },
        { overview: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let trips = [];

    if (isDbConnected()) {
      try {
        const totalCount = await Trip.countDocuments();
        if (totalCount === 0) {
          const staticList = getStaticKnowledgeTrips();
          if (staticList.length > 0) {
            console.log(`🌱 Auto-seeding ${staticList.length} trip packages to MongoDB...`);
            const normalizedToInsert = staticList.map(t => ({
              title: t.title,
              slug: t.slug || t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
              location: t.location || t.state || 'India',
              destination: t.destination || 'India',
              duration: t.duration || `${t.days || 5}D/${t.nights || 4}N`,
              days: t.days || 5,
              nights: t.nights || 4,
              price: Number(t.price || 18500),
              originalPrice: Number(t.originalPrice || Math.round(Number(t.price || 18500) * 1.2)),
              image: t.image || t.heroImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
              heroImage: t.heroImage || t.image || '',
              gallery: t.gallery || [],
              rating: Number(t.rating || 4.8),
              reviews: Number(t.reviews || 12),
              tags: t.tags || ['Backpacking', 'Adventure'],
              category: t.category || 'Backpacking',
              mood: t.mood || 'Adventure',
              overview: t.overview || t.shortDescription || '',
              itinerary: t.itinerary || [],
              inclusions: t.inclusions || [],
              exclusions: t.exclusions || [],
              faqs: t.faqs || [],
              status: 'published',
              isActive: true,
              seo: {
                seoTitle: `${t.title} | WanderLuxe Expeditions`,
                metaDescription: t.overview || `Book ${t.title} with WanderLuxe.`,
                canonicalUrl: `https://wanderluxe.in/trip/${t.slug || t.id}`,
                indexingDirective: 'index, follow'
              }
            }));
            await Trip.insertMany(normalizedToInsert, { ordered: false }).catch(() => {});
          }
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'price_low') sortOption = { price: 1 };
        if (sort === 'price_high') sortOption = { price: -1 };
        if (sort === 'rating') sortOption = { rating: -1 };

        trips = await Trip.find(filter).sort(sortOption);
      } catch (dbErr) {
        console.warn('Trips DB query warning:', dbErr.message);
      }
    }

    // Static fallback if DB is offline or returned empty
    if (trips.length === 0) {
      const staticList = getStaticKnowledgeTrips();
      trips = staticList.filter(t => {
        const dest = (t.destination || t.location || '').toLowerCase();
        if (destination && destination !== 'All' && destination !== 'all' && !new RegExp(destination, 'i').test(t.destination || t.location)) return false;
        if (country && country !== 'All') {
          if (country.toLowerCase() === 'india' || country.toLowerCase() === 'domestic') {
            if (dest.includes('bali') || dest.includes('indonesia')) return false;
          } else if (country.toLowerCase() === 'international') {
            if (!dest.includes('bali') && !dest.includes('indonesia') && !/international/i.test(t.category)) return false;
          }
        }
        if (category && category !== 'All' && !new RegExp(category, 'i').test(t.category)) return false;
        if (tag && !new RegExp(tag, 'i').test(Array.isArray(t.tags) ? t.tags.join(' ') : '')) return false;
        if (duration === 'weekend' && !/2N|3D|3N\/4D/i.test(t.duration || '')) return false;
        if (search && !new RegExp(search, 'i').test(`${t.title} ${t.location} ${t.destination} ${t.overview}`)) return false;
        return true;
      });
    }

    res.json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    console.error('getTrips Error:', error);
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

    if (isDbConnected()) {
      try {
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
          trip = await Trip.findById(idOrSlug);
        }
        if (!trip) {
          trip = await Trip.findOne({ slug: cleanId });
        }
      } catch (dbErr) {
        console.warn('Trip query warning:', dbErr.message);
      }
    }

    if (!trip) {
      const staticList = getStaticKnowledgeTrips();
      trip = staticList.find(
        (t, idx) =>
          t.slug === cleanId ||
          String(t.id || '') === cleanId ||
          String(t._id || '') === cleanId ||
          String(idx + 1) === cleanId
      );
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip package not found.' });
    }

    res.json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('getTripByIdOrSlug Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error fetching trip details' });
  }
};

// @desc    Create a new trip package
// @route   POST /api/trips
// @access  Private/Admin
export const createTrip = async (req, res) => {
  try {
    const { 
      title, slug, location, destination, duration, price, 
      image, heroImage, gallery, overview, itinerary, 
      inclusions, exclusions, faqs, seo, status, category, mood, difficulty, groupType
    } = req.body;

    if (!title || !location || !duration || !price || !image) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title, location, duration, price, and image are required.' 
      });
    }

    // Auto-generate clean slug
    let cleanSlug = (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Check slug uniqueness
    if (isDbConnected()) {
      const existingSlug = await Trip.findOne({ slug: cleanSlug });
      if (existingSlug) {
        cleanSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
      }
    }

    const newTrip = await Trip.create({
      title: title.trim(),
      slug: cleanSlug,
      location: location.trim(),
      destination: destination || 'India',
      region: req.body.region || 'North India',
      duration: duration.trim(),
      days: req.body.days || parseInt(duration) || 5,
      nights: req.body.nights || (parseInt(duration) ? parseInt(duration) - 1 : 4),
      price: Number(price),
      originalPrice: req.body.originalPrice ? Number(req.body.originalPrice) : Math.round(Number(price) * 1.2),
      discount: req.body.discount || 0,
      currency: req.body.currency || 'INR',
      image: image.trim(),
      heroImage: heroImage ? heroImage.trim() : image.trim(),
      gallery: Array.isArray(gallery) ? gallery : [],
      rating: req.body.rating ? Number(req.body.rating) : 4.8,
      reviews: req.body.reviews ? Number(req.body.reviews) : 12,
      tags: Array.isArray(req.body.tags) ? req.body.tags : (req.body.tags ? String(req.body.tags).split(',').map(s => s.trim()) : ['Backpacking', 'Adventure']),
      category: category || 'Backpacking',
      mood: mood || 'Adventure',
      difficulty: difficulty || 'Moderate',
      groupType: groupType || 'Mixed Group',
      bestMonths: Array.isArray(req.body.bestMonths) ? req.body.bestMonths : [],
      nextBatch: req.body.nextBatch || '15 Sep',
      availableDates: Array.isArray(req.body.availableDates) ? req.body.availableDates : [],
      batches: Array.isArray(req.body.batches) ? req.body.batches : [],
      sharingPricing: req.body.sharingPricing || {
        doubleSharing: Number(price),
        tripleSharing: Math.max(1000, Number(price) - 1500),
        singleSharing: Number(price) + 3500
      },
      pickupPoints: Array.isArray(req.body.pickupPoints) ? req.body.pickupPoints : ['Airport Arrival Terminal (10:00 AM)', 'Central Railway Station (11:30 AM)'],
      capacity: req.body.capacity ? Number(req.body.capacity) : 20,
      shortDescription: req.body.shortDescription || overview || '',
      overview: overview || req.body.shortDescription || '',
      itinerary: Array.isArray(itinerary) ? itinerary : [],
      inclusions: Array.isArray(inclusions) ? inclusions : [],
      exclusions: Array.isArray(exclusions) ? exclusions : [],
      faqs: Array.isArray(faqs) ? faqs : [],
      status: status || 'published',
      isActive: status !== 'inactive',
      seo: {
        seoTitle: seo?.seoTitle || `${title} | WanderLuxe Expeditions`,
        metaDescription: seo?.metaDescription || overview || `Book ${title} with WanderLuxe.`,
        canonicalUrl: seo?.canonicalUrl || `https://wanderluxe.in/trip/${cleanSlug}`,
        indexingDirective: seo?.indexingDirective || 'index, follow',
        ogTitle: seo?.ogTitle || title,
        ogDescription: seo?.ogDescription || overview || '',
        ogImage: seo?.ogImage || heroImage || image,
        structuredSchemaType: seo?.structuredSchemaType || 'Product'
      }
    });

    console.log(`✅ Admin created new trip: ${newTrip.title} (${newTrip.slug})`);

    res.status(201).json({ success: true, data: newTrip });
  } catch (error) {
    console.error('createTrip Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error creating trip.' });
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
      return res.status(404).json({ success: false, message: 'Trip package not found.' });
    }

    if (req.body.price !== undefined) {
      if (isNaN(Number(req.body.price)) || Number(req.body.price) < 0) {
        return res.status(400).json({ success: false, message: 'Price must be a valid positive number.' });
      }
      req.body.price = Number(req.body.price);
    }

    if (req.body.originalPrice !== undefined) {
      req.body.originalPrice = Number(req.body.originalPrice);
    }

    if (req.body.status) {
      req.body.isActive = req.body.status !== 'inactive';
    }

    // Assign sanitized updates
    Object.assign(trip, req.body);
    await trip.save();

    console.log(`✅ Admin updated trip: ${trip.title} (ID: ${trip._id})`);

    res.json({ success: true, data: trip });
  } catch (error) {
    console.error('updateTrip Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error updating trip.' });
  }
};

// @desc    Delete or deactivate trip package
// @route   DELETE /api/trips/:id
// @access  Private/Admin
export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip package not found.' });
    }

    // Check if bookings exist for this trip before hard delete
    if (isDbConnected()) {
      const activeBookingsCount = await Booking.countDocuments({ 
        $or: [{ tripId: String(id) }, { 'tripSnapshot.title': trip.title }] 
      });

      if (activeBookingsCount > 0) {
        trip.status = 'inactive';
        trip.isActive = false;
        await trip.save();
        return res.json({ 
          success: true, 
          message: `Trip has ${activeBookingsCount} linked bookings. Safely deactivated from catalog without breaking booking records.`, 
          id,
          deactivated: true 
        });
      }
    }

    await trip.deleteOne();
    console.log(`🗑️ Admin deleted trip: ${trip.title} (ID: ${id})`);
    res.json({ success: true, message: 'Trip package deleted successfully.', id });
  } catch (error) {
    console.error('deleteTrip Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error deleting trip.' });
  }
};

// @desc    Seed initial catalog into database
// @route   POST /api/trips/seed
// @access  Private/Admin
export const seedTrips = async (req, res) => {
  try {
    const staticList = getStaticKnowledgeTrips();
    const count = await Trip.countDocuments();
    if (count > 0 && req.query.force !== 'true') {
      return res.json({ message: `Database already has ${count} trips. Pass ?force=true to reseed.`, count });
    }

    const normalizedToInsert = staticList.map(t => ({
      title: t.title,
      slug: t.slug || t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      location: t.location || t.state || 'India',
      destination: t.destination || 'India',
      duration: t.duration || `${t.days || 5}D/${t.nights || 4}N`,
      days: t.days || 5,
      nights: t.nights || 4,
      price: Number(t.price || 18500),
      originalPrice: Number(t.originalPrice || Math.round(Number(t.price || 18500) * 1.2)),
      image: t.image || t.heroImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      heroImage: t.heroImage || t.image || '',
      gallery: t.gallery || [],
      rating: Number(t.rating || 4.8),
      reviews: Number(t.reviews || 12),
      tags: t.tags || ['Backpacking', 'Adventure'],
      category: t.category || 'Backpacking',
      mood: t.mood || 'Adventure',
      overview: t.overview || t.shortDescription || '',
      itinerary: t.itinerary || [],
      inclusions: t.inclusions || [],
      exclusions: t.exclusions || [],
      faqs: t.faqs || [],
      status: 'published',
      isActive: true,
      seo: {
        seoTitle: `${t.title} | WanderLuxe Expeditions`,
        metaDescription: t.overview || `Book ${t.title} with WanderLuxe.`,
        canonicalUrl: `https://wanderluxe.in/trip/${t.slug || t.id}`,
        indexingDirective: 'index, follow'
      }
    }));

    const created = await Trip.insertMany(normalizedToInsert, { ordered: false });
    res.status(201).json({ message: `Successfully seeded ${created.length} trip packages into MongoDB.`, count: created.length });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error seeding trips' });
  }
};
