import assert from 'node:assert/strict';
import test from 'node:test';
import { bannerStatusQuery, getBannerEffectiveState, normalizeBannerStatus } from './services/bannerEligibilityService.js';

const now = new Date('2026-09-19T12:00:00.000Z');
const past = new Date('2026-09-18T23:59:59.999Z');
const future = new Date('2026-09-25T00:00:00.000Z');

test('active and started scheduled banners are eligible within their window', () => {
  assert.equal(getBannerEffectiveState({ status: 'active' }, now).eligible, true);
  assert.equal(getBannerEffectiveState({ status: 'scheduled', startDate: past, endDate: future }, now).effectiveStatus, 'active');
  assert.equal(getBannerEffectiveState({ status: 'active', startDate: past, endDate: future }, now).reason, 'ACTIVE_IN_WINDOW');
});

test('inactive, future, and expired banners are not publicly eligible', () => {
  assert.equal(getBannerEffectiveState({ status: 'inactive' }, now).eligible, false);
  assert.equal(getBannerEffectiveState({ status: 'scheduled', startDate: future }, now).effectiveStatus, 'scheduled');
  assert.equal(getBannerEffectiveState({ status: 'active', endDate: past }, now).effectiveStatus, 'expired');
});

test('active status filter shares the public eligibility rules', () => {
  assert.deepEqual(bannerStatusQuery('active', now).status.$in, ['active', 'scheduled']);
  assert.equal(bannerStatusQuery('scheduled', now).startDate.$gt, now);
  assert.equal(bannerStatusQuery('expired', now).endDate.$lt, now);
});

test('save normalization explains future dates and rejects impossible activation', () => {
  assert.equal(normalizeBannerStatus('active', null, null, now), 'active');
  assert.equal(normalizeBannerStatus('active', future, null, now), 'scheduled');
  assert.equal(normalizeBannerStatus('scheduled', past, future, now), 'active');
  assert.throws(() => normalizeBannerStatus('active', null, past, now), /cannot be activated/);
  assert.equal(normalizeBannerStatus('inactive', null, past, now), 'inactive');
});
