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
      // Extract token from Bearer header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'wanderluxe_secure_jwt_secret_key_2026');

      if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          req.user = await User.findById(decoded.id).select('-password');
        } catch (dbErr) {
          console.warn('DB lookup failed in protect middleware:', dbErr.message);
        }
      }

      // Fallback user construction if DB is in memory mode or user not in DB
      if (!req.user) {
        const isAdmin = decoded.id === 'usr_admin';
        const isInfluencer = decoded.id === 'usr_influencer';

        req.user = {
          _id: decoded.id,
          name: isAdmin ? 'Gaurav Kumar Yadav (Admin)' : isInfluencer ? 'Gaurav Kumar Yadav (Influencer)' : 'Traveler',
          email: isAdmin ? ADMIN_EMAIL : isInfluencer ? INFLUENCER_EMAIL : 'traveler@wanderluxe.in',
          role: isAdmin ? 'admin' : isInfluencer ? 'influencer' : 'user',
          influencerStatus: isInfluencer || isAdmin ? 'approved' : 'none',
          bookedTrips: []
        };
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
  if (
    req.user && (
      req.user.role === 'admin' || 
      req.user.email?.toLowerCase() === ADMIN_EMAIL || 
      req.user.email?.toLowerCase() === 'gaurav99@gmail.com'
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
    req.user.influencerStatus === 'approved' ||
    req.user.email?.toLowerCase() === INFLUENCER_EMAIL
  );

  if (isApproved) {
    next();
  } else {
    res.status(403).json({ 
      message: 'Access denied: Your influencer application is pending review or requires Admin approval.' 
    });
  }
};
