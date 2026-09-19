import assert from 'node:assert/strict';
import test from 'node:test';
import { safeBannerLink } from './bannerLink.js';

test('promotion CTA accepts routed site paths and safe external URLs', () => {
  assert.deepEqual(safeBannerLink('/trips/kashmir'), { external: false, href: '/trips/kashmir' });
  assert.equal(safeBannerLink('https://example.com/path').external, true);
});

test('promotion CTA suppresses protocol-relative and unsafe URLs', () => {
  assert.equal(safeBannerLink('//evil.example'), null);
  assert.equal(safeBannerLink('/\\evil.example'), null);
  assert.equal(safeBannerLink('javascript:alert(1)'), null);
});
