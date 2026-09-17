import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const requiredEnvironmentValue = (name) => {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required. Prefer npm run staff:create for staff provisioning.`);
  return value;
};

// Legacy bulk helper. Credentials are always explicit environment values.
const getSalesUsersConfig = () => ([
  {
    name: process.env.SALES_1_NAME || 'Sales Specialist 1',
    email: requiredEnvironmentValue('SALES_1_EMAIL').toLowerCase(),
    password: requiredEnvironmentValue('SALES_1_PASSWORD'),
    phone: process.env.SALES_1_PHONE || '',
    address: process.env.SALES_1_ADDRESS || '',
    avatar: '',
    role: 'sales',
    isActive: true
  },
  {
    name: process.env.SALES_2_NAME || 'Sales Specialist 2',
    email: requiredEnvironmentValue('SALES_2_EMAIL').toLowerCase(),
    password: requiredEnvironmentValue('SALES_2_PASSWORD'),
    phone: process.env.SALES_2_PHONE || '',
    address: process.env.SALES_2_ADDRESS || '',
    avatar: '',
    role: 'sales',
    isActive: true
  }
]);

export const seedSalesUsers = async () => {
  try {
    await connectDB();

    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      console.warn('⚠️ Warning: Database not connected. Sales users cannot be persisted to MongoDB.');
      return { success: false, message: 'Database connection failed' };
    }

    const results = [];

    for (const config of getSalesUsersConfig()) {
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
