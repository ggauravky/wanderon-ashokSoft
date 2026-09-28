import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultPdfDisplayModeForCategory, normalizeQuotationAttachmentState } from './attachmentEnums.js';

test('quotation editor repairs known legacy attachment labels without hiding unknown values', () => {
  const quotation = normalizeQuotationAttachmentState({
    attachments: [
      { category: 'TRAIN TICKET', visibility: 'CUSTOMER VISIBLE AFTER APPROVAL' },
      { category: 'UNSUPPORTED DOCUMENT', visibility: 'INTERNAL_ONLY' }
    ],
    hotelOptions: [],
    transportOptions: [],
    activities: [],
    addOns: []
  });
  assert.equal(quotation.attachments[0].category, 'TRAIN_TICKET');
  assert.equal(quotation.attachments[0].visibility, 'CUSTOMER_VISIBLE_AFTER_APPROVAL');
  assert.equal(quotation.attachments[0].pdfDisplayMode, 'AUTO');
  assert.equal(quotation.attachments[1].category, 'UNSUPPORTED DOCUMENT');
});

test('ticket categories receive an explicit preview recommendation without changing legacy records', () => {
  assert.equal(defaultPdfDisplayModeForCategory('FLIGHT_TICKET'), 'ALWAYS_PREVIEW');
  assert.equal(defaultPdfDisplayModeForCategory('HOTEL_VOUCHER'), 'ALWAYS_PREVIEW');
  assert.equal(defaultPdfDisplayModeForCategory('GENERAL'), 'AUTO');
  const quotation = normalizeQuotationAttachmentState({
    attachments: [{ category: 'GENERAL' }, { category: 'FLIGHT_TICKET', pdfDisplayMode: 'link only' }],
    hotelOptions: [], transportOptions: [], activities: [], addOns: []
  });
  assert.deepEqual(quotation.attachments.map((item) => item.pdfDisplayMode), ['AUTO', 'LINK_ONLY']);
});
