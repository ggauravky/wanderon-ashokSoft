import assert from 'node:assert/strict';
import test from 'node:test';
import { getReferenceId, leadDraft } from './quotationLeadDraft.js';

const LEAD_ID = '66aa11111111111111111111';
const ITINERARY_ID = '66bb11111111111111111111';
const blankDraft = () => ({
  leadId: null,
  sourceItineraryId: null,
  customerSnapshot: { name: '', email: '', phone: '', city: '', notes: '' },
  tripRequirements: {
    title: '', destination: '', startDate: '', endDate: '', datesFlexible: false, flexibleMonth: '',
    adults: 1, children: 0, infants: 0, seniors: 0, totalTravelers: 1,
    budgetPerPerson: '', specialRequests: ''
  }
});

test('reference normalization safely supports every quotation Lead reference shape', () => {
  assert.equal(getReferenceId(null), null);
  assert.equal(getReferenceId(undefined), null);
  assert.equal(getReferenceId(ITINERARY_ID), ITINERARY_ID);
  assert.equal(getReferenceId({ _id: ITINERARY_ID }), ITINERARY_ID);
  assert.equal(getReferenceId({ id: ITINERARY_ID }), ITINERARY_ID);
  assert.equal(getReferenceId(42), null);
});

test('reported callback request opens a factual quotation draft without an AI itinerary', () => {
  const draft = leadDraft({
    _id: LEAD_ID,
    leadType: 'callback_request',
    sourceItineraryId: null,
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '+91 9876543210',
    destination: 'Manali',
    travelersCount: 3,
    travelMonth: 'October 2026',
    budgetPerPerson: '25000',
    message: 'Need a relaxed family trip'
  }, blankDraft());

  assert.equal(draft.leadId, LEAD_ID);
  assert.equal(draft.sourceItineraryId, null);
  assert.deepEqual(draft.customerSnapshot, {
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '+91 9876543210',
    city: '',
    notes: 'Need a relaxed family trip'
  });
  assert.equal(draft.tripRequirements.title, 'Manali journey');
  assert.equal(draft.tripRequirements.destination, 'Manali');
  assert.equal(draft.tripRequirements.adults, 3);
  assert.equal(draft.tripRequirements.children, 0);
  assert.equal(draft.tripRequirements.infants, 0);
  assert.equal(draft.tripRequirements.seniors, 0);
  assert.equal(draft.tripRequirements.totalTravelers, 3);
  assert.equal(draft.tripRequirements.datesFlexible, true);
  assert.equal(draft.tripRequirements.flexibleMonth, 'October 2026');
  assert.equal(draft.tripRequirements.startDate, '');
  assert.equal(draft.tripRequirements.budgetPerPerson, 25000);
  assert.equal(draft.customerSnapshot.notes, 'Need a relaxed family trip');
  assert.equal(draft.tripRequirements.specialRequests, '');
});

test('AI Planner Lead keeps its populated source and richer traveler breakdown', () => {
  const draft = leadDraft({
    id: LEAD_ID,
    sourceItineraryId: {
      _id: ITINERARY_ID,
      plannerContext: {
        travelersBreakdown: { adults: 2, children: 1, infants: 1, seniors: 1 }
      }
    },
    tripTitleSnapshot: 'Spiti Family Circuit',
    destination: 'Spiti Valley',
    travelersCount: 99,
    travelDate: '2026-10-12',
    travelMonth: 'October 2026',
    budgetPerPerson: '₹45,000'
  }, blankDraft());

  assert.equal(draft.leadId, LEAD_ID);
  assert.equal(draft.sourceItineraryId, ITINERARY_ID);
  assert.equal(draft.tripRequirements.title, 'Spiti Family Circuit');
  assert.deepEqual(
    {
      adults: draft.tripRequirements.adults,
      children: draft.tripRequirements.children,
      infants: draft.tripRequirements.infants,
      seniors: draft.tripRequirements.seniors,
      totalTravelers: draft.tripRequirements.totalTravelers
    },
    { adults: 2, children: 1, infants: 1, seniors: 1, totalTravelers: 5 }
  );
  assert.equal(draft.tripRequirements.startDate, '2026-10-12');
  assert.equal(draft.tripRequirements.endDate, '');
  assert.equal(draft.tripRequirements.datesFlexible, false);
  assert.equal(draft.tripRequirements.flexibleMonth, '');
  assert.equal(draft.tripRequirements.budgetPerPerson, 45000);
});

test('undefined itinerary and minimum legacy Lead produce safe empty/default fields', () => {
  const undefinedSource = leadDraft({ _id: LEAD_ID, sourceItineraryId: undefined }, blankDraft());
  assert.equal(undefinedSource.sourceItineraryId, null);

  const minimum = leadDraft({ id: LEAD_ID, destination: null, travelDate: null, travelMonth: null, quotations: null, userId: null }, blankDraft());
  assert.equal(minimum.leadId, LEAD_ID);
  assert.equal(minimum.tripRequirements.destination, '');
  assert.equal(minimum.tripRequirements.title, '');
  assert.equal(minimum.tripRequirements.adults, 1);
  assert.equal(minimum.tripRequirements.totalTravelers, 1);
  assert.equal(minimum.tripRequirements.startDate, '');
  assert.equal(minimum.tripRequirements.flexibleMonth, '');
});

test('selected batch is preserved without duplicating the customer message', () => {
  const draft = leadDraft({
    _id: LEAD_ID,
    message: 'Window seats requested',
    selectedBatch: '12–18 October 2026',
    specialRequests: 'Avoid overnight buses'
  }, blankDraft());
  assert.equal(draft.customerSnapshot.notes, 'Window seats requested');
  assert.equal(draft.tripRequirements.specialRequests, 'Selected batch: 12–18 October 2026\nAvoid overnight buses');
});
