import mongoose from 'mongoose';
import User from '../models/User.js';
import Trip from '../models/Trip.js';
import Booking from '../models/Booking.js';
import Lead from '../models/Lead.js';
import Review from '../models/Review.js';

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

let couponsList = [
  { id: 'c1', code: 'WANDER10', type: 'percentage', value: 10, expiry: '2026-12-31', maxUses: 500, usesCount: 0, active: true },
  { id: 'c2', code: 'SUMMER500', type: 'flat', value: 500, expiry: '2026-09-30', maxUses: 300, usesCount: 0, active: true },
  { id: 'c3', code: 'EARLYBIRD15', type: 'percentage', value: 15, expiry: '2026-10-15', maxUses: 200, usesCount: 0, active: true },
  { id: 'c4', code: 'FESTIVE20', type: 'percentage', value: 20, expiry: '2026-11-01', maxUses: 100, usesCount: 0, active: false }
];

// @desc    Get aggregate analytics dashboard statistics (Real MongoDB Aggregation - ZERO Mock Data)
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    const { range = '30d' } = req.query;

    let dateFilter = {};
    const now = new Date();

    if (range === '7d') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: past7 } };
    } else if (range === '30d') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: past30 } };
    } else if (range === '90d') {
      const past90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: past90 } };
    } else if (range === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      dateFilter = { createdAt: { $gte: startOfYear } };
    }

    let totalUsers = 0;
    let totalBookings = 0;
    let confirmedBookings = 0;
    let pendingBookings = 0;
    let cancelledBookings = 0;
    let totalRevenue = 0;
    let activeTrips = 0;
    let totalLeads = 0;
    let convertedLeads = 0;
    let totalReviews = 0;
    let monthlyRevenue = [];
    let destinationBreakdown = [];
    let topTrips = [];

    if (isDbConnected()) {
      try {
        // 1. Users Count
        totalUsers = await User.countDocuments();

        // 2. Active Trips
        activeTrips = await Trip.countDocuments({ status: { $ne: 'draft' }, isActive: { $ne: false } });

        // 3. Leads Count
        totalLeads = await Lead.countDocuments(dateFilter);
        convertedLeads = await Lead.countDocuments({ ...dateFilter, status: 'CONVERTED' });

        // 4. Reviews Count
        totalReviews = await Review.countDocuments();

        // 5. Booking Counts
        totalBookings = await Booking.countDocuments(dateFilter);
        confirmedBookings = await Booking.countDocuments({ ...dateFilter, bookingStatus: 'CONFIRMED' });
        pendingBookings = await Booking.countDocuments({ ...dateFilter, bookingStatus: { $in: ['PENDING_PAYMENT', 'PENDING'] } });
        cancelledBookings = await Booking.countDocuments({ ...dateFilter, bookingStatus: 'CANCELLED' });

        // 6. Verified Revenue (Collected Cash from PAID and PARTIALLY_PAID bookings)
        const revenueAgg = await Booking.aggregate([
          {
            $match: {
              ...dateFilter,
              $or: [
                { 'payment.status': 'PAID' },
                { paymentStatus: { $in: ['PAID', 'PARTIALLY_PAID'] } },
                { bookingStatus: { $in: ['CONFIRMED', 'PROVISIONALLY_CONFIRMED'] } }
              ]
            }
          },
          {
            $group: {
              _id: null,
              totalAmount: {
                $sum: {
                  $cond: [
                    { $gt: ['$pricing.amountPaid', 0] },
                    '$pricing.amountPaid',
                    { $ifNull: ['$pricing.finalAmount', 0] }
                  ]
                }
              }
            }
          }
        ]);
        totalRevenue = revenueAgg[0]?.totalAmount || 0;

        // 7. Monthly Revenue & Booking Trend (Last 12 Months)
        const monthsMap = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyAgg = await Booking.aggregate([
          {
            $match: {
              $or: [
                { 'payment.status': 'PAID' },
                { paymentStatus: { $in: ['PAID', 'PARTIALLY_PAID'] } },
                { bookingStatus: { $in: ['CONFIRMED', 'PROVISIONALLY_CONFIRMED'] } }
              ]
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              revenue: {
                $sum: {
                  $cond: [
                    { $gt: ['$pricing.amountPaid', 0] },
                    '$pricing.amountPaid',
                    { $ifNull: ['$pricing.finalAmount', 0] }
                  ]
                }
              },
              bookings: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        if (monthlyAgg.length > 0) {
          monthlyRevenue = monthlyAgg.map(item => ({
            month: `${monthsMap[item._id.month - 1]} ${item._id.year}`,
            revenue: item.revenue,
            bookings: item.bookings
          }));
        }

        // 8. Destination Breakdown from Verified Bookings
        const destAgg = await Booking.aggregate([
          {
            $group: {
              _id: { $ifNull: ['$tripSnapshot.destination', '$tripSnapshot.location'] },
              count: { $sum: 1 },
              revenue: { $sum: '$pricing.finalAmount' }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 6 }
        ]);

        if (destAgg.length > 0 && totalBookings > 0) {
          destinationBreakdown = destAgg.filter(d => d._id).map(d => ({
            name: d._id || 'Expeditions',
            count: d.count,
            revenue: d.revenue,
            percentage: Math.round((d.count / (totalBookings || 1)) * 100)
          }));
        }

        // 9. Top Trips from Bookings
        const topTripsAgg = await Booking.aggregate([
          {
            $group: {
              _id: '$tripSnapshot.title',
              bookingCount: { $sum: 1 },
              totalRevenue: { $sum: '$pricing.finalAmount' }
            }
          },
          { $sort: { bookingCount: -1 } },
          { $limit: 5 }
        ]);

        topTrips = topTripsAgg.filter(t => t._id).map(t => ({
          title: t._id,
          bookingCount: t.bookingCount,
          totalRevenue: t.totalRevenue
        }));

      } catch (dbErr) {
        console.warn('Analytics Aggregation Notice:', dbErr.message);
      }
    }

    const conversionRate = totalLeads > 0 
      ? `${((convertedLeads / totalLeads) * 100).toFixed(1)}%` 
      : (totalUsers > 0 && confirmedBookings > 0 ? `${((confirmedBookings / totalUsers) * 100).toFixed(1)}%` : '0%');

    const statsData = {
      totalRevenue,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      activeTrips,
      totalUsers,
      totalLeads,
      convertedLeads,
      conversionRate,
      totalReviews,
      monthlyRevenue,
      destinationBreakdown,
      topTrips,
      period: range,
      isRealData: true
    };

    res.json(statsData);
  } catch (error) {
    console.error('getAdminStats Error:', error);
    res.status(500).json({ message: error.message || 'Server Error generating analytics' });
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

// =========================================================================
// PROTECTED FROM REFACTOR: INFLUENCER APPROVALS & VERIFICATION ENGINE
// =========================================================================

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
      success: true,
      message: `Applicant ${user.name} approved successfully.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        influencerStatus: user.influencerStatus
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
    const { reason = 'Profile criteria not met' } = req.body;

    let user = null;
    if (isDbConnected()) {
      try {
        user = await User.findById(id);
      } catch (e) {}
    }

    if (!user) {
      return res.status(404).json({ message: 'Applicant user record not found.' });
    }

    user.influencerStatus = 'rejected';
    user.influencerApplication = {
      ...(user.influencerApplication || {}),
      rejectedAt: new Date(),
      reviewedBy: req.user?.email || 'admin@wanderluxe.in',
      rejectionReason: reason
    };

    if (isDbConnected() && typeof user.save === 'function') {
      await user.save();
    }

    res.json({
      success: true,
      message: `Applicant ${user.name} rejected.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        influencerStatus: user.influencerStatus
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Update trip-level SEO metadata
// @route   PUT /api/admin/trips/:id/seo
// @access  Private/Admin
export const updateTripSeo = async (req, res) => {
  try {
    const { id } = req.params;
    const { seoTitle, metaDescription, canonicalUrl, indexingDirective, ogTitle, ogDescription, ogImage } = req.body;

    let trip = null;
    if (isDbConnected()) {
      try {
        trip = await Trip.findById(id);
      } catch (e) {}
    }

    if (!trip) {
      return res.status(404).json({ message: 'Trip package not found.' });
    }

    trip.seo = {
      seoTitle: seoTitle || trip.seo?.seoTitle || trip.title,
      metaDescription: metaDescription || trip.seo?.metaDescription || trip.overview,
      canonicalUrl: canonicalUrl || trip.seo?.canonicalUrl || `https://wanderluxe.in/trip/${trip.slug}`,
      indexingDirective: indexingDirective || trip.seo?.indexingDirective || 'index, follow',
      ogTitle: ogTitle || trip.seo?.ogTitle || trip.title,
      ogDescription: ogDescription || trip.seo?.ogDescription || trip.overview,
      ogImage: ogImage || trip.seo?.ogImage || trip.heroImage || trip.image,
      structuredSchemaType: 'Product'
    };

    if (isDbConnected() && typeof trip.save === 'function') {
      await trip.save();
    }

    res.json({
      success: true,
      message: 'Trip SEO metadata saved and deployed successfully.',
      seo: trip.seo
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
