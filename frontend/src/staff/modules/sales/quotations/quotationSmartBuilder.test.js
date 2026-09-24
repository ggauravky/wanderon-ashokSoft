import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQuotationReadyExport, parseStructuredItineraryText,
  quotationAiPrerequisite, resolveDefaultImportSource, selectMissingCopyFields
} from './quotationSmartBuilder.js';

test('default source precedence is deterministic', () => {
  assert.equal(resolveDefaultImportSource({ initialItineraryId: 'plan', linkedLeadId: 'lead' }), 'SAVED_ITINERARY');
  assert.equal(resolveDefaultImportSource({ linkedLeadId: 'lead' }), 'LEAD_LINKED_ITINERARY');
  assert.equal(resolveDefaultImportSource({}), 'PASTED_ITINERARY');
});

test('quotation-ready export strips identity and share metadata', () => {
  const payload = buildQuotationReadyExport({ _id: 'secret', userEmail: 'person@example.com', shareToken: 'secret', title: 'Plan', destination: 'Goa', days: [] });
  assert.equal(payload.schema, 'wanderluxe-ai-itinerary');
  assert.equal(payload.itinerary._id, undefined);
  assert.equal(payload.itinerary.userEmail, undefined);
  assert.equal(payload.itinerary.shareToken, undefined);
});

test('paste parser reports invalid JSON and accepts structured JSON', () => {
  assert.deepEqual(parseStructuredItineraryText('{"days":[]}'), { days: [] });
  assert.throws(() => parseStructuredItineraryText('{broken'), /Invalid JSON/);
});

test('AI prerequisite and missing-copy detection are fact based', () => {
  const quotation = { tripRequirements: { destination: '' }, itinerary: [{ day: 1, title: 'Arrival', description: '' }], hotelOptions: [], transportOptions: [], activities: [], inclusions: [], exclusions: [], policies: {} };
  assert.equal(quotationAiPrerequisite(quotation, 'journey.title'), 'Add the destination first.');
  assert.ok(selectMissingCopyFields(quotation).includes('dayDescriptions'));
  assert.ok(selectMissingCopyFields(quotation).includes('inclusions'));
});
