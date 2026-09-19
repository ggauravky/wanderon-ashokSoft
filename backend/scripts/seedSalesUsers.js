import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

// Configuration: Pull credentials from environment variables, with safe local setup defaults
const SALES_USERS_CONFIG = [
  {
    name: 'AshokSoft Sales 1',
    email: (process.env.SALES_1_EMAIL || 'ashoksoftsales1@gmail.com').toLowerCase().trim(),
    password: process.env.SALES_1_PASSWORD || 'AshokSoftSales1@123',
    phone: '+91 9876543211',
    address: 'WanderLuxe Sales Desk, India',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    role: 'sales',
    isActive: true
  },
  {
    name: 'AshokSoft Sales 2',
    email: (process.env.SALES_2_EMAIL || 'ashoksoftsales2@gmail.com').toLowerCase().trim(),
    password: process.env.SALES_2_PASSWORD || 'AshokSoftSales2@123',
    phone: '+91 9876543212',
    address: 'WanderLuxe Sales Desk, India',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    role: 'sales',
    isActive: true
  }
];

export const seedSalesUsers = async () => {
  try {
    await connectDB();

    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      console.warn('⚠️ Warning: Database not connected. Sales users cannot be persisted to MongoDB.');
      return { success: false, message: 'Database connection failed' };
    }

    const results = [];

    for (const config of SALES_USERS_CONFIG) {
      const normalizedEmail = config.email.toLowerCase().trim();
      const existing = await User.findOne({ email: normalizedEmail });

      if (!existing) {
        // Create user using Mongoose model so pre('save') hashes the password with bcrypt
        const newUser = await User.create({
          name: config.name,
          email: normalizedEmail,
          password: config.password,
          phone: config.phone,
          address: config.address,
          avatar: config.avatar,
          role: 'sales',
          isActive: true
        });

        console.log(`✓ ${config.name} created`);
        results.push({ name: config.name, email: normalizedEmail, status: 'created', id: newUser._id });
      } else if (existing.role === 'sales') {
        console.log(`✓ ${config.name} already exists`);
        // Ensure isActive is true if it was missing
        if (existing.isActive === undefined || existing.isActive === null) {
          existing.isActive = true;
          await existing.save();
        }
        results.push({ name: config.name, email: normalizedEmail, status: 'already_exists', id: existing._id });
      } else {
        console.warn(`⚠️ Conflict: Account with email "${normalizedEmail}" already exists with role "${existing.role}". Did not overwrite.`);
        results.push({ name: config.name, email: normalizedEmail, status: 'conflict', currentRole: existing.role });
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('❌ Error during sales users seeding:', error.message);
    throw error;
  }
};

// If run directly from terminal
if (process.argv[1]?.endsWith('seedSalesUsers.js')) {
  seedSalesUsers()
    .then(() => {
      console.log('✨ Sales user provisioning complete.\n');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal seed failure:', err);
      process.exit(1);
    });
}

export default seedSalesUsers;
