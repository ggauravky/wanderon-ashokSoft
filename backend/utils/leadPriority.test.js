import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateLeadPriority } from './leadPriority.js';

const now = new Date('2026-09-17T10:00:00.000Z');

test('overdue qualified follow-up is urgent', () => {
  const result = calculateLeadPriority({ status: 'QUALIFIED', nextFollowUpAt: '2026-09-16T10:00:00.000Z' }, { now });
  assert.equal(result.effectivePriority, 'URGENT');
  assert.deepEqual(result.priorityReasons.slice(0, 2), ['Follow-up overdue', 'Qualified lead']);
});

test('terminal leads are closed and never urgent', () => {
  const result = calculateLeadPriority({ status: 'CONVERTED', priority: 'URGENT', preferredCallDate: '2026-09-01' }, { now });
  assert.equal(result.effectivePriority, 'LOW');
  assert.equal(result.priorityScore, 0);
});

test('stale untouched new request gains urgency', () => {
  const result = calculateLeadPriority({ status: 'NEW', createdAt: '2026-09-16T08:00:00.000Z', contactCount: 0 }, { now });
  assert.equal(result.effectivePriority, 'MEDIUM');
  assert.ok(result.priorityReasons.includes('New request untouched for 24+ hours'));
});
