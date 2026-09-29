import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuotationPresentationModel } from './buildQuotationPresentationModel.js';
import { chunkItinerary, chunkPolicyEntries, splitHotel } from './pagination.js';
import { packPdfBlocks } from './measuredPagination.js';
import { buildPdfSectionManifest, resolveDocumentPresentation, splitOversizedPdfBlock } from './pdfSectionManifest.js';
import { PDF_CONTENT_PROFILES, buildTemplatePdfModel } from './pdfContentProfiles.js';
import { resolveAttachmentMediaType } from './attachmentMedia.js';
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
    assert.deepEqual([...new Set(chunks.flat().map((day) => day.day))], days.map((day) => day.day));
    for (const day of days) {
      assert.equal(chunks.flat().filter((part) => part.day === day.day).map((part) => part.description).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim(), day.description.trim());
    }
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
  assert.equal(quotationPdfFileName(rawQuotation(), 'minimal'), 'WanderLuxe_WLX-QA-2026_Expedition-Dossier.pdf');
});

test('hotel gallery primary image and transport media survive the customer model', () => {
  const quotation = rawQuotation({
    hotelOptions: [{ ...rawQuotation().hotelOptions[0], imageUrl: 'https://example.com/old.jpg', gallery: [
      { url: 'https://example.com/side.jpg' }, { secureUrl: 'https://example.com/primary.jpg', isPrimary: true }
    ] }],
    transportOptions: [{ ...rawQuotation().transportOptions[0], vehicleMedia: [{ url: 'https://example.com/car.jpg' }],
      reference: { bookingReference: 'TRANSFER-123' }, documents: [{ id: 'ticket', title: 'Transfer ticket', visibility: 'CUSTOMER_VISIBLE', mimeType: 'image/png', secureUrl: 'https://example.com/ticket.png' }] }]
  });
  const model = buildQuotationPresentationModel(quotation);
  assert.equal(model.hotels[0].heroImage.url, 'https://example.com/primary.jpg');
  assert.equal(model.hotels[0].gallery.length, 2);
  assert.equal(model.transport[0].media[0].url, 'https://example.com/car.jpg');
  assert.equal(model.transport[0].reference, 'TRANSFER-123');
  assert.equal(model.transport[0].documents[0].relation.kind, 'transport');
});

test('hotel PDF gallery respects the template image budget without duplicating the hero', () => {
  const gallery = Array.from({ length: 7 }, (_, index) => ({ url: `https://example.com/stay-${index}.jpg` }));
  const parts = splitHotel({ id: 'hotel-1', heroImage: gallery[0], gallery, notes: '', amenities: [], documents: [] }, 3);
  assert.equal(parts.length, 1);
  assert.deepEqual(parts.flatMap((part) => part.gallery.map((image) => image.url)), gallery.slice(1, 4).map((image) => image.url));
  assert.equal(parts[0].heroImage.url, gallery[0].url);
});

test('split itinerary fragments have stable unique render keys', () => {
  const fragments = chunkItinerary([{ day: 4, title: 'Long day', description: 'A detailed sentence. '.repeat(100) }], 'minimal').flat();
  assert.equal(new Set(fragments.map((item) => item.fragmentId)).size, fragments.length);
});

test('document visibility follows approval and booking, with no internal or unsafe links', () => {
  const documents = [
    { id: 'visible', visibility: 'CUSTOMER_VISIBLE', secureUrl: 'https://example.com/visible.pdf' },
    { id: 'approval', visibility: 'CUSTOMER_VISIBLE_AFTER_APPROVAL', secureUrl: 'https://example.com/approval.pdf' },
    { id: 'booking', visibility: 'CUSTOMER_VISIBLE_AFTER_BOOKING', secureUrl: 'https://example.com/booking.pdf' },
    { id: 'internal', visibility: 'INTERNAL_ONLY', secureUrl: 'https://example.com/internal.pdf' },
    { id: 'unsafe', visibility: 'CUSTOMER_VISIBLE', secureUrl: 'http://example.com/unsafe.pdf' }
  ];
  const quote = rawQuotation({ attachments: documents, hotelOptions: [], transportOptions: [] });
  const ids = (overrides = {}) => buildQuotationPresentationModel({ ...quote, ...overrides }).allCustomerDocuments.map((item) => item.id);
  assert.deepEqual(ids(), ['visible']);
  assert.deepEqual(ids({ status: 'APPROVED' }), ['visible', 'approval']);
  assert.deepEqual(ids({ status: 'CONVERTED' }), ['visible', 'approval', 'booking']);
  assert.deepEqual(ids({ status: 'APPROVED', booked: true }), ['visible', 'approval', 'booking']);
});

test('measured pagination handles exact fits, just-overflow blocks, and empty input', () => {
  const block = (id, measuredHeight, extra = {}) => ({ id, measuredHeight, ...extra });
  assert.deepEqual(packPdfBlocks({ blocks: [], pageContentHeight: 100, gap: 10 }), []);
  const exact = packPdfBlocks({ blocks: [block('a', 40), block('b', 50)], pageContentHeight: 100, gap: 10 });
  assert.equal(exact.length, 1);
  assert.deepEqual(exact[0].blocks.map((item) => item.id), ['a', 'b']);
  const justOver = packPdfBlocks({ blocks: [block('a', 40), block('b', 51)], pageContentHeight: 100, gap: 10 });
  assert.equal(justOver.length, 2);
  assert.deepEqual(justOver.map((page) => page.blocks.map((item) => item.id)), [['a'], ['b']]);
});

test('measured pagination requires an explicit lossless splitter for oversized blocks', () => {
  const oversized = {
    id: 'long', measuredHeight: 140,
    split: () => [{ id: 'long-a', measuredHeight: 70 }, { id: 'long-b', measuredHeight: 70 }]
  };
  const pages = packPdfBlocks({ blocks: [oversized], pageContentHeight: 100, gap: 10 });
  assert.deepEqual(pages.map((page) => page.blocks.map((item) => item.id)), [['long-a'], ['long-b']]);
  assert.throws(() => packPdfBlocks({ blocks: [{ id: 'unsafe', measuredHeight: 101 }], pageContentHeight: 100 }), /cannot fit/);
});

test('document display rules never override security and keep all four PDF modes deterministic', () => {
  const quote = rawQuotation({
    attachments: [
      { id: 'auto', title: 'Flight ticket', category: 'FLIGHT_TICKET', visibility: 'CUSTOMER_VISIBLE', pdfDisplayMode: 'AUTO', secureUrl: 'https://example.com/flight.pdf' },
      { id: 'preview', title: 'Permit', category: 'PERMIT', visibility: 'CUSTOMER_VISIBLE', pdfDisplayMode: 'ALWAYS_PREVIEW', secureUrl: 'https://example.com/permit.pdf' },
      { id: 'link', title: 'Insurance', category: 'INSURANCE', visibility: 'CUSTOMER_VISIBLE', pdfDisplayMode: 'LINK_ONLY', secureUrl: 'https://example.com/insurance.pdf' },
      { id: 'hidden', title: 'Hidden', category: 'OTHER', visibility: 'CUSTOMER_VISIBLE', pdfDisplayMode: 'HIDDEN', secureUrl: 'https://example.com/hidden.pdf' },
      { id: 'internal', title: 'Internal', category: 'FLIGHT_TICKET', visibility: 'INTERNAL_ONLY', pdfDisplayMode: 'ALWAYS_PREVIEW', secureUrl: 'https://example.com/internal.pdf' }
    ], hotelOptions: [], transportOptions: []
  });
  const documents = buildQuotationPresentationModel(quote).allCustomerDocuments;
  assert.deepEqual(documents.map((item) => item.id), ['auto', 'preview', 'link']);
  assert.equal(resolveDocumentPresentation(documents[0], 'journey'), 'preview');
  assert.equal(resolveDocumentPresentation(documents[0], 'minimal'), 'link');
  assert.equal(resolveDocumentPresentation(documents[1], 'minimal'), 'preview');
  assert.equal(resolveDocumentPresentation(documents[2], 'signature_luxe'), 'link');
});

test('central section manifest covers every required proposal section for every template', () => {
  const quotation = rawQuotation({
    tripRequirements: { ...rawQuotation().tripRequirements, personalNote: 'Welcome.', specialRequests: 'Quiet rooms.' },
    inclusions: ['Breakfast'], exclusions: ['Flights'],
    policies: { cancellationPolicy: 'Cancellation terms.', refundNotes: 'Refund terms.', termsAndConditions: 'General terms.' },
    manualPricing: { ...rawQuotation().manualPricing, paymentSchedule: [{ label: 'Deposit', amount: 50000 }] }
  });
  const model = buildQuotationPresentationModel(quotation);
  const expected = ['cover', 'introduction', 'overview', 'itinerary', 'hotels', 'transport', 'experiences', 'documents', 'inclusions', 'exclusions', 'pricing', 'payment-schedule', 'policies', 'closing'];
  for (const key of QUOTATION_TEMPLATE_KEYS) {
    const sections = new Set(buildPdfSectionManifest(model, key).map((item) => item.section));
    expected.forEach((section) => assert.ok(sections.has(section), `${key} missing ${section}`));
  }
});

test('section manifest keeps logical content whole until measured overflow requests a split', () => {
  const longDescription = 'A measured itinerary paragraph. '.repeat(80);
  const model = buildQuotationPresentationModel(rawQuotation({
    itinerary: [{ day: 1, title: 'A genuinely long day', destination: 'Leh', description: longDescription }]
  }));
  const manifest = buildPdfSectionManifest(model, 'signature_luxe');
  const itinerary = manifest.filter((item) => item.kind === 'itinerary');
  assert.equal(itinerary.length, 1);
  assert.equal(itinerary[0].content.description, longDescription.trim());
  const fragments = splitOversizedPdfBlock({ ...itinerary[0], measuredHeight: 1400 }, 'signature_luxe');
  assert.ok(fragments.length > 1);
  assert.equal(fragments.map((item) => item.content.description).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim(), longDescription.trim());
});

test('attachment media detection uses MIME first and falls back to safe file extensions', () => {
  assert.equal(resolveAttachmentMediaType({ mimeType: 'image/png', secureUrl: 'https://example.com/file' }), 'image');
  assert.equal(resolveAttachmentMediaType({ fileName: 'voucher.PDF' }), 'pdf');
  assert.equal(resolveAttachmentMediaType({ secureUrl: 'https://example.com/ticket.webp?token=1' }), 'image');
  assert.equal(resolveAttachmentMediaType({ fileName: 'unknown.docx' }), 'document');
});

test('content profile differentiates narrative density while keeping facts identical', () => {
  const raw = rawQuotation({
    itinerary: [
      { day: 1, title: 'Day 1 Adventure', destination: 'Leh', description: 'First sentence. Second sentence. Third long sentence about mountains.' },
      { day: 2, title: 'Day 2 Exploration', destination: 'Nubra', description: 'Morning departure. Scenic pass crossing. Evening rest.' }
    ]
  });
  const baseModel = buildQuotationPresentationModel(raw);

  const sigModel = buildTemplatePdfModel(baseModel, 'signature_luxe');
  const jrnModel = buildTemplatePdfModel(baseModel, 'journey');
  const dosModel = buildTemplatePdfModel(baseModel, 'minimal');

  // Customer facts remain identical
  assert.equal(sigModel.customer.name, dosModel.customer.name);
  assert.equal(sigModel.pricing.finalCustomerPrice, dosModel.pricing.finalCustomerPrice);
  assert.equal(sigModel.itinerary.length, dosModel.itinerary.length);

  // Itinerary descriptions differentiate
  assert.equal(sigModel.itinerary[0].description, baseModel.itinerary[0].description);
  assert.ok(jrnModel.itinerary[0].description.length < sigModel.itinerary[0].description.length);
  assert.ok(dosModel.itinerary[0].summaryText || dosModel.itinerary[0].description);
  assert.equal(dosModel.itinerary[0].morning, '');
});

test('section manifest produces differentiated block structures across templates', () => {
  const raw = rawQuotation({
    itinerary: [
      { day: 1, title: 'Day 1', destination: 'Leh', description: 'Day 1 plan.' },
      { day: 2, title: 'Day 2', destination: 'Nubra', description: 'Day 2 plan.' }
    ],
    hotelOptions: [
      { optionId: 'h-1', hotelName: 'Resort 1', selected: true, totalPrice: 10000, nights: 2 },
      { optionId: 'h-2', hotelName: 'Resort 2', selected: true, totalPrice: 12000, nights: 1 }
    ],
    transportOptions: [
      { optionId: 't-1', mode: 'CAB', title: 'SUV Transfer', selected: true, totalPrice: 5000 }
    ],
    activities: [
      { activityId: 'a-1', dayNumber: 1, name: 'Walk', selected: true, totalPrice: 1000 }
    ],
    addOns: [
      { addonId: 'o-1', name: 'Guide', selected: true, totalPrice: 2000 }
    ]
  });
  const model = buildQuotationPresentationModel(raw);

  const sigBlocks = buildPdfSectionManifest(model, 'signature_luxe');
  const jrnBlocks = buildPdfSectionManifest(model, 'journey');
  const dosBlocks = buildPdfSectionManifest(model, 'minimal');

  const sigKinds = sigBlocks.map((b) => b.kind);
  const jrnKinds = jrnBlocks.map((b) => b.kind);
  const dosKinds = dosBlocks.map((b) => b.kind);

  // Signature has individual itinerary and experience blocks
  assert.ok(sigKinds.includes('itinerary'));
  assert.ok(sigKinds.includes('experience'));
  assert.ok(sigKinds.includes('closing'));

  // Journey has grouped experiences
  assert.ok(jrnKinds.includes('experiences-grouped'));

  // Dossier has matrix blocks and no closing page
  assert.ok(dosKinds.includes('itinerary-matrix'));
  assert.ok(dosKinds.includes('hotels-matrix'));
  assert.ok(dosKinds.includes('transport-matrix'));
  assert.ok(dosKinds.includes('experiences-matrix'));
  assert.ok(!dosKinds.includes('closing'));
});

test('hotel and transport media budgets follow content profiles', () => {
  const hotelWithGallery = {
    optionId: 'h-1', hotelName: 'Luxury Palace', selected: true, totalPrice: 50000,
    imageUrl: 'https://example.com/hero.jpg',
    gallery: [
      { url: 'https://example.com/hero.jpg' },
      { url: 'https://example.com/gallery1.jpg' },
      { url: 'https://example.com/gallery2.jpg' },
      { url: 'https://example.com/gallery3.jpg' }
    ]
  };
  const transportWithMedia = {
    optionId: 't-1', mode: 'SUV', title: 'Mountain SUV', selected: true, totalPrice: 15000,
    vehicleMedia: [
      { url: 'https://example.com/car1.jpg', isPrimary: true },
      { url: 'https://example.com/car2.jpg' },
      { url: 'https://example.com/car3.jpg' }
    ]
  };
  const model = buildQuotationPresentationModel(rawQuotation({
    hotelOptions: [hotelWithGallery],
    transportOptions: [transportWithMedia]
  }));

  const sigModel = buildTemplatePdfModel(model, 'signature_luxe');
  const jrnModel = buildTemplatePdfModel(model, 'journey');
  const dosModel = buildTemplatePdfModel(model, 'minimal');

  // Hotel gallery budgets
  assert.equal(sigModel.hotels[0].gallery.length, 4); // hero + 3 gallery
  assert.equal(jrnModel.hotels[0].gallery.length, 1); // hero only
  assert.equal(dosModel.hotels[0].gallery.length, 0); // matrix mode has no gallery

  // Transport media budgets
  assert.equal(sigModel.transport[0].media.length, 2);
  assert.equal(jrnModel.transport[0].media.length, 1);
  assert.equal(dosModel.transport[0].media.length, 0);
});

