import mongoose from 'mongoose';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

const MIN_PASSWORD_LENGTH = 8;
const isDbConnected = () => mongoose.connection?.readyState === 1;
const requireIdentityDatabase = (res) => {
  if (isDbConnected()) return true;
  res.status(503).json({ success: false, message: 'Authentication is temporarily unavailable.' });
  return false;
};

const safeUser = (user, { includeBookings = true, includeApplication = true } = {}) => {
  const value = user?.toObject ? user.toObject() : user;
  if (!value) return null;
  const response = {
    id: String(value._id),
    _id: value._id,
    name: value.name,
    email: value.email,
    phone: value.phone || '',
    address: value.address || '',
    avatar: value.avatar || '',
    role: value.role,
    isActive: value.isActive !== false,
    influencerStatus: value.influencerStatus || 'none'
  };
  if (includeApplication) response.influencerApplication = value.influencerApplication || null;
  if (includeBookings) response.bookedTrips = Array.isArray(value.bookedTrips) ? value.bookedTrips : [];
  return response;
};

const sessionResponse = (user, options) => ({ ...safeUser(user, options), token: generateToken(user._id) });
const invalidCredentials = (res) => res.status(401).json({ success: false, message: 'Invalid email or password.' });
const validatePassword = (password) => String(password || '').length >= MIN_PASSWORD_LENGTH;

export const registerUser = async (req, res) => {
  try {
    if (!requireIdentityDatabase(res)) return;
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!name || !email || !password) return res.status(400).json({ message: 'Please provide name, email, and password.' });
    if (!validatePassword(password)) return res.status(400).json({ message: `Password must contain at least ${MIN_PASSWORD_LENGTH} characters.` });
    if (await User.exists({ email })) return res.status(409).json({ message: 'An account already exists with this email address.' });
    const user = await User.create({
      name,
      email,
      password,
      phone: String(req.body.phone || '').trim(),
      address: String(req.body.address || '').trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      role: 'user',
      influencerStatus: 'none'
    });
    return res.status(201).json(sessionResponse(user));
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'An account already exists with this email address.' });
    console.error('Registration failed:', error.message);
    return res.status(500).json({ message: 'Unable to create account.' });
  }
};

export const loginUser = async (req, res) => {
  try {
    if (!requireIdentityDatabase(res)) return;
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ message: 'Please enter both email and password.' });
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) return invalidCredentials(res);
    if (user.isActive === false) return res.status(403).json({ message: 'Account is disabled. Please contact an administrator.' });
    return res.json(sessionResponse(user));
  } catch (error) {
    console.error('Login failed:', error.message);
    return res.status(503).json({ success: false, message: 'Authentication is temporarily unavailable.' });
  }
};

export const influencerLogin = async (req, res) => {
  try {
    if (!requireIdentityDatabase(res)) return;
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ message: 'Please enter both creator email and password.' });
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) return invalidCredentials(res);
    if (user.isActive === false) return res.status(403).json({ message: 'Account is disabled. Please contact an administrator.' });
    if (user.role !== 'influencer' || user.influencerStatus !== 'approved') {
      return res.status(403).json({ message: 'Creator access is unavailable until the application is approved.', influencerStatus: user.influencerStatus || 'none' });
    }
    return res.json(sessionResponse(user, { includeBookings: false, includeApplication: true }));
  } catch (error) {
    console.error('Creator login failed:', error.message);
    return res.status(503).json({ success: false, message: 'Authentication is temporarily unavailable.' });
  }
};

export const getMe = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized.' });
  return res.json(safeUser(req.user));
};

export const updateUserProfile = async (req, res) => {
  try {
    if (!requireIdentityDatabase(res)) return;
    const user = await User.findById(req.user._id);
    if (!user || user.isActive === false) return res.status(401).json({ message: 'Session is no longer valid.' });
    if (req.body.name !== undefined) user.name = String(req.body.name || '').trim() || user.name;
    if (req.body.phone !== undefined) user.phone = String(req.body.phone || '').trim();
    if (req.body.address !== undefined) user.address = String(req.body.address || '').trim();
    if (req.body.avatar !== undefined) user.avatar = String(req.body.avatar || '').trim();
    if (req.body.password !== undefined) {
      if (!validatePassword(req.body.password)) return res.status(400).json({ message: `Password must contain at least ${MIN_PASSWORD_LENGTH} characters.` });
      user.password = String(req.body.password);
    }
    await user.save();
    return res.json(safeUser(user));
  } catch (error) {
    console.error('Profile update failed:', error.message);
    return res.status(500).json({ message: 'Unable to update profile.' });
  }
};

export const applyInfluencer = async (req, res) => {
  try {
    if (!requireIdentityDatabase(res)) return;
    const user = await User.findById(req.user._id);
    if (!user || user.isActive === false) return res.status(401).json({ message: 'Session is no longer valid.' });
    if (user.influencerStatus === 'approved') return res.status(400).json({ message: 'This account is already an approved creator.', influencerStatus: 'approved' });
    if (user.influencerStatus === 'pending') return res.status(400).json({ message: 'A creator application is already under review.', influencerStatus: 'pending' });
    if (req.body.name) user.name = String(req.body.name).trim() || user.name;
    if (req.body.phone !== undefined) user.phone = String(req.body.phone || '').trim();
    user.influencerStatus = 'pending';
    user.influencerApplication = {
      socialHandle: String(req.body.socialHandle || '').trim(),
      platform: String(req.body.platform || '').trim(),
      followerCount: String(req.body.followerCount || '').trim(),
      niche: String(req.body.niche || '').trim(),
      sampleContent: String(req.body.sampleContent || '').trim(),
      applicationSubmitted: true,
      appliedAt: new Date()
    };
    await user.save();
    return res.status(201).json({ message: 'Creator application submitted for review.', ...safeUser(user, { includeBookings: false }) });
  } catch (error) {
    console.error('Creator application failed:', error.message);
    return res.status(500).json({ message: 'Unable to submit creator application.' });
  }
};
