import 'dotenv/config';
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import connectDB from '../config/db.js';
import Hotel from '../models/Hotel.js';
import MediaAsset, { generateLocationKeys } from '../models/MediaAsset.js';
import Quotation from '../models/Quotation.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import { CANONICAL_MEDIA_ASSETS } from '../data/canonicalMediaAssets.js';
import { normalizedHotelName } from '../services/hotelCatalogService.js';
import { assertDemoSeedAllowed } from '../utils/mediaStoragePolicy.js';

export const DEMO_HOSTEL_NAMES = Object.freeze([
  'WanderLuxe Alpine Backpackers - Manali Demo',
  'WanderLuxe Parvati Riverside Hostel - Kasol Demo',
  'WanderLuxe Dhauladhar Social Hostel - Dharamshala Demo'
]);

const commonStayInfo = {
  checkInTime: '13:00', checkOutTime: '11:00', earlyCheckInNotes: 'Subject to availability.',
  lateCheckOutNotes: 'Subject to availability and may attract additional charges.',
  childPolicy: 'Dormitory accommodation is intended for eligible adult travelers; private rooms may follow property policy.',
  extraBedPolicy: 'Extra bedding is available only in eligible private rooms and requires confirmation.',
  propertyNotes: 'Quiet hours apply after 11 PM. Government-issued ID may be required at check-in.'
};

const room = (roomTypeId, name, description, bedType, maxOccupancy, maxChildren, amenities, extraBedAllowed = false) => ({
  roomTypeId, name, description, bedType, maxOccupancy, maxAdults: maxOccupancy, maxChildren,
  extraBedAllowed, amenities, media: [], active: true
});

const rates = (prefix, dormId, privateId, dormBase, privateBase) => [
  { ratePlanId: `${prefix}_dorm_ep`, roomTypeId: dormId, mealPlan: 'EP', supplierRatePerNight: dormBase, customerReferenceRatePerNight: dormBase + 250 },
  { ratePlanId: `${prefix}_dorm_cp`, roomTypeId: dormId, mealPlan: 'CP', supplierRatePerNight: dormBase + 150, customerReferenceRatePerNight: dormBase + 450 },
  { ratePlanId: `${prefix}_private_ep`, roomTypeId: privateId, mealPlan: 'EP', supplierRatePerNight: privateBase, customerReferenceRatePerNight: privateBase + 700 },
  { ratePlanId: `${prefix}_private_cp`, roomTypeId: privateId, mealPlan: 'CP', supplierRatePerNight: privateBase + 300, customerReferenceRatePerNight: privateBase + 1100 }
].map((rate) => ({
  ...rate, currency: 'INR', taxPercent: 5, validFrom: new Date('2026-01-01T00:00:00.000Z'),
  validTo: new Date('2028-12-31T23:59:59.999Z'), minNights: 1, active: true,
  notes: 'DEMO INTERNAL reference rate only; not live availability.'
}));

export const buildHostelSeedDefinitions = () => [
  {
    name: DEMO_HOSTEL_NAMES[0], city: 'Manali', mediaOffset: 0, classification: 'Premium Backpacker Stay',
    tags: ['backpacker', 'mountain', 'manali', 'social', 'budget', 'workation', 'submission-demo', 'demo-seed', 'hostel'],
    shortDescription: 'A social mountain hostel in Old Manali designed for backpackers, couples and small groups.',
    description: 'Set near Old Manali, this clearly labelled demo hostel combines social common spaces with mountain-facing corners and backpacker-focused rooms. Its travel-friendly location supports relaxed cafe time, local walks and convenient onward transfers.',
    location: { addressLine1: 'Old Manali Road', locality: 'Old Manali', city: 'Manali', state: 'Himachal Pradesh', country: 'India', pincode: '175131', nearbyLandmarks: ['Manu Temple', 'Old Manali Market', 'Mall Road'] },
    amenities: ['Wi-Fi', 'Hot Water', 'Common Lounge', 'Cafe', 'Lockers', 'Power Backup', 'Bonfire Area', 'Laundry', 'Parking', 'Work Desk', 'Board Games', 'Mountain View', 'Travel Desk'],
    highlights: ['Old Manali location', 'Social common lounge', 'Mountain-facing common areas', 'Backpacker-friendly stay', 'Workation-friendly Wi-Fi'],
    roomTypes: [
      room('room_seed_manali_mixed_6', '6-Bed Mixed Dorm', 'Shared dormitory with individual beds and secure lockers.', 'Bunk Bed', 6, 0, ['Locker', 'Reading Light', 'Charging Point', 'Shared Bathroom']),
      room('room_seed_manali_female_4', '4-Bed Female Dorm', 'Female-only shared dorm with individual storage and reading lights.', 'Bunk Bed', 4, 0, ['Locker', 'Reading Light', 'Charging Point', 'Shared Bathroom']),
      room('room_seed_manali_private_double', 'Private Mountain Double', 'Private mountain-facing room suited to couples or a small family.', 'Queen Bed', 2, 1, ['Private Bathroom', 'Mountain View', 'Work Desk'], true)
    ],
    ratePlans: rates('rate_seed_manali', 'room_seed_manali_mixed_6', 'room_seed_manali_private_double', 700, 2200)
  },
  {
    name: DEMO_HOSTEL_NAMES[1], city: 'Kasol', mediaOffset: 4, classification: 'Riverside Backpacker Stay',
    tags: ['backpacker', 'riverside', 'kasol', 'social', 'budget', 'workation', 'submission-demo', 'demo-seed', 'hostel'],
    shortDescription: 'A demo riverside backpacker stay near Kasol with social spaces, practical rooms and Parvati Valley views.',
    description: 'This submission-demo property places travelers close to Kasol and the Parvati River. A cafe, common lounge and work-friendly corners support both sociable evenings and relaxed daytime exploration.',
    location: { addressLine1: 'Parvati Valley Road', locality: 'Kasol', city: 'Kasol', state: 'Himachal Pradesh', country: 'India', pincode: '175105', nearbyLandmarks: ['Parvati River', 'Kasol Market', 'Chalal Trail'] },
    amenities: ['Wi-Fi', 'Cafe', 'River View', 'Common Lounge', 'Lockers', 'Bonfire Area', 'Hot Water', 'Travel Desk', 'Work Desk'],
    highlights: ['Parvati River setting', 'Social cafe and lounge', 'Walkable Kasol location', 'Backpacker-focused rooms'],
    roomTypes: [
      room('room_seed_kasol_mixed_8', '8-Bed Mixed Dorm', 'Spacious shared dorm with secure lockers and individual charging points.', 'Bunk Bed', 8, 0, ['Locker', 'Reading Light', 'Charging Point', 'Shared Bathroom']),
      room('room_seed_kasol_mixed_4', '4-Bed Mixed Dorm', 'Compact shared dorm for small groups.', 'Bunk Bed', 4, 0, ['Locker', 'Charging Point', 'Shared Bathroom']),
      room('room_seed_kasol_private_double', 'Private Riverside Double', 'Private double room with a calm riverside outlook.', 'Queen Bed', 2, 1, ['Private Bathroom', 'River View', 'Work Desk'], true)
    ],
    ratePlans: rates('rate_seed_kasol', 'room_seed_kasol_mixed_8', 'room_seed_kasol_private_double', 650, 2100)
  },
  {
    name: DEMO_HOSTEL_NAMES[2], city: 'Dharamshala', mediaOffset: 8, classification: 'Mountain Social Hostel',
    tags: ['backpacker', 'mountain', 'dharamshala', 'mcleod-ganj', 'social', 'workation', 'submission-demo', 'demo-seed', 'hostel'],
    shortDescription: 'A social mountain hostel demo near McLeod Ganj with Dhauladhar views and practical traveler facilities.',
    description: 'This demo hostel provides a convenient base between McLeod Ganj and Dharamshala. Mountain views, a cafe and shared work areas complement simple dorms and a private room for mixed traveler needs.',
    location: { addressLine1: 'Dharamkot Road', locality: 'McLeod Ganj', city: 'Dharamshala', state: 'Himachal Pradesh', country: 'India', pincode: '176219', nearbyLandmarks: ['McLeod Ganj Market', 'Bhagsu Waterfall', 'Dalai Lama Temple'] },
    amenities: ['Wi-Fi', 'Mountain View', 'Cafe', 'Common Lounge', 'Lockers', 'Laundry', 'Work Desk', 'Travel Desk', 'Hot Water'],
    highlights: ['Dhauladhar views', 'McLeod Ganj access', 'Social common areas', 'Workation facilities'],
    roomTypes: [
      room('room_seed_dharam_mixed_6', '6-Bed Dorm', 'Mixed dormitory with individual storage and mountain-inspired common spaces.', 'Bunk Bed', 6, 0, ['Locker', 'Reading Light', 'Charging Point', 'Shared Bathroom']),
      room('room_seed_dharam_female_4', '4-Bed Female Dorm', 'Female-only dorm with secure storage and hot water access.', 'Bunk Bed', 4, 0, ['Locker', 'Charging Point', 'Shared Bathroom']),
      room('room_seed_dharam_private_double', 'Private Dhauladhar Room', 'Private room with space for a couple and one child.', 'Queen Bed', 2, 1, ['Private Bathroom', 'Mountain View', 'Work Desk'], true)
    ],
    ratePlans: rates('rate_seed_dharam', 'room_seed_dharam_mixed_6', 'room_seed_dharam_private_double', 750, 2400)
  }
];

const findSeedActor = async () => (await User.findOne({ role: 'super_admin' }).sort({ createdAt: 1 }))
  || (await User.findOne({ role: 'admin' }).sort({ createdAt: 1 }));

const canonicalHimachal = CANONICAL_MEDIA_ASSETS.filter((asset) => asset.geography?.state === 'Himachal Pradesh');

const upsertHostelMedia = async (definition, actor) => Promise.all(['hero', 'gallery-1', 'gallery-2', 'gallery-3'].map(async (role, index) => {
  const sourceAsset = canonicalHimachal[(definition.mediaOffset + index) % canonicalHimachal.length];
  const publicId = `submission-demo/hostels/${definition.city.toLowerCase()}/${role}`;
  const geography = { ...sourceAsset.geography, destination: definition.city, city: definition.city };
  const tags = [...new Set([...(sourceAsset.tags || []), 'submission-demo', 'demo-seed', `seed-hostel-${definition.city.toLowerCase()}`])];
  return MediaAsset.findOneAndUpdate(
    { 'storage.publicId': publicId },
    {
      type: 'IMAGE', title: `[SEED] ${definition.city} Hostel ${role === 'hero' ? 'Hero' : `Gallery ${index}`}`,
      altText: `${definition.city} demo hostel ${role.replace('-', ' ')}`,
      caption: `Submission demo media for the ${definition.city} Hostel Catalog record.`,
      storage: { provider: 'external', publicId, secureUrl: sourceAsset.storage.secureUrl, width: sourceAsset.storage.width || 1600, height: sourceAsset.storage.height || 900, format: 'jpg', bytes: 0 },
      geography, locationKeys: generateLocationKeys(geography, definition.name, tags), tags,
      categories: ['Hostel', 'Accommodation', role === 'hero' ? 'Hero' : 'Gallery'], orientation: 'LANDSCAPE',
      usage: { itinerary: true, destination: true, tripCard: true, hero: role === 'hero', hotel: true, gallery: true },
      source: { sourceType: 'PROJECT_ASSET', attribution: 'WanderLuxe Editorial Archive', sourceUrl: sourceAsset.storage.secureUrl, license: 'Commercial Editorial Use' },
      active: true, featured: role === 'hero', createdBy: actor._id
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
}));

const mediaRef = (asset) => ({ assetId: asset._id, publicId: asset.storage.publicId, secureUrl: asset.storage.secureUrl, altText: asset.altText, caption: asset.caption });

export const seedHostelCatalogDemo = async ({ cleanup = false } = {}) => {
  assertDemoSeedAllowed();
  if (!(await connectDB())) throw new Error('Database connection is required for the Hostel Catalog demo seed.');
  const actor = await findSeedActor();
  if (!actor) throw new Error('No Admin/Super Admin account exists. Create a staff user before running demo seeds.');

  if (cleanup) {
    await Hotel.deleteMany({ name: { $in: DEMO_HOSTEL_NAMES }, tags: 'submission-demo' });
    const demoAssets = await MediaAsset.find({ tags: 'submission-demo', 'storage.publicId': /^submission-demo\/hostels\// });
    let removedAssets = 0;
    for (const asset of demoAssets) {
      const [hotelRefs, tripRefs, quotationRefs] = await Promise.all([
        Hotel.countDocuments({ $or: [{ 'media.hero.assetId': asset._id }, { 'media.gallery.assetId': asset._id }, { 'roomTypes.media.assetId': asset._id }] }),
        Trip.countDocuments({ 'itinerary.coverMediaAssetId': asset._id }),
        Quotation.countDocuments({ 'itinerary.coverMediaAssetId': asset._id })
      ]);
      if (hotelRefs + tripRefs + quotationRefs === 0) { await asset.deleteOne(); removedAssets += 1; }
    }
    console.log(`HOSTEL DEMO CLEANUP COMPLETE: hotels=${DEMO_HOSTEL_NAMES.length}, unreferencedMedia=${removedAssets}`);
    return [];
  }

  const seeded = [];
  for (const definition of buildHostelSeedDefinitions()) {
    const assets = await upsertHostelMedia(definition, actor);
    const references = assets.map(mediaRef);
    const payload = {
      ...definition, mediaOffset: undefined, normalizedName: normalizedHotelName(definition.name),
      propertyType: 'HOSTEL', status: 'ACTIVE', starRating: 4, stayInfo: commonStayInfo,
      availableMealPlans: ['EP', 'CP'], media: { hero: references[0], gallery: references.slice(1) },
      roomTypes: definition.roomTypes.map((item, index) => ({ ...item, media: [references[Math.min(index + 1, references.length - 1)]] })),
      internalNotes: 'Submission demo seed. Reference rates are illustrative and are not live availability.',
      createdBy: actor._id, updatedBy: actor._id
    };
    delete payload.mediaOffset;
    let hotel = await Hotel.findOne({ normalizedName: payload.normalizedName, 'location.city': definition.city }).select('+normalizedName');
    if (!hotel) hotel = new Hotel({ ...payload, catalogVersion: 1 });
    else hotel.set({ ...payload, catalogVersion: hotel.catalogVersion || 1 });
    await hotel.save();
    seeded.push(hotel);
  }

  const verified = await Hotel.find({ name: { $in: DEMO_HOSTEL_NAMES }, tags: 'submission-demo' });
  if (verified.length !== 3 || verified.some((hotel) => hotel.status !== 'ACTIVE' || hotel.propertyType !== 'HOSTEL' || !hotel.media?.hero?.assetId || hotel.roomTypes.length < 2 || !hotel.availableMealPlans.length || !hotel.location?.city)) {
    throw new Error('Hostel demo seed verification failed.');
  }
  console.log('HOSTEL DEMO SEED COMPLETE');
  verified.forEach((hotel) => console.log(`${hotel.name} | ${hotel._id} | ${hotel.hotelCode} | ${hotel.location.city} | rooms=${hotel.roomTypes.length} | ${hotel.status}`));
  console.log(`Open: ${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')}/staff/admin/hotels`);
  return verified;
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    await seedHostelCatalogDemo({ cleanup: process.argv.includes('--cleanup') });
  } catch (error) {
    console.error(`Hostel demo seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

