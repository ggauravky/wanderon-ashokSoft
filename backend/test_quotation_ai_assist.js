import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyQuotationAiPatch,
  buildDeterministicPatch,
  detectConflicts
} from './services/quotationAiService.js';

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
