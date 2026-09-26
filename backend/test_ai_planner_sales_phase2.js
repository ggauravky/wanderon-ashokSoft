import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import mongoose from 'mongoose';
import Booking from './models/Booking.js';
import Quotation from './models/Quotation.js';
import {
  buildDeterministicPatch,
  buildQuotationAiImportPreview,
  buildQuotationSourceComparison,
  buildSmartQuotationDraft,
  buildSmartQuotationSummary,
  sanitizeQuotationSourcePlan
} from './services/quotationAiService.js';
import {
  buildPublicRevisionDto,
  buildRevisionSnapshot,
  validateQuotationV2
} from './services/quotationV2Service.js';
import { calculateQuotationPrice } from './services/quotationPricingService.js';

const objectId = () => new mongoose.Types.ObjectId();
const itineraryId = objectId();
const leadId = objectId();
const actorId = objectId();
const generatedAt = new Date('2026-09-01T08:00:00.000Z');
const updatedAt = new Date('2026-09-05T08:00:00.000Z');

const itinerary = {
  _id: itineraryId,
  title: 'Spiti Valley Explorer',
  tagline: 'A thoughtful high-altitude journey.',
  destination: 'Spiti Valley',
  duration: 6,
  travelers: 4,
  travelStyle: 'Adventure',
  pace: 'Balanced',
  currency: 'INR',
  version: 2,
  generatedAt,
  updatedAt,
  totalEstimatedCost: 82000,
  seasonContext: 'Autumn shoulder season',
  bestTimeToVisit: 'May to October',
  budgetBreakdown: { stay: '₹25,000', transport: '₹30,000', estimatedTotal: '₹82,000' },
  plannerContext: {
    origin: 'Delhi', datesFlexible: true, flexibleMonth: 'October 2026',
    travelersBreakdown: { adults: 2, children: 1, infants: 0, seniors: 1 },
    tripType: 'Private family journey', paceRhythm: 'Balanced', interests: ['Photography', 'Monasteries'],
    stayPreference: 'Homestay', roomStyle: 'Family room', hotelRating: 4,
    dietaryPreference: 'Vegetarian', transportPreference: 'Private SUV',
    mobilityConstraints: ['Avoid steep walks'], mustInclude: ['Key Monastery'], avoid: ['Night travel'],
    customPreferences: 'Prefer quiet stays.', budgetAmount: 45000
  },
  days: [
    { day: 1, title: 'Manali arrival', locationName: 'Manali', stay: 'Hotel A', morning: [{ activity: 'Arrival transfer', location: 'Manali' }], coverMedia: { url: 'https://example.com/day-1.jpg' } },
    { day: 2, title: 'Kaza journey', locationName: 'Kaza', stay: 'Hotel B', morning: [{ activity: 'Scenic drive', location: 'Kaza' }] },
    { day: 3, title: 'Monastery circuit', locationName: 'Kaza', stay: 'Hotel B', morning: [{ activity: 'Key Monastery', location: 'Kaza', description: 'Guided visit.' }], galleryMedia: [{ url: 'https://example.com/key.jpg' }] },
    { day: 4, title: 'Village day', locationName: 'Kaza', stay: 'Hotel B', afternoon: [{ activity: 'Kibber Village', location: 'Kibber' }] },
    { day: 5, title: 'Tabo', locationName: 'Tabo', stay: 'Hotel C', evening: [{ activity: 'Old monastery walk', location: 'Tabo' }] },
    { day: 6, title: 'Departure', locationName: 'Manali', morning: [{ activity: 'Departure transfer', location: 'Manali' }] }
  ],
  staySuggestions: ['Hotel B', 'Alternative Homestay'],
  foodSuggestions: ['Momos', 'Thukpa'],
  packingList: ['Warm layers'],
  localTips: ['Carry cash'],
  healthReport: { isFeasible: true }
};

const lead = {
  _id: leadId,
  leadType: 'trip_enquiry',
  source: 'ai_planner',
  sourceItineraryId: itineraryId,
  name: 'Asha Sharma',
  email: 'asha@example.com',
  phone: '+91 9876543210',
  message: 'Anniversary trip.'
};

test('Smart Build maps customer, journey, seniors and preferences without folding seniors into adults', () => {
  const draft = buildSmartQuotationDraft({ lead, itinerary, actor: { _id: actorId } });
  assert.equal(draft.customerSnapshot.name, 'Asha Sharma');
  assert.equal(draft.tripRequirements.origin, 'Delhi');
  assert.equal(draft.tripRequirements.adults, 2);
  assert.equal(draft.tripRequirements.seniors, 1);
  assert.equal(draft.tripRequirements.children, 1);
  assert.equal(draft.tripRequirements.totalTravelers, 4);
  assert.equal(draft.tripPreferences.stayPreference, 'Homestay');
  assert.deepEqual(draft.tripPreferences.avoid, ['Night travel']);
  assert.match(draft.tripRequirements.specialRequests, /Anniversary trip/);
  assert.doesNotMatch(draft.tripRequirements.specialRequests, /Origin:|Interests:|Stay preference:/);
});

test('pricing counts seniors as travelers while applying the existing adult multiplier', () => {
  const result = calculateQuotationPrice({
    tripRequirements: { adults: 1, children: 0, infants: 0, seniors: 1, nights: 1 },
    pricing: { customerBasePrice: 1000 },
    pricingRules: { adultMultiplier: 1, childMultiplier: 0.7, infantMultiplier: 0 }
  });
  assert.equal(result.tripRequirements.totalTravelers, 2);
  assert.equal(result.tripRequirements.seniors, 1);
  assert.equal(result.pricing.adultTotal, result.pricing.adultPrice * 2);
});

test('flexible dates remain flexible and exact dates are not fabricated', () => {
  const patch = buildDeterministicPatch(itinerary);
  assert.equal(patch.tripRequirements.datesFlexible, true);
  assert.equal(patch.tripRequirements.flexibleMonth, 'October 2026');
  assert.equal(patch.tripRequirements.startDate, '');
  assert.equal(patch.tripRequirements.endDate, '');
});

test('exact source dates remain exact and do not retain a flexible month', () => {
  const exactItinerary = structuredClone(itinerary);
  exactItinerary.plannerContext = {
    ...exactItinerary.plannerContext,
    datesFlexible: false,
    flexibleMonth: 'October 2026',
    startDate: '2026-10-12',
    endDate: '2026-10-17'
  };
  const patch = buildDeterministicPatch(exactItinerary);
  assert.equal(patch.tripRequirements.datesFlexible, false);
  assert.equal(patch.tripRequirements.flexibleMonth, '');
  assert.equal(patch.tripRequirements.startDate.slice(0, 10), '2026-10-12');
  assert.equal(patch.tripRequirements.endDate.slice(0, 10), '2026-10-17');
});

test('Smart Build output validates against the persisted Quotation schema', () => {
  const draft = buildSmartQuotationDraft({ lead, itinerary, actor: { _id: actorId } });
  const document = new Quotation({
    ...draft,
    quotationNumber: 'WLX-Q-2026-SCHEMA',
    createdBy: actorId,
    assignedTo: actorId,
    validUntil: new Date('2026-10-31T00:00:00.000Z')
  });
  assert.equal(document.validateSync(), undefined);
});

test('full day itinerary and media map deterministically without Gemini', () => {
  const patch = buildDeterministicPatch(itinerary);
  assert.equal(patch.itinerary.length, 6);
  assert.match(patch.itinerary[0].description, /Morning: Arrival transfer/);
  assert.equal(patch.itinerary[0].coverMedia.url, 'https://example.com/day-1.jpg');
  assert.equal(patch.itinerary[2].galleryMedia[0].url, 'https://example.com/key.jpg');
});

test('consecutive overnight stays form safe hotel segments and alternatives remain unallocated', () => {
  const hotels = buildDeterministicPatch(itinerary).hotelOptions;
  assert.deepEqual(hotels.slice(0, 3).map((item) => [item.hotelName, item.nights]), [['Hotel A', 1], ['Hotel B', 3], ['Hotel C', 1]]);
  const alternative = hotels.find((item) => item.hotelName === 'Alternative Homestay');
  assert.equal(alternative.nights, 1);
  assert.match(alternative.notes, /Night allocation.*require review/i);
  assert.equal(hotels.every((item) => item.sourceKind === 'AI_PLANNER' && item.reviewStatus === 'SUGGESTED' && item.selected === false), true);
  assert.equal(hotels.every((item) => !item.roomType && !item.mealPlan && item.pricePerNight === 0), true);
});

test('transport and activity candidates are review-only, deduplicated and commercially empty', () => {
  const patch = buildDeterministicPatch(itinerary);
  assert.equal(patch.transportOptions.length, 1);
  assert.equal(patch.transportOptions[0].pickup, 'Delhi');
  assert.equal(patch.transportOptions[0].drop, 'Spiti Valley');
  assert.equal(patch.transportOptions[0].unitPrice, 0);
  assert.equal(patch.activities.every((item) => item.selected === false && item.isIncluded === false && item.reviewStatus === 'SUGGESTED'), true);
  assert.equal(new Set(patch.activities.map((item) => `${item.dayNumber}|${item.name}|${item.location}`)).size, patch.activities.length);
});

test('planning estimates stay internal and never become quotation pricing or inclusions', () => {
  const draft = buildSmartQuotationDraft({ lead, itinerary, actor: { _id: actorId } });
  assert.equal(draft.planningReference.aiEstimatedTotal, 82000);
  assert.equal(draft.planningReference.plannerBudgetAmount, 45000);
  assert.equal(draft.planningReference.plannerBudgetScope, 'UNSPECIFIED');
  assert.equal(draft.manualPricing.finalCustomerPrice, 0);
  assert.equal(draft.manualPricing.depositAmount, 0);
  assert.deepEqual(draft.inclusions, []);
  assert.equal(JSON.stringify(draft.inclusions).includes('Momos'), false);
});

test('safe policies and provenance are complete and source-bound', () => {
  const draft = buildSmartQuotationDraft({ lead, itinerary, actor: { _id: actorId } });
  assert.equal(Object.values(draft.policies).filter(Boolean).length, 6);
  assert.equal(draft.aiImportProvenance.sourceVersion, 2);
  assert.equal(draft.aiImportProvenance.buildMode, 'AI_LEAD_SMART_BUILD');
  assert.equal(String(draft.sourceItineraryId), String(itineraryId));
  assert.equal(buildSmartQuotationSummary(draft).pricingChanged, false);
});

test('Smart Build and Smart Assist use the same deterministic source facts', async () => {
  const preview = await buildQuotationAiImportPreview({ request: { sourceType: 'JSON_UPLOAD', itineraryPayload: itinerary }, user: {} });
  const draft = buildSmartQuotationDraft({ lead, itinerary, actor: { _id: actorId } });
  assert.deepEqual(
    { ...draft.tripRequirements, specialRequests: preview.deterministicPatch.tripRequirements.specialRequests },
    preview.deterministicPatch.tripRequirements
  );
  for (const field of ['tripPreferences', 'itinerary', 'hotelOptions', 'transportOptions', 'activities']) {
    assert.deepEqual(draft[field], preview.deterministicPatch[field]);
  }
});

test('selected unreviewed AI candidates warn normally and block commercial progression', () => {
  const quotation = buildSmartQuotationDraft({ lead, itinerary, actor: { _id: actorId } });
  quotation.hotelOptions[0].selected = true;
  assert(validateQuotationV2(quotation).warnings.some((item) => item.code === 'AI_HOTEL_REVIEW_REQUIRED'));
  assert(validateQuotationV2(quotation, { requireCandidateReview: true }).errors.some((item) => item.code === 'AI_HOTEL_REVIEW_REQUIRED'));
  quotation.hotelOptions[0].reviewStatus = 'REVIEWED';
  assert.equal(validateQuotationV2(quotation, { requireCandidateReview: true }).errors.some((item) => item.code === 'AI_HOTEL_REVIEW_REQUIRED'), false);
});

test('revision preserves structured preferences and internal planning reference', () => {
  const draft = buildSmartQuotationDraft({ lead, itinerary, actor: { _id: actorId } });
  const snapshot = buildRevisionSnapshot({ ...draft, _id: objectId(), quotationNumber: 'WLX-Q-2026-TEST', version: 1 });
  assert.equal(snapshot.tripRequirements.seniors, 1);
  assert.equal(snapshot.tripPreferences.dietaryPreference, 'Vegetarian');
  assert.equal(snapshot.planningReference.aiEstimatedTotal, 82000);
});

test('public DTO filters unselected AI candidates and strips planning and review metadata', () => {
  const draft = buildSmartQuotationDraft({ lead, itinerary, actor: { _id: actorId } });
  draft.quotationNumber = 'WLX-Q-2026-PUBLIC';
  draft.version = 1;
  draft.hotelOptions[0].selected = true;
  draft.hotelOptions[0].reviewStatus = 'REVIEWED';
  const revision = { _id: objectId(), version: 1, status: 'FINALIZED', snapshot: buildRevisionSnapshot(draft), approval: {} };
  const dto = buildPublicRevisionDto({ quotation: { bookingId: null, latestSharedRevisionId: revision._id, attachments: [] }, revision, share: { _id: objectId(), templateKey: 'journey', allowAttachments: true, recipientEmail: 'asha@example.com', isActive: true, expiresAt: new Date('2027-01-01'), approvalEnabled: true } });
  assert.equal(dto.hotelOptions.length, 1);
  assert.equal(Object.hasOwn(dto.hotelOptions[0], 'reviewStatus'), false);
  assert.equal(Object.hasOwn(dto, 'planningReference'), false);
  assert.equal(Object.hasOwn(dto, 'aiImportProvenance'), false);
  assert.equal(dto.tripRequirements.origin, 'Delhi');
});

test('source DTO removes ownership tokens and comparison detects a changed day/version', () => {
  const source = sanitizeQuotationSourcePlan({ ...itinerary, user: objectId(), userEmail: 'private@example.com', shareToken: 'secret' });
  assert.equal(Object.hasOwn(source, 'user'), false);
  assert.equal(JSON.stringify(source).includes('secret'), false);
  const quotation = buildSmartQuotationDraft({ lead, itinerary, actor: { _id: actorId } });
  const unchangedComparison = buildQuotationSourceComparison(quotation, itinerary);
  assert.deepEqual(unchangedComparison.changedGroups, []);
  const newer = { ...itinerary, version: 3, updatedAt: new Date('2026-09-10'), days: itinerary.days.map((day) => day.day === 3 ? { ...day, title: 'Changed monastery day' } : day) };
  const comparison = buildQuotationSourceComparison(quotation, newer);
  assert.equal(comparison.sourceChanged, true);
  assert(comparison.changedGroups.includes('Itinerary'));
});

test('Quotation and Booking schemas expose additive Phase 2 fields without a migration index', () => {
  assert(Quotation.schema.path('tripRequirements.seniors'));
  assert(Quotation.schema.path('tripPreferences.interests'));
  assert(Quotation.schema.path('planningReference.aiEstimatedTotal'));
  assert(Quotation.schema.path('hotelOptions').schema.path('reviewStatus'));
  assert(Booking.schema.path('quotationSnapshot.tripPreferences'));
  assert.equal(Quotation.schema.indexes().some(([keys]) => keys['tripRequirements.origin'] || keys['tripRequirements.seniors'] || keys.tripPreferences), false);
});

test('routes and controller retain protected deterministic idempotency and lifecycle hooks', () => {
  const routes = readFileSync(new URL('./routes/quotationRoutes.js', import.meta.url), 'utf8');
  const controller = readFileSync(new URL('./controllers/quotationV2Controller.js', import.meta.url), 'utf8');
  assert.match(routes, /v2\/from-ai-lead\/:leadId'.*requireRoles\('super_admin', 'admin', 'sales'\)/);
  assert.match(routes, /v2\/source-plan/);
  assert.match(routes, /candidates\/:type\/:candidateId\/review/);
  assert.match(controller, /loadAuthorizedLeadForStaff\(req\.params\.leadId, req\.user\)/);
  assert.match(controller, /status: \{ \$in: activeSmartStatuses \}/);
  assert.match(controller, /lifecycleStatus: 'QUOTATION_LINKED'/);
  assert.match(controller, /lifecycleStatus: 'BOOKED'/);
});
