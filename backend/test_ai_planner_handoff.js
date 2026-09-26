import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createLead } from './controllers/leadController.js';
import Itinerary from './models/Itinerary.js';
import Lead from './models/Lead.js';
import User from './models/User.js';
import {
  buildItineraryPersistencePayload,
  persistGeneratedItinerary,
  updatePersistedItinerary
} from './services/itineraryPersistenceService.js';
import {
  ITINERARY_TOKEN_PURPOSES,
  signItineraryGuestEditToken,
  signItineraryHandoffToken,
  verifyItineraryHandoffToken
} from './services/itineraryHandoffService.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'ai-planner-handoff-test-secret-that-is-long-enough';

const IDS = Object.freeze({
  itinerary: '66aa11111111111111111111',
  customer: '66bb11111111111111111111',
  staff: '66cc11111111111111111111',
  other: '66dd11111111111111111111',
  lead: '66ee11111111111111111111'
});

const plannerData = {
  title: 'Seven Days in Spiti',
  destination: 'Spiti Valley',
  duration: 7,
  travelers: 2,
  days: [{ day: 1, title: 'Arrival', morning: [{ activity: 'Drive to Kaza' }] }],
  plannerContext: { flexibleMonth: 'October 2026' }
};

const leadBody = (overrides = {}) => ({
  name: 'Planner Test',
  email: 'planner@example.com',
  phone: '9876543210',
  source: 'ai_planner',
  leadType: 'trip_enquiry',
  sourceItineraryId: IDS.itinerary,
  ...overrides
});

const makeUser = (id, role) => new User({
  _id: id,
  name: `${role} test`,
  email: `${role}-${id.slice(-4)}@example.com`,
  password: 'unused-test-password',
  role
});

const makeResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

const withLeadControllerModels = async ({
  sourceItinerary,
  requester = null,
  handoffToken = '',
  existingLead = null
}) => {
  const originals = {
    readyState: mongoose.connection.readyState,
    itineraryFindById: Itinerary.findById,
    itineraryFindByIdAndUpdate: Itinerary.findByIdAndUpdate,
    leadFindOne: Lead.findOne,
    leadCreate: Lead.create
  };
  let createCount = 0;
  let createdPayload = null;
  let retainedUpdate = null;

  try {
    mongoose.connection.readyState = 1;
    Itinerary.findById = () => {
      const query = {
        select: () => query,
        lean: async () => sourceItinerary
      };
      return query;
    };
    Itinerary.findByIdAndUpdate = async (_id, update) => {
      retainedUpdate = update;
      if (sourceItinerary && update?.$set) Object.assign(sourceItinerary, update.$set);
      return sourceItinerary;
    };
    Lead.findOne = () => ({ sort: async () => existingLead });
    Lead.create = async (payload) => {
      createCount += 1;
      createdPayload = payload;
      return { _id: IDS.lead, ...payload };
    };

    const req = {
      body: leadBody({ sourceItineraryHandoffToken: handoffToken }),
      user: requester,
      originalUrl: '/api/leads'
    };
    const res = makeResponse();
    await createLead(req, res);
    return { res, createCount, createdPayload, retainedUpdate };
  } finally {
    mongoose.connection.readyState = originals.readyState;
    Itinerary.findById = originals.itineraryFindById;
    Itinerary.findByIdAndUpdate = originals.itineraryFindByIdAndUpdate;
    Lead.findOne = originals.leadFindOne;
    Lead.create = originals.leadCreate;
  }
};

test('CASE 1 — guest generation, same-itinerary update, Lead handoff, and retention transition succeed', async () => {
  const originals = {
    readyState: mongoose.connection.readyState,
    create: Itinerary.create,
    findById: Itinerary.findById
  };
  let itinerary;
  try {
    mongoose.connection.readyState = 1;
    Itinerary.create = async (payload) => {
      itinerary = new Itinerary({ ...payload, _id: IDS.itinerary });
      itinerary.save = async () => itinerary;
      return itinerary;
    };
    const generated = await persistGeneratedItinerary({ itineraryData: plannerData, user: null });
    assert.ok(generated.guestAuthorization.editToken);
    assert.ok(generated.guestAuthorization.handoffToken);

    Itinerary.findById = async () => itinerary;
    const updated = await updatePersistedItinerary({
      itineraryId: IDS.itinerary,
      itineraryData: { ...plannerData, pace: 'Relaxed' },
      guestEditToken: generated.guestAuthorization.editToken
    });
    assert.equal(String(updated.itinerary._id), IDS.itinerary);
    assert.equal(verifyItineraryHandoffToken(updated.guestAuthorization.handoffToken, IDS.itinerary), true);

    const result = await withLeadControllerModels({
      sourceItinerary: updated.itinerary.toObject(),
      handoffToken: updated.guestAuthorization.handoffToken
    });
    assert.equal(result.res.statusCode, 201);
    assert.equal(String(result.createdPayload.sourceItineraryId), IDS.itinerary);
    assert.equal(result.createdPayload.userId, null);
    assert.equal(result.retainedUpdate.$set.lifecycleStatus, 'LEAD_LINKED');
    assert.equal(result.retainedUpdate.$set.retentionExpiresAt, null);
  } finally {
    mongoose.connection.readyState = originals.readyState;
    Itinerary.create = originals.create;
    Itinerary.findById = originals.findById;
  }
});

test('CASE 2 — the authenticated customer owner succeeds and becomes Lead.userId', async () => {
  const customer = makeUser(IDS.customer, 'user');
  const result = await withLeadControllerModels({
    sourceItinerary: { _id: IDS.itinerary, user: customer._id, ...plannerData },
    requester: customer
  });
  assert.equal(result.res.statusCode, 201);
  assert.equal(String(result.createdPayload.userId), IDS.customer);
  assert.equal(String(result.createdPayload.sourceItineraryId), IDS.itinerary);
});

test('CASE 3 — the same authenticated non-customer owner is authorized', async () => {
  const staff = makeUser(IDS.staff, 'admin');
  const result = await withLeadControllerModels({
    sourceItinerary: { _id: IDS.itinerary, user: staff._id, ...plannerData },
    requester: staff
  });
  assert.equal(result.res.statusCode, 201);
  assert.equal(result.createCount, 1);
});

test('CASE 4 — a different authenticated account remains forbidden', async () => {
  const result = await withLeadControllerModels({
    sourceItinerary: { _id: IDS.itinerary, user: IDS.customer, ...plannerData },
    requester: makeUser(IDS.other, 'user')
  });
  assert.equal(result.res.statusCode, 403);
  assert.equal(result.createCount, 0);
});

test('CASE 5 — a guest token bound to another itinerary is forbidden', async () => {
  const result = await withLeadControllerModels({
    sourceItinerary: { _id: IDS.itinerary, user: null, ...plannerData },
    handoffToken: signItineraryHandoffToken(IDS.other)
  });
  assert.equal(result.res.statusCode, 403);
  assert.equal(result.createCount, 0);
});

test('CASE 6 — an expired guest handoff token is forbidden', async () => {
  const expired = jwt.sign({
    purpose: ITINERARY_TOKEN_PURPOSES.LEAD_HANDOFF,
    itineraryId: IDS.itinerary,
    exp: Math.floor(Date.now() / 1000) - 1
  }, process.env.JWT_SECRET);
  const result = await withLeadControllerModels({
    sourceItinerary: { _id: IDS.itinerary, user: null, ...plannerData },
    handoffToken: expired
  });
  assert.equal(result.res.statusCode, 403);
  assert.equal(result.createCount, 0);
});

test('CASE 7 — a guest edit token cannot authorize a Lead handoff', async () => {
  const result = await withLeadControllerModels({
    sourceItinerary: { _id: IDS.itinerary, user: null, ...plannerData },
    handoffToken: signItineraryGuestEditToken(IDS.itinerary)
  });
  assert.equal(result.res.statusCode, 403);
  assert.equal(result.createCount, 0);
});

test('CASE 8 — update-issued handoff proof succeeds after an old token has expired', async () => {
  const expired = jwt.sign({
    purpose: ITINERARY_TOKEN_PURPOSES.LEAD_HANDOFF,
    itineraryId: IDS.itinerary,
    exp: Math.floor(Date.now() / 1000) - 1
  }, process.env.JWT_SECRET);
  assert.equal(verifyItineraryHandoffToken(expired, IDS.itinerary), false);

  const itinerary = new Itinerary({
    ...buildItineraryPersistencePayload(plannerData),
    _id: IDS.itinerary,
    user: null,
    lifecycleStatus: 'GENERATED',
    version: 1
  });
  itinerary.save = async () => itinerary;
  const originalFindById = Itinerary.findById;
  try {
    Itinerary.findById = async () => itinerary;
    const refreshed = await updatePersistedItinerary({
      itineraryId: IDS.itinerary,
      itineraryData: plannerData,
      guestEditToken: signItineraryGuestEditToken(IDS.itinerary)
    });
    assert.equal(verifyItineraryHandoffToken(refreshed.guestAuthorization.handoffToken, IDS.itinerary), true);
    const result = await withLeadControllerModels({
      sourceItinerary: refreshed.itinerary.toObject(),
      handoffToken: refreshed.guestAuthorization.handoffToken
    });
    assert.equal(result.res.statusCode, 201);
  } finally {
    Itinerary.findById = originalFindById;
  }
});

test('CASE 9 — repeated submission returns the existing Lead without creating a duplicate', async () => {
  const existingLead = { _id: IDS.lead, referenceId: 'WLX-EXISTING', name: 'Planner Test' };
  const token = signItineraryHandoffToken(IDS.itinerary);
  const result = await withLeadControllerModels({
    sourceItinerary: { _id: IDS.itinerary, user: null, ...plannerData },
    handoffToken: token,
    existingLead
  });
  assert.equal(result.res.statusCode, 200);
  assert.equal(result.res.body.existingRequest, true);
  assert.equal(result.res.body.lead, existingLead);
  assert.equal(result.createCount, 0);
});

test('CASE 10 — an authenticated staff owner never becomes the traveler relationship', async () => {
  const staff = makeUser(IDS.staff, 'sales');
  const result = await withLeadControllerModels({
    sourceItinerary: { _id: IDS.itinerary, user: staff._id, ...plannerData },
    requester: staff
  });
  assert.equal(result.res.statusCode, 201);
  assert.equal(result.createdPayload.userId, null);
  assert.equal(String(result.createdPayload.sourceItineraryId), IDS.itinerary);
});
