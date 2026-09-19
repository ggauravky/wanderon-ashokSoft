import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { createLead } from '../controllers/leadController.js';
import { optionalAuth } from '../middlewares/authMiddleware.js';
import generateToken from '../utils/generateToken.js';

async function reproduce() {
  console.log('🔄 Connecting to MongoDB to reproduce error...');
  await connectDB();

  // 1. Generate an Admin token exactly as generated when logging in as Admin
  const adminToken = generateToken('usr_admin', 'admin', 'gaurav999@gmail.com');
  console.log('Generated adminToken payload id: usr_admin');

  // 2. Simulate the request that passes through optionalAuth
  const req = {
    headers: {
      authorization: `Bearer ${adminToken}`
    },
    body: {
      name: 'Traveler Testing As Admin',
      email: `test_admin_lead_${Date.now()}@example.com`,
      phone: '9876543210',
      leadType: 'callback_request',
      tripId: 'kashmir-great-lakes',
      tripSlug: 'kashmir-great-lakes',
      tripTitle: 'Kashmir Great Lakes Expedition',
      tripPriceSnapshot: 24500,
      destination: 'Kashmir',
      travelersCount: 2,
      preferredCallDate: '2026-09-16',
      preferredCallWindow: 'Afternoon',
      topics: ['Customized Route'],
      message: 'Testing expert request while logged in as admin',
      source: 'trip_page'
    }
  };

  let statusCode = 200;
  let responseData = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  // Run through optionalAuth middleware
  await new Promise((resolve) => {
    optionalAuth(req, res, () => resolve());
  });

  console.log('\n--- Decoded req.user from optionalAuth ---');
  console.log('req.user:', req.user);

  console.log('\n--- Submitting lead via createLead ---');
  await createLead(req, res);

  console.log('\n--- Result ---');
  console.log('Status Code:', statusCode);
  console.log('Response Body:', responseData);

  await mongoose.disconnect();
  console.log('Done.');
}

reproduce().catch(err => {
  console.error('Fatal reproduction error:', err);
  process.exit(1);
});
