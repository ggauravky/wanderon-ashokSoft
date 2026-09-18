import assert from 'node:assert/strict';
import test from 'node:test';
import MediaAsset from './models/MediaAsset.js';
import { CANONICAL_MEDIA_ASSETS, HOTEL_MEDIA_ASSETS } from './data/canonicalMediaAssets.js';

test('canonical seed includes a useful, uniquely identified hotel collection', () => {
  assert.ok(HOTEL_MEDIA_ASSETS.length >= 15 && HOTEL_MEDIA_ASSETS.length <= 25);
  assert.equal(new Set(HOTEL_MEDIA_ASSETS.map((asset) => asset.storage.publicId)).size, HOTEL_MEDIA_ASSETS.length);
  assert.equal(new Set(HOTEL_MEDIA_ASSETS.map((asset) => asset.storage.secureUrl)).size, HOTEL_MEDIA_ASSETS.length);
  for (const asset of HOTEL_MEDIA_ASSETS) {
    assert.equal(asset.usage.hotel, true);
    assert.equal(asset.source.sourceType, 'UNSPLASH_CURATED');
    assert.match(asset.title, /Inspiration$/);
    assert.ok(asset.categories.length > 0);
    assert.ok(asset.tags.includes('hotel'));
  }
});

test('canonical mapping preserves hotel usage and source metadata', () => {
  const hotels = CANONICAL_MEDIA_ASSETS.filter((asset) => asset.usage?.hotel);
  assert.equal(hotels.length, HOTEL_MEDIA_ASSETS.length);
  assert.ok(hotels.every((asset) => asset.source.sourceType === 'UNSPLASH_CURATED'));
});

test('MediaAsset schema supports hotel queries and staff upload provenance', () => {
  assert.ok(MediaAsset.schema.path('source.sourceType').enumValues.includes('STAFF_UPLOAD'));
  const hotel = new MediaAsset({
    title: 'Uploaded room',
    altText: 'Uploaded hotel room',
    storage: { secureUrl: 'https://example.com/room.jpg' },
    geography: { destination: 'Spiti Valley' },
    categories: ['Room'],
    usage: { hotel: true },
    source: { sourceType: 'STAFF_UPLOAD' }
  });
  assert.equal(hotel.validateSync(), undefined);
  assert.equal(hotel.usage.hotel, true);
});
