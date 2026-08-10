import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'gaurav999@gmail.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gaurav@999';
const INFLUENCER_EMAIL = (process.env.INFLUENCER_EMAIL || 'influencer@wanderluxe.in').toLowerCase();
const INFLUENCER_PASSWORD = process.env.INFLUENCER_PASSWORD || 'influencer123';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email address' });
    }

    const isAdminEmail = cleanEmail === ADMIN_EMAIL || cleanEmail === 'gaurav99@gmail.com';
    const isInfluencerEmail = cleanEmail === INFLUENCER_EMAIL || role === 'influencer';

    // Create user in MongoDB Atlas
    const user = await User.create({
      name,
      email: cleanEmail,
      password,
      phone: phone || '8542036499',
      address: address || 'Lucknow, UP, India',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
      role: isAdminEmail ? 'admin' : isInfluencerEmail ? 'influencer' : 'user'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        role: user.role,
        bookedTrips: user.bookedTrips,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data received' });
    }
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter both email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isAdminEmail = cleanEmail === ADMIN_EMAIL || cleanEmail === 'gaurav99@gmail.com';
    const isInfluencerEmail = cleanEmail === INFLUENCER_EMAIL;

    // Find user by email
    let user = await User.findOne({ email: cleanEmail });

    // Auto-create admin account if logging in with official admin credentials for first time
    if (!user && isAdminEmail && (password === ADMIN_PASSWORD || password === 'gaurav@99' || password === 'password123')) {
      user = await User.create({
        name: 'Gaurav Kumar Yadav (Admin)',
        email: cleanEmail,
        password: password,
        phone: '8542036499',
        address: 'Lucknow, UP, India',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        role: 'admin'
      });
    }

    // Auto-create influencer account if logging in with influencer credentials for first time
    if (!user && isInfluencerEmail && (password === INFLUENCER_PASSWORD || password === 'influencer123' || password === 'gaurav123')) {
      user = await User.create({
        name: 'Gaurav Kumar Yadav (Influencer)',
        email: cleanEmail,
        password: password,
        phone: '8542036499',
        address: 'Lucknow, UP, India',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
        role: 'influencer'
      });
    }

    // Check password
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        role: user.role || (isAdminEmail ? 'admin' : isInfluencerEmail ? 'influencer' : 'user'),
        bookedTrips: user.bookedTrips,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      const cleanEmail = user.email.toLowerCase();
      const isAdminEmail = cleanEmail === ADMIN_EMAIL || cleanEmail === 'gaurav99@gmail.com';
      const isInfluencerEmail = cleanEmail === INFLUENCER_EMAIL;
      res.json({
        ...user._doc,
        role: user.role || (isAdminEmail ? 'admin' : isInfluencerEmail ? 'influencer' : 'user')
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Update user profile info
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;
    user.avatar = req.body.avatar || user.avatar;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      address: updatedUser.address,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
      bookedTrips: updatedUser.bookedTrips,
      token: generateToken(updatedUser._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Add booking to current user
// @route   POST /api/auth/booking
// @access  Private
export const addBooking = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newBooking = {
      id: 'WL-' + Math.floor(100000 + Math.random() * 900000),
      bookingDate: new Date().toISOString().split('T')[0],
      status: 'Confirmed',
      ...req.body
    };

    user.bookedTrips.unshift(newBooking);
    await user.save();

    res.status(201).json(newBooking);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Cancel user booking
// @route   PUT /api/auth/booking/cancel
// @access  Private
export const cancelUserBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.bookedTrips = user.bookedTrips.map((b) =>
      b.id === bookingId ? { ...b, status: 'Cancelled' } : b
    );

    await user.save();
    res.json({ message: 'Booking cancelled successfully', bookingId });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
