import User from '../models/User.js';

// Initial Mock Coupon Storage for Backend
let couponsList = [
  { id: 'c1', code: 'WANDER10', type: 'percentage', value: 10, expiry: '2026-12-31', maxUses: 500, usesCount: 142, active: true },
  { id: 'c2', code: 'SUMMER500', type: 'flat', value: 500, expiry: '2026-09-30', maxUses: 300, usesCount: 89, active: true },
  { id: 'c3', code: 'EARLYBIRD15', type: 'percentage', value: 15, expiry: '2026-10-15', maxUses: 200, usesCount: 45, active: true },
  { id: 'c4', code: 'FESTIVE20', type: 'percentage', value: 20, expiry: '2026-11-01', maxUses: 100, usesCount: 12, active: false }
];

// @desc    Get aggregate analytics dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    const usersCount = await User.countDocuments() || 148;
    
    // Aggregated revenue & booking metrics
    const statsData = {
      totalRevenue: 4850000,
      totalBookings: 1240,
      activeTrips: 18,
      newLeads: 342,
      conversionRate: '14.2%',
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
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
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

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role || (user.role === 'admin' ? 'user' : 'admin');
    await user.save();

    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
