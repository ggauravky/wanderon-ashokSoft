import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeQuotationAttachmentState } from './attachmentEnums.js';

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
  assert.equal(quotation.attachments[1].category, 'UNSUPPORTED DOCUMENT');
});
