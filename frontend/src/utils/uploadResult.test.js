import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeImageUploadResult, validateImageUploadFile } from './uploadResult.js';

test('normalizes Cloudinary snake-case upload fields', () => {
  const result = normalizeImageUploadResult({
    secure_url: 'https://res.cloudinary.com/demo/image/upload/room.jpg',
    public_id: 'wanderluxe/quotation-hotels/room',
    width: 1200,
    height: 800,
    format: 'jpg',
    bytes: 1024
  });

  assert.equal(result.secureUrl, 'https://res.cloudinary.com/demo/image/upload/room.jpg');
  assert.equal(result.publicId, 'wanderluxe/quotation-hotels/room');
  assert.equal(result.secure_url, result.secureUrl);
  assert.equal(result.public_id, result.publicId);
});

test('normalizes camel-case and wrapped upload fields', () => {
  const result = normalizeImageUploadResult({ data: {
    secureUrl: 'https://cdn.example.com/property.webp',
    publicId: 'property-1',
    width: '900',
    height: '600'
  } });

  assert.equal(result.secureUrl, 'https://cdn.example.com/property.webp');
  assert.equal(result.publicId, 'property-1');
  assert.equal(result.width, 900);
  assert.equal(result.height, 600);
});

test('returns an empty canonical URL when an upload response has no URL field', () => {
  const result = normalizeImageUploadResult({ public_id: 'orphan' });
  assert.equal(result.secureUrl, '');
  assert.equal(result.publicId, 'orphan');
});

test('rejects unsupported and oversized image files before upload', () => {
  assert.equal(validateImageUploadFile({ type: 'image/gif', size: 500 }), 'Use a JPG, PNG, or WEBP image.');
  assert.equal(validateImageUploadFile({ type: 'image/png', size: 10 * 1024 * 1024 + 1 }), 'Image must be 10 MB or smaller.');
  assert.equal(validateImageUploadFile({ type: 'image/webp', size: 1024 }), '');
});
