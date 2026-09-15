import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

async function check() {
  await connectDB();
  const users = await User.find({}, 'name email role _id isActive').lean();
  console.log('Total DB users:', users.length);
  users.forEach(u => {
    console.log(`- ${u.name} | ${u.email} | role: ${u.role} | _id: ${u._id}`);
  });
  await mongoose.disconnect();
}

check().catch(console.error);
