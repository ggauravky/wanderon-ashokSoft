import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

process.env.JWT_SECRET ||= 'quotation-v2-test-secret-that-is-long-enough';

const {
  buildPublicRevisionDto,
  calculateComponentReference,
  tokenHash,
  validateQuotationV2,
  verificationHash
} = await import('./services/quotationV2Service.js');
const {
  QUOTATION_ATTACHMENT_CATEGORIES,
  QUOTATION_ATTACHMENT_VISIBILITIES,
  normalizeQuotationAttachmentPayload
} = await import('./constants/quotationAttachments.js');
const { default: Quotation } = await import('./models/Quotation.js');

const baseQuotation = () => ({
  _id: 'quotation-1',
  quotationNumber: 'WLX-Q-2026-TEST',
  version: 1,
  customerSnapshot: { name: 'Traveler', email: 'traveler@example.com', phone: '9876543210' },
  tripRequirements: { title: 'Private Himalaya Journey', destination: 'Himachal Pradesh', adults: 2, children: 0, infants: 0 },
  itinerary: [],
  hotelOptions: [{ hotelName: 'Test Stay', selected: true, nights: 2, rooms: 1, pricePerNight: 5000, costPerNight: 2500, provider: 'Private supplier' }],
  transportOptions: [{ selected: true, unitPrice: 4000, unitCost: 2000, quantity: 1, provider: 'Private transport', driverDetails: { phone: '1111111111' } }],
  activities: [{ selected: true, isIncluded: true, unitPrice: 1000, unitCost: 500, quantity: 2 }],
  addOns: [{ selected: false, unitPrice: 500 }],
  attachments: [],
  inclusions: ['Stay'],
  exclusions: [],
  manualPricing: { currency: 'INR', finalCustomerPrice: 20000, depositAmount: 5000, balanceAmount: 15000, paymentSchedule: [], finalizedAt: new Date() },
  presentationSettings: { template: 'journey', showAttachments: true, showPaymentSchedule: true, showAdvisor: true },
  validUntil: new Date(Date.now() + 86_400_000),
  bookingId: null,
  latestSharedRevisionId: 'revision-1'
});

test('component reference is arithmetic guidance and never overwrites manual price', () => {
  const quotation = baseQuotation();
  assert.equal(calculateComponentReference(quotation), 16000);
  assert.equal(quotation.manualPricing.finalCustomerPrice, 20000);
});

test('central validation blocks missing identity and invalid manual pricing', () => {
  const quotation = baseQuotation();
  quotation.customerSnapshot.email = 'invalid';
  quotation.manualPricing.depositAmount = 25000;
  const result = validateQuotationV2(quotation, { forFinalization: true });
  assert.ok(result.errors.some((item) => item.code === 'CUSTOMER_EMAIL_INVALID'));
  assert.ok(result.errors.some((item) => item.code === 'DEPOSIT_EXCEEDS_TOTAL'));
});

test('public revision DTO strips internal supplier fields and internal attachments', () => {
  const quotation = baseQuotation();
  const snapshot = {
    ...quotation,
    attachments: [
      { id: 'private', title: 'Invoice', mimeType: 'application/pdf', secureUrl: 'https://private', visibility: 'INTERNAL_ONLY' },
      { id: 'public', title: 'Voucher', mimeType: 'application/pdf', secureUrl: 'https://public', visibility: 'CUSTOMER_VISIBLE' }
    ]
  };
  const dto = buildPublicRevisionDto({
    quotation,
    revision: { _id: 'revision-1', version: 1, status: 'SHARED', snapshot, approval: {} },
    share: { _id: 'share-1', templateKey: 'journey', allowAttachments: true, allowPdfDownload: true, requireEmailVerification: true, approvalEnabled: true, isActive: true, expiresAt: new Date(Date.now() + 86_400_000) }
  });
  assert.equal(dto.attachments.length, 1);
  assert.equal(dto.attachments[0].id, 'public');
  assert.equal('provider' in dto.hotelOptions[0], false);
  assert.equal('costPerNight' in dto.hotelOptions[0], false);
  assert.equal('pricePerNight' in dto.hotelOptions[0], false);
  assert.equal('unitCost' in dto.transportOptions[0], false);
  assert.equal('driverDetails' in dto.transportOptions[0], false);
});

test('public revision excludes unselected AI candidates and normalizes legacy policy once', () => {
  const quotation = baseQuotation();
  const snapshot = { ...quotation,
    hotelOptions: [{ optionId: 'ai_hotel_1', hotelName: 'Unconfirmed', selected: false }, ...quotation.hotelOptions],
    transportOptions: [{ optionId: 'ai_transport_candidate', title: 'Unconfirmed', selected: false }, ...quotation.transportOptions],
    activities: [{ activityId: 'ai_act_1_morning_1', name: 'Unconfirmed', selected: false }, ...quotation.activities],
    policies: { termsAndConditions: '' }, termsAndConditions: ['Legacy terms']
  };
  const dto = buildPublicRevisionDto({ quotation, revision: { _id: 'revision-1', version: 1, status: 'SHARED', snapshot, approval: {} },
    share: { _id: 'share-1', templateKey: 'journey', allowAttachments: false, allowPdfDownload: false, expiresAt: new Date(Date.now() + 86_400_000) } });
  assert.equal(dto.hotelOptions.length, 1);
  assert.equal(dto.transportOptions.length, 1);
  assert.equal(dto.activities.length, 1);
  assert.equal(dto.policies.termsAndConditions, 'Legacy terms');
  assert.deepEqual(dto.termsAndConditions, []);
});

test('public revision DTO always uses the immutable share template', () => {
  const quotation = baseQuotation();
  const snapshot = { ...quotation, presentationSettings: { ...quotation.presentationSettings, template: 'journey' } };
  const revision = { _id: 'revision-1', version: 1, status: 'SHARED', templateKey: 'signature_luxe', snapshot, approval: {} };
  const dto = buildPublicRevisionDto({
    quotation,
    revision,
    share: { _id: 'share-1', templateKey: 'minimal', allowAttachments: true, allowPdfDownload: true, requireEmailVerification: true, approvalEnabled: true, isActive: true, expiresAt: new Date(Date.now() + 86_400_000) }
  });
  assert.equal(dto.templateKey, 'minimal');
  assert.equal(revision.templateKey, 'signature_luxe');
  assert.equal(snapshot.presentationSettings.template, 'journey');
});

test('legacy attachment display labels normalize across every quotation attachment path', () => {
  const normalized = normalizeQuotationAttachmentPayload({
    attachments: [{ category: 'TRAIN TICKET', visibility: 'customer visible after approval' }],
    hotelOptions: [{ documents: [{ category: 'HOTEL VOUCHER', visibility: 'CUSTOMER VISIBLE' }] }],
    transportOptions: [{ documents: [{ type: 'TRAIN TICKET', visibility: 'CUSTOMER VISIBLE AFTER APPROVAL' }] }],
    activities: [{ attachments: [{ category: 'ACTIVITY TICKET', visibility: 'CUSTOMER VISIBLE AFTER BOOKING' }] }],
    addOns: [{ attachments: [{ category: 'insurance', visibility: 'internal only' }] }]
  });
  assert.equal(normalized.attachments[0].category, 'TRAIN_TICKET');
  assert.equal(normalized.attachments[0].visibility, 'CUSTOMER_VISIBLE_AFTER_APPROVAL');
  assert.equal(normalized.hotelOptions[0].documents[0].category, 'HOTEL_VOUCHER');
  assert.equal(normalized.transportOptions[0].documents[0].type, 'TRAIN_TICKET');
  assert.equal(normalized.transportOptions[0].documents[0].visibility, 'CUSTOMER_VISIBLE_AFTER_APPROVAL');
  assert.equal(normalized.activities[0].attachments[0].visibility, 'CUSTOMER_VISIBLE_AFTER_BOOKING');
  assert.equal(normalized.addOns[0].attachments[0].category, 'INSURANCE');
});

test('unknown attachment labels are rejected before Mongoose validation', () => {
  assert.throws(() => normalizeQuotationAttachmentPayload({ attachments: [{ category: 'TRAIN RECEIPT' }] }), /Invalid attachment category/);
  assert.throws(() => normalizeQuotationAttachmentPayload({ attachments: [{ visibility: 'EVERYONE' }] }), /Invalid attachment visibility/);
});

test('quotation schema and shared constants accept every supported attachment enum', () => {
  const attachmentSchema = Quotation.schema.path('attachments').schema;
  assert.deepEqual(attachmentSchema.path('category').enumValues, [...QUOTATION_ATTACHMENT_CATEGORIES]);
  assert.deepEqual(attachmentSchema.path('visibility').enumValues, [...QUOTATION_ATTACHMENT_VISIBILITIES]);
  const transportVisibility = Quotation.schema.path('transportOptions').schema.path('documents').schema.path('visibility').enumValues;
  assert.deepEqual(transportVisibility, [...QUOTATION_ATTACHMENT_VISIBILITIES]);
});

test('model validation repairs recognized spaced enum values on an existing draft', async () => {
  const actorId = new mongoose.Types.ObjectId();
  const draft = new Quotation({
    quotationNumber: 'WLX-Q-2026-LEGACY',
    createdBy: actorId,
    validUntil: new Date(Date.now() + 86_400_000),
    customerSnapshot: { name: 'Traveler', email: 'traveler@example.com', phone: '9876543210' },
    tripRequirements: { title: 'Legacy draft', destination: 'Spiti Valley' },
    attachments: [{ id: 'legacy', category: 'TRAIN TICKET', title: 'Train ticket', mimeType: 'application/pdf', secureUrl: 'https://example.com/train.pdf', visibility: 'CUSTOMER VISIBLE AFTER APPROVAL' }]
  });
  await draft.validate();
  assert.equal(draft.attachments[0].category, 'TRAIN_TICKET');
  assert.equal(draft.attachments[0].visibility, 'CUSTOMER_VISIBLE_AFTER_APPROVAL');
});

test('approval and booking attachment visibility is enforced by the public DTO', () => {
  const quotation = baseQuotation();
  quotation.bookingId = 'booking-1';
  const snapshot = {
    ...quotation,
    attachments: [
      { id: 'approval', title: 'Approval document', mimeType: 'application/pdf', secureUrl: 'https://approval', visibility: 'CUSTOMER_VISIBLE_AFTER_APPROVAL' },
      { id: 'booking', title: 'Booking document', mimeType: 'application/pdf', secureUrl: 'https://booking', visibility: 'CUSTOMER_VISIBLE_AFTER_BOOKING' }
    ]
  };
  const dto = buildPublicRevisionDto({
    quotation,
    revision: { _id: 'revision-1', version: 1, status: 'APPROVED', snapshot, approval: { approvedAt: new Date(), method: 'CUSTOMER_ACCOUNT', approvedByName: 'Traveler' } },
    share: { _id: 'share-1', templateKey: 'journey', allowAttachments: true, allowPdfDownload: true, requireEmailVerification: true, approvalEnabled: true, isActive: true, expiresAt: new Date(Date.now() + 86_400_000) }
  });
  assert.deepEqual(dto.attachments.map((item) => item.id).sort(), ['approval', 'booking']);
  assert.equal(dto.booked, true);
  assert.deepEqual(dto.attachments.map((item) => item.visibility).sort(), ['CUSTOMER_VISIBLE_AFTER_APPROVAL', 'CUSTOMER_VISIBLE_AFTER_BOOKING']);
});

test('share and verification secrets are one-way deterministic hashes', () => {
  assert.equal(tokenHash('abc'), tokenHash('abc'));
  assert.notEqual(tokenHash('abc'), tokenHash('abcd'));
  assert.equal(verificationHash('123456'), verificationHash('123456'));
  assert.notEqual(verificationHash('123456'), verificationHash('654321'));
});
