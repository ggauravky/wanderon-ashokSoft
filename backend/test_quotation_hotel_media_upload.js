import assert from 'node:assert/strict';
import test from 'node:test';
import MediaAsset, { generateLocationKeys } from './models/MediaAsset.js';
import { isAllowedHotelMediaCategory, normalizeQuotationHotelMediaInput } from './services/quotationHotelMediaService.js';

test('normalizes snake-case Cloudinary fields into a valid hotel MediaAsset', () => {
  const input = normalizeQuotationHotelMediaInput({
    title: 'Harbour Hotel',
    altText: 'Harbour Hotel exterior',
    storage: {
      secure_url: 'https://res.cloudinary.com/demo/image/upload/harbour.webp',
      public_id: 'wanderluxe/quotation-hotels/harbour',
      width: 1400,
      height: 900,
      format: 'webp',
      bytes: 245000
    },
    geography: { destination: 'Delhi' },
    hotel: { city: 'Mumbai', location: 'Colaba' },
    quotationDestination: 'Goa',
    categories: ['Hotel'],
    tags: ['Harbour']
  });

  assert.equal(input.storage.secureUrl, 'https://res.cloudinary.com/demo/image/upload/harbour.webp');
  assert.equal(input.storage.publicId, 'wanderluxe/quotation-hotels/harbour');
  assert.equal(input.geography.destination, 'Mumbai');
  assert.deepEqual(input.tags, ['harbour', 'hotel', 'property']);

  const asset = new MediaAsset({
    type: 'IMAGE',
    ...input,
    locationKeys: generateLocationKeys(input.geography, input.title, input.tags),
    usage: { hotel: true, gallery: true },
    source: { sourceType: 'STAFF_UPLOAD', attribution: 'WanderLuxe Staff Upload' }
  });
  assert.equal(asset.validateSync(), undefined);
  assert.equal(asset.source.sourceType, 'STAFF_UPLOAD');
  assert.equal(asset.usage.hotel, true);
});

test('normalizes camel-case upload fields and uses quotation destination fallback', () => {
  const input = normalizeQuotationHotelMediaInput({
    title: 'Mountain Stay',
    altText: 'Mountain Stay room',
    storage: { secureUrl: 'https://cdn.example.com/room.png', publicId: 'room-1' },
    quotationDestination: 'Spiti Valley'
  });

  assert.equal(input.storage.secureUrl, 'https://cdn.example.com/room.png');
  assert.equal(input.geography.destination, 'Spiti Valley');
  assert.deepEqual(input.categories, ['Hotel']);
});

test('falls back to explicitly supplied destination and preserves missing destination for a useful 400', () => {
  assert.equal(normalizeQuotationHotelMediaInput({ destination: 'Kerala' }).geography.destination, 'Kerala');
  assert.equal(normalizeQuotationHotelMediaInput({}).geography.destination, '');
});

test('hotel categories are checked against the endpoint contract', () => {
  assert.equal(isAllowedHotelMediaCategory('Hotel'), true);
  assert.equal(isAllowedHotelMediaCategory('Beach Resort'), true);
  assert.equal(isAllowedHotelMediaCategory('STAFF UPLOAD'), false);
});
