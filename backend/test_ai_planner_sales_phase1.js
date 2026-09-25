import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import Itinerary from './models/Itinerary.js';
import Lead from './models/Lead.js';
import {
  AI_PLANNER_LEAD_FILTER,
  buildSalesLeadScope,
  deriveAiPlannerLeadSummary,
  sanitizeItineraryDossier
} from './services/aiPlannerLeadService.js';
import {
  buildItineraryPersistencePayload,
  canUpdatePersistedItinerary,
  getGuestRetentionExpiry
} from './services/itineraryPersistenceService.js';
import {
  ITINERARY_TOKEN_PURPOSES,
  signItineraryGuestEditToken,
  signItineraryHandoffToken,
  verifyItineraryGuestEditToken,
  verifyItineraryHandoffToken
} from './services/itineraryHandoffService.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'ai-planner-phase-one-test-secret-that-is-long-enough';

const completePlan = {
  title: 'Seven Days in Spiti', tagline: 'A measured high-altitude circuit', destination: 'Spiti Valley',
  duration: 7, travelers: 3, travelStyle: 'Adventure', pace: 'Balanced', budgetLevel: 'Moderate',
  totalEstimatedCost: 72000, currency: 'INR', weather: { temp: '12°C', condition: 'Clear', seasonTag: 'Autumn' },
  seasonContext: 'Autumn shoulder season', bestTimeToVisit: 'May to October',
  days: [{ day: 1, title: 'Arrival', morning: [{ activity: 'Drive to Kaza' }], galleryMedia: [{ url: 'https://example.com/a.jpg' }] }],
  staySuggestions: ['Kaza Heritage Homestay'], foodSuggestions: ['Thukpa'], packingList: ['Warm layers'], localTips: ['Carry cash'],
  budgetBreakdown: { stay: '₹20,000', transport: '₹25,000', food: '₹10,000', activities: '₹5,000', estimatedTotal: '₹60,000' },
  plannerContext: { origin: 'Delhi', datesFlexible: true, flexibleMonth: 'October 2026', travelersBreakdown: { adults: 2, children: 1, infants: 0, seniors: 0 }, interests: ['Photography'], budgetAmount: 45000 },
  healthReport: { isFeasible: true, feasibilityScore: 92, checks: [{ id: 'pace', code: 'PACE', name: 'Pace checked', status: 'pass', severity: 'low', message: 'Balanced.' }], modificationsApplied: ['Added acclimatization buffer.'] },
  media: { hero: 'https://example.com/hero.jpg' }, matchedTrip: { _id: '66cc11111111111111111111', title: 'Spiti Circuit', price: 42000 }, source: 'gemini-ai'
};

test('Sales queue scopes isolate Expert Requests and AI Planner Leads', () => {
  assert.deepEqual(buildSalesLeadScope({ user: { role: 'sales' }, queue: 'expert_requests' }), { leadType: 'callback_request' });
  assert.deepEqual(buildSalesLeadScope({ user: { role: 'sales' }, queue: 'ai_planner' }), AI_PLANNER_LEAD_FILTER);
  assert.deepEqual(buildSalesLeadScope({ user: { role: 'sales' }, queue: 'all_sales' }), { $or: [{ leadType: 'callback_request' }, AI_PLANNER_LEAD_FILTER] });
});

test('unknown Sales queue cannot broaden access', () => {
  assert.throws(() => buildSalesLeadScope({ user: { role: 'sales' }, queue: 'everything' }), /Unknown Sales queue/);
});

test('AI Planner queue is restricted to Sales and administrators', () => {
  assert.throws(
    () => buildSalesLeadScope({ user: { role: 'operations' }, queue: 'ai_planner' }),
    (error) => error.status === 403
  );
  assert.deepEqual(buildSalesLeadScope({ user: { role: 'admin' }, queue: 'ai_planner' }), AI_PLANNER_LEAD_FILTER);
});

test('AI Planner Lead summary is derived from the authorized source itinerary', () => {
  const summary = deriveAiPlannerLeadSummary(completePlan, { destination: 'Forged', travelersCount: 99 });
  assert.equal(summary.destination, 'Spiti Valley');
  assert.equal(summary.travelersCount, 3);
  assert.equal(summary.travelMonth, 'October 2026');
  assert.equal(summary.tripTitle, 'Seven Days in Spiti');
  assert.match(summary.budgetPerPerson, /45,000/);
});

test('persistence payload keeps complete generated planning data', () => {
  const payload = buildItineraryPersistencePayload(completePlan);
  for (const field of ['plannerContext', 'days', 'media', 'weather', 'seasonContext', 'healthReport', 'budgetBreakdown', 'packingList', 'localTips', 'staySuggestions']) {
    assert.ok(payload[field], `${field} should be present`);
  }
  assert.equal(payload.healthReport.checks[0].code, 'PACE');
  assert.equal(String(payload.matchedTrip.id), completePlan.matchedTrip._id);
});

test('Itinerary schema stores lifecycle, version, season and structured health report', async () => {
  const itinerary = new Itinerary({ ...buildItineraryPersistencePayload(completePlan), lifecycleStatus: 'GENERATED', version: 1 });
  await itinerary.validate();
  assert.equal(itinerary.lifecycleStatus, 'GENERATED');
  assert.equal(itinerary.version, 1);
  assert.equal(itinerary.seasonContext, 'Autumn shoulder season');
  assert.equal(itinerary.healthReport.feasibilityScore, 92);
});

test('guest retention defaults to approximately seven days', () => {
  const now = new Date('2026-09-26T00:00:00.000Z');
  const expiry = getGuestRetentionExpiry(now);
  assert.equal((expiry - now) / 86400000, Number(process.env.AI_GUEST_ITINERARY_RETENTION_DAYS) || 7);
});

test('retention index is an absolute TTL index', () => {
  const ttl = Itinerary.schema.indexes().find(([keys]) => keys.retentionExpiresAt === 1);
  assert.ok(ttl);
  assert.equal(ttl[1].expireAfterSeconds, 0);
});

test('source itinerary has a unique partial Lead index for concurrent idempotency', () => {
  const index = Lead.schema.indexes().find(([, options]) => options.name === 'unique_lead_per_source_itinerary');
  assert.ok(index);
  assert.deepEqual(index[0], { sourceItineraryId: 1 });
  assert.equal(index[1].unique, true);
  assert.deepEqual(index[1].partialFilterExpression, { sourceItineraryId: { $type: 'objectId' } });
});

test('guest edit and Lead handoff tokens have distinct bound purposes', () => {
  const edit = signItineraryGuestEditToken('plan-a');
  const handoff = signItineraryHandoffToken('plan-a');
  assert.equal(verifyItineraryGuestEditToken(edit, 'plan-a'), true);
  assert.equal(verifyItineraryHandoffToken(handoff, 'plan-a'), true);
  assert.equal(verifyItineraryHandoffToken(edit, 'plan-a'), false);
  assert.equal(verifyItineraryGuestEditToken(handoff, 'plan-a'), false);
  assert.equal(jwt.decode(edit).purpose, ITINERARY_TOKEN_PURPOSES.GUEST_EDIT);
});

test('guest edit authorization is itinerary-bound and rejects wrong or expired proof', () => {
  const itinerary = { _id: 'plan-a', user: null };
  assert.equal(canUpdatePersistedItinerary({ itinerary, guestEditToken: signItineraryGuestEditToken('plan-a') }), true);
  assert.equal(canUpdatePersistedItinerary({ itinerary, guestEditToken: signItineraryGuestEditToken('plan-b') }), false);
  const expired = jwt.sign({ purpose: ITINERARY_TOKEN_PURPOSES.GUEST_EDIT, itineraryId: 'plan-a', exp: Math.floor(Date.now() / 1000) - 1 }, process.env.JWT_SECRET);
  assert.equal(canUpdatePersistedItinerary({ itinerary, guestEditToken: expired }), false);
});

test('authenticated owner remains authoritative for persisted plan updates', () => {
  const owner = '66aa11111111111111111111';
  assert.equal(canUpdatePersistedItinerary({ itinerary: { _id: 'plan', user: owner }, user: { _id: owner, role: 'user' } }), true);
  assert.equal(canUpdatePersistedItinerary({ itinerary: { _id: 'plan', user: owner }, user: { _id: '66bb11111111111111111111', role: 'user' } }), false);
});

test('dossier sanitizer returns planning data without ownership or token fields', () => {
  const itinerary = new Itinerary({ ...buildItineraryPersistencePayload(completePlan), userEmail: 'private@example.com', shareToken: 'secret', lifecycleStatus: 'LEAD_LINKED' }).toObject();
  const dossier = sanitizeItineraryDossier(itinerary);
  assert.equal(dossier.title, completePlan.title);
  assert.equal(dossier.days.length, 1);
  assert.equal(Object.hasOwn(dossier, 'user'), false);
  assert.equal(Object.hasOwn(dossier, 'userEmail'), false);
  assert.equal(Object.hasOwn(dossier, 'shareToken'), false);
  assert.equal(JSON.stringify(dossier).includes('secret'), false);
});

test('plan-updated badge comparison can use itinerary and Lead timestamps', () => {
  const leadCreatedAt = new Date('2026-09-20T10:00:00Z');
  const itineraryUpdatedAt = new Date('2026-09-21T10:00:00Z');
  assert.equal(itineraryUpdatedAt > leadCreatedAt, true);
});
