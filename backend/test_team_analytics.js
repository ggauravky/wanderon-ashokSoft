import assert from 'node:assert/strict';
import test from 'node:test';
import { CATEGORY_ROLE, resolveAnalyticsRange } from './services/teamAnalyticsService.js';

test('team analytics categories map only to persisted platform roles', () => {
  assert.deepEqual(CATEGORY_ROLE, { sales: 'sales', marketing: 'marketing', creator: 'influencer' });
});

test('custom India date boundaries preserve the selected calendar days', () => {
  const range = resolveAnalyticsRange({ range: 'custom', from: '2026-09-01', to: '2026-09-02' });
  assert.equal(range.from.toISOString(), '2026-08-31T18:30:00.000Z');
  assert.equal(range.to.toISOString(), '2026-09-02T18:29:59.999Z');
});

test('invalid and reversed custom ranges are rejected before Mongo receives them', () => {
  assert.throws(() => resolveAnalyticsRange({ range: 'custom', from: 'Invalid Date', to: '2026-09-02' }), /YYYY-MM-DD/);
  assert.throws(() => resolveAnalyticsRange({ range: 'custom', from: '2026-09-03', to: '2026-09-02' }), /on or before/);
});

test('all-time ranges do not invent a previous comparison period', () => {
  const range = resolveAnalyticsRange({ range: 'all' }, new Date('2026-09-18T10:00:00.000Z'));
  assert.equal(range.from, null);
  assert.equal(range.previousFrom, null);
  assert.equal(range.previousTo, null);
});
