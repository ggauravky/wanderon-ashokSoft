import dns from "node:dns";
import mongoose from "mongoose";
import { getMongoUri } from "./environment.js";

let isConnecting = false;

const connectDB = async () => {
  if (isConnecting || mongoose.connection.readyState === 1) return;
  isConnecting = true;

  try {
    const mongoUri = getMongoUri();
    if (!mongoUri) {
      if (process.env.NODE_ENV === 'production') throw new Error('MONGODB_URI (or MONGO_URI) is required in production.');
      console.warn("MongoDB URI is missing. Database-backed features will fail closed.");
      return false;
    }

    // Set Google Public DNS & Cloudflare DNS to ensure reliable SRV record resolution across all network adapters
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
    } catch (dnsErr) {
      console.warn("DNS override notice:", dnsErr.message);
    }

    // Disable buffering so database-backed features fail closed when MongoDB is unreachable.
    mongoose.set("bufferCommands", false);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000
    });

    console.log("✅ MongoDB Atlas Database connected successfully!");
    return true;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    if (process.env.NODE_ENV === 'production') throw error;
    return false;
  } finally {
    isConnecting = false;
  }
};

export default connectDB;
