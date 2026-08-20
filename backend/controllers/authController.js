import mongoose from 'mongoose';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'gaurav999@gmail.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gaurav@999';
const INFLUENCER_EMAIL = (process.env.INFLUENCER_EMAIL || 'influencer@wanderluxe.in').toLowerCase();
const INFLUENCER_PASSWORD = process.env.INFLUENCER_PASSWORD || 'influencer123';

// In-Memory User Store Fallback when MongoDB is offline
const memoryUsers = [
  {
    _id: 'usr_admin',
    name: 'Gaurav Kumar Yadav (Admin)',
    email: ADMIN_EMAIL,
    password: bcrypt.hashSync(ADMIN_PASSWORD, 10),
    phone: '8542036499',
    address: 'Lucknow, UP, India',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    role: 'admin',
    influencerStatus: 'approved',
    bookedTrips: []
  },
  {
    _id: 'usr_influencer',
    name: 'Gaurav Kumar Yadav (Influencer)',
    email: INFLUENCER_EMAIL,
    password: bcrypt.hashSync(INFLUENCER_PASSWORD, 10),
    phone: '8542036499',
    address: 'Lucknow, UP, India',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
    role: 'influencer',
    influencerStatus: 'approved',
    bookedTrips: []
  }
];

// Helper: Check DB connectivity
const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

// @desc    Register a new user directly into MongoDB database (or memory fallback)
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

    let user = null;

    if (isDbConnected()) {
      try {
        const userExists = await User.findOne({ email: cleanEmail });
        if (userExists) {
          return res.status(400).json({ message: 'User already exists with this email address' });
        }

        user = await User.create({
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
      } catch (dbErr) {
        console.warn('DB Register fallback:', dbErr.message);
      }
    }

    if (!user) {
      const memExists = memoryUsers.find((u) => u.email === cleanEmail);
      if (memExists) {
        return res.status(400).json({ message: 'User already exists with this email address' });
      }

      user = {
        _id: 'usr_' + Date.now(),
        name: name.trim(),
        email: cleanEmail,
        password: bcrypt.hashSync(password, 10),
        phone: phone || '',
        address: address || '',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
        role: isAdminEmail ? 'admin' : isInfluencerEmail ? 'influencer' : 'user',
        influencerStatus: isInfluencerEmail ? 'approved' : 'none',
        bookedTrips: []
      };
      memoryUsers.push(user);
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
      bookedTrips: user.bookedTrips || [],
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Submit / Apply for Creator & Influencer Status
// @route   POST /api/auth/influencer-apply
// @access  Private
export const applyInfluencer = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required. Please log in first.' });
    }

    const { name, socialHandle, platform, followerCount, niche, sampleContent, phone } = req.body;

    let user = null;
    if (isDbConnected()) {
      try {
        user = await User.findById(userId);
      } catch (e) {}
    }

    if (!user) {
      user = memoryUsers.find((u) => String(u._id) === String(userId));
    }

    if (!user) {
      user = {
        _id: userId,
        name: req.user.name || 'Traveler',
        email: req.user.email || 'user@wanderluxe.in',
        role: 'user',
        influencerStatus: 'none'
      };
      memoryUsers.push(user);
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

    if (name && name.trim()) user.name = name.trim();
    if (phone && phone.trim()) user.phone = phone.trim();

    user.influencerStatus = 'pending';
    user.influencerApplication = {
      socialHandle: socialHandle || '@creator',
      platform: platform || 'Instagram',
      followerCount: followerCount || '10K+',
      niche: niche || 'Travel & Adventure',
      sampleContent: sampleContent || '',
      applicationSubmitted: true,
      appliedAt: new Date()
    };

    if (isDbConnected() && typeof user.save === 'function') {
      await user.save();
    }

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

    let user = null;

    if (isDbConnected()) {
      try {
        user = await User.findOne({ email: cleanEmail });

        if (!user && isAdminEmail && (password === ADMIN_PASSWORD || password === 'gaurav@999')) {
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
      } catch (dbErr) {
        console.warn('DB Login fallback:', dbErr.message);
      }
    }

    if (!user) {
      user = memoryUsers.find((u) => u.email === cleanEmail);
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password. Please check your credentials or register.' });
    }

    let isMatch = false;
    if (typeof user.matchPassword === 'function') {
      isMatch = await user.matchPassword(password);
    } else {
      isMatch = bcrypt.compareSync(password, user.password) || (isAdminEmail && password === ADMIN_PASSWORD) || (isInfluencerEmail && password === INFLUENCER_PASSWORD);
    }

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
      bookedTrips: user.bookedTrips || [],
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Dedicated Creator & Influencer Login
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

    let user = null;
    if (isDbConnected()) {
      try {
        user = await User.findOne({ email: cleanEmail });
      } catch (e) {}
    }

    if (!user) {
      user = memoryUsers.find((u) => u.email === cleanEmail);
    }

    if (!user && isMasterInfluencer) {
      user = {
        _id: 'usr_influencer',
        name: 'Gaurav Kumar Yadav (Influencer)',
        email: cleanEmail,
        password: bcrypt.hashSync(password, 10),
        role: 'influencer',
        influencerStatus: 'approved'
      };
      memoryUsers.push(user);
    }

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email. Please apply to become an influencer first.' });
    }

    let isMatch = false;
    if (typeof user.matchPassword === 'function') {
      isMatch = await user.matchPassword(password);
    } else {
      isMatch = bcrypt.compareSync(password, user.password) || (isMasterInfluencer && password === INFLUENCER_PASSWORD);
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password. Please try again.' });
    }

    if (user.influencerStatus === 'pending') {
      return res.status(403).json({ message: 'Your influencer application is currently under review by our Admin team.', influencerStatus: 'pending' });
    }

    if (user.influencerStatus === 'rejected') {
      return res.status(403).json({ message: 'Your influencer application was not approved. Please contact support.', influencerStatus: 'rejected' });
    }

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

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    let user = null;
    if (isDbConnected()) {
      try {
        user = await User.findById(req.user._id).select('-password');
      } catch (e) {}
    }

    if (!user) {
      user = memoryUsers.find((u) => String(u._id) === String(req.user._id)) || req.user;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Update user profile info
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    let user = null;
    if (isDbConnected()) {
      try {
        user = await User.findById(req.user._id);
      } catch (e) {}
    }

    if (!user) {
      user = memoryUsers.find((u) => String(u._id) === String(req.user._id));
    }

    if (!user) {
      user = req.user;
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    user.address = req.body.address !== undefined ? req.body.address : user.address;
    user.avatar = req.body.avatar || user.avatar;
    if (req.body.password) {
      user.password = typeof user.save === 'function' ? req.body.password : bcrypt.hashSync(req.body.password, 10);
    }

    if (isDbConnected() && typeof user.save === 'function') {
      await user.save();
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
      token: generateToken(user._id)
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
    let user = null;
    if (isDbConnected()) {
      try {
        user = await User.findById(req.user._id);
      } catch (e) {}
    }

    if (!user) {
      user = memoryUsers.find((u) => String(u._id) === String(req.user._id)) || req.user;
    }

    const newBooking = {
      id: 'WL-' + Math.floor(100000 + Math.random() * 900000),
      bookingDate: new Date().toISOString().split('T')[0],
      status: 'Confirmed',
      ...req.body
    };

    user.bookedTrips = user.bookedTrips || [];
    user.bookedTrips.unshift(newBooking);

    if (isDbConnected() && typeof user.save === 'function') {
      await user.save();
    }

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
    let user = null;
    if (isDbConnected()) {
      try {
        user = await User.findById(req.user._id);
      } catch (e) {}
    }

    if (!user) {
      user = memoryUsers.find((u) => String(u._id) === String(req.user._id)) || req.user;
    }

    user.bookedTrips = (user.bookedTrips || []).map((b) =>
      b.id === bookingId ? { ...b, status: 'Cancelled' } : b
    );

    if (isDbConnected() && typeof user.save === 'function') {
      await user.save();
    }

    res.json({ message: 'Booking cancelled successfully', bookingId });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
