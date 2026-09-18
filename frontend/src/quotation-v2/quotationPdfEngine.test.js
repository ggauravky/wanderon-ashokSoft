import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuotationPresentationModel } from './buildQuotationPresentationModel.js';
import { chunkItinerary, chunkPolicyEntries } from './pagination.js';
import { quotationPdfFileName } from './quotationV2.js';
import { QUOTATION_TEMPLATE_KEYS, quotationTemplateOptions } from './templateRegistry.js';

const rawQuotation = (overrides = {}) => ({
  quotationNumber: 'WLX-QA/2026',
  version: 4,
  status: 'FINALIZED',
  customerSnapshot: { name: 'Aarav Mehta', email: 'aarav@example.com', phone: '9876543210', internalScore: 99 },
  tripRequirements: { title: 'High Himalaya Passage', destination: 'Ladakh', adults: 2, days: 6 },
  itinerary: [{ day: 1, title: 'Arrival in Leh', destination: 'Leh', description: 'A gentle first day.' }],
  hotelOptions: [{
    optionId: 'hotel-1', hotelName: 'Snowline House', selected: true, totalPrice: 77777,
    costPerNight: 11111, provider: 'SUPPLIER-SECRET', notes: 'INTERNAL-HOTEL-NOTE', customerNotes: 'Breakfast included.',
    documents: [
      { id: 'hotel-private', title: 'INTERNAL-HOTEL-INVOICE', visibility: 'INTERNAL_ONLY', secureUrl: 'https://private.example/hotel' },
      { id: 'hotel-voucher', title: 'Hotel voucher', visibility: 'CUSTOMER_VISIBLE', secureUrl: 'https://public.example/hotel' }
    ]
  }],
  transportOptions: [{
    optionId: 'transport-1', mode: 'SUV', title: 'Private road transfer', selected: true, totalPrice: 88888,
    unitCost: 22222, provider: 'DRIVER-SUPPLIER-SECRET', notes: 'INTERNAL-DRIVER-NOTE', customerNotes: 'Meet in the hotel lobby.',
    driverDetails: { phone: '0000000000' }
  }],
  activities: [{ activityId: 'activity-1', name: 'Monastery visit', selected: true, totalPrice: 9999, unitCost: 3333 }],
  addOns: [{ addonId: 'addon-1', name: 'Travel insurance', selected: true, totalPrice: 4444, supplierCost: 1234 }],
  attachments: [
    { id: 'private', title: 'INTERNAL-INVOICE', visibility: 'INTERNAL_ONLY', secureUrl: 'https://private.example/invoice' },
    { id: 'public', title: 'Travel guide', visibility: 'CUSTOMER_VISIBLE', secureUrl: 'https://public.example/guide' }
  ],
  manualPricing: { currency: 'INR', finalCustomerPrice: 245000, depositAmount: 50000, finalizedAt: '2026-09-18T10:00:00.000Z' },
  presentationSettings: { showAttachments: true, showComponentPrices: false },
  ...overrides
});

test('presentation model is a strict customer-safe whitelist', () => {
  const model = buildQuotationPresentationModel(rawQuotation());
  const serialized = JSON.stringify(model);
  for (const forbidden of ['SUPPLIER-SECRET', 'DRIVER-SUPPLIER-SECRET', 'INTERNAL-HOTEL-NOTE', 'INTERNAL-DRIVER-NOTE', 'INTERNAL-INVOICE', 'INTERNAL-HOTEL-INVOICE', '0000000000', '77777', '88888', '11111', '22222', '3333']) {
    assert.equal(serialized.includes(forbidden), false, `customer model leaked ${forbidden}`);
  }
  assert.equal(model.pricing.finalCustomerPrice, 245000);
  assert.deepEqual(model.attachments.map((item) => item.id).sort(), ['hotel-voucher', 'public']);
  assert.deepEqual(model.pricing.customerVisibleComponents, []);
});

test('component prices only enter the presentation model when explicitly enabled', () => {
  const quotation = rawQuotation({ presentationSettings: { showAttachments: false, showComponentPrices: true } });
  const model = buildQuotationPresentationModel(quotation);
  assert.deepEqual(model.pricing.customerVisibleComponents, [
    ['Stays', 77777], ['Transport', 88888], ['Activities', 9999], ['Add-ons', 4444]
  ]);
  assert.deepEqual(model.attachments, []);
});

test('weighted pagination preserves every itinerary day for all templates', () => {
  const days = Array.from({ length: 14 }, (_, index) => ({
    day: index + 1,
    title: `Day ${index + 1}`,
    description: index % 2 ? 'A long descriptive journey segment. '.repeat(35) : 'A compact journey segment.',
    coverMedia: index % 3 === 0 ? { url: `https://example.com/${index}.jpg` } : null
  }));
  for (const key of QUOTATION_TEMPLATE_KEYS) {
    const chunks = chunkItinerary(days, key);
    assert.ok(chunks.length > 1, `${key} should paginate long itineraries`);
    assert.deepEqual(chunks.flat().map((day) => day.day), days.map((day) => day.day));
    assert.ok(chunks.every((chunk) => chunk.length > 0));
  }
});

test('terms pagination preserves long prose and long bullet lists', () => {
  const prose = 'Cancellation terms remain customer readable. '.repeat(120).trim();
  const bullets = Array.from({ length: 28 }, (_, index) => `Included service ${index + 1}`);
  const chunks = chunkPolicyEntries([['cancellationPolicy', prose], ['inclusions', bullets]], 1400);
  const entries = chunks.flat();
  const rebuiltProse = entries.filter(([key]) => key.startsWith('cancellationPolicy')).map(([, value]) => value).join(' ');
  const rebuiltBullets = entries.filter(([key]) => key.startsWith('inclusions')).flatMap(([, value]) => value);
  assert.equal(rebuiltProse, prose);
  assert.deepEqual(rebuiltBullets, bullets);
  assert.ok(chunks.length > 2);
});

test('template registry preserves internal keys and exposes professional names', () => {
  assert.deepEqual(QUOTATION_TEMPLATE_KEYS, ['signature_luxe', 'journey', 'minimal']);
  assert.deepEqual(quotationTemplateOptions().map((item) => item.name), ['Signature Luxe', 'Journey Journal', 'Expedition Dossier']);
});

test('PDF filenames include the immutable template identity', () => {
  assert.equal(quotationPdfFileName(rawQuotation(), 'minimal'), 'WanderLuxe_WLX-QA-2026_v4_Expedition-Dossier.pdf');
});
