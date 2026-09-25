import mongoose from 'mongoose';
import Itinerary from '../models/Itinerary.js';
import { normalizeDestinationSlug } from './travelKnowledgeService.js';
import {
  signItineraryGuestEditToken,
  signItineraryHandoffToken,
  verifyItineraryGuestEditToken
} from './itineraryHandoffService.js';

const DEFAULT_GUEST_RETENTION_DAYS = 7;
const EDITABLE_LIFECYCLES = new Set(['GENERATED', 'LEAD_LINKED']);

const asText = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const asList = (value, max = 100) => Array.isArray(value) ? value.slice(0, max) : [];
const asFiniteNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export const getGuestRetentionExpiry = (now = new Date()) => {
  const configured = Number(process.env.AI_GUEST_ITINERARY_RETENTION_DAYS);
  const days = Number.isFinite(configured) ? Math.min(90, Math.max(1, configured)) : DEFAULT_GUEST_RETENTION_DAYS;
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
};

export const resolveItineraryOwner = (user) => {
  const candidate = user?._id || user?.id;
  return candidate && mongoose.Types.ObjectId.isValid(candidate) ? candidate : null;
};

const sanitizeHealthReport = (report = {}) => ({
  isFeasible: report?.isFeasible !== false,
  feasibilityScore: Number.isFinite(Number(report?.feasibilityScore))
    ? Math.min(100, Math.max(0, Number(report.feasibilityScore)))
    : null,
  checks: asList(report?.checks, 100).map((check) => ({
    id: asText(check?.id, 100),
    code: asText(check?.code, 100),
    name: asText(check?.name, 160),
    status: asText(check?.status, 40),
    severity: asText(check?.severity, 40),
    message: asText(check?.message, 1000)
  })),
  modificationsApplied: asList(report?.modificationsApplied, 100).map((item) => asText(item, 1000)).filter(Boolean)
});

const sanitizeMatchedTrip = (trip) => {
  if (!trip || typeof trip !== 'object') return null;
  return {
    id: trip.id || trip._id || null,
    title: asText(trip.title, 200),
    price: Math.max(0, asFiniteNumber(trip.price, 0)),
    image: asText(trip.image, 1000),
    duration: asText(String(trip.duration || ''), 80)
  };
};

export const buildItineraryPersistencePayload = (input = {}) => ({
  title: asText(input.title, 200),
  tagline: asText(input.tagline, 500),
  destination: asText(input.destination, 120),
  destinationSlug: asText(input.destinationSlug, 160) || normalizeDestinationSlug(input.destination || ''),
  duration: Math.min(15, Math.max(1, Math.round(asFiniteNumber(input.duration || input.daysCount, 5)))),
  travelers: Math.min(30, Math.max(1, Math.round(asFiniteNumber(input.travelers, 2)))),
  travelStyle: asText(input.travelStyle || input.mood, 100) || 'Adventure',
  pace: asText(input.pace, 100) || 'Balanced',
  budgetLevel: asText(input.budgetLevel, 100) || 'Moderate',
  totalEstimatedCost: Math.max(0, asFiniteNumber(input.totalEstimatedCost, 0)),
  currency: asText(input.currency, 8) || 'INR',
  weather: input.weather || {},
  seasonContext: asText(input.seasonContext, 200),
  bestTimeToVisit: asText(input.bestTimeToVisit, 300),
  days: asList(input.days || input.itineraryDays, 15),
  staySuggestions: asList(input.staySuggestions, 30),
  foodSuggestions: asList(input.foodSuggestions, 30),
  packingList: asList(input.packingList || input.packingSuggestions, 100),
  localTips: asList(input.localTips, 100),
  budgetBreakdown: input.budgetBreakdown || {},
  plannerContext: input.plannerContext || {},
  healthReport: sanitizeHealthReport(input.healthReport),
  media: input.media || null,
  matchedTrip: sanitizeMatchedTrip(input.matchedCatalogTrip || input.matchedTrip),
  source: ['gemini-ai', 'template-engine', 'customized'].includes(input.source) ? input.source : 'gemini-ai'
});

export const buildGuestAuthorization = (itinerary) => {
  if (!itinerary || itinerary.user) return null;
  return {
    editToken: signItineraryGuestEditToken(itinerary._id),
    handoffToken: signItineraryHandoffToken(itinerary._id)
  };
};

export const persistGeneratedItinerary = async ({ itineraryData, user, now = new Date() }) => {
  if (mongoose.connection.readyState !== 1) {
    throw Object.assign(new Error('The generated plan could not be stored right now. Please retry.'), { status: 503, code: 'ITINERARY_PERSISTENCE_UNAVAILABLE' });
  }
  const ownerId = resolveItineraryOwner(user);
  const payload = buildItineraryPersistencePayload(itineraryData);
  const itinerary = await Itinerary.create({
    ...payload,
    user: ownerId,
    userEmail: ownerId ? asText(user?.email, 320).toLowerCase() : '',
    lifecycleStatus: 'GENERATED',
    version: 1,
    generatedAt: now,
    lastEditedAt: null,
    retentionExpiresAt: ownerId ? null : getGuestRetentionExpiry(now),
    isPublic: false
  });
  return { itinerary, guestAuthorization: buildGuestAuthorization(itinerary) };
};

export const canUpdatePersistedItinerary = ({ itinerary, user, guestEditToken }) => {
  if (!itinerary) return false;
  const role = String(user?.role || '').toLowerCase();
  if (['admin', 'super_admin'].includes(role)) return true;
  const ownerId = resolveItineraryOwner(user);
  if (itinerary.user && ownerId && String(itinerary.user) === String(ownerId)) return true;
  return !itinerary.user && verifyItineraryGuestEditToken(guestEditToken, itinerary._id);
};

export const updatePersistedItinerary = async ({ itineraryId, itineraryData, user, guestEditToken, now = new Date() }) => {
  if (!mongoose.Types.ObjectId.isValid(itineraryId)) throw Object.assign(new Error('A valid itinerary is required.'), { status: 422 });
  const itinerary = await Itinerary.findById(itineraryId);
  if (!itinerary) throw Object.assign(new Error('Itinerary not found.'), { status: 404 });
  if (!canUpdatePersistedItinerary({ itinerary, user, guestEditToken })) {
    throw Object.assign(new Error('Not authorized to update this itinerary.'), { status: 403 });
  }
  if (!EDITABLE_LIFECYCLES.has(itinerary.lifecycleStatus)) {
    throw Object.assign(new Error('This itinerary is no longer editable.'), { status: 409 });
  }
  itinerary.set(buildItineraryPersistencePayload({ ...itinerary.toObject(), ...itineraryData, source: 'customized' }));
  itinerary.version = Math.max(1, Number(itinerary.version) || 1) + 1;
  itinerary.lastEditedAt = now;
  await itinerary.save();
  return { itinerary, guestAuthorization: buildGuestAuthorization(itinerary) };
};

export const retainLinkedItinerary = async (itineraryId, now = new Date()) => Itinerary.findByIdAndUpdate(
  itineraryId,
  {
    $set: {
      lifecycleStatus: 'LEAD_LINKED',
      leadLinkedAt: now,
      retentionExpiresAt: null
    }
  },
  { new: true }
);

export const extractGuestEditToken = (body = {}) => (
  body.guestEditToken || body.editToken || body.guestAuthorization?.editToken || ''
);
