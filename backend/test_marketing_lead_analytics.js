import assert from 'node:assert/strict';
import test from 'node:test';
import { ACTION_PERMISSIONS } from './middlewares/authMiddleware.js';
import { normalizeUtmValue, sanitizeAttributionTouch } from './services/marketingAttributionService.js';
import { parseAnalyticsRange, summarizeMarketingCohort } from './services/marketingLeadAnalyticsService.js';

test('UTM values normalize without changing human campaign names', () => {
  assert.equal(normalizeUtmValue(' Instagram Ads! '), 'instagram_ads');
  assert.equal(sanitizeAttributionTouch({ utm_id: 'kashmir-winter-2026', utm_source: 'Instagram' }).utmId, 'KASHMIR-WINTER-2026');
});

test('analytics range rejects invalid custom dates before Mongo receives them', () => {
  assert.throws(() => parseAnalyticsRange({ range: 'custom', from: 'invalid', to: '2026-09-18' }), /Invalid analytics date range/);
  assert.throws(() => parseAnalyticsRange({ range: 'custom', from: '2026-10-01', to: '2026-09-01' }), /Invalid analytics date range/);
});

test('cohort funnel deduplicates quotation revisions and uses real paid amounts', () => {
  const lead = { _id: 'lead-1', referenceId: 'WLX-1', createdAt: '2026-09-01T00:00:00Z', firstContactAt: '2026-09-01T01:00:00Z', contactCount: 1, status: 'CONVERTED', destination: 'Kashmir', source: 'contact_page', marketingAttribution: { firstTouch: { source: 'instagram', medium: 'paid_social', content: 'reel_01' }, campaignId: 'campaign-1', campaignNameSnapshot: 'Kashmir Winter', campaignCodeSnapshot: 'KASHMIR-WINTER-2026' }, campaign: { spend: 10000 } };
  const result = summarizeMarketingCohort([{ lead, quotations: [{ status: 'APPROVED', approvedRevisionId: 'revision-1' }, { status: 'CONVERTED' }], bookings: [{ bookingStatus: 'PROVISIONALLY_CONFIRMED', paymentStatus: 'PARTIALLY_PAID', createdAt: '2026-09-04T00:00:00Z', pricing: { finalAmount: 100000, amountPaid: 20000, currency: 'INR' } }] }], { key: '30d' });
  assert.equal(result.summary.potentialLeads, 1);
  assert.equal(result.summary.quotationLeads, 1);
  assert.equal(result.summary.bookingLeads, 1);
  assert.equal(result.summary.payingCustomers, 1);
  assert.equal(result.summary.bookingValue, 100000);
  assert.equal(result.summary.paidRevenue, 20000);
  assert.equal(result.summary.leadToPaidRate, 100);
});

test('zero-data cohort returns controlled zero metrics', () => {
  const result = summarizeMarketingCohort([], { key: '30d' });
  assert.equal(result.summary.potentialLeads, 0);
  assert.equal(result.summary.leadToPaidRate, 0);
  assert.equal(result.summary.paidRevenue, 0);
});

test('lead analytics permission is restricted to admin and marketing roles', () => {
  assert.deepEqual(ACTION_PERMISSIONS['marketing:view_lead_analytics'], ['super_admin', 'admin', 'marketing']);
  assert.equal(ACTION_PERMISSIONS['leads:view'].includes('marketing'), false);
});

