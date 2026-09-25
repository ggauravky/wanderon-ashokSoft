import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAiAssistVisualState,
  getAiKey,
  getAiSuggestionSourceLabel,
  hasMeaningfulSuggestion,
  mergeSelectedSuggestionLines
} from './aiAssistUi.js';

test('only the active quotation field displays a loading state', () => {
  const busyKey = getAiKey('hotel.notes', 2);
  const active = getAiAssistVisualState({ key: busyKey, busyKey, mode: 'improve' });
  const other = getAiAssistVisualState({ key: getAiKey('hotel.notes', 1), busyKey, blocked: true });
  assert.deepEqual(active, { state: 'busy', label: 'Improving text…', disabled: true });
  assert.equal(other.state, 'blocked');
  assert.equal(other.disabled, true);
});

test('suggestion-ready feedback is scoped to the completed field', () => {
  const key = getAiKey('journey.title');
  assert.equal(getAiAssistVisualState({ key, readyKey: key }).state, 'ready');
  assert.equal(getAiAssistVisualState({ key: 'journey.personalNote', readyKey: key }).state, 'idle');
});

test('empty arrays and blank objects are not meaningful suggestions', () => {
  assert.equal(hasMeaningfulSuggestion([]), false);
  assert.equal(hasMeaningfulSuggestion(['  ']), false);
  assert.equal(hasMeaningfulSuggestion({ paymentTerms: '', cancellationPolicy: ' ' }), false);
  assert.equal(hasMeaningfulSuggestion([{ day: 1, description: '' }]), false);
  assert.equal(hasMeaningfulSuggestion(['Confirmed transport']), true);
});

test('selected list application deduplicates case and whitespace', () => {
  assert.deepEqual(
    mergeSelectedSuggestionLines(
      ['Private SUV transfer'],
      [' private   suv transfer ', 'Breakfast at the selected hotel'],
      false
    ),
    ['Private SUV transfer', 'Breakfast at the selected hotel']
  );
  assert.deepEqual(
    mergeSelectedSuggestionLines(['Old line'], ['New line', 'new  line'], true),
    ['New line']
  );
});

test('suggestion source badges distinguish AI, quotation facts, and fallback copy', () => {
  assert.equal(getAiSuggestionSourceLabel({ source: 'ai' }), 'AI suggestion');
  assert.equal(getAiSuggestionSourceLabel({ source: 'quotation' }), 'Generated from quotation');
  assert.equal(getAiSuggestionSourceLabel({ provider: 'fallback' }), 'Safe fallback');
  assert.equal(getAiSuggestionSourceLabel({ source: 'default' }), 'Smart default');
});
