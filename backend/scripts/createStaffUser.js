import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const ALLOWED_STAFF_ROLES = new Set(['super_admin', 'admin', 'sales', 'marketing']);

const readStaffConfig = () => ({
  name: String(process.env.STAFF_NAME || '').trim(),
  email: String(process.env.STAFF_EMAIL || '').trim().toLowerCase(),
  password: String(process.env.STAFF_PASSWORD || ''),
  role: String(process.env.STAFF_ROLE || '').trim().toLowerCase(),
  isActive: String(process.env.STAFF_IS_ACTIVE || 'true').trim().toLowerCase() !== 'false'
});

const validateStaffConfig = (config) => {
  const missing = ['name', 'email', 'password', 'role'].filter((field) => !config[field]);
  if (missing.length) {
    throw new Error(`Missing required environment values: ${missing.map((field) => `STAFF_${field.toUpperCase()}`).join(', ')}`);
  }

  if (!ALLOWED_STAFF_ROLES.has(config.role)) {
    throw new Error(`STAFF_ROLE must be one of: ${[...ALLOWED_STAFF_ROLES].join(', ')}`);
  }

  if (config.password.length < 8) {
    throw new Error('STAFF_PASSWORD must contain at least 8 characters.');
  }
};

export const createStaffUser = async (overrides = {}) => {
  const config = { ...readStaffConfig(), ...overrides };
  config.email = String(config.email || '').trim().toLowerCase();
  config.role = String(config.role || '').trim().toLowerCase();
  config.name = String(config.name || '').trim();
  config.password = String(config.password || '');
  config.isActive = typeof config.isActive === 'string'
    ? config.isActive.trim().toLowerCase() !== 'false'
    : config.isActive !== false;
  validateStaffConfig(config);

  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB connection is required to create a staff user.');
  }

  const existingUser = await User.findOne({ email: config.email });
  if (existingUser) {
    if (existingUser.role !== config.role) {
      throw new Error(`A user with this email already exists with role "${existingUser.role}". No changes were made.`);
    }

    return { status: 'already_exists', id: existingUser._id, email: existingUser.email, role: existingUser.role };
  }

  const user = await User.create({
    name: config.name,
    email: config.email,
    password: config.password,
    role: config.role,
    isActive: config.isActive
  });

  return { status: 'created', id: user._id, email: user.email, role: user.role, isActive: user.isActive };
};

if (process.argv[1]?.endsWith('createStaffUser.js')) {
  createStaffUser()
    .then((result) => {
      console.log(`Staff user ${result.status}: ${result.email} (${result.role})`);
      process.exitCode = 0;
    })
    .catch((error) => {
      console.error(`Staff user creation failed: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    });
}

export default createStaffUser;
