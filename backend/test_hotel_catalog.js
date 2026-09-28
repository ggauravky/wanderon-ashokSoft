import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Hotel from './models/Hotel.js';
import MediaAsset from './models/MediaAsset.js';
import Quotation from './models/Quotation.js';
import { requireRoles } from './middlewares/authMiddleware.js';
import { buildPublicRevisionDto } from './services/quotationV2Service.js';
import { escapeSearch, hotelSalesDto, normalizeHotelInput, resolveCatalogHotelOptions, validateHotelActivation } from './services/hotelCatalogService.js';

const hotelId = new mongoose.Types.ObjectId();
const assetId = new mongoose.Types.ObjectId();
const actorId = new mongoose.Types.ObjectId();
const catalog = () => ({
  _id: hotelId, hotelCode: 'WL-HOT-TEST', name: 'Mountain House', normalizedName: 'mountain house',
  propertyType: 'RESORT', status: 'ACTIVE', starRating: 4, catalogVersion: 2,
  location: { city: 'Manali', country: 'India', locality: 'Old Manali' },
  roomTypes: [{ roomTypeId: 'room_deluxe', name: 'Deluxe', active: true }],
  availableMealPlans: ['CP'], amenities: ['Wi-Fi'],
  media: { hero: { assetId, secureUrl: 'https://images.example/hotel.jpg', altText: 'Mountain House' }, gallery: [] },
  ratePlans: [{ ratePlanId: 'rate_cp', roomTypeId: 'room_deluxe', mealPlan: 'CP', active: true, supplierRatePerNight: 3000, customerReferenceRatePerNight: 5000, taxPercent: 12, validFrom: new Date('2026-10-01'), validTo: new Date('2026-10-31'), minNights: 2 }],
  contact: { email: 'private@example.com' }, vendorId: new mongoose.Types.ObjectId(), internalNotes: 'Private', updatedAt: new Date()
});
const option = (overrides = {}) => ({ optionId: 'opt_1', catalogHotelId: String(hotelId), catalogRoomTypeId: 'room_deluxe', catalogMealPlan: 'CP', rooms: 1, nights: 2, checkIn: '2026-10-12', selected: true, hotelName: 'Forged Name', imageUrl: 'https://forged.example/image', costPerNight: 99999, pricePerNight: 99999, ...overrides });
const withCatalog = async (fn) => {
  const original = Hotel.find;
  Hotel.find = () => ({ lean: async () => [catalog()] });
  try { await fn(); } finally { Hotel.find = original; }
};

test('hotel schema supports accommodation types and rejects invalid coordinates', () => {
  const item = new Hotel({ name: 'Property', normalizedName: 'property', location: { city: 'Leh', country: 'India', coordinates: { lat: 100 } }, propertyType: 'HOSTEL', createdBy: actorId, updatedBy: actorId });
  assert.equal(item.propertyType, 'HOSTEL');
  assert.equal(item.status, 'DRAFT');
  assert.equal(item.validateSync()?.errors['location.coordinates.lat']?.kind, 'max');
});

test('Sales can pass catalog read guard but cannot pass Admin write guard', () => {
  const req = { user: { role: 'sales' } };
  let status;
  const res = { status(value) { status = value; return this; }, json() { return this; } };
  let reads = 0;
  requireRoles('super_admin', 'admin', 'sales')(req, res, () => { reads += 1; });
  requireRoles('super_admin', 'admin')(req, res, () => { throw new Error('Sales write allowed'); });
  assert.equal(reads, 1);
  assert.equal(status, 403);
});

test('activation requires property facts without requiring rates or vendor', () => {
  const item = catalog();
  assert.deepEqual(validateHotelActivation(item), []);
  delete item.media.hero;
  assert.ok(validateHotelActivation(item).some((problem) => problem.includes('hero')));
});

test('Sales DTO contains property details but never supplier, contact or rate fields', () => {
  const dto = hotelSalesDto(catalog());
  assert.equal(dto.name, 'Mountain House');
  assert.equal(dto.roomTypes[0].name, 'Deluxe');
  assert.equal(dto.ratePlans, undefined);
  assert.equal(dto.contact, undefined);
  assert.equal(dto.vendorId, undefined);
  assert.equal(dto.internalNotes, undefined);
});

test('search input is escaped and bounded', () => {
  assert.equal(escapeSearch('a.*(b)'), 'a\\.\\*\\(b\\)');
  assert.equal(escapeSearch('x'.repeat(200)).length, 80);
});

test('Hotel media is resolved from active Media Library record, not client URL', async () => {
  const original = MediaAsset.find;
  MediaAsset.find = () => ({ lean: async () => [{ _id: assetId, type: 'IMAGE', active: true, storage: { secureUrl: 'https://trusted.example/photo', publicId: 'hotel/photo' }, altText: 'Trusted', caption: 'Photo' }] });
  try {
    const next = await normalizeHotelInput({ name: 'New', media: { hero: { assetId: String(assetId), secureUrl: 'https://forged.example' }, gallery: [] } }, { actorId });
    assert.equal(next.media.hero.secureUrl, 'https://trusted.example/photo');
    await assert.rejects(normalizeHotelInput({ media: { hero: { assetId: 'bad' } } }, { actorId }), /Media Library/);
  } finally { MediaAsset.find = original; }
});

test('server rebuilds catalog identity and zeroes new Sales commercial fields', async () => withCatalog(async () => {
  const [snapshot] = await resolveCatalogHotelOptions([option()], [], { admin: false });
  assert.equal(snapshot.sourceKind, 'HOTEL_CATALOG');
  assert.equal(snapshot.hotelName, 'Mountain House');
  assert.equal(snapshot.imageUrl, 'https://images.example/hotel.jpg');
  assert.equal(snapshot.mealPlan, 'CP (Breakfast)');
  assert.equal(snapshot.costPerNight, 0);
  assert.equal(snapshot.pricePerNight, 0);
  assert.equal(snapshot.availabilityStatus, 'UNCONFIRMED');
}));

test('existing snapshot stays frozen until explicit refresh, preserving stay and pricing', async () => withCatalog(async () => {
  const saved = { ...option(), sourceKind: 'HOTEL_CATALOG', hotelName: 'Old Name', imageUrl: 'https://old.example', catalogVersion: 1, costPerNight: 2000, pricePerNight: 4000, notes: 'Old note' };
  const [unchanged] = await resolveCatalogHotelOptions([option({ hotelName: 'Forged', nights: 3, notes: 'New note' })], [saved], { admin: false });
  assert.equal(unchanged.hotelName, 'Old Name');
  assert.equal(unchanged.imageUrl, 'https://old.example');
  assert.equal(unchanged.nights, 3);
  assert.equal(unchanged.notes, 'New note');
  assert.equal(unchanged.pricePerNight, 4000);
  assert.equal(unchanged.catalogChanged, true);
  const [refreshed] = await resolveCatalogHotelOptions([option({ refreshFromCatalog: true, nights: 3, notes: 'New note' })], [saved], { admin: false });
  assert.equal(refreshed.hotelName, 'Mountain House');
  assert.equal(refreshed.nights, 3);
  assert.equal(refreshed.pricePerNight, 4000);
  assert.equal(refreshed.notes, 'New note');
}));

test('catalog ID cannot be stripped or exchanged on an existing option', async () => withCatalog(async () => {
  const saved = option();
  await assert.rejects(resolveCatalogHotelOptions([{ ...option(), catalogHotelId: null }], [saved]), /Remove the catalog/);
  await assert.rejects(resolveCatalogHotelOptions([option({ catalogHotelId: String(new mongoose.Types.ObjectId()) })], [saved]), /different catalog/);
}));

test('Admin rate application is explicit and date-bound', async () => withCatalog(async () => {
  const base = option({ applyCatalogRate: true, catalogRatePlanId: 'rate_cp' });
  const [sales] = await resolveCatalogHotelOptions([base], [], { admin: false });
  assert.equal(sales.costPerNight, 0);
  const [admin] = await resolveCatalogHotelOptions([base], [], { admin: true });
  assert.equal(admin.costPerNight, 3000);
  assert.equal(admin.pricePerNight, 5000);
  assert.equal(admin.totalPrice, 10000);
  await assert.rejects(resolveCatalogHotelOptions([option({ ...base, checkIn: '2026-11-01' })], [], { admin: true }), /not valid/);
}));

test('quotation schema and public revision keep catalog provenance private', () => {
  const item = new Quotation({ hotelOptions: [{ optionId: 'opt_1', hotelName: 'Mountain House', sourceKind: 'HOTEL_CATALOG', catalogHotelId: hotelId, catalogVersion: 2 }] });
  assert.equal(item.hotelOptions[0].sourceKind, 'HOTEL_CATALOG');
  const quotation = { _id: 'q1', version: 1, customerSnapshot: {}, tripRequirements: {}, manualPricing: {}, presentationSettings: {} };
  const snapshot = { ...quotation, hotelOptions: [{ optionId: 'opt_1', hotelName: 'Mountain House', selected: true, catalogHotelId: hotelId, catalogVersion: 2, costPerNight: 3000, pricePerNight: 5000, contact: { email: 'private@example.com' }, internalNotes: 'Private' }] };
  const dto = buildPublicRevisionDto({ quotation, revision: { _id: 'r1', version: 1, status: 'SHARED', snapshot, approval: {} }, share: { _id: 's1', templateKey: 'journey', allowAttachments: false, allowPdfDownload: false, expiresAt: new Date(Date.now() + 86_400_000) } });
  assert.equal(dto.hotelOptions[0].catalogHotelId, undefined);
  assert.equal(dto.hotelOptions[0].contact, undefined);
  assert.equal(dto.hotelOptions[0].costPerNight, undefined);
});
