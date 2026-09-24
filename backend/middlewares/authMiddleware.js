import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { getJwtSecret } from '../config/environment.js';

const isDbConnected = () => mongoose.connection?.readyState === 1;
const bearerToken = (req) => {
  const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
};

const loadCurrentUser = async (token) => {
  const decoded = jwt.verify(token, getJwtSecret());
  if (!decoded.userId || !mongoose.Types.ObjectId.isValid(decoded.userId)) return null;
  return User.findById(decoded.userId).select('-password');
};

export const protect = async (req, res, next) => {
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ message: 'Not authorized, no token provided' });
  if (!isDbConnected()) return res.status(503).json({ message: 'Authentication is temporarily unavailable.' });

  try {
    const user = await loadCurrentUser(token);
    if (!user) return res.status(401).json({ message: 'User not found or session expired. Please log in again.' });
    if (user.isActive === false) return res.status(403).json({ message: 'Account is disabled. Please contact an administrator.' });
    req.user = user;
    req.authContext = { source: 'database', mongoUserId: user._id, role: user.role };
    return next();
  } catch (error) {
    if (error?.name !== 'JsonWebTokenError' && error?.name !== 'TokenExpiredError') {
      console.error('Authentication verification failed:', error.message);
    }
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

export const requireRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  const role = String(req.user.role || 'user').toLowerCase();
  if (allowedRoles.map((value) => value.toLowerCase()).includes(role)) return next();
  return res.status(403).json({ message: 'Access denied for the current account role.' });
};

export const superAdminOnly = requireRoles('super_admin');
export const adminOnly = requireRoles('super_admin', 'admin');
export const salesOrAdmin = requireRoles('super_admin', 'admin', 'operations', 'sales');
export const operationsOrAdmin = requireRoles('super_admin', 'admin', 'operations');
export const marketingOrAdmin = requireRoles('super_admin', 'admin', 'marketing');

export const influencerOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  const approved = ['super_admin', 'admin'].includes(req.user.role)
    || (req.user.role === 'influencer' && req.user.influencerStatus === 'approved');
  if (approved) return next();
  return res.status(403).json({ message: 'Access denied: An approved creator account is required.' });
};

export const ACTION_PERMISSIONS = Object.freeze({
  'trips:view': ['super_admin', 'admin', 'operations', 'sales', 'marketing', 'influencer', 'user'],
  'trips:create': ['super_admin', 'admin', 'operations'],
  'trips:edit': ['super_admin', 'admin', 'operations'],
  'trips:delete': ['super_admin', 'admin'],
  'trips:publish': ['super_admin', 'admin', 'operations'],
  'departures:manage': ['super_admin', 'admin', 'operations'],
  'leads:view': ['super_admin', 'admin', 'operations', 'sales'],
  'leads:assign': ['super_admin', 'admin'],
  'leads:update_status': ['super_admin', 'admin', 'sales'],
  'quotations:view': ['super_admin', 'admin', 'operations', 'sales'],
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
  'marketing:view_lead_analytics': ['super_admin', 'admin', 'marketing'],
  'sales:view_dashboard': ['super_admin', 'admin', 'sales'],
  'operations:view_dashboard': ['super_admin', 'admin', 'operations'],
  'operations:view_trips': ['super_admin', 'admin', 'operations'],
  'operations:manage_trips': ['super_admin', 'admin', 'operations'],
  'operations:view_vendors': ['super_admin', 'admin', 'operations'],
  'operations:manage_vendors': ['super_admin', 'admin', 'operations'],
  'operations:manage_services': ['super_admin', 'admin', 'operations'],
  'reports:view': ['super_admin', 'admin'],
  'users:manage_roles': ['super_admin', 'admin']
});

export const checkPermission = (action) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  const allowedRoles = ACTION_PERMISSIONS[action];
  if (!allowedRoles) return res.status(403).json({ message: 'Access denied: Unknown permission.' });
  if (allowedRoles.includes(String(req.user.role || 'user').toLowerCase())) return next();
  return res.status(403).json({ message: 'Access denied for the requested action.' });
};

export const optionalAuth = async (req, res, next) => {
  const token = bearerToken(req);
  if (!token || !isDbConnected()) return next();
  try {
    const user = await loadCurrentUser(token);
    if (user?.isActive !== false) {
      req.user = user;
      req.authContext = { source: 'database', mongoUserId: user._id, role: user.role };
    }
  } catch {
    req.user = null;
    req.authContext = null;
  }
  return next();
};
