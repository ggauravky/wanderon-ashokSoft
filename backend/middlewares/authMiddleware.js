import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from Bearer header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'wanderluxe_secure_jwt_secret_key_2026');

      // Get user from database without password
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// @desc Middleware to enforce Admin role server-side
export const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.email?.toLowerCase() === 'gaurav999@gmail.com' || req.user.email?.toLowerCase() === 'gaurav99@gmail.com')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
};

// @desc Middleware to enforce Influencer/Creator role server-side
export const influencerOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'influencer' || req.user.role === 'admin' || req.user.email?.toLowerCase() === 'influencer@wanderluxe.in')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Creator/Influencer privileges required' });
  }
};

