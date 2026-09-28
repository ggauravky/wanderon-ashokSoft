import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import mediaRoutes from './routes/mediaRoutes.js';
import MediaAsset from './models/MediaAsset.js';
import { getMediaAssetById, listAdminMediaAssets } from './controllers/mediaAssetController.js';
import {
  assertMediaStorageAvailable,
  getMediaStorageStatus,
  isSafeMediaUrl,
  normalizeUploadedMedia
} from './utils/mediaStoragePolicy.js';
import { buildHostelSeedDefinitions } from './scripts/seedHostelCatalogDemo.js';
import { buildMaximumQuotationPayload } from './scripts/seedMaximumQuotationDemo.js';
import { buildPublicRevisionDto, buildRevisionSnapshot, validateQuotationV2 } from './services/quotationV2Service.js';
import { buildQuotationPresentationModel } from '../frontend/src/quotation-v2/buildQuotationPresentationModel.js';

const responseRecorder = () => {
  const result = { statusCode: 200, body: null };
  return {
    result,
    res: {
      status(code) { result.statusCode = code; return this; },
      json(body) { result.body = body; return body; }
    }
  };
};

test('static Media Admin routes are registered before the dynamic media id route', () => {
  const paths = mediaRoutes.stack.filter((layer) => layer.route).map((layer) => layer.route.path);
  const dynamicIndex = paths.indexOf('/:id');
  for (const path of ['/admin', '/coverage', '/health']) {
    assert(paths.includes(path));
    assert(paths.indexOf(path) < dynamicIndex, `${path} must precede /:id`);
  }
});

test('Admin media filters are escaped, mapped to whitelisted fields, and return facets', async () => {
  const originals = {
    readyState: mongoose.connection.readyState,
    find: MediaAsset.find,
    countDocuments: MediaAsset.countDocuments,
    distinct: MediaAsset.distinct
  };
  let capturedFilter;
  const chain = { sort() { return this; }, skip() { return this; }, limit() { return this; }, lean: async () => [] };
  try {
    mongoose.connection.readyState = 1;
    MediaAsset.find = (filter) => { capturedFilter = filter; return chain; };
    MediaAsset.countDocuments = async () => 0;
    MediaAsset.distinct = async (field) => ({
      'geography.destination': ['Manali'], categories: ['Hostel'], 'source.sourceType': ['PROJECT_ASSET'], type: ['IMAGE']
    }[field] || []);
    const { res, result } = responseRecorder();
    await listAdminMediaAssets({ query: { search: '[Manali].*', destination: 'Manali', type: 'IMAGE', category: 'Hostel', source: 'PROJECT_ASSET', active: 'true', page: '1', limit: '24' } }, res);
    assert.equal(result.statusCode, 200);
    assert.equal(capturedFilter.type, 'IMAGE');
    assert.equal(capturedFilter.categories, 'Hostel');
    assert.equal(capturedFilter['source.sourceType'], 'PROJECT_ASSET');
    assert.equal(capturedFilter['geography.destination'].$regex.source, 'Manali');
    assert.match(capturedFilter.$and[0].$or[0].title.source, /\\\[Manali\\\]\\\.\\\*/);
    assert.deepEqual(result.body.facets.types, ['IMAGE']);
    assert.deepEqual(result.body.facets.sources, ['PROJECT_ASSET']);
  } finally {
    mongoose.connection.readyState = originals.readyState;
    MediaAsset.find = originals.find;
    MediaAsset.countDocuments = originals.countDocuments;
    MediaAsset.distinct = originals.distinct;
  }
});

test('Admin media list fails clearly without Mongo while public fallback remains separate', async () => {
  const readyState = mongoose.connection.readyState;
  try {
    mongoose.connection.readyState = 0;
    const { res, result } = responseRecorder();
    await listAdminMediaAssets({ query: {} }, res);
    assert.equal(result.statusCode, 503);
    assert.equal(result.body.message, 'Media Library is temporarily unavailable.');
  } finally {
    mongoose.connection.readyState = readyState;
  }
});

test('invalid media ids return a controlled 400 response', async () => {
  const readyState = mongoose.connection.readyState;
  try {
    mongoose.connection.readyState = 1;
    const { res, result } = responseRecorder();
    await getMediaAssetById({ params: { id: 'not-an-object-id' } }, res);
    assert.equal(result.statusCode, 400);
    assert.equal(result.body.message, 'Invalid media asset ID');
  } finally {
    mongoose.connection.readyState = readyState;
  }
});

test('media URL policy accepts public HTTPS and only the controlled development upload origin', () => {
  const production = { NODE_ENV: 'production' };
  assert.equal(isSafeMediaUrl('https://res.cloudinary.com/demo/image/upload/sample.jpg', { env: production }), true);
  for (const url of ['blob:https://example.com/x', 'file:///tmp/x.jpg', 'data:image/png;base64,abc', 'javascript:alert(1)', 'ftp://example.com/x', 'http://localhost:5000/uploads/x.jpg', 'https://10.0.0.1/x.jpg', 'https://192.168.1.2/x.jpg', 'https://172.20.0.1/x.jpg', 'https://169.254.169.254/latest', 'https://service.internal/x.jpg']) {
    assert.equal(isSafeMediaUrl(url, { env: production }), false, url);
  }
  const development = { NODE_ENV: 'development', BACKEND_URL: 'http://localhost:5000' };
  assert.equal(isSafeMediaUrl('http://localhost:5000/uploads/images/demo.png', { env: development }), true);
  assert.equal(isSafeMediaUrl('http://127.0.0.1:5000/uploads/images/demo.png', { env: development }), false);
  assert.equal(isSafeMediaUrl('http://localhost:5000/private/demo.png', { env: development }), false);
});

test('production-like storage fails closed and normalized upload metadata stays truthful', () => {
  const renderEnv = { NODE_ENV: 'development', RENDER: 'true' };
  assert.deepEqual(getMediaStorageStatus(renderEnv), { provider: 'unavailable', configured: false, uploadReady: false });
  assert.throws(() => assertMediaStorageAvailable(renderEnv), (error) => error.code === 'MEDIA_STORAGE_UNAVAILABLE' && error.status === 503);
  assert.deepEqual(getMediaStorageStatus({ NODE_ENV: 'development' }), { provider: 'local-development', configured: false, uploadReady: true });
  const result = normalizeUploadedMedia({ source: 'local_fallback', public_id: 'local/images/demo.png', secure_url: 'http://localhost:5000/uploads/images/demo.png' }, { originalname: 'demo.png', size: 321 });
  assert.equal(result.provider, 'local');
  assert.equal(result.format, 'png');
  assert.equal(result.bytes, 321);
});

test('Hostel seed definitions are deterministic and complete', () => {
  const first = buildHostelSeedDefinitions();
  const second = buildHostelSeedDefinitions();
  assert.deepEqual(first, second);
  assert.equal(new Set(first.map((hotel) => hotel.name)).size, 3);
  first.forEach((hotel) => {
    assert(hotel.roomTypes.length >= 3);
    assert(hotel.ratePlans.length >= 4);
    assert(hotel.tags.includes('submission-demo'));
    assert.equal(new Set(hotel.roomTypes.map((room) => room.roomTypeId)).size, hotel.roomTypes.length);
  });
});

test('maximum quotation seed shape validates and public output hides planning, costs, and gated documents', () => {
  const actorId = new mongoose.Types.ObjectId();
  const actor = { _id: actorId, name: 'Demo Admin', email: 'admin@example.test', phone: '' };
  const media = Array.from({ length: 8 }, (_, index) => ({ _id: new mongoose.Types.ObjectId(), title: `Media ${index}`, altText: `Media ${index}`, caption: '', storage: { provider: 'cloudinary', publicId: `demo/${index}`, secureUrl: `https://cdn.example.test/${index}.jpg`, width: 1600, height: 900, format: 'jpg', bytes: 1000 } }));
  const ticketAssets = { train: media[0], bus: media[1], voucher: { ...media[2], storage: { ...media[2].storage, secureUrl: 'https://cdn.example.test/voucher.pdf', format: 'pdf' } } };
  const hotelOptions = Array.from({ length: 3 }, (_, index) => ({ optionId: `seed_hotel_${index + 1}`, sourceKind: 'HOTEL_CATALOG', reviewStatus: 'REVIEWED', catalogHotelId: new mongoose.Types.ObjectId(), catalogHotelCode: `HOT-${index}`, catalogVersion: 1, catalogRoomTypeId: `room-${index}`, catalogMealPlan: 'CP', hotelName: `Demo Hostel ${index + 1}`, city: ['Manali', 'Kasol', 'Dharamshala'][index], location: 'Himachal Pradesh', category: 'Hostel', roomType: 'Private Double', rooms: 2, occupancy: 'Double Sharing', mealPlan: 'CP (Breakfast)', checkIn: new Date('2026-10-18'), checkOut: new Date('2026-10-20'), nights: 2, costPerNight: 2000, pricePerNight: 3000, totalCost: 8000, totalPrice: 12000, imageUrl: media[index].storage.secureUrl, gallery: [], amenities: ['Wi-Fi'], availabilityStatus: 'UNCONFIRMED', recommendationType: 'CUSTOM', selected: true, documents: [] }));
  const payload = buildMaximumQuotationPayload({ actor, quotationNumber: 'WLX-Q-2026-TEST01', hotelOptions, ticketAssets, media });
  const validation = validateQuotationV2(payload, { forFinalization: true, forShare: true });
  assert.deepEqual(validation.errors, []);
  const snapshot = buildRevisionSnapshot(payload);
  const revision = { _id: new mongoose.Types.ObjectId(), version: 1, status: 'FINALIZED', snapshot, approval: {} };
  const share = { _id: new mongoose.Types.ObjectId(), templateKey: 'journey', allowAttachments: true, allowPdfDownload: true, requireEmailVerification: false, approvalEnabled: false, recipientEmail: payload.customerSnapshot.email, expiresAt: payload.validUntil, isActive: true, revokedAt: null };
  const dto = buildPublicRevisionDto({ quotation: payload, revision, share });
  const serialized = JSON.stringify(dto);
  assert(!serialized.includes('planningReference'));
  assert(!serialized.includes('Internal Demo Supplier Invoice'));
  assert(!serialized.includes('[DEMO] Mountain Transfer Partner'));
  assert(dto.attachments.every((item) => item.visibility === 'CUSTOMER_VISIBLE'));
  const presentation = buildQuotationPresentationModel(dto);
  assert(!presentation.attachments.some((item) => item.pdfDisplayMode === 'HIDDEN'));
  assert(presentation.attachments.some((item) => item.pdfDisplayMode === 'LINK_ONLY'));
});

