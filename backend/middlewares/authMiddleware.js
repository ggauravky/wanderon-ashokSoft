import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'gaurav999@gmail.com').toLowerCase();
const INFLUENCER_EMAIL = (process.env.INFLUENCER_EMAIL || 'influencer@wanderluxe.in').toLowerCase();
const SALES_1_EMAIL = (process.env.SALES_1_EMAIL || 'ashoksoftsales1@gmail.com').toLowerCase();
const SALES_2_EMAIL = (process.env.SALES_2_EMAIL || 'ashoksoftsales2@gmail.com').toLowerCase();

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
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id) && !String(decoded.id).startsWith('usr_')) {
            req.user = await User.findById(decoded.id).select('-password');
          }
          if (!req.user && decoded.email) {
            req.user = await User.findOne({ email: decoded.email.toLowerCase().trim() }).select('-password');
          }
        } catch (dbErr) {
          console.warn('User lookup in DB failed, using token payload fallback:', dbErr.message);
        }
      }

      // Memory Fallback / Admin / Influencer / Sales mock tokens
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
        } else if (decoded.email === SALES_1_EMAIL || decoded.id === 'usr_sales_1') {
          req.user = {
            _id: 'usr_sales_1',
            name: 'AshokSoft Sales 1',
            email: SALES_1_EMAIL,
            role: 'sales',
            isActive: true
          };
        } else if (decoded.email === SALES_2_EMAIL || decoded.id === 'usr_sales_2') {
          req.user = {
            _id: 'usr_sales_2',
            name: 'AshokSoft Sales 2',
            email: SALES_2_EMAIL,
            role: 'sales',
            isActive: true
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

      if (req.user) {
        if (req.user instanceof mongoose.Model || req.user?.constructor?.modelName === 'User') {
          req.authContext = {
            source: 'database',
            mongoUserId: req.user._id,
            role: req.user.role
          };
        } else {
          req.authContext = {
            source: 'legacy_synthetic',
            mongoUserId: null,
            role: req.user.role
          };
        }
      }

      if (!req.user) {
        return res.status(401).json({ message: 'User not found or session expired. Please log in again.' });
      }

      if (req.user.isActive === false) {
        return res.status(403).json({ message: 'Access denied: Account is deactivated. Please contact an administrator.' });
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

// @desc Reusable role requirement middleware
export const requireRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const userRole = (req.user.role || 'user').toLowerCase();
  const isSuperEmail = req.user.email?.toLowerCase() === ADMIN_EMAIL;

  if (isSuperEmail || userRole === 'super_admin' || allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
    return next();
  }
  return res.status(403).json({
    message: `Access denied: Action requires one of following roles: [${allowedRoles.join(', ')}]. Current role: "${userRole}".`
  });
};

// @desc Middleware to enforce Super Admin role server-side
export const superAdminOnly = (req, res, next) => {
  if (
    req.user && (
      req.user.role === 'super_admin' ||
      req.user.email?.toLowerCase() === ADMIN_EMAIL
    )
  ) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Super Admin privileges required.' });
  }
};

// @desc Middleware to enforce Admin or Super Admin role server-side
export const adminOnly = (req, res, next) => {
  if (
    req.user && (
      req.user.role === 'admin' || 
      req.user.role === 'super_admin' ||
      req.user.email?.toLowerCase() === ADMIN_EMAIL
    )
  ) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
};

// @desc Middleware to enforce Sales, Operations, or Admin roles
export const salesOrAdmin = (req, res, next) => {
  if (
    req.user && (
      ['admin', 'super_admin', 'operations', 'sales'].includes(req.user.role) ||
      req.user.email?.toLowerCase() === ADMIN_EMAIL
    )
  ) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Sales, Operations, or Admin privileges required.' });
  }
};

// @desc Middleware to enforce Operations or Admin roles (Blocks Sales & Marketing)
export const operationsOrAdmin = (req, res, next) => {
  if (
    req.user && (
      ['admin', 'super_admin', 'operations'].includes(req.user.role) ||
      req.user.email?.toLowerCase() === ADMIN_EMAIL
    )
  ) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Operations or Admin privileges required.' });
  }
};

// @desc Middleware to enforce Marketing or Admin roles
export const marketingOrAdmin = (req, res, next) => {
  if (
    req.user && (
      ['admin', 'super_admin', 'marketing'].includes(req.user.role) ||
      req.user.email?.toLowerCase() === ADMIN_EMAIL
    )
  ) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Marketing or Admin privileges required.' });
  }
};

// @desc Middleware to enforce Influencer/Creator approval status server-side
export const influencerOnly = (req, res, next) => {
  const isApproved = req.user && (
    req.user.role === 'admin' ||
    req.user.role === 'super_admin' ||
    req.user.influencerStatus === 'approved' ||
    req.user.email?.toLowerCase() === ADMIN_EMAIL
  );

  if (isApproved) {
    next();
  } else {
    res.status(403).json({ 
      message: 'Access denied: Your influencer application is pending review or requires Admin approval.' 
    });
  }
};

// @desc Action-Based Permissions Matrix
export const ACTION_PERMISSIONS = {
  'trips:view': ['super_admin', 'admin', 'operations', 'sales', 'marketing', 'influencer', 'user'],
  'trips:create': ['super_admin', 'admin', 'operations'],
  'trips:edit': ['super_admin', 'admin', 'operations'],
  'trips:delete': ['super_admin', 'admin'],
  'trips:publish': ['super_admin', 'admin', 'operations'],
  'departures:manage': ['super_admin', 'admin', 'operations'],
  'leads:view': ['super_admin', 'admin', 'operations', 'sales', 'marketing'],
  'leads:assign': ['super_admin', 'admin'],
  'leads:update_status': ['super_admin', 'admin', 'sales'],
  'quotations:view': ['super_admin', 'admin', 'operations', 'sales', 'marketing'],
  'quotations:create': ['super_admin', 'admin', 'sales'],
  'quotations:edit': ['super_admin', 'admin', 'sales'],
  'quotations:approve': ['super_admin', 'admin', 'sales'],
  'quotations:convert_trip': ['super_admin', 'admin', 'operations'],
  'quotations:convert_booking': ['super_admin', 'admin', 'operations', 'sales'],
  'pricing:view': ['super_admin', 'admin', 'operations', 'sales'],
  'pricing:manage_rules': ['super_admin', 'admin'],
  'followups:manage': ['super_admin', 'admin', 'sales'],
  'marketing:manage_campaigns': ['super_admin', 'admin', 'marketing'],
  'marketing:manage_banners': ['super_admin', 'admin', 'marketing'],
  'marketing:view_dashboard': ['super_admin', 'admin', 'marketing'],
  'sales:view_dashboard': ['super_admin', 'admin', 'sales'],
  'reports:view': ['super_admin', 'admin'],
  'users:manage_roles': ['super_admin', 'admin']
};

// @desc Middleware to check action-level permissions
export const checkPermission = (action) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const userRole = (req.user.role || 'user').toLowerCase();
  const isSuperEmail = req.user.email?.toLowerCase() === ADMIN_EMAIL;

  if (isSuperEmail || userRole === 'super_admin') {
    return next();
  }

  const allowedRoles = ACTION_PERMISSIONS[action] || [];
  if (allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
    return next();
  }

  return res.status(403).json({
    message: `Access denied: Action "${action}" requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: "${userRole}".`
  });
};

// @desc Optional authentication middleware: Populates req.user if Bearer token present, but does not reject guests
export const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'wanderluxe_secure_jwt_secret_key_2026'
      );

      if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id) && !String(decoded.id).startsWith('usr_')) {
            req.user = await User.findById(decoded.id).select('-password');
          }
          if (!req.user && decoded.email) {
            req.user = await User.findOne({ email: decoded.email.toLowerCase().trim() }).select('-password');
          }
        } catch (dbErr) {
          console.warn('Optional user DB lookup fallback:', dbErr.message);
        }
      }

      if (!req.user) {
        if (decoded.email === ADMIN_EMAIL || decoded.id === 'usr_admin') {
          req.user = {
            _id: 'usr_admin',
            name: 'Gaurav Kumar Yadav (Admin)',
            email: ADMIN_EMAIL,
            role: 'admin'
          };
        } else if (decoded.email === SALES_1_EMAIL || decoded.id === 'usr_sales_1') {
          req.user = {
            _id: 'usr_sales_1',
            name: 'AshokSoft Sales 1',
            email: SALES_1_EMAIL,
            role: 'sales',
            isActive: true
          };
        } else if (decoded.email === SALES_2_EMAIL || decoded.id === 'usr_sales_2') {
          req.user = {
            _id: 'usr_sales_2',
            name: 'AshokSoft Sales 2',
            email: SALES_2_EMAIL,
            role: 'sales',
            isActive: true
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
            name: decoded.name || 'Traveler',
            email: decoded.email,
            role: decoded.role || 'user'
          };
        }
      }

      if (req.user) {
        if (req.user instanceof mongoose.Model || req.user?.constructor?.modelName === 'User') {
          req.authContext = {
            source: 'database',
            mongoUserId: req.user._id,
            role: req.user.role
          };
        } else {
          req.authContext = {
            source: 'legacy_synthetic',
            mongoUserId: null,
            role: req.user.role
          };
        }
      }
    } catch (err) {
      // Graceful fallback for invalid/expired token on optional endpoints
      req.user = null;
      req.authContext = null;
    }
  }
  next();
};



