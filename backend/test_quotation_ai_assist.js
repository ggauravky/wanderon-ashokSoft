import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyQuotationAiPatch,
  buildDeterministicPatch,
  detectConflicts,
  parseSharedItineraryToken,
  normalizeImportedItineraryPayload,
  sanitizeAiQuotationPatch
} from './services/quotationAiService.js';
import { buildQuotationPolicyDefaults, normalizeQuotationPolicies } from './config/quotationPolicyPresets.js';
import { buildFactualInclusions, buildFieldContext, generateQuotationFieldSuggestion } from './services/quotationFieldAiService.js';
import { signItineraryHandoffToken, verifyItineraryHandoffToken } from './services/itineraryHandoffService.js';
import { canStaffAccessLead } from './services/leadAccessService.js';
import { quotationRateLimit } from './middlewares/quotationRateLimit.js';
import Quotation from './models/Quotation.js';
import jwt from 'jsonwebtoken';
import { cloneQuotationAiSampleItinerary } from './fixtures/quotationAiSampleItinerary.js';

const baseItinerary = {
  title: 'Spiti Valley Slow Circuit',
  destination: 'Spiti Valley',
  duration: 7,
  travelers: 4,
  travelStyle: 'Couple',
  plannerContext: {
    datesFlexible: true,
    flexibleMonth: 'October 2026',
    travelersBreakdown: { adults: 2, children: 1, infants: 1, seniors: 1 },
    origin: 'Delhi NCR',
    dietaryPreference: 'Vegetarian',
    stayPreference: 'Boutique Homestay',
    interests: ['photography', 'monasteries']
  },
  days: [
    {
      day: 1,
      title: 'Arrival in Kaza',
      locationName: 'Kaza',
      morning: [
        { time: '09:00 AM', activity: 'Drive to Kaza', location: 'Kaza', description: 'Scenic acclimatization drive.' },
        { time: '11:00 AM', activity: 'Market orientation', location: 'Kaza', description: 'Short local walk.' }
      ],
      afternoon: [{ activity: 'Cafe rest', location: 'Kaza' }],
      evening: [{ activity: 'Sunset viewpoint', location: 'Kaza' }],
      stay: 'Kaza Heritage Homestay',
      coverMedia: { url: 'https://example.com/kaza.jpg', altText: 'Kaza valley' },
      galleryMedia: [{ url: 'https://example.com/kaza-2.jpg', altText: 'Kaza monastery' }]
    }
  ],
  staySuggestions: ['Kaza Heritage Homestay'],
  totalEstimatedCost: 80000,
  budgetBreakdown: { stay: '₹40,000' }
};

test('AI plan journey mapping derives destination duration and traveler total', () => {
  const patch = buildDeterministicPatch(baseItinerary);
  assert.equal(patch.tripRequirements.destination, 'Spiti Valley');
  assert.equal(patch.tripRequirements.days, 7);
  assert.equal(patch.tripRequirements.nights, 6);
  assert.equal(patch.tripRequirements.duration, '7D/6N');
  assert.equal(patch.tripRequirements.totalTravelers, 5);
});

test('new quotation model has no fictional service, inclusion, or cancellation content', () => {
  const draft = new Quotation();
  assert.deepEqual(draft.itinerary, []);
  assert.deepEqual(draft.hotelOptions, []);
  assert.deepEqual(draft.transportOptions, []);
  assert.deepEqual(draft.activities, []);
  assert.deepEqual(draft.addOns, []);
  assert.deepEqual(draft.inclusions, []);
  assert.deepEqual(draft.exclusions, []);
  assert.deepEqual(draft.termsAndConditions, []);
  assert.deepEqual(draft.cancellationPolicy, []);
});

test('sample fixture is a complete seven-day non-commercial plan', () => {
  const sample = cloneQuotationAiSampleItinerary();
  assert.equal(sample.schema, 'wanderluxe-ai-itinerary');
  assert.equal(sample.itinerary.days.length, 7);
  assert.equal(sample.itinerary.totalEstimatedCost, undefined);
  assert.equal(JSON.stringify(sample).includes('@'), false);
});

test('upload, paste, wrapper, and raw sources normalize identically', () => {
  const sample = cloneQuotationAiSampleItinerary();
  const expected = normalizeImportedItineraryPayload(sample);
  const variants = [
    JSON.stringify(sample),
    { data: sample },
    { itinerary: sample.itinerary, plannerContext: sample.plannerContext },
    { ...sample.itinerary, plannerContext: sample.plannerContext }
  ];
  variants.forEach((variant) => assert.deepEqual(normalizeImportedItineraryPayload(variant), expected));
  assert.throws(() => normalizeImportedItineraryPayload('{broken'), /invalid/i);
  assert.throws(() => normalizeImportedItineraryPayload({ days: [] }), /supported structured/i);
});

test('normalization and deterministic mapping never carry imported pricing', () => {
  const sample = cloneQuotationAiSampleItinerary();
  sample.itinerary.totalEstimatedCost = 999999;
  sample.itinerary.budgetBreakdown = { estimatedTotal: '999999' };
  const patch = buildDeterministicPatch(normalizeImportedItineraryPayload(sample));
  assert.equal(Object.hasOwn(patch, 'manualPricing'), false);
  assert.equal(Object.hasOwn(patch, 'pricing'), false);
  assert.equal(patch.hotelOptions.every((item) => item.unitPrice === undefined && item.pricePerNight === 0), true);
});

test('traveler breakdown counts seniors with adults and preserves senior fact', () => {
  const patch = buildDeterministicPatch(baseItinerary);
  assert.equal(patch.tripRequirements.adults, 3);
  assert.equal(patch.tripRequirements.children, 1);
  assert.equal(patch.tripRequirements.infants, 1);
  assert.match(patch.tripRequirements.specialRequests, /Senior travelers: 1/);
});

test('flexible month does not invent exact dates', () => {
  const patch = buildDeterministicPatch(baseItinerary);
  assert.equal(patch.tripRequirements.startDate, '');
  assert.equal(patch.tripRequirements.endDate, '');
  assert.match(patch.tripRequirements.specialRequests, /October 2026/);
});

test('itinerary activity arrays map to readable strings, not raw objects', () => {
  const patch = buildDeterministicPatch(baseItinerary);
  assert.match(patch.itinerary[0].morning, /Drive to Kaza/);
  assert.match(patch.itinerary[0].morning, /Market orientation/);
  assert.doesNotMatch(patch.itinerary[0].morning, /\[object Object\]/);
});

test('AI import patch does not contain commercial pricing fields', () => {
  const patch = buildDeterministicPatch(baseItinerary);
  assert.equal(Object.hasOwn(patch, 'manualPricing'), false);
  assert.equal(Object.hasOwn(patch, 'pricing'), false);
  assert.equal(Object.hasOwn(patch.hotelOptions[0], 'pricePerNight'), true);
  assert.equal(patch.hotelOptions[0].pricePerNight, 0);
});

test('fill-empty merge preserves existing destination conflict', () => {
  const patch = buildDeterministicPatch(baseItinerary);
  const current = {
    tripRequirements: { destination: 'Kashmir', title: '', adults: 1 },
    manualPricing: { finalCustomerPrice: 12345, depositAmount: 1000 }
  };
  const conflicts = detectConflicts(current, patch);
  assert(conflicts.some((item) => item.field === 'tripRequirements.destination'));
  const result = applyQuotationAiPatch({ quotation: current, patch, mergeMode: 'FILL_EMPTY_ONLY', selectedSections: ['journey'] });
  assert.equal(result.quotation.tripRequirements.destination, 'Kashmir');
  assert.equal(result.quotation.manualPricing.finalCustomerPrice, 12345);
});

test('import leaves meals and commercial inclusions unconfirmed', () => {
  const patch = buildDeterministicPatch(baseItinerary);
  assert.deepEqual(patch.itinerary[0].mealsIncluded, []);
  assert.equal(patch.hotelOptions[0].mealPlan, '');
  assert.equal(patch.hotelOptions[0].selected, false);
  assert.equal(patch.activities[0].isIncluded, false);
  assert.equal(patch.activities[0].selected, false);
  assert.deepEqual(patch.inclusions, []);
  assert.equal(patch.tripRequirements.travelStyle, 'Custom');
  assert.deepEqual(buildDeterministicPatch({ ...baseItinerary, days: [{ ...baseItinerary.days[0], mealsIncluded: ['Breakfast'] }] }).itinerary[0].mealsIncluded, ['Breakfast']);
});

test('commercial fields from a forged client patch cannot survive sanitization', () => {
  const injected = {
    ...buildDeterministicPatch(baseItinerary),
    manualPricing: { finalCustomerPrice: 1 }, pricing: { finalTotal: 1 },
    hotelOptions: [{ ...buildDeterministicPatch(baseItinerary).hotelOptions[0], pricePerNight: 999999 }],
    transportOptions: [{ optionId: 'x', unitPrice: 999999, selected: true }]
  };
  const safe = sanitizeAiQuotationPatch(injected);
  assert.equal(safe.manualPricing, undefined);
  assert.equal(safe.pricing, undefined);
  assert.equal(safe.hotelOptions[0].pricePerNight, 0);
  assert.equal(safe.transportOptions[0].unitPrice, 0);
  assert.equal(safe.transportOptions[0].selected, false);
});

test('replace mode retains existing commercial service prices and policy text', () => {
  const current = { hotelOptions: [{ optionId: 'manual', hotelName: 'Verified', pricePerNight: 5000, selected: true }],
    policies: { paymentTerms: 'Approved payment text' }, tripRequirements: { budgetPerPerson: 20000 } };
  const patch = sanitizeAiQuotationPatch(buildDeterministicPatch(baseItinerary));
  const { quotation } = applyQuotationAiPatch({ quotation: current, patch, mergeMode: 'REPLACE_SELECTED_SECTIONS', selectedSections: ['journey', 'hotels', 'terms'] });
  assert.equal(quotation.hotelOptions[0].pricePerNight, 5000);
  assert.equal(quotation.hotelOptions[0].selected, true);
  assert.equal(quotation.hotelOptions[1].selected, false);
  assert.equal(quotation.policies.paymentTerms, 'Approved payment text');
  assert.equal(quotation.tripRequirements.budgetPerPerson, 20000);
});

test('policy defaults use current structured payment numbers and avoid sample cancellation percentages', () => {
  const first = buildQuotationPolicyDefaults({ paymentTerms: { paymentMode: 'PARTIAL', depositPercent: 10, balanceDueDays: 6 } });
  const second = buildQuotationPolicyDefaults({ paymentTerms: { paymentMode: 'PARTIAL', depositPercent: 20, balanceDueDays: 10 } });
  assert.match(first.paymentTerms, /10%/);
  assert.match(first.paymentTerms, /6 days/);
  assert.match(second.paymentTerms, /20%/);
  assert.match(second.paymentTerms, /10 days/);
  assert.doesNotMatch(first.cancellationPolicy, /\d+%/);
  assert.doesNotMatch(buildQuotationPolicyDefaults({ paymentTerms: { paymentMode: 'FULL' } }).paymentTerms, /deposit/i);
  assert.equal(normalizeQuotationPolicies({ policies: { termsAndConditions: 'Canonical' }, termsAndConditions: ['Legacy'] }).termsAndConditions, 'Canonical');
  assert.equal(normalizeQuotationPolicies({ cancellationPolicy: ['Legacy line'] }).cancellationPolicy, 'Legacy line');
});

test('field context excludes identity and financial data; inclusions require selected services', async () => {
  const quotation = { customerSnapshot: { name: 'Jane Doe', email: 'jane@example.com', notes: 'Call jane@example.com' },
    tripRequirements: { destination: 'Spiti', budgetPerPerson: 99999 }, manualPricing: { finalCustomerPrice: 999999 },
    hotelOptions: [{ hotelName: 'Selected Stay', selected: true, mealPlan: '' }, { hotelName: 'Candidate Stay', selected: false, mealPlan: 'MAP' }],
    activities: [{ name: 'Walk', selected: false, isIncluded: true }], transportOptions: [{ title: 'Unconfirmed car', selected: false }] };
  const context = buildFieldContext(quotation, 'customer.notes');
  assert.doesNotMatch(JSON.stringify(context), /Jane Doe|jane@example.com|99999/);
  const lines = buildFactualInclusions(quotation);
  assert(lines.some((line) => line.includes('Selected Stay')));
  assert(lines.every((line) => !/Candidate Stay|Walk|car|breakfast|dinner/i.test(line)));
  assert.deepEqual((await generateQuotationFieldSuggestion({ quotation, field: 'inclusions' })).suggestion, lines);
});

test('guest handoff proof is bound to itinerary and expires', () => {
  process.env.JWT_SECRET = 'quotation-ai-handoff-test-secret-that-is-long-enough';
  const token = signItineraryHandoffToken('itinerary-a');
  assert.equal(verifyItineraryHandoffToken(token, 'itinerary-a'), true);
  assert.equal(verifyItineraryHandoffToken(token, 'itinerary-b'), false);
  const expired = jwt.sign({ purpose: 'ai_itinerary_lead_handoff', itineraryId: 'itinerary-a', exp: Math.floor(Date.now() / 1000) - 1 }, process.env.JWT_SECRET);
  assert.equal(verifyItineraryHandoffToken(expired, 'itinerary-a'), false);
});

test('Sales can import only lead types visible in their workspace', () => {
  assert.equal(canStaffAccessLead({ leadType: 'trip_enquiry', source: 'ai_planner' }, { role: 'sales' }), true);
  assert.equal(canStaffAccessLead({ leadType: 'trip_enquiry', source: 'contact_page' }, { role: 'sales' }), false);
  assert.equal(canStaffAccessLead({ leadType: 'trip_enquiry', source: 'contact_page' }, { role: 'admin' }), true);
});

test('shared-plan links accept configured origins but reject unrelated hosts and paths', () => {
  const previous = process.env.FRONTEND_URL;
  process.env.FRONTEND_URL = 'https://wanderon-ashok-soft.vercel.app';
  try {
    assert.equal(parseSharedItineraryToken('https://wanderon-ashok-soft.vercel.app/itinerary/shared/valid_token_123'), 'valid_token_123');
    assert.equal(parseSharedItineraryToken('http://127.0.0.1:5174/itinerary/shared/valid_token_123'), 'valid_token_123');
    assert.throws(() => parseSharedItineraryToken('https://evil.example/itinerary/shared/valid_token_123'));
    assert.throws(() => parseSharedItineraryToken('https://wanderluxe.evil.example/itinerary/shared/valid_token_123'));
    assert.throws(() => parseSharedItineraryToken('https://wanderon-ashok-soft.vercel.app/other/valid_token_123'));
  } finally {
    if (previous === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = previous;
  }
});

test('AI rate limiter rejects requests after its action limit', () => {
  const middleware = quotationRateLimit({ action: 'test-ai-rate-limit', limit: 2, windowMs: 3600000 });
  let status = 0;
  const req = { user: { _id: 'test-actor' }, ip: '127.0.0.1', body: {} };
  const res = { set: () => {}, status: (code) => { status = code; return res; }, json: () => res };
  let allowed = 0;
  middleware(req, res, () => { allowed += 1; });
  middleware(req, res, () => { allowed += 1; });
  middleware(req, res, () => { allowed += 1; });
  assert.equal(allowed, 2);
  assert.equal(status, 429);
});
