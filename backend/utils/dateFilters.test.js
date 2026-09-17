import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCreatedAtRange } from './dateFilters.js';

test('missing dates do not create a Mongo date filter', () => {
  assert.equal(buildCreatedAtRange(undefined, '', 'quotation'), null);
});

test('a from-only filter starts at UTC midnight', () => {
  const range = buildCreatedAtRange('2026-09-17', undefined, 'quotation');
  assert.equal(range.$gte.toISOString(), '2026-09-17T00:00:00.000Z');
  assert.equal(range.$lt, undefined);
});

test('a to-only filter includes the entire selected day', () => {
  const range = buildCreatedAtRange(undefined, '2026-09-17', 'quotation');
  assert.equal(range.$lt.toISOString(), '2026-09-18T00:00:00.000Z');
  assert.equal(range.$gte, undefined);
});

test('a complete date range uses an exclusive next-day upper bound', () => {
  const range = buildCreatedAtRange('2026-09-16', '2026-09-17', 'quotation');
  assert.equal(range.$gte.toISOString(), '2026-09-16T00:00:00.000Z');
  assert.equal(range.$lt.toISOString(), '2026-09-18T00:00:00.000Z');
});

test('a malformed supplied date fails with a clean 400 error', () => {
  assert.throws(
    () => buildCreatedAtRange('not-a-date', undefined, 'quotation'),
    (error) => error.status === 400 && error.message === 'Invalid quotation date filter.'
  );
});
