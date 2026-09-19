import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * Checks whether a value is a valid MongoDB 24-character hexadecimal ObjectId
 * (or an active Mongoose ObjectId instance).
 */
export const isValidMongoObjectId = (val) => {
  if (!val) return false;
  if (val instanceof mongoose.Types.ObjectId) return true;
  if (typeof val !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(val) && /^[0-9a-fA-F]{24}$/.test(val);
};

/**
 * Converts a candidate string or ObjectId to a Mongoose ObjectId instance, or returns null.
 */
export const toObjectIdOrNull = (val) => {
  if (!val) return null;
  if (val instanceof mongoose.Types.ObjectId) return val;
  if (isValidMongoObjectId(val)) {
    return new mongoose.Types.ObjectId(val);
  }
  return null;
};

/**
 * Resolves a valid ObjectId if the user exists in the MongoDB User collection.
 */
export const resolveUserObjectId = async (val) => {
  if (!val || !isValidMongoObjectId(val)) return null;
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const exists = await User.exists({ _id: val });
      return exists ? val : null;
    }
  } catch (e) {
    return null;
  }
  return null;
};

/**
 * Permitted customer roles that can have their account linked to a customer Lead
 */
const CUSTOMER_ROLES = ['user'];

/**
 * Resolves an authenticated user's MongoDB ObjectId ONLY if they represent a real customer traveler.
 *
 * Staff roles (admin, super_admin, sales, operations, marketing, etc.) or synthetic
 * identities (usr_admin, usr_sales_1, etc.) will ALWAYS resolve to null to prevent
 * linking staff accounts as traveler relationships or causing Mongoose CastErrors.
 */
export const resolveCustomerUserObjectId = async (reqUser) => {
  if (!reqUser) return null;

  const role = (reqUser.role || '').toLowerCase();
  // Staff accounts testing or browsing the customer site must NEVER be linked as the customer
  if (!CUSTOMER_ROLES.includes(role)) {
    return null;
  }

  const candidate = reqUser._id || reqUser.id;
  if (!candidate || !isValidMongoObjectId(candidate)) {
    return null;
  }

  // If candidate is already an active Mongoose model instance of User from the DB
  if (reqUser instanceof mongoose.Model || reqUser?.constructor?.modelName === 'User') {
    return candidate;
  }

  // If DB is connected, verify user actually exists in the collection
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const exists = await User.exists({ _id: candidate });
      return exists ? candidate : null;
    } catch (e) {
      return null;
    }
  }

  return null;
};

export default {
  isValidMongoObjectId,
  toObjectIdOrNull,
  resolveUserObjectId,
  resolveCustomerUserObjectId
};
