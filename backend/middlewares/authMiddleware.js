import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'gaurav999@gmail.com').toLowerCase();

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'wanderluxe_secure_jwt_secret_key_2026'
      );

      if (mongoose.connection && mongoose.connection.readyState === 1) {
        req.user = await User.findById(decoded.id).select('-password');
      }

      if (!req.user) {
        return res.status(401).json({ message: 'User not found or session expired. Please log in again.' });
      }

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// @desc Middleware to enforce Admin role server-side
export const adminOnly = (req, res, next) => {
  if (
    req.user && (
      req.user.role === 'admin' || 
      req.user.email?.toLowerCase() === ADMIN_EMAIL
    )
  ) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
};

// @desc Middleware to enforce Influencer/Creator approval status server-side
export const influencerOnly = (req, res, next) => {
  const isApproved = req.user && (
    req.user.role === 'admin' ||
    req.user.role === 'influencer' ||
    req.user.influencerStatus === 'approved'
  );

  if (isApproved) {
    next();
  } else {
    res.status(403).json({ 
      message: 'Access denied: Your influencer application is pending review or requires Admin approval.' 
    });
  }
};
