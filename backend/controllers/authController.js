import mongoose from 'mongoose';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'gaurav999@gmail.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gaurav@999';
const INFLUENCER_EMAIL = (process.env.INFLUENCER_EMAIL || 'influencer@wanderluxe.in').toLowerCase();
const INFLUENCER_PASSWORD = process.env.INFLUENCER_PASSWORD || 'influencer123';

// @desc    Register a new user directly into MongoDB database
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isAdminEmail = cleanEmail === ADMIN_EMAIL;
    const isInfluencerEmail = cleanEmail === INFLUENCER_EMAIL;

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email address' });
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      phone: phone || '',
      address: address || '',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
      role: isAdminEmail ? 'admin' : isInfluencerEmail ? 'influencer' : 'user',
      influencerStatus: isInfluencerEmail ? 'approved' : 'none',
      bookedTrips: []
    });

    if (!user) {
      return res.status(500).json({ message: 'Database failed to save user profile.' });
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      role: user.role,
      influencerStatus: user.influencerStatus,
      bookedTrips: user.bookedTrips,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Submit / Apply for Creator & Influencer Status (Tied to authenticated user's DB ID)
// @route   POST /api/auth/influencer-apply
// @access  Private
export const applyInfluencer = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required. Please log in first.' });
    }

    const { name, socialHandle, platform, followerCount, niche, sampleContent, phone } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User record not found in database.' });
    }

    if (user.influencerStatus === 'approved') {
      return res.status(400).json({ 
        message: 'You are already an approved creator partner. Please login via Influencer Portal.',
        influencerStatus: 'approved'
      });
    }

    if (user.influencerStatus === 'pending') {
      return res.status(400).json({ 
        message: 'You already have an application under review by our Admin team.',
        influencerStatus: 'pending'
      });
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }
    if (phone && phone.trim()) {
      user.phone = phone.trim();
    }

    user.influencerStatus = 'pending';
    user.influencerApplication = {
      socialHandle: socialHandle || '@creator',
      platform: platform || 'Instagram',
      followerCount: followerCount || '10K+',
      niche: niche || 'Travel & Adventure',
      sampleContent: sampleContent || '',
      applicationSubmitted: true,
      appliedAt: new Date(),
      reviewedAt: null,
      reviewedBy: '',
      reviewNotes: ''
    };

    await user.save();

    res.status(201).json({
      message: 'Influencer application submitted successfully. Status is PENDING Admin review.',
      influencerStatus: 'pending',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        influencerStatus: user.influencerStatus,
        influencerApplication: user.influencerApplication
      }
    });
  } catch (error) {
    console.error('Influencer Application Error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Authenticate registered user & get JWT session token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter both email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isAdminEmail = cleanEmail === ADMIN_EMAIL;
    const isInfluencerEmail = cleanEmail === INFLUENCER_EMAIL;

    let user = await User.findOne({ email: cleanEmail });

    // Auto-seed official Admin account if logging in with valid Admin credentials
    if (!user && isAdminEmail && (password === ADMIN_PASSWORD || password === 'gaurav@99')) {
      user = await User.create({
        name: 'Gaurav Kumar Yadav (Admin)',
        email: cleanEmail,
        password: password,
        phone: '8542036499',
        address: 'Lucknow, UP, India',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        role: 'admin',
        influencerStatus: 'approved'
      });
    }

    // Auto-seed official test Influencer account
    if (!user && isInfluencerEmail && password === INFLUENCER_PASSWORD) {
      user = await User.create({
        name: 'Gaurav Kumar Yadav (Influencer)',
        email: cleanEmail,
        password: password,
        phone: '8542036499',
        address: 'Lucknow, UP, India',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
        role: 'influencer',
        influencerStatus: 'approved'
      });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password. Please check your credentials or register.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      role: user.role,
      influencerStatus: user.influencerStatus,
      influencerApplication: user.influencerApplication,
      bookedTrips: user.bookedTrips,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Dedicated Creator & Influencer Login (Strict database approval check)
// @route   POST /api/auth/influencer-login
// @access  Public
export const influencerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter both creator email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isMasterInfluencer = cleanEmail === INFLUENCER_EMAIL;

    let user = await User.findOne({ email: cleanEmail });

    if (!user && isMasterInfluencer && password === INFLUENCER_PASSWORD) {
      user = await User.create({
        name: 'Gaurav Kumar Yadav (Influencer)',
        email: cleanEmail,
        password: password,
        phone: '8542036499',
        address: 'Lucknow, UP, India',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
        role: 'influencer',
        influencerStatus: 'approved'
      });
    }

    if (!user) {
      return res.status(404).json({ 
        message: 'No account found with this email. Please apply to become an influencer first.' 
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password. Please try again.' });
    }

    // Strict Server-Side Approval State Machine Check
    if (user.influencerStatus === 'pending') {
      return res.status(403).json({ 
        message: 'Your influencer application is currently under review by our Admin team. You will be able to log in once approved.',
        influencerStatus: 'pending'
      });
    }

    if (user.influencerStatus === 'rejected') {
      return res.status(403).json({ 
        message: 'Your influencer application was not approved. Please contact support.',
        influencerStatus: 'rejected'
      });
    }

    if (user.influencerStatus !== 'approved' && user.role !== 'influencer') {
      return res.status(403).json({ 
        message: 'No approved influencer account found. Please submit your application at the Creator Partner Program.',
        influencerStatus: 'none'
      });
    }

    // Approved Influencer - Issue Session Token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: 'influencer',
      influencerStatus: 'approved',
      influencerApplication: user.influencerApplication,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Influencer Login Error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get current authenticated user profile from MongoDB
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found in database.' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Update user profile info in MongoDB
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    user.address = req.body.address !== undefined ? req.body.address : user.address;
    user.avatar = req.body.avatar || user.avatar;
    if (req.body.password) {
      user.password = req.body.password;
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      role: user.role,
      influencerStatus: user.influencerStatus,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Add booking to current user in MongoDB
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

    user.bookedTrips = user.bookedTrips || [];
    user.bookedTrips.unshift(newBooking);
    await user.save();

    res.status(201).json(newBooking);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Cancel user booking in MongoDB
// @route   PUT /api/auth/booking/cancel
// @access  Private
export const cancelUserBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.bookedTrips = (user.bookedTrips || []).map((b) =>
      b.id === bookingId ? { ...b, status: 'Cancelled' } : b
    );
    await user.save();

    res.json({ message: 'Booking cancelled successfully', bookingId });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
