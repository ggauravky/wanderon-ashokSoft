import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getFreshGuestHandoffToken,
  isGuestItinerary,
  mergeSavedItinerary
} from './itineraryAuthorization.js';

test('save-result merge replaces guest authorization with the refreshed credentials', () => {
  const merged = mergeSavedItinerary(
    { _id: 'plan-1', guestAuthorization: { editToken: 'old-edit', handoffToken: 'old-handoff' } },
    { _id: 'plan-1', guestAuthorization: { editToken: 'fresh-edit', handoffToken: 'fresh-handoff' } }
  );
  assert.deepEqual(merged.guestAuthorization, { editToken: 'fresh-edit', handoffToken: 'fresh-handoff' });
  assert.equal(getFreshGuestHandoffToken(merged), 'fresh-handoff');
});

test('unrelated state merges preserve guest authorization instead of dropping it', () => {
  const merged = mergeSavedItinerary(
    { _id: 'plan-1', guestAuthorization: { editToken: 'edit', handoffToken: 'handoff' } },
    { _id: 'plan-1', pace: 'Relaxed' }
  );
  assert.equal(merged.guestAuthorization.editToken, 'edit');
  assert.equal(merged.guestAuthorization.handoffToken, 'handoff');
});

test('guest save without a fresh handoff token fails closed for Lead submission', () => {
  const savedGuest = { _id: 'plan-1', user: null, guestAuthorization: { editToken: 'fresh-edit' } };
  assert.equal(isGuestItinerary(savedGuest), true);
  assert.equal(getFreshGuestHandoffToken(savedGuest), '');
});

test('account-owned itinerary does not require guest handoff credentials', () => {
  const savedAccountPlan = { _id: 'plan-1', user: '66bb11111111111111111111' };
  assert.equal(isGuestItinerary(savedAccountPlan), false);
  assert.equal(getFreshGuestHandoffToken(savedAccountPlan), '');
});
