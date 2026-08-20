import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'gaurav999@gmail.com').toLowerCase();
const INFLUENCER_EMAIL = (process.env.INFLUENCER_EMAIL || 'influencer@wanderluxe.in').toLowerCase();

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

      // Attempt to load user from MongoDB database
      if (mongoose.connection && mongoose.connection.readyState === 1 && decoded.id && decoded.id !== 'usr_admin' && decoded.id !== 'usr_influencer') {
        try {
          req.user = await User.findById(decoded.id).select('-password');
        } catch (dbErr) {
          console.warn('User lookup in DB failed, using token payload fallback:', dbErr.message);
        }
      }

      // Memory Fallback / Admin / Influencer mock tokens
      if (!req.user) {
        if (decoded.email === ADMIN_EMAIL || decoded.id === 'usr_admin') {
          req.user = {
            _id: 'usr_admin',
            name: 'Gaurav Kumar Yadav (Admin)',
            email: ADMIN_EMAIL,
            role: 'admin',
            influencerStatus: 'approved'
          };
        } else if (decoded.email === INFLUENCER_EMAIL || decoded.id === 'usr_influencer') {
          req.user = {
            _id: 'usr_influencer',
            name: 'Gaurav Kumar Yadav (Influencer)',
            email: INFLUENCER_EMAIL,
            role: 'influencer',
            influencerStatus: 'approved'
          };
        } else if (decoded.id) {
          req.user = {
            _id: decoded.id,
            name: decoded.name || 'WanderLuxe Traveler',
            email: decoded.email || 'user@wanderluxe.in',
            role: decoded.role || 'user',
            influencerStatus: decoded.influencerStatus || 'none'
          };
        }
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
