import test from 'node:test';
import assert from 'node:assert/strict';
import { isPdfAssetAllowed } from './services/quotationPdfRenderer.js';

const policy = { allowedOrigins: new Set(['https://wanderluxe.example', 'https://api.wanderluxe.example']), mediaHosts: new Set(['res.cloudinary.com']) };

test('native renderer only loads configured origins and exact HTTPS media hosts', () => {
  assert.equal(isPdfAssetAllowed('https://wanderluxe.example/assets/main.js', policy), true);
  assert.equal(isPdfAssetAllowed('https://api.wanderluxe.example/api/health', policy), true);
  assert.equal(isPdfAssetAllowed('https://res.cloudinary.com/sample/image/upload/photo.jpg', policy), true);
  for (const url of ['https://res.cloudinary.com.evil.example/photo.jpg', 'http://res.cloudinary.com/photo.jpg', 'file:///etc/passwd', 'http://169.254.169.254/latest/meta-data', 'https://unlisted.example/media.jpg']) {
    assert.equal(isPdfAssetAllowed(url, policy), false, url);
  }
});
