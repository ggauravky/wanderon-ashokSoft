import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email address' });
    }

    // Create user in MongoDB Atlas
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '+91 8542036499',
      address: address || 'Lucknow, UP, India',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
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

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Check password
    if (user && (await user.matchPassword(password))) {
      res.json({
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
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
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
