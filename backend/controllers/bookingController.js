import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import QRCode from 'qrcode';
import Booking from '../models/Booking.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import Commission from '../models/Commission.js';
import WalletLedger from '../models/WalletLedger.js';

// Static Catalog fallback for all 50 predefined expeditions
const STATIC_TRIPS_CATALOG = {
  // Himachal Pradesh (1-12)
  '1': { title: 'Spiti Valley Circuit: The Himalayan Odyssey', location: 'Spiti Valley, Himachal Pradesh', destination: 'Himachal Pradesh', duration: '6N/7D', price: 22000, image: 'https://images.pexels.com/photos/6239996/pexels-photo-6239996.jpeg', slug: 'spiti-valley-circuit' },
  '2': { title: 'Manali & Solang Valley Snow & Adventure Getaway', location: 'Manali, Himachal Pradesh', destination: 'Himachal Pradesh', duration: '4N/5D', price: 13500, image: 'https://images.unsplash.com/photo-1586796676774-c93004ae009f?q=80&w=1200&auto=format&fit=crop', slug: 'manali-solang-adventure' },
  '3': { title: 'Kasol, Kheerganga & Tosh Parvati Valley Backpacking', location: 'Parvati Valley, Himachal Pradesh', destination: 'Himachal Pradesh', duration: '3N/4D', price: 9500, image: 'https://images.unsplash.com/photo-1596761611076-02720db1b4f8?q=80&w=1200&auto=format&fit=crop', slug: 'kasol-kheerganga-tosh-backpacking' },
  '4': { title: 'Dharamshala, McLeodganj & Triund Ridge Trek', location: 'Dharamshala, Himachal Pradesh', destination: 'Himachal Pradesh', duration: '3N/4D', price: 10500, image: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?q=80&w=1200&auto=format&fit=crop', slug: 'dharamshala-triund-trek' },
  '5': { title: 'Jibhi & Tirthan Valley Hidden Trails Expedition', location: 'Tirthan Valley, Himachal Pradesh', destination: 'Himachal Pradesh', duration: '3N/4D', price: 11500, image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop', slug: 'jibhi-tirthan-valley' },
  '6': { title: 'Bir Billing Paragliding & Tibetan Monastery Circuit', location: 'Bir Billing, Himachal Pradesh', destination: 'Himachal Pradesh', duration: '3N/4D', price: 12500, image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1200&auto=format&fit=crop', slug: 'bir-billing-paragliding' },
  '7': { title: 'Kinnaur Valley: Sangla, Chitkul & Kalpa Border Circuit', location: 'Kinnaur, Himachal Pradesh', destination: 'Himachal Pradesh', duration: '5N/6D', price: 18500, image: 'https://images.unsplash.com/photo-1626714486950-c63bf1084b64?q=80&w=1200&auto=format&fit=crop', slug: 'kinnaur-chitkul-circuit' },
  '8': { title: 'Shimla, Kufri & Mashobra Heritage Colonial Getaway', location: 'Shimla, Himachal Pradesh', destination: 'Himachal Pradesh', duration: '3N/4D', price: 11000, image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=1200&auto=format&fit=crop', slug: 'shimla-mashobra-getaway' },
  '9': { title: 'Dalhousie & Khajjiar Mini Switzerland Forest Circuit', location: 'Dalhousie, Himachal Pradesh', destination: 'Himachal Pradesh', duration: '4N/5D', price: 13000, image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop', slug: 'dalhousie-khajjiar-circuit' },
  '10': { title: 'Hampta Pass & Chandratal Alpine Crossover Trek', location: 'Manali to Spiti, Himachal Pradesh', destination: 'Himachal Pradesh', duration: '5N/6D', price: 15500, image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop', slug: 'hampta-pass-trek' },
  '11': { title: 'Pin Parvati Pass High-Altitude Wilderness Expedition', location: 'Parvati to Spiti, Himachal Pradesh', destination: 'Himachal Pradesh', duration: '7N/8D', price: 32000, image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop', slug: 'pin-parvati-pass-expedition' },
  '12': { title: 'Spiti Winter White Expedition & Snow Leopard Trail', location: 'Spiti Valley, Himachal Pradesh', destination: 'Himachal Pradesh', duration: '6N/7D', price: 28000, image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1200&auto=format&fit=crop', slug: 'spiti-winter-white-expedition' },

  // Uttarakhand (13-20)
  '13': { title: 'Kedarnath & Badrinath Sacred Himalayan Circuit', location: 'Kedarnath, Uttarakhand', destination: 'Uttarakhand', duration: '5N/6D', price: 19500, image: 'https://images.pexels.com/photos/442579/pexels-photo-442579.jpeg', slug: 'kedarnath-badrinath-circuit' },
  '14': { title: 'Rishikesh Whitewater Rafting & Riverside Camping', location: 'Rishikesh, Uttarakhand', destination: 'Uttarakhand', duration: '2N/3D', price: 6500, image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop', slug: 'rishikesh-rafting-camping' },
  '15': { title: 'Chopta Tungnath & Chandrashila Peak Trek', location: 'Chopta, Uttarakhand', destination: 'Uttarakhand', duration: '3N/4D', price: 9500, image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop', slug: 'chopta-tungnath-chandrashila' },
  '16': { title: 'Auli Skiing, Ropeway & Valley of Flowers Trek', location: 'Auli, Uttarakhand', destination: 'Uttarakhand', duration: '5N/6D', price: 18000, image: 'https://images.unsplash.com/photo-1596761611076-02720db1b4f8?q=80&w=1200&auto=format&fit=crop', slug: 'auli-valley-of-flowers' },
  '17': { title: 'Nainital & Jim Corbett Wilderness Tiger Safari', location: 'Corbett & Nainital, Uttarakhand', destination: 'Uttarakhand', duration: '4N/5D', price: 14500, image: 'https://images.unsplash.com/photo-1586796676774-c93004ae009f?q=80&w=1200&auto=format&fit=crop', slug: 'nainital-corbett-safari' },
  '18': { title: 'Mussoorie, Landour & Dhanaulti Misty Hills', location: 'Mussoorie, Uttarakhand', destination: 'Uttarakhand', duration: '3N/4D', price: 11000, image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1200&auto=format&fit=crop', slug: 'mussoorie-landour-dhanaulti' },
  '19': { title: 'Dayara Bugyal High-Altitude Alpine Meadow Trek', location: 'Uttarkashi, Uttarakhand', destination: 'Uttarakhand', duration: '4N/5D', price: 11500, image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop', slug: 'dayara-bugyal-trek' },
  '20': { title: 'Nag Tibba Weekend Backpacker Summit Trek', location: 'Pantwari, Uttarakhand', destination: 'Uttarakhand', duration: '2N/3D', price: 6500, image: 'https://images.unsplash.com/photo-1596761611076-02720db1b4f8?q=80&w=1200&auto=format&fit=crop', slug: 'nag-tibba-weekend-trek' },

  // Meghalaya (21-26)
  '21': { title: 'Meghalaya Backpacking: Land of Clouds & Living Root Bridges', location: 'Meghalaya, India', destination: 'Meghalaya', duration: '5N/6D', price: 18500, image: 'https://images.pexels.com/photos/17334314/pexels-photo-17334314.jpeg', slug: 'meghalaya-backpacking-living-root-bridges' },
  '22': { title: 'Cherrapunji (Sohra) Waterfalls & Cave Odyssey', location: 'Cherrapunji, Meghalaya', destination: 'Meghalaya', duration: '4N/5D', price: 16000, image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop', slug: 'cherrapunji-waterfalls-caves' },
  '23': { title: 'Dawki Glass River & Mawlynnong Eco Trail', location: 'Dawki, Meghalaya', destination: 'Meghalaya', duration: '3N/4D', price: 13500, image: 'https://images.pexels.com/photos/17334314/pexels-photo-17334314.jpeg', slug: 'dawki-glass-river-mawlynnong' },
  '24': { title: 'Kongthong Whistling Village & Bamboo Trail', location: 'East Khasi Hills, Meghalaya', destination: 'Meghalaya', duration: '4N/5D', price: 15500, image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop', slug: 'kongthong-whistling-village' },
  '25': { title: 'Jaintia Hills Krang Suri Blue Lagoon Circuit', location: 'Jowai, Meghalaya', destination: 'Meghalaya', duration: '3N/4D', price: 12500, image: 'https://images.pexels.com/photos/17334314/pexels-photo-17334314.jpeg', slug: 'jaintia-hills-krang-suri' },
  '26': { title: 'Garo Hills Nokrek Biosphere & Siju Cave Expedition', location: 'Garo Hills, Meghalaya', destination: 'Meghalaya', duration: '5N/6D', price: 19500, image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop', slug: 'garo-hills-nokrek-biosphere' },

  // Kashmir (27-31)
  '27': { title: 'Kashmir Paradise: Srinagar, Gulmarg & Pahalgam', location: 'Srinagar, Kashmir', destination: 'Kashmir', duration: '5N/6D', price: 21500, image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=2070&auto=format&fit=crop', slug: 'kashmir-srinagar-gulmarg-pahalgam' },
  '28': { title: 'Kashmir Great Lakes Alpine High Altitude Trek', location: 'Sonamarg to Naranag, Kashmir', destination: 'Kashmir', duration: '7N/8D', price: 24500, image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop', slug: 'kashmir-great-lakes-trek' },
  '29': { title: 'Sonamarg Glacier & Doodhpathri Valley of Milk', location: 'Sonamarg, Kashmir', destination: 'Kashmir', duration: '4N/5D', price: 17500, image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=2070&auto=format&fit=crop', slug: 'sonamarg-doodhpathri-kashmir' },
  '30': { title: 'Gurez Valley Offbeat Himalayan Border Circuit', location: 'Gurez Valley, Kashmir', destination: 'Kashmir', duration: '5N/6D', price: 22500, image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop', slug: 'gurez-valley-kashmir' },
  '31': { title: 'Winter Gulmarg Skiing & Snowboarding Retreat', location: 'Gulmarg, Kashmir', destination: 'Kashmir', duration: '4N/5D', price: 26000, image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=2070&auto=format&fit=crop', slug: 'winter-gulmarg-ski-retreat' },

  // Goa (32-35)
  '32': { title: 'South Goa Heritage, Hidden Waterfalls & Secret Beaches', location: 'South Goa, India', destination: 'Goa', duration: '3N/4D', price: 12500, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=60', slug: 'south-goa-hidden-beaches' },
  '33': { title: 'North Goa Beachside Backpacking & Sunset Cruise', location: 'North Goa, India', destination: 'Goa', duration: '4N/5D', price: 13500, image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&auto=format&fit=crop&q=60', slug: 'north-goa-backpacking' },
  '34': { title: 'Gokarna & South Goa Dual Coastline Circuit', location: 'Gokarna & Goa, India', destination: 'Goa', duration: '4N/5D', price: 14500, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=60', slug: 'gokarna-south-goa-circuit' },
  '35': { title: 'Dudhsagar Waterfalls & Spice Plantation 4x4 Jeep Safari', location: 'Mollem, Goa', destination: 'Goa', duration: '2N/3D', price: 8500, image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&auto=format&fit=crop&q=60', slug: 'dudhsagar-waterfalls-safari' },

  // Kerala (36-39)
  '36': { title: 'Kerala Backwaters, Munnar & Alleppey Luxury Houseboat', location: 'Munnar & Alleppey, Kerala', destination: 'Kerala', duration: '4N/5D', price: 15500, image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=2069&auto=format&fit=crop', slug: 'kerala-backwaters-munnar-alleppey' },
  '37': { title: 'Wayanad Rainforest, Bamboo Rafting & Treehouse Stay', location: 'Wayanad, Kerala', destination: 'Kerala', duration: '3N/4D', price: 13500, image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop', slug: 'wayanad-rainforest-treehouse' },
  '38': { title: 'Varkala Cliffside Surf, Yoga & Sunset Retreat', location: 'Varkala, Kerala', destination: 'Kerala', duration: '3N/4D', price: 11500, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=60', slug: 'varkala-cliff-surf-retreat' },
  '39': { title: 'Thekkady Periyar Tiger Reserve & Spice Trails', location: 'Thekkady, Kerala', destination: 'Kerala', duration: '3N/4D', price: 12000, image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=2069&auto=format&fit=crop', slug: 'thekkady-tiger-reserve-kerala' },

  // Ladakh (40-43)
  '40': { title: 'Ladakh Leh, Pangong Tso & Nubra Valley Circuit', location: 'Leh Ladakh, India', destination: 'Ladakh', duration: '6N/7D', price: 24500, image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=60', slug: 'ladakh-leh-pangong-nubra' },
  '41': { title: 'Zanskar Valley Offbeat Rugged Expedition', location: 'Zanskar, Ladakh', destination: 'Ladakh', duration: '7N/8D', price: 29500, image: 'https://images.unsplash.com/photo-1626714486950-c63bf1084b64?q=80&w=1200&auto=format&fit=crop', slug: 'zanskar-valley-expedition' },
  '42': { title: 'Markha Valley High Altitude Trekking Odyssey', location: 'Hemis National Park, Ladakh', destination: 'Ladakh', duration: '6N/7D', price: 22000, image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop', slug: 'markha-valley-trek' },
  '43': { title: 'Sham Valley Apricot Blossom & Heritage Trail', location: 'Lower Ladakh, India', destination: 'Ladakh', duration: '4N/5D', price: 16500, image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=60', slug: 'sham-valley-apricot-trail' },

  // Bali (44-47)
  '44': { title: 'Bali Island & Nusa Penida Tropical Escape', location: 'Bali, Indonesia', destination: 'Bali', duration: '5N/6D', price: 45000, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1938&auto=format&fit=crop', slug: 'bali-island-nusa-penida-escape' },
  '45': { title: 'Ubud Spiritual Retreat, Rice Terraces & Waterfall Sanctuary', location: 'Ubud, Bali, Indonesia', destination: 'Bali', duration: '4N/5D', price: 38000, image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop', slug: 'ubud-spiritual-retreat' },
  '46': { title: 'Gili Islands Coral Reef & Sea Turtle Snorkeling Cruise', location: 'Gili Trawangan, Indonesia', destination: 'Bali', duration: '4N/5D', price: 39000, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop', slug: 'gili-islands-snorkeling-cruise' },
  '47': { title: 'Mount Batur Sunrise Volcano Trek & Natural Hot Springs', location: 'Kintamani, Bali, Indonesia', destination: 'Bali', duration: '3N/4D', price: 34000, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1938&auto=format&fit=crop', slug: 'mount-batur-sunrise-trek' },

  // Rajasthan (48-50)
  '48': { title: 'Udaipur & Mount Abu Royal Lakes Expedition', location: 'Udaipur, Rajasthan', destination: 'Rajasthan', duration: '4N/5D', price: 15500, image: 'https://images.unsplash.com/photo-1609137144822-77eb5782782e?w=600&auto=format&fit=crop&q=60', slug: 'udaipur-mount-abu-royal-lakes' },
  '49': { title: 'Jaisalmer Golden Sand Dunes & Desert Camping', location: 'Jaisalmer, Rajasthan', destination: 'Rajasthan', duration: '3N/4D', price: 12500, image: 'https://images.unsplash.com/photo-1609137144822-77eb5782782e?w=600&auto=format&fit=crop&q=60', slug: 'jaisalmer-golden-desert-camp' },
  '50': { title: 'Jaipur, Jodhpur & Pushkar Cultural Heritage Odyssey', location: 'Jaipur to Jodhpur, Rajasthan', destination: 'Rajasthan', duration: '5N/6D', price: 17500, image: 'https://images.unsplash.com/photo-1609137144822-77eb5782782e?w=600&auto=format&fit=crop&q=60', slug: 'jaipur-jodhpur-pushkar-heritage' }
};

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay Test Mode credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are missing in environment variables.');
  }

  return new Razorpay({ key_id, key_secret });
};

// Helper: Authoritative Server-Side Price Calculation
const calculateServerPrice = async (trip, travelersCount, occupancy, couponCode) => {
  const count = Math.max(1, parseInt(travelersCount, 10) || 1);
  const basePerPerson = Number(trip.price) || 18500;
  
  let occupancyDiff = 0;
  if (occupancy === 'Single Sharing') occupancyDiff = 3500;
  else if (occupancy === 'Triple Sharing') occupancyDiff = -1500;

  const effectivePerPerson = Math.max(1000, basePerPerson + occupancyDiff);
  const subtotal = effectivePerPerson * count;

  let discount = 0;
  let validatedCoupon = null;

  if (couponCode && couponCode.trim()) {
    const code = couponCode.trim().toUpperCase();
    if (code === 'GOA-KR7X9P' || code === 'GAURAV15' || code === 'EARLYBIRD15') {
      discount = Math.round(subtotal * 0.15);
      validatedCoupon = { code, discountValue: 15, discountType: 'percentage', influencerId: 'usr_influencer' };
    } else if (code === 'MEGH-X82P9A' || code === 'WANDER10' || code === 'EXPLOREWITHGAURAV') {
      discount = Math.round(subtotal * 0.10);
      validatedCoupon = { code, discountValue: 10, discountType: 'percentage', influencerId: 'usr_influencer' };
    } else if (code === 'SUMMER500') {
      discount = 500;
      validatedCoupon = { code, discountValue: 500, discountType: 'flat', influencerId: 'usr_influencer' };
    } else {
      const dbCoupon = await Coupon.findOne({ code, status: 'active' });
      if (dbCoupon) {
        discount = dbCoupon.discountType === 'percentage'
          ? Math.round(subtotal * (dbCoupon.discountValue / 100))
          : dbCoupon.discountValue;
        validatedCoupon = dbCoupon;
      }
    }
  }

  const finalAmount = Math.max(1, subtotal - discount);

  return {
    count,
    basePricePerPerson: effectivePerPerson,
    subtotal,
    discount,
    taxes: 0,
    finalAmount,
    currency: 'INR',
    validatedCoupon
  };
};

// @desc    Create Razorpay Test Order and Pending Booking in MongoDB
// @route   POST /api/bookings/create-order
// @access  Private
export const createBookingOrder = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required to create a booking.' });
    }

    const {
      tripId,
      travelersCount,
      batchDate,
      occupancy,
      pickupPoint,
      leadTraveler,
      coTravelers,
      couponCode
    } = req.body;

    if (!tripId) {
      return res.status(400).json({ message: 'Trip ID is required for booking.' });
    }

    // 1. Fetch trip from DB or Static Catalog
    let trip = null;
    try {
      trip = await Trip.findById(tripId);
    } catch (e) {
      // Ignored if tripId is not a MongoDB ObjectId
    }

    if (!trip) {
      trip = await Trip.findOne({ slug: String(tripId).toLowerCase() });
    }

    if (!trip && STATIC_TRIPS_CATALOG[String(tripId)]) {
      trip = STATIC_TRIPS_CATALOG[String(tripId)];
    }

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or no longer available for booking.' });
    }

    // 2. Authoritative Server-Side Pricing Calculation
    const pricing = await calculateServerPrice(
      trip,
      travelersCount,
      occupancy,
      couponCode
    );

    // 3. Generate Unique Human-Friendly Booking ID & Verification Token
    const bookingId = 'WLX-2026-' + Math.floor(100000 + Math.random() * 900000);
    const verificationToken = crypto.randomBytes(16).toString('hex');

    // 4. Create Razorpay Test Order
    const rzp = getRazorpayInstance();
    const rzpOrder = await rzp.orders.create({
      amount: pricing.finalAmount * 100, // in paise
      currency: 'INR',
      receipt: bookingId,
      notes: {
        bookingId,
        userId: userId.toString(),
        tripTitle: trip.title,
        travelersCount: String(pricing.count)
      }
    });

    console.log(`[RAZORPAY ORDER CREATED] Order ID: ${rzpOrder.id} for Booking ${bookingId}, Amount: ₹${pricing.finalAmount}`);

    // 5. Create Pending Booking Record in MongoDB
    const booking = await Booking.create({
      bookingId,
      userId,
      tripId: String(tripId),
      tripSnapshot: {
        title: trip.title,
        location: trip.location || 'India',
        destination: trip.destination || trip.location || 'India',
        image: trip.image,
        duration: trip.duration,
        batchDate: batchDate || '15 Sep - 20 Sep 2026',
        pickupPoint: pickupPoint || 'Main Arrival Meeting Hub'
      },
      customer: {
        name: leadTraveler?.name || req.user.name,
        email: leadTraveler?.email || req.user.email,
        phone: leadTraveler?.phone || req.user.phone || '',
        age: leadTraveler?.age || '',
        gender: leadTraveler?.gender || 'Male'
      },
      travelers: coTravelers || [],
      numberOfTravelers: pricing.count,
      occupancy: occupancy || 'Double Sharing',
      pricing: {
        basePricePerPerson: pricing.basePricePerPerson,
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        couponCode: couponCode ? couponCode.trim().toUpperCase() : '',
        taxes: 0,
        finalAmount: pricing.finalAmount,
        currency: 'INR'
      },
      payment: {
        provider: 'razorpay',
        status: 'PENDING',
        razorpayOrderId: rzpOrder.id
      },
      bookingStatus: 'PENDING_PAYMENT',
      qrCode: {
        verificationToken,
        verificationUrl: `https://wanderluxe.in/booking/verify/${verificationToken}`
      },
      influencerAttribution: pricing.validatedCoupon ? {
        influencerId: pricing.validatedCoupon.influencerId || 'usr_influencer',
        couponCode: pricing.validatedCoupon.code,
        commissionRate: 10,
        commissionAmount: Math.round(pricing.finalAmount * 0.1)
      } : {}
    });

    res.status(201).json({
      success: true,
      bookingId: booking.bookingId,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      customer: booking.customer,
      pricing: booking.pricing,
      tripSnapshot: booking.tripSnapshot
    });
  } catch (error) {
    console.error('Create Booking Order Error:', error);
    res.status(500).json({ message: error.message || 'Server Error creating payment order' });
  }
};

// @desc    Verify Razorpay Payment Signature, Confirm Booking, and Generate Unique QR Code
// @route   POST /api/bookings/verify-payment
// @access  Private
export const verifyBookingPayment = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing required payment verification parameters.' });
    }

    // 1. Fetch Booking from MongoDB
    const booking = await Booking.findOne({ bookingId, userId });
    if (!booking) {
      return res.status(404).json({ message: 'Booking record not found or access denied.' });
    }

    // 2. Idempotency Check: If already confirmed, safely return confirmed booking
    if (booking.bookingStatus === 'CONFIRMED' && booking.payment.status === 'PAID') {
      return res.json({
        success: true,
        message: 'Booking was already confirmed.',
        booking
      });
    }

    // 3. Verify that the Razorpay Order ID matches the booking
    if (booking.payment.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: 'Order mismatch: Razorpay Order ID does not match this booking.' });
    }

    // 4. Server-Side Cryptographic Signature Verification (HMAC-SHA256)
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const bodyToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyToSign)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error(`[PAYMENT VERIFICATION FAILED] Signature mismatch for Booking ${bookingId}`);
      booking.payment.status = 'FAILED';
      booking.bookingStatus = 'FAILED';
      await booking.save();
      return res.status(400).json({ message: 'Invalid payment signature. Payment verification failed.' });
    }

    console.log(`[PAYMENT VERIFIED SUCCESS] Booking ${bookingId} verified with Payment ID: ${razorpay_payment_id}`);

    // 5. Generate Unique Scannable QR Code Data URL
    const qrPayload = JSON.stringify({
      bookingId: booking.bookingId,
      token: booking.qrCode.verificationToken,
      trip: booking.tripSnapshot.title,
      travelers: booking.numberOfTravelers,
      batchDate: booking.tripSnapshot.batchDate,
      lead: booking.customer.name,
      status: 'CONFIRMED'
    });

    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0b132b',
          light: '#ffffff'
        }
      });
    } catch (qrErr) {
      console.warn('QR generation error (non-fatal):', qrErr.message);
    }

    // 6. Update MongoDB Booking State to CONFIRMED and Payment to PAID
    booking.payment.status = 'PAID';
    booking.payment.razorpayPaymentId = razorpay_payment_id;
    booking.payment.razorpaySignature = razorpay_signature;
    booking.payment.paidAt = new Date();
    booking.bookingStatus = 'CONFIRMED';
    if (qrDataUrl) {
      booking.qrCode.dataUrl = qrDataUrl;
    }
    await booking.save();

    // 7. Save Booking Snapshot to User Profile
    const user = await User.findById(userId);
    if (user) {
      user.bookedTrips = user.bookedTrips || [];
      const alreadyInUser = user.bookedTrips.some(
        (b) => b.id === booking.bookingId || b.bookingId === booking.bookingId
      );

      if (!alreadyInUser) {
        user.bookedTrips.unshift({
          id: booking.bookingId,
          bookingId: booking.bookingId,
          tripTitle: booking.tripSnapshot.title,
          destination: booking.tripSnapshot.destination,
          image: booking.tripSnapshot.image,
          duration: booking.tripSnapshot.duration,
          travelDate: booking.tripSnapshot.batchDate,
          travelers: booking.numberOfTravelers,
          amount: booking.pricing.finalAmount,
          status: 'Confirmed',
          bookingDate: new Date().toISOString().split('T')[0],
          qrCode: qrDataUrl
        });
        await user.save();
      }
    }

    // 8. Record Influencer Commission Ledger Entry if Coupon Applied
    if (booking.influencerAttribution?.couponCode) {
      try {
        await Commission.create({
          bookingId: booking.bookingId,
          influencerId: booking.influencerAttribution.influencerId || 'usr_influencer',
          couponCode: booking.influencerAttribution.couponCode,
          baseAmount: booking.pricing.subtotal,
          amount: booking.influencerAttribution.commissionAmount,
          status: 'CONFIRMED'
        });

        await WalletLedger.create({
          influencerId: booking.influencerAttribution.influencerId || 'usr_influencer',
          bookingId: booking.bookingId,
          type: 'COMMISSION_CONFIRMED',
          amount: booking.influencerAttribution.commissionAmount,
          status: 'Settled',
          reference: `Verified Booking ${booking.bookingId} (${booking.tripSnapshot.title})`
        });
      } catch (ledgerErr) {
        console.warn('Ledger recording error (non-fatal):', ledgerErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Payment verified and booking confirmed successfully.',
      booking
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ message: error.message || 'Server Error verifying payment' });
  }
};

// @desc    Get Authenticated User's Bookings History from MongoDB
// @route   GET /api/bookings/my-bookings
// @access  Private
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const bookings = await Booking.find({ userId }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error fetching user bookings' });
  }
};

// @desc    Get Single Booking by Booking ID (Protected - Owner or Admin only)
// @route   GET /api/bookings/:bookingId
// @access  Private
export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?._id;

    const query = [{ bookingId }];
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      query.push({ _id: bookingId });
    }

    const booking = await Booking.findOne({ $or: query });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Access Control: Only owner or admin can view details
    const isOwner = booking.userId && booking.userId.toString() === userId.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to view this booking.' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error fetching booking details' });
  }
};

// @desc    Get Structured Boarding Pass Document Data (Protected - Owner or Admin only)
// @route   GET /api/bookings/:bookingId/boarding-pass
// @access  Private
export const getBoardingPassData = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const query = [{ bookingId }];
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      query.push({ _id: bookingId });
    }

    const booking = await Booking.findOne({ $or: query });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Access Control: Only owner or admin can access boarding pass
    const isOwner = booking.userId && booking.userId.toString() === userId.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to view this boarding pass.' });
    }

    // Must be confirmed and paid
    if (booking.bookingStatus !== 'CONFIRMED' || booking.payment.status !== 'PAID') {
      return res.status(400).json({ 
        message: `Boarding Pass is only available for confirmed and paid bookings. Current status: ${booking.bookingStatus} (${booking.payment.status})`,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.payment.status
      });
    }

    // Ensure high-resolution QR code dataUrl exists
    let qrDataUrl = booking.qrCode?.dataUrl;
    if (!qrDataUrl) {
      const qrPayload = JSON.stringify({
        bookingId: booking.bookingId,
        token: booking.qrCode?.verificationToken,
        trip: booking.tripSnapshot.title,
        travelers: booking.numberOfTravelers,
        batchDate: booking.tripSnapshot.batchDate,
        lead: booking.customer.name,
        status: 'CONFIRMED'
      });

      try {
        qrDataUrl = await QRCode.toDataURL(qrPayload, {
          width: 360,
          margin: 2,
          color: {
            dark: '#0b132b',
            light: '#ffffff'
          }
        });
        booking.qrCode.dataUrl = qrDataUrl;
        await booking.save();
      } catch (qrErr) {
        console.warn('QR regeneration error:', qrErr.message);
      }
    }

    res.json({
      success: true,
      boardingPass: {
        bookingId: booking.bookingId,
        bookingStatus: booking.bookingStatus,
        confirmedAt: booking.payment.paidAt || booking.updatedAt || booking.createdAt,
        trip: {
          tripId: booking.tripId,
          title: booking.tripSnapshot.title,
          destination: booking.tripSnapshot.destination || booking.tripSnapshot.location || 'India',
          duration: booking.tripSnapshot.duration,
          batchDate: booking.tripSnapshot.batchDate,
          pickupPoint: booking.tripSnapshot.pickupPoint || 'Airport Arrival Terminal / Main Meeting Point',
          image: booking.tripSnapshot.image
        },
        leadTraveler: {
          name: booking.customer.name,
          email: booking.customer.email,
          phone: booking.customer.phone,
          age: booking.customer.age,
          gender: booking.customer.gender
        },
        coTravelers: booking.travelers || [],
        numberOfTravelers: booking.numberOfTravelers,
        occupancy: booking.occupancy || 'Double Sharing',
        pricing: {
          basePricePerPerson: booking.pricing.basePricePerPerson,
          subtotal: booking.pricing.subtotal,
          discount: booking.pricing.discount,
          couponCode: booking.pricing.couponCode,
          finalAmount: booking.pricing.finalAmount,
          currency: booking.pricing.currency || 'INR'
        },
        payment: {
          status: booking.payment.status,
          razorpayPaymentId: booking.payment.razorpayPaymentId || 'rzp_test_verified',
          paidAt: booking.payment.paidAt || booking.updatedAt
        },
        qrCode: {
          dataUrl: qrDataUrl || booking.qrCode?.dataUrl,
          verificationToken: booking.qrCode?.verificationToken,
          verificationUrl: booking.qrCode?.verificationUrl || `https://wanderluxe.in/booking/verify/${booking.qrCode?.verificationToken}`
        },
        supportContact: {
          phone: '+91 85420 36499',
          email: 'support@wanderluxe.in',
          captainName: 'Gaurav Kumar Yadav (Certified Expedition Lead)'
        }
      }
    });
  } catch (error) {
    console.error('Get Boarding Pass Error:', error);
    res.status(500).json({ message: error.message || 'Server Error fetching boarding pass' });
  }
};

// @desc    Public QR Code Verification Endpoint (Safe Summary, No Secrets)
// @route   GET /api/bookings/verify/:token
// @access  Public
export const verifyBookingToken = async (req, res) => {
  try {
    const { token } = req.params;

    const booking = await Booking.findOne({ 'qrCode.verificationToken': token });

    if (!booking) {
      return res.status(404).json({ valid: false, message: 'Invalid QR verification token. No booking found.' });
    }

    res.json({
      valid: true,
      bookingId: booking.bookingId,
      tripTitle: booking.tripSnapshot.title,
      destination: booking.tripSnapshot.destination,
      duration: booking.tripSnapshot.duration,
      batchDate: booking.tripSnapshot.batchDate,
      pickupPoint: booking.tripSnapshot.pickupPoint,
      numberOfTravelers: booking.numberOfTravelers,
      customerName: booking.customer.name,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.payment.status,
      confirmedAt: booking.payment.paidAt || booking.updatedAt
    });
  } catch (error) {
    res.status(500).json({ valid: false, message: error.message || 'Server Error verifying token' });
  }
};
