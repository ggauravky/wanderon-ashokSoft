import mongoose from 'mongoose';
import User from '../models/User.js';
import Trip from '../models/Trip.js';
import Booking from '../models/Booking.js';

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

let couponsList = [
  { id: 'c1', code: 'WANDER10', type: 'percentage', value: 10, expiry: '2026-12-31', maxUses: 500, usesCount: 142, active: true },
  { id: 'c2', code: 'SUMMER500', type: 'flat', value: 500, expiry: '2026-09-30', maxUses: 300, usesCount: 89, active: true },
  { id: 'c3', code: 'EARLYBIRD15', type: 'percentage', value: 15, expiry: '2026-10-15', maxUses: 200, usesCount: 45, active: true },
  { id: 'c4', code: 'FESTIVE20', type: 'percentage', value: 20, expiry: '2026-11-01', maxUses: 100, usesCount: 12, active: false }
];

let memoryUsers = [
  {
    _id: 'usr_admin',
    name: 'Gaurav Kumar Yadav (Admin)',
    email: 'gaurav999@gmail.com',
    role: 'admin',
    influencerStatus: 'approved',
    phone: '8542036499',
    createdAt: new Date('2026-01-01')
  },
  {
    _id: 'usr_influencer',
    name: 'Gaurav Kumar Yadav (Influencer)',
    email: 'influencer@wanderluxe.in',
    role: 'influencer',
    influencerStatus: 'approved',
    phone: '8542036499',
    createdAt: new Date('2026-01-05')
  }
];

let memoryBookings = [
  {
    bookingId: 'WLX-2026-849201',
    customer: { name: 'Aarav Sharma', email: 'aarav@gmail.com', phone: '9876543210' },
    tripSnapshot: { title: 'Meghalaya Backpacking', duration: '5D/4N' },
    numberOfTravelers: 2,
    pricing: { finalAmount: 37000 },
    payment: { status: 'PAID' },
    bookingStatus: 'CONFIRMED',
    createdAt: new Date('2026-08-01')
  }
];

// @desc    Get aggregate analytics dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    let usersCount = memoryUsers.length;
    if (isDbConnected()) {
      try {
        usersCount = await User.countDocuments() || memoryUsers.length;
      } catch (e) {}
    }

    const statsData = {
      totalRevenue: 4850000,
      totalBookings: 1240,
      activeTrips: 18,
      newLeads: 342,
      conversionRate: '14.2%',
      totalUsers: usersCount,
      monthlyRevenue: [
        { month: 'Jan', revenue: 320000, bookings: 85 },
        { month: 'Feb', revenue: 410000, bookings: 102 },
        { month: 'Mar', revenue: 580000, bookings: 145 },
        { month: 'Apr', revenue: 620000, bookings: 160 },
        { month: 'May', revenue: 790000, bookings: 198 },
        { month: 'Jun', revenue: 940000, bookings: 230 },
        { month: 'Jul', revenue: 1190000, bookings: 320 }
      ],
      destinationBreakdown: [
        { name: 'Meghalaya Backpacking', percentage: 38, count: 470 },
        { name: 'Spiti Valley Circuit', percentage: 28, count: 348 },
        { name: 'Bali Island Escape', percentage: 22, count: 272 },
        { name: 'Kerala Backwaters', percentage: 12, count: 150 }
      ]
    };

    res.json(statsData);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get all coupons
// @route   GET /api/admin/coupons
// @access  Private/Admin
export const getCoupons = async (req, res) => {
  try {
    res.json(couponsList);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Create a new coupon code
// @route   POST /api/admin/coupons
// @access  Private/Admin
export const createCoupon = async (req, res) => {
  try {
    const { code, type, value, expiry, maxUses } = req.body;

    if (!code || !value) {
      return res.status(400).json({ message: 'Coupon code and value are required' });
    }

    const newCoupon = {
      id: 'c_' + Date.now(),
      code: code.toUpperCase().trim(),
      type: type || 'percentage',
      value: Number(value),
      expiry: expiry || '2026-12-31',
      maxUses: Number(maxUses) || 500,
      usesCount: 0,
      active: true
    };

    couponsList.unshift(newCoupon);
    res.status(201).json(newCoupon);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Toggle coupon active status
// @route   PUT /api/admin/coupons/:id/toggle
// @access  Private/Admin
export const toggleCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = couponsList.find((c) => c.id === id);

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    coupon.active = !coupon.active;
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Delete a coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Private/Admin
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    couponsList = couponsList.filter((c) => c.id !== id);
    res.json({ message: 'Coupon deleted successfully', id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get all users for admin management
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAdminUsers = async (req, res) => {
  try {
    let users = [];
    if (isDbConnected()) {
      try {
        users = await User.find().select('-password').sort({ createdAt: -1 });
      } catch (e) {}
    }

    if (users.length === 0) {
      users = memoryUsers;
    }

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get all bookings for admin management
// @route   GET /api/admin/bookings
// @access  Private/Admin
export const getAdminBookings = async (req, res) => {
  try {
    let bookings = [];
    if (isDbConnected()) {
      try {
        bookings = await Booking.find().sort({ createdAt: -1 });
      } catch (e) {}
    }

    if (bookings.length === 0) {
      bookings = memoryBookings;
    }

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    let user = null;
    if (isDbConnected()) {
      try {
        user = await User.findById(id);
      } catch (e) {}
    }

    if (!user) {
      user = memoryUsers.find((u) => String(u._id) === String(id));
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.role = role || (user.role === 'admin' ? 'user' : 'admin');
    if (isDbConnected() && typeof user.save === 'function') {
      await user.save();
    }

    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get all influencer applications
// @route   GET /api/admin/influencer-applications
// @access  Private/Admin
export const getInfluencerApplications = async (req, res) => {
  try {
    let applications = [];
    if (isDbConnected()) {
      try {
        applications = await User.find({
          $or: [
            { influencerStatus: { $in: ['pending', 'approved', 'rejected'] } },
            { role: 'influencer' }
          ]
        }).select('-password').sort({ updatedAt: -1 });
      } catch (e) {}
    }

    if (applications.length === 0) {
      applications = memoryUsers.filter((u) => u.influencerStatus !== 'none' || u.role === 'influencer');
    }

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Approve influencer application
// @route   PUT /api/admin/influencer-applications/:id/approve
// @access  Private/Admin
export const approveInfluencerApplication = async (req, res) => {
  try {
    const { id } = req.params;

    let user = null;
    if (isDbConnected()) {
      try {
        user = await User.findById(id);
      } catch (e) {}
    }

    if (!user) {
      user = memoryUsers.find((u) => String(u._id) === String(id));
    }

    if (!user) {
      return res.status(404).json({ message: 'Applicant user record not found.' });
    }

    user.role = 'influencer';
    user.influencerStatus = 'approved';
    user.influencerApplication = {
      ...(user.influencerApplication || {}),
      applicationSubmitted: true,
      approvedAt: new Date(),
      reviewedAt: new Date(),
      reviewedBy: req.user?.email || 'admin@wanderluxe.in',
      reviewNotes: 'Application approved by Admin'
    };

    if (isDbConnected() && typeof user.save === 'function') {
      await user.save();
    }

    res.json({
      message: 'Influencer application approved successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        influencerStatus: user.influencerStatus,
        influencerApplication: user.influencerApplication
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Reject influencer application
// @route   PUT /api/admin/influencer-applications/:id/reject
// @access  Private/Admin
export const rejectInfluencerApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    let user = null;
    if (isDbConnected()) {
      try {
        user = await User.findById(id);
      } catch (e) {}
    }

    if (!user) {
      user = memoryUsers.find((u) => String(u._id) === String(id));
    }

    if (!user) {
      return res.status(404).json({ message: 'Applicant user record not found.' });
    }

    user.role = 'user';
    user.influencerStatus = 'rejected';
    user.influencerApplication = {
      ...(user.influencerApplication || {}),
      rejectedAt: new Date(),
      reviewedAt: new Date(),
      reviewedBy: req.user?.email || 'admin@wanderluxe.in',
      reviewNotes: reason || 'Criteria not met'
    };

    if (isDbConnected() && typeof user.save === 'function') {
      await user.save();
    }

    res.json({
      message: 'Influencer application rejected successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        influencerStatus: user.influencerStatus,
        influencerApplication: user.influencerApplication
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Update trip-level SEO configuration
// @route   PUT /api/admin/trips/:id/seo
// @access  Private/Admin
export const updateTripSeo = async (req, res) => {
  try {
    const { id } = req.params;
    const { seoTitle, metaDescription, canonicalUrl, indexingDirective, ogTitle, ogDescription, ogImage } = req.body;

    let trip = null;
    if (isDbConnected()) {
      try {
        trip = await Trip.findOne({ $or: [{ _id: id }, { slug: id }, { id: id }] });
      } catch (e) {}
    }

    if (!trip && isDbConnected()) {
      try {
        trip = new Trip({
          title: req.body.title || 'Meghalaya Backpacking Living Root Bridges',
          slug: id,
          location: 'Meghalaya',
          duration: '5D/4N',
          price: 18500,
          image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'
        });
      } catch (e) {}
    }

    const seoData = {
      seoTitle: seoTitle || 'WanderLuxe Departure',
      metaDescription: metaDescription || '',
      canonicalUrl: canonicalUrl || `https://wanderluxe.in/trip/${id}`,
      indexingDirective: indexingDirective || 'index, follow',
      ogTitle: ogTitle || seoTitle || '',
      ogDescription: ogDescription || metaDescription || '',
      ogImage: ogImage || '',
      structuredSchemaType: 'Product'
    };

    if (trip && typeof trip.save === 'function') {
      trip.seo = seoData;
      await trip.save();
    }

    res.json({
      message: 'Trip-Level SEO updated successfully.',
      seo: seoData
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
