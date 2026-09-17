import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import MediaAsset, { generateLocationKeys } from '../models/MediaAsset.js';
import { RAW_SEED_ASSETS as SEED_ASSETS } from '../data/canonicalMediaAssets.js';

async function seedMedia() {
  console.log('🚀 Connecting to MongoDB for Media Asset Seeding...');
  await connectDB();

  console.log(`📦 Found ${SEED_ASSETS.length} canonical media assets to seed.`);

  let inserted = 0;
  let updated = 0;

  for (const assetData of SEED_ASSETS) {
    const locationKeys = generateLocationKeys(
      assetData.geography,
      assetData.title,
      assetData.tags
    );

    const filter = {
      $or: [
        { 'storage.publicId': assetData.storage.publicId },
        { title: assetData.title }
      ]
    };

    const updateDoc = {
      ...assetData,
      locationKeys,
      type: 'IMAGE',
      active: true,
      usage: { itinerary: true, destination: true, tripCard: true, hero: true, gallery: true },
      source: {
        sourceType: 'PROJECT_ASSET',
        attribution: 'WanderLuxe Editorial Archive',
        license: 'Commercial Editorial License'
      }
    };

    const res = await MediaAsset.findOneAndUpdate(
      filter,
      { $set: updateDoc },
      { upsert: true, new: true }
    );

    if (res.createdAt && res.updatedAt && res.createdAt.getTime() === res.updatedAt.getTime()) {
      inserted++;
    } else {
      updated++;
    }
  }

  const total = await MediaAsset.countDocuments();
  console.log(`✅ Media Asset Seed Complete! ${inserted} inserted, ${updated} updated. Total active assets: ${total}`);
  process.exit(0);
}

seedMedia().catch((err) => {
  console.error('❌ Error during Media Seed:', err);
  process.exit(1);
});
