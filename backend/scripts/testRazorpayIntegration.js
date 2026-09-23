import 'dotenv/config';
import mongoose from 'mongoose';
import { getRazorpayConfig, getMongoUri } from '../config/environment.js';
import { testCredentialConnectivity } from '../services/razorpayService.js';

async function run() {
  console.log('--- WanderLuxe Razorpay Configuration & Connectivity Test ---');

  const config = getRazorpayConfig();
  console.log(`Razorpay Configured: ${config.isConfigured ? 'YES' : 'NO'}`);
  console.log(`Razorpay Mode: ${config.mode}`);
  console.log(`Webhook Secret Configured: ${config.webhookSecret ? 'YES' : 'NO'}`);

  if (!config.isConfigured) {
    console.error('ERROR: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing.');
    process.exit(1);
  }

  if (config.mode !== 'test') {
    console.error(`ERROR: Expected test mode, found: ${config.mode}. Refusing to run credential check on non-test key.`);
    process.exit(1);
  }

  // Check MongoDB
  const mongoUri = getMongoUri();
  let dbStatus = 'Not connected';
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      dbStatus = 'Connected successfully';
    } catch (dbErr) {
      dbStatus = `Connection failed: ${dbErr.message}`;
    }
  }
  console.log(`MongoDB Status: ${dbStatus}`);

  // Test Razorpay API Authentication
  try {
    const result = await testCredentialConnectivity();
    console.log('Razorpay API Authentication: SUCCESS');
    console.log(`Key ID Prefix: ${result.keyIdPrefix}`);
    console.log(`Orders Query: ${result.ordersEntity}`);
    console.log('--- All Credentials & Basic API Checks PASSED ---');
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(0);
  } catch (err) {
    console.error(`Razorpay API Authentication: FAILED (${err.statusCode || err.status || ''} - ${err.message})`);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

run();
