import test from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_SECRET ||= 'quotation-v2-test-secret-that-is-long-enough';

const {
  buildPublicRevisionDto,
  calculateComponentReference,
  tokenHash,
  validateQuotationV2,
  verificationHash
} = await import('./services/quotationV2Service.js');

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

test('share and verification secrets are one-way deterministic hashes', () => {
  assert.equal(tokenHash('abc'), tokenHash('abc'));
  assert.notEqual(tokenHash('abc'), tokenHash('abcd'));
  assert.equal(verificationHash('123456'), verificationHash('123456'));
  assert.notEqual(verificationHash('123456'), verificationHash('654321'));
});
