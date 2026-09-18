import assert from 'node:assert/strict';
import test from 'node:test';
import { captureMarketingAttribution, getLeadAttributionPayload, sanitizeUtmValue } from './marketingAttribution.js';

const installBrowser = () => {
  const values = new Map();
  global.window = { location: { search: '', pathname: '/', host: 'wanderluxe.in' }, localStorage: { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) } };
  global.document = { referrer: '' };
};

test('browser attribution preserves first touch and updates explicit last touch', () => {
  installBrowser();
  captureMarketingAttribution('?utm_id=CAMPAIGN-A&utm_source=Instagram&utm_medium=paid_social&utm_campaign=winter', '/trips/kashmir');
  captureMarketingAttribution('', '/contact');
  captureMarketingAttribution('?utm_id=CAMPAIGN-B&utm_source=Google&utm_medium=cpc&utm_campaign=search', '/contact');
  window.location.pathname = '/contact';
  const payload = getLeadAttributionPayload();
  assert.equal(payload.firstTouch.utmId, 'CAMPAIGN-A');
  assert.equal(payload.firstTouch.source, 'instagram');
  assert.equal(payload.lastTouch.utmId, 'CAMPAIGN-B');
  assert.equal(payload.leadCapture.landingPath, '/contact');
  delete global.window; delete global.document;
});

test('UTM sanitizer canonicalizes safely', () => {
  assert.equal(sanitizeUtmValue(' Paid Social / India '), 'paid_social_india');
});

test('first explicit campaign replaces an initial direct placeholder', () => {
  installBrowser();
  captureMarketingAttribution('', '/');
  captureMarketingAttribution('?utm_id=CAMPAIGN-A&utm_source=Instagram&utm_medium=paid_social', '/trips/kashmir');
  const payload = getLeadAttributionPayload();
  assert.equal(payload.firstTouch.utmId, 'CAMPAIGN-A');
  assert.equal(payload.firstTouch.source, 'instagram');
  delete global.window; delete global.document;
});
