import mongoose from 'mongoose';
import Itinerary from '../models/Itinerary.js';
import Lead from '../models/Lead.js';
import { getAllowedOrigins } from '../config/environment.js';
import { loadAuthorizedLeadForStaff } from './leadAccessService.js';
import { buildFactualInclusions, buildSafeExclusions } from './quotationFieldAiService.js';
import { buildQuotationPolicyDefaults, normalizeQuotationPolicies } from '../config/quotationPolicyPresets.js';
import { buildQuotationFieldFallback, isMeaningfulQuotationSuggestion } from '../config/quotationCopyPresets.js';

const MAX_JSON_BYTES = 1024 * 1024;
const MAX_DAYS = 21;
const MAX_ACTIVITIES_PER_SLOT = 8;
const MERGE_MODES = new Set(['FILL_EMPTY_ONLY', 'REPLACE_SELECTED_SECTIONS']);
const SECTION_FIELDS = {
  journey: ['tripRequirements', 'tripPreferences', 'planningReference', 'sourceItineraryId'],
  itinerary: ['itinerary'],
  hotels: ['hotelOptions'],
  transport: ['transportOptions'],
  activities: ['activities'],
  inclusions: ['inclusions', 'exclusions'],
  terms: ['policies'],
  presentation: ['personalNote']
};

const text = (value, max = 500) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const list = (value, maxItems = 20, maxLength = 180) => (
  Array.isArray(value)
    ? value.map((item) => text(item, maxLength)).filter(Boolean).slice(0, maxItems)
    : []
);
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clone = (value) => JSON.parse(JSON.stringify(value ?? null));
const pick = (value, keys) => Object.fromEntries(keys.filter((key) => Object.prototype.hasOwnProperty.call(value || {}, key)).map((key) => [key, clone(value[key])]));

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
const rejectPrototypeKeys = (value) => {
  if (!value || typeof value !== 'object') return;
  for (const key of Object.keys(value)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) {
      throw Object.assign(new Error('JSON contains unsupported object keys.'), { status: 422 });
    }
    rejectPrototypeKeys(value[key]);
  }
};

const durationParts = (duration) => {
  const days = Math.max(1, Math.min(MAX_DAYS, Math.round(number(duration, 1))));
  const nights = Math.max(0, days - 1);
  return { days, nights, label: `${days}D/${nights}N` };
};

const dateValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};

const activityLine = (activity = {}) => {
  if (typeof activity === 'string') return text(activity, 220);
  const parts = [
    activity.time,
    activity.activity || activity.name,
    activity.location ? `at ${activity.location}` : '',
    activity.description
  ].map((item) => text(item, 180)).filter(Boolean);
  return parts.join(' - ');
};

const slotObjectText = (slot) => (
  Array.isArray(slot)
    ? slot.slice(0, MAX_ACTIVITIES_PER_SLOT).map(activityLine).filter(Boolean).join('\n')
    : activityLine(slot)
);

export const buildDeterministicDayDescription = (day = {}) => {
  const slotLabels = [
    ['Morning', day.morning],
    ['Afternoon', day.afternoon],
    ['Evening', day.evening]
  ];
  const facts = slotLabels.map(([label, slot]) => {
    const entries = (Array.isArray(slot) ? slot : [slot])
      .map((item) => typeof item === 'string' ? text(item, 180) : text(item?.activity || item?.name, 180))
      .filter(Boolean)
      .slice(0, 3);
    return entries.length ? `${label}: ${entries.join(', ')}` : '';
  }).filter(Boolean);
  return facts.join('. ').slice(0, 700);
};

const media = (input = {}) => ({
  id: text(input.id, 80),
  url: text(input.url, 1000),
  altText: text(input.altText, 180),
  caption: text(input.caption, 180),
  width: number(input.width, 1600),
  height: number(input.height, 900)
});

const gallery = (value) => (Array.isArray(value) ? value.map(media).filter((item) => item.url).slice(0, 8) : []);

const itineraryDay = (day = {}, index = 0) => {
  const cover = day.coverMedia?.url ? media(day.coverMedia) : { id: '', url: '', altText: '', caption: '', width: 1600, height: 900 };
  return {
    day: number(day.day, index + 1),
    title: text(day.title, 180) || `Day ${index + 1}`,
    locationName: text(day.locationName || day.destination || day.location, 160),
    destination: text(day.destination || day.locationName || day.location, 160),
    description: text(day.description, 700) || buildDeterministicDayDescription(day) || text(day.title, 700),
    morning: slotObjectText(day.morning),
    afternoon: slotObjectText(day.afternoon),
    evening: slotObjectText(day.evening),
    stay: text(day.stay, 220),
    mealsIncluded: list(day.mealsIncluded, 4, 50),
    transferDetails: text(day.transferDetails, 500),
    activityHighlights: [
      ...(Array.isArray(day.morning) ? day.morning : []),
      ...(Array.isArray(day.afternoon) ? day.afternoon : []),
      ...(Array.isArray(day.evening) ? day.evening : [])
    ].map((item) => text(item.activity || item.name || item, 120)).filter(Boolean).slice(0, 6),
    coverMedia: cover,
    coverMediaAssetId: mongoose.Types.ObjectId.isValid(day.coverMediaAssetId) ? day.coverMediaAssetId : null,
    galleryMedia: gallery(day.galleryMedia || day.gallery),
    mediaSelectionMode: String(day.mediaSelectionMode || 'AUTO').toUpperCase() === 'MANUAL' ? 'MANUAL' : 'AUTO'
  };
};

const travelStyle = (value = '') => {
  const normalized = text(value, 80).toLowerCase();
  if (/luxury|premium|comfort/.test(normalized)) return 'Luxury';
  if (/budget/.test(normalized)) return 'Budget';
  if (/backpack/.test(normalized)) return 'Backpacking';
  if (/family/.test(normalized)) return 'Family';
  if (/honeymoon/.test(normalized)) return 'Honeymoon';
  if (/adventure|trek|bike/.test(normalized)) return 'Adventure';
  return 'Custom';
};

const travelerBreakdown = (itinerary = {}) => {
  const ctx = itinerary.plannerContext || {};
  const tb = ctx.travelersBreakdown || {};
  const seniors = number(tb.seniors, 0);
  const adults = Math.max(0, number(tb.adults, 0));
  const children = number(tb.children, 0);
  const infants = number(tb.infants, 0);
  const statedTotal = number(itinerary.travelers, 0);
  const structuredTotal = adults + children + infants + seniors;
  const fallbackAdults = structuredTotal > 0 ? adults : Math.max(1, statedTotal || 1);
  return {
    adults: fallbackAdults,
    children,
    infants,
    seniors,
    total: Math.max(1, fallbackAdults + children + infants + seniors)
  };
};

const normalizedCandidateKey = (...values) => values
  .map((value) => text(value, 220).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim())
  .filter(Boolean)
  .join('|');

const reviewMetadata = (sourceLabel, sourceDayNumbers = []) => ({
  sourceKind: 'AI_PLANNER',
  reviewStatus: 'SUGGESTED',
  sourceLabel,
  sourceDayNumbers,
  reviewedBy: null,
  reviewedAt: null
});

const hotelCandidate = ({ id, segmentId, segmentName, segmentOrder, hotelName, city, nights, sourceDayNumbers, note }) => ({
  ...reviewMetadata('AI Planner stay suggestion', sourceDayNumbers),
  optionId: id,
  segmentId,
  segmentName,
  segmentOrder,
  tier: 'Custom',
  label: sourceDayNumbers.length ? `AI stay · ${segmentName}` : 'AI alternative stay',
  hotelName,
  city,
  location: '',
  category: 'Suggested stay',
  roomType: '',
  rooms: 1,
  occupancy: '',
  mealPlan: '',
  nights: Math.max(1, nights || 1),
  costPerNight: 0,
  pricePerNight: 0,
  totalCost: 0,
  totalPrice: 0,
  imageUrl: '',
  amenities: [],
  notes: note,
  recommendationType: 'CUSTOM',
  selected: false
});

const hotelCandidates = (itinerary = {}) => {
  const seen = new Set();
  const result = [];
  const maxNights = Math.max(0, number(itinerary.duration, itinerary.days?.length || 1) - 1);
  const overnightDays = (itinerary.days || []).slice(0, Math.min(MAX_DAYS, maxNights || MAX_DAYS));
  const segments = [];
  overnightDays.forEach((day, index) => {
    const name = text(day.stay, 180);
    if (!name) return;
    const key = normalizedCandidateKey(name);
    const previous = segments.at(-1);
    if (previous?.key === key && previous.lastIndex === index - 1) {
      previous.nights += 1;
      previous.dayNumbers.push(number(day.day, index + 1));
      previous.lastIndex = index;
    } else {
      segments.push({ key, name, nights: 1, dayNumbers: [number(day.day, index + 1)], lastIndex: index,
        city: text(day.locationName || day.destination || itinerary.destination, 120) });
    }
  });
  segments.forEach((segment, index) => {
    seen.add(segment.key);
    result.push(hotelCandidate({
      id: `ai_hotel_segment_${index + 1}`,
      segmentId: `ai_stay_segment_${index + 1}`,
      segmentName: segment.city || `Stay segment ${index + 1}`,
      segmentOrder: index + 1,
      hotelName: segment.name,
      city: segment.city,
      nights: segment.nights,
      sourceDayNumbers: segment.dayNumbers,
      note: 'Derived from consecutive overnight stays in the AI itinerary. Room allocation, availability, supplier, meal plan, and pricing require staff review.'
    }));
  });
  list(itinerary.staySuggestions, 20, 180).forEach((name) => {
    const key = normalizedCandidateKey(name);
    if (!key || seen.has(key) || result.length >= 12) return;
    seen.add(key);
    const index = result.length + 1;
    result.push(hotelCandidate({
      id: `ai_hotel_alternative_${index}`,
      segmentId: 'ai_stay_alternatives',
      segmentName: 'Alternative stays',
      segmentOrder: index,
      hotelName: name,
      city: text(itinerary.destination, 120),
      nights: 1,
      sourceDayNumbers: [],
      note: 'Top-level AI stay alternative. Night allocation and room allocation require review; availability, supplier, meal plan, and pricing are not confirmed.'
    }));
  });
  return result;
};

const activityCandidates = (itinerary = {}) => {
  const rows = [];
  const seen = new Set();
  (itinerary.days || []).slice(0, MAX_DAYS).forEach((day, dayIndex) => {
    ['morning', 'afternoon', 'evening'].forEach((slot) => {
      (Array.isArray(day[slot]) ? day[slot] : []).slice(0, MAX_ACTIVITIES_PER_SLOT).forEach((activity, index) => {
        const name = text(activity.activity || activity.name, 180);
        if (!name) return;
        const location = text(activity.location || day.locationName || itinerary.destination, 160);
        const dedupeKey = normalizedCandidateKey(dayIndex + 1, name, location);
        if (seen.has(dedupeKey)) return;
        seen.add(dedupeKey);
        rows.push({
          ...reviewMetadata('AI Planner activity', [number(day.day, dayIndex + 1)]),
          activityId: `ai_act_${dayIndex + 1}_${slot}_${index + 1}`,
          dayNumber: dayIndex + 1,
          name,
          description: text(activity.description, 500),
          location,
          pricingType: 'PER_PERSON',
          quantity: 1,
          unitCost: 0,
          unitPrice: 0,
          totalCost: 0,
          totalPrice: 0,
          isIncluded: false,
          isOptional: true,
          selected: false
        });
      });
    });
  });
  return rows.slice(0, 60);
};

const transportCandidate = (itinerary = {}) => {
  const ctx = itinerary.plannerContext || {};
  const preference = text(ctx.transportPreference, 120);
  const origin = text(ctx.origin, 120);
  if (!preference && !origin) return null;
  return {
    ...reviewMetadata('AI Planner transport preference'),
    optionId: 'ai_transport_candidate',
    mode: 'TRANSFER',
    type: preference || 'Transport to be reviewed',
    title: 'AI Planner transport preference',
    vehicle: preference,
    provider: '',
    pickup: origin,
    drop: text(itinerary.destination, 120),
    route: { from: origin, to: text(itinerary.destination, 120), pickupPoint: '', dropPoint: '' },
    capacity: Math.max(1, number(itinerary.travelers, 1)),
    quantity: 1,
    pricingType: 'PER_VEHICLE',
    unitCost: 0,
    unitPrice: 0,
    totalCost: 0,
    totalPrice: 0,
    inclusions: [],
    notes: `AI Planner transport candidate for ${Math.max(1, travelerBreakdown(itinerary).total)} travelers. Provider, vehicle, timings, and price require staff confirmation.`,
    selected: false,
    vehicleMedia: [],
    documents: []
  };
};

export function buildDeterministicPatch(itinerary = {}) {
  const duration = durationParts(itinerary.duration || itinerary.days?.length || 1);
  const travelers = travelerBreakdown(itinerary);
  const ctx = itinerary.plannerContext || {};
  const special = text(ctx.customPreferences, 1100);

  const startDate = !ctx.datesFlexible ? dateValue(ctx.startDate) : '';
  const endDate = !ctx.datesFlexible ? dateValue(ctx.endDate) : '';
  const importedDays = (itinerary.days || []).slice(0, MAX_DAYS).map(itineraryDay);
  const stayCandidates = hotelCandidates(itinerary);
  const activities = activityCandidates(itinerary);
  const transport = transportCandidate(itinerary);
  const budgetScopeValue = text(ctx.budgetScope, 30).toUpperCase().replace(/[\s-]+/g, '_');
  const plannerBudgetScope = ['TOTAL', 'PER_PERSON'].includes(budgetScopeValue) ? budgetScopeValue : 'UNSPECIFIED';

  return {
    sourceItineraryId: itinerary._id || null,
    tripRequirements: {
      title: text(itinerary.title, 180) || `${text(itinerary.destination, 120)} journey`,
      destination: text(itinerary.destination, 120),
      origin: text(ctx.origin, 120),
      startDate,
      endDate,
      datesFlexible: ctx.datesFlexible === true,
      flexibleMonth: ctx.datesFlexible === true ? text(ctx.flexibleMonth, 80) : '',
      duration: duration.label,
      days: duration.days,
      nights: duration.nights,
      adults: travelers.adults,
      children: travelers.children,
      infants: travelers.infants,
      seniors: travelers.seniors,
      totalTravelers: travelers.total,
      travelStyle: travelStyle(itinerary.travelStyle || itinerary.tripType),
      budgetPerPerson: 0,
      specialRequests: special
    },
    tripPreferences: {
      tripType: text(ctx.tripType || itinerary.travelStyle, 100),
      pace: text(itinerary.pace, 100),
      paceRhythm: text(ctx.paceRhythm, 100),
      acclimatization: text(ctx.acclimatization, 200),
      interests: list(ctx.interests, 20, 120),
      stayPreference: text(ctx.stayPreference, 160),
      roomStyle: text(ctx.roomStyle, 160),
      hotelRating: Number.isFinite(Number(ctx.hotelRating)) ? Number(ctx.hotelRating) : null,
      dietaryPreference: text(ctx.dietaryPreference, 160),
      transportPreference: text(ctx.transportPreference, 160),
      mobilityConstraints: list(ctx.mobilityConstraints, 20, 180),
      mustInclude: list(ctx.mustInclude, 20, 180),
      avoid: list(ctx.avoid, 20, 180),
      customPreferences: text(ctx.customPreferences, 1100)
    },
    planningReference: {
      sourceItineraryVersion: number(itinerary.version, 0) || null,
      sourceGeneratedAt: itinerary.generatedAt || null,
      sourceUpdatedAt: itinerary.updatedAt || null,
      plannerBudgetAmount: Number.isFinite(Number(ctx.budgetAmount)) ? Number(ctx.budgetAmount) : null,
      plannerBudgetScope,
      aiEstimatedTotal: number(itinerary.totalEstimatedCost, 0) || null,
      currency: text(itinerary.currency, 10) || 'INR',
      budgetBreakdown: clone(itinerary.budgetBreakdown || null),
      bestTimeToVisit: text(itinerary.bestTimeToVisit, 180),
      seasonContext: text(itinerary.seasonContext, 300)
    },
    itinerary: importedDays,
    hotelOptions: stayCandidates,
    transportOptions: transport ? [transport] : [],
    activities,
    inclusions: [],
    exclusions: buildSafeExclusions(),
    policies: {
      importantInformation: [
        ctx.datesFlexible && ctx.flexibleMonth ? `Travel dates are flexible for ${ctx.flexibleMonth}; exact dates must be confirmed before pricing.` : '',
        'Hotel, transport, and activity availability is subject to manual confirmation.',
        'AI budget estimates are planning references only and are not customer pricing.'
      ].filter(Boolean).join('\n'),
      travelRequirements: [
        ctx.dietaryPreference ? `Dietary preference: ${ctx.dietaryPreference}` : '',
        ctx.mobilityConstraints?.length ? `Mobility considerations: ${ctx.mobilityConstraints.join(', ')}` : '',
        ctx.mustInclude?.length ? `Must include: ${ctx.mustInclude.join(', ')}` : '',
        ctx.avoid?.length ? `Avoid: ${ctx.avoid.join(', ')}` : ''
      ].filter(Boolean).join('\n')
    },
    personalNote: itinerary.tagline || ''
  };
}

export function sanitizeAiQuotationPatch(patch = {}) {
  rejectPrototypeKeys(patch);
  const safe = pick(patch, ['sourceItineraryId', 'personalNote', 'inclusions', 'exclusions']);
  safe.tripRequirements = pick(patch.tripRequirements, [
    'title', 'destination', 'startDate', 'endDate', 'duration', 'days', 'nights',
    'origin', 'datesFlexible', 'flexibleMonth', 'adults', 'children', 'infants', 'seniors',
    'totalTravelers', 'travelStyle', 'specialRequests'
  ]);
  safe.tripPreferences = pick(patch.tripPreferences, [
    'tripType', 'pace', 'paceRhythm', 'acclimatization', 'interests', 'stayPreference',
    'roomStyle', 'hotelRating', 'dietaryPreference', 'transportPreference',
    'mobilityConstraints', 'mustInclude', 'avoid', 'customPreferences'
  ]);
  safe.planningReference = pick(patch.planningReference, [
    'sourceItineraryVersion', 'sourceGeneratedAt', 'sourceUpdatedAt', 'plannerBudgetAmount',
    'plannerBudgetScope', 'aiEstimatedTotal', 'currency', 'budgetBreakdown', 'bestTimeToVisit', 'seasonContext'
  ]);
  safe.itinerary = (patch.itinerary || []).map((day) => pick(day, [
    'day', 'title', 'locationName', 'destination', 'description', 'morning', 'afternoon',
    'evening', 'stay', 'mealsIncluded', 'transferDetails', 'activityHighlights',
    'coverMedia', 'coverMediaAssetId', 'galleryMedia', 'mediaSelectionMode'
  ]));
  safe.hotelOptions = (patch.hotelOptions || []).map((item) => ({ ...pick(item, [
    'optionId', 'segmentId', 'segmentName', 'segmentOrder', 'tier', 'label', 'hotelName',
    'city', 'location', 'category', 'roomType', 'rooms', 'occupancy', 'mealPlan', 'nights',
    'imageUrl', 'amenities', 'notes', 'recommendationType', 'sourceKind', 'reviewStatus',
    'sourceLabel', 'sourceDayNumbers'
  ]), selected: false, costPerNight: 0, pricePerNight: 0, totalCost: 0, totalPrice: 0 }));
  safe.transportOptions = (patch.transportOptions || []).map((item) => ({ ...pick(item, [
    'optionId', 'mode', 'type', 'title', 'vehicle', 'pickup', 'drop', 'route',
    'capacity', 'quantity', 'pricingType', 'notes', 'sourceKind', 'reviewStatus',
    'sourceLabel', 'sourceDayNumbers'
  ]), selected: false, unitCost: 0, unitPrice: 0, totalCost: 0, totalPrice: 0, inclusions: [] }));
  safe.activities = (patch.activities || []).map((item) => ({ ...pick(item, [
    'activityId', 'dayNumber', 'name', 'description', 'location', 'pricingType', 'quantity',
    'sourceKind', 'reviewStatus', 'sourceLabel', 'sourceDayNumbers'
  ]), selected: false, isIncluded: false, isOptional: true,
  unitCost: 0, unitPrice: 0, totalCost: 0, totalPrice: 0 }));
  safe.policies = pick(patch.policies, ['travelRequirements', 'importantInformation']);
  return safe;
}

const empty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'number') return value === 0;
  return false;
};

const fieldConflicts = (current = {}, patch = {}, prefix = '') => {
  const conflicts = [];
  Object.entries(patch || {}).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(value) && isPlainObject(current?.[key])) {
      conflicts.push(...fieldConflicts(current[key], value, path));
    } else if (!empty(current?.[key]) && !empty(value) && JSON.stringify(current[key]) !== JSON.stringify(value)) {
      conflicts.push({ field: path, currentValue: current[key], proposedValue: value });
    }
  });
  return conflicts;
};

export const detectConflicts = (currentQuotation = {}, patch = {}) => fieldConflicts(currentQuotation, patch);

export function applyQuotationAiPatch({ quotation = {}, patch = {}, mergeMode = 'FILL_EMPTY_ONLY', selectedSections = [], conflictChoices = {} }) {
  const mode = MERGE_MODES.has(mergeMode) ? mergeMode : 'FILL_EMPTY_ONLY';
  const selected = new Set(Array.isArray(selectedSections) ? selectedSections : Object.keys(SECTION_FIELDS));
  const next = clone(quotation) || {};
  const appliedSections = [];

  Object.entries(SECTION_FIELDS).forEach(([section, fields]) => {
    if (!selected.has(section)) return;
    let changed = false;
    fields.forEach((field) => {
      if (!Object.prototype.hasOwnProperty.call(patch, field)) return;
      if (mode === 'REPLACE_SELECTED_SECTIONS') {
        if (field === 'tripRequirements' || field === 'tripPreferences' || field === 'planningReference' || field === 'policies') {
          next[field] = { ...(next[field] || {}), ...clone(patch[field]) };
        } else if (['hotelOptions', 'transportOptions', 'activities'].includes(field)) {
          const idField = { hotelOptions: 'optionId', transportOptions: 'optionId', activities: 'activityId' }[field];
          const existing = next[field] || [];
          const existingIds = new Set(existing.map((item) => item[idField]));
          next[field] = [...existing, ...clone(patch[field]).filter((item) => !existingIds.has(item[idField]))];
        } else {
          next[field] = clone(patch[field]);
        }
        changed = true;
        return;
      }
      if (field === 'tripRequirements' || field === 'tripPreferences' || field === 'planningReference') {
        const starterJourney = !next.tripRequirements?.title && !next.tripRequirements?.destination;
        next[field] = { ...(next[field] || {}) };
        Object.entries(patch[field] || {}).forEach(([key, value]) => {
          if ((empty(next[field][key]) || (field === 'tripRequirements' && starterJourney && ['days', 'nights', 'adults', 'children', 'infants', 'seniors', 'totalTravelers', 'duration', 'datesFlexible'].includes(key))) && !empty(value)) {
            next[field][key] = clone(value);
            changed = true;
          }
        });
      } else if (field === 'policies') {
        next.policies = { ...(next.policies || {}) };
        Object.entries(patch.policies || {}).forEach(([key, value]) => {
          if (empty(next.policies[key]) && !empty(value)) {
            next.policies[key] = clone(value);
            changed = true;
          }
        });
      } else if (empty(next[field]) && !empty(patch[field])) {
        next[field] = clone(patch[field]);
        changed = true;
      }
    });
    if (changed) appliedSections.push(section);
  });

  const allowedConflictPaths = new Set(detectConflicts(quotation, patch).map((item) => item.field));
  Object.entries(conflictChoices || {}).forEach(([path, choice]) => {
    if (!allowedConflictPaths.has(path) || !['keep', 'use'].includes(choice)) return;
    const root = path.split('.')[0];
    if (['hotelOptions', 'transportOptions', 'activities', 'sourceItineraryId'].includes(root)) return;
    if (!Object.entries(SECTION_FIELDS).some(([section, fields]) => selected.has(section) && fields.includes(root))) return;
    const parts = path.split('.');
    const source = choice === 'use' ? patch : quotation;
    const value = parts.reduce((current, key) => current?.[key], source);
    if (value === undefined) return;
    if (parts.length === 1) next[root] = clone(value);
    else if (parts.length === 2) next[root] = { ...(next[root] || {}), [parts[1]]: clone(value) };
  });

  return { quotation: next, appliedSections };
}

const loadItineraryForUser = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('A valid itinerary id is required.'), { status: 422 });
  const doc = await Itinerary.findById(id);
  if (!doc) throw Object.assign(new Error('AI itinerary not found.'), { status: 404 });
  const role = String(user?.role || '').toLowerCase();
  const isPrivilegedStaff = ['super_admin', 'admin'].includes(role);
  const userId = String(user?._id || user?.id || '');
  const owns = (doc.user && String(doc.user) === userId) || (doc.userEmail && doc.userEmail === user?.email);
  if (!isPrivilegedStaff && !doc.isPublic && !owns) throw Object.assign(new Error('You cannot access this private AI itinerary.'), { status: 403 });
  return doc.toObject();
};

const parseStructuredPayload = (payload) => {
  if (typeof payload !== 'string') return payload;
  if (Buffer.byteLength(payload, 'utf8') > MAX_JSON_BYTES) {
    throw Object.assign(new Error('Quotation-ready JSON must be 1 MB or smaller.'), { status: 413 });
  }
  try {
    return JSON.parse(payload);
  } catch (error) {
    const position = String(error?.message || '').match(/position\s+(\d+)/i)?.[1];
    throw Object.assign(new Error(position
      ? `This JSON is invalid near position ${position}.`
      : 'This JSON is invalid. Check the copied plan and try again.'), { status: 422 });
  }
};

const unwrapImportedPayload = (input) => {
  let payload = input;
  for (let depth = 0; depth < 4; depth += 1) {
    if (payload?.schema === 'wanderluxe-ai-itinerary') {
      if (Number(payload.schemaVersion) !== 1 || !isPlainObject(payload.itinerary)) {
        throw Object.assign(new Error('Unsupported quotation-ready itinerary JSON schema.'), { status: 422 });
      }
      return {
        itinerary: payload.itinerary,
        plannerContext: payload.plannerContext || payload.itinerary.plannerContext || {}
      };
    }
    if (isPlainObject(payload?.data)) {
      payload = payload.data;
      continue;
    }
    if (isPlainObject(payload?.itinerary)) {
      return {
        itinerary: payload.itinerary,
        plannerContext: payload.plannerContext || payload.itinerary.plannerContext || {}
      };
    }
    break;
  }
  if (isPlainObject(payload) && Array.isArray(payload.days)
    && (text(payload.destination, 120) || text(payload.title, 180))) {
    return { itinerary: payload, plannerContext: payload.plannerContext || {} };
  }
  throw Object.assign(new Error(
    'This is not a supported structured WanderLuxe AI itinerary.'
  ), { status: 422 });
};

export function normalizeImportedItineraryPayload(input, { enforceSize = true } = {}) {
  const parsed = parseStructuredPayload(input);
  if (enforceSize) {
    const size = Buffer.byteLength(JSON.stringify(parsed || {}), 'utf8');
    if (size > MAX_JSON_BYTES) throw Object.assign(new Error('Quotation-ready JSON must be 1 MB or smaller.'), { status: 413 });
  }
  rejectPrototypeKeys(parsed);
  const { itinerary, plannerContext } = unwrapImportedPayload(parsed);
  const days = Array.isArray(itinerary.days)
    ? itinerary.days
    : Array.isArray(itinerary.itineraryDays) ? itinerary.itineraryDays : [];
  const breakdown = plannerContext?.travelersBreakdown || {};
  const travelerTotal = number(itinerary.travelers,
    number(breakdown.adults) + number(breakdown.children) + number(breakdown.infants) + number(breakdown.seniors));
  const parsedDuration = number(itinerary.duration, days.length || 1);
  return {
    _id: itinerary._id || itinerary.id || null,
    title: text(itinerary.title, 180),
    tagline: text(itinerary.tagline || itinerary.summary, 500),
    destination: text(itinerary.destination, 120),
    duration: parsedDuration,
    travelers: Math.max(1, travelerTotal || 1),
    travelStyle: text(itinerary.travelStyle || itinerary.tripType, 80),
    pace: text(itinerary.pace || plannerContext?.paceRhythm, 80),
    budgetLevel: text(itinerary.budgetLevel || plannerContext?.budgetTier, 80),
    plannerContext: clone(plannerContext || {}),
    days: clone(days.slice(0, MAX_DAYS)),
    staySuggestions: list(itinerary.staySuggestions, 20, 180),
    foodSuggestions: list(itinerary.foodSuggestions, 30, 180),
    packingList: list(itinerary.packingList || itinerary.packingSuggestions, 40, 180),
    localTips: list(itinerary.localTips, 30, 300),
    bestTimeToVisit: text(itinerary.bestTimeToVisit, 180),
    weather: clone(itinerary.weather || null),
    healthReport: clone(itinerary.healthReport || null),
    matchedCatalogTrip: clone(itinerary.matchedCatalogTrip || itinerary.matchedTrip || null),
    totalEstimatedCost: number(itinerary.totalEstimatedCost, 0),
    budgetBreakdown: clone(itinerary.budgetBreakdown || null),
    currency: text(itinerary.currency, 10) || 'INR',
    seasonContext: text(itinerary.seasonContext, 300),
    version: number(itinerary.version, 0) || null,
    generatedAt: itinerary.generatedAt || null,
    createdAt: itinerary.createdAt || null,
    updatedAt: itinerary.updatedAt || null
  };
}

export function parseSharedItineraryToken(value) {
  const raw = text(value, 500);
  let shareToken = raw;
  if (/^https?:\/\//i.test(raw)) {
    const url = new URL(raw);
    const configuredHosts = [...getAllowedOrigins()].flatMap((origin) => {
      try { return [new URL(origin).hostname]; } catch { return []; }
    });
    const allowedHost = ['wanderluxe.in', 'www.wanderluxe.in', 'wanderluxe.com', 'www.wanderluxe.com',
      'localhost', '127.0.0.1', ...configuredHosts].includes(url.hostname);
    if (!allowedHost) throw Object.assign(new Error('Use a WanderLuxe shared-plan link.'), { status: 422 });
    shareToken = url.pathname.match(/^\/itinerary\/shared\/([^/]+)\/?$/)?.[1] || '';
  }
  if (!/^[a-zA-Z0-9_-]{8,200}$/.test(shareToken)) {
    throw Object.assign(new Error('A valid shared-plan token is required.'), { status: 422 });
  }
  return shareToken;
}

export async function resolveImportSource(request = {}, user) {
  const sourceType = request.sourceType || 'JSON_UPLOAD';
  if (sourceType === 'SAVED_ITINERARY') {
    const itinerary = await loadItineraryForUser(request.itineraryId, user);
    return { type: sourceType, itinerary: normalizeImportedItineraryPayload(itinerary, { enforceSize: false }) };
  }
  if (sourceType === 'SHARED_ITINERARY') {
    const shareToken = parseSharedItineraryToken(request.shareToken);
    const doc = await Itinerary.findOne({ shareToken, isPublic: true }).select('-user -userEmail -__v');
    if (!doc) throw Object.assign(new Error('Shared AI itinerary not found or sharing is disabled.'), { status: 404 });
    return { type: sourceType, itinerary: normalizeImportedItineraryPayload(doc.toObject(), { enforceSize: false }) };
  }
  if (sourceType === 'LEAD_LINKED_ITINERARY') {
    const lead = await loadAuthorizedLeadForStaff(request.leadId, user);
    if (!lead.sourceItineraryId) throw Object.assign(new Error('This lead does not have a linked AI itinerary.'), { status: 404 });
    const itinerary = await Itinerary.findById(lead.sourceItineraryId);
    if (!itinerary) throw Object.assign(new Error('Linked AI itinerary was removed.'), { status: 404 });
    return { type: sourceType, itinerary: normalizeImportedItineraryPayload(itinerary.toObject(), { enforceSize: false }) };
  }
  if (sourceType === 'JSON_UPLOAD' || sourceType === 'PASTED_ITINERARY' || sourceType === 'DEMO_SAMPLE') {
    return { type: sourceType, itinerary: normalizeImportedItineraryPayload(request.itineraryPayload) };
  }
  throw Object.assign(new Error('Unsupported AI itinerary import source.'), { status: 422 });
}

export async function buildQuotationAiImportPreview({ request = {}, user }) {
  const { type, itinerary } = await resolveImportSource(request, user);
  if (!Array.isArray(itinerary.days) || itinerary.days.length > MAX_DAYS) {
    throw Object.assign(new Error(`AI itinerary must include ${MAX_DAYS} days or fewer.`), { status: 422 });
  }
  const patch = sanitizeAiQuotationPatch(buildDeterministicPatch(itinerary));
  if (['JSON_UPLOAD', 'PASTED_ITINERARY', 'DEMO_SAMPLE'].includes(type)) delete patch.sourceItineraryId;
  const conflicts = detectConflicts(request.currentQuotation || {}, patch);
  const warnings = [];
  if (!itinerary.plannerContext || Object.keys(itinerary.plannerContext || {}).length === 0) {
    warnings.push('Some original planner preferences are unavailable for this legacy plan.');
  }
  if (itinerary.totalEstimatedCost || itinerary.budgetBreakdown) {
    warnings.push('AI budget estimates were ignored for quotation pricing.');
  }
  const images = (patch.itinerary || []).reduce((count, day) => count + (day.coverMedia?.url ? 1 : 0) + (day.galleryMedia?.length || 0), 0);
  return {
    source: {
      type,
      itineraryId: itinerary._id || null,
      title: itinerary.title || '',
      destination: itinerary.destination || '',
      updatedAt: itinerary.updatedAt || itinerary.createdAt || null,
      version: itinerary.version || null,
      generatedAt: itinerary.generatedAt || null
    },
    deterministicPatch: patch,
    suggestions: {
      stayCandidates: patch.hotelOptions || [],
      activityCandidates: patch.activities || [],
      transportCandidate: patch.transportOptions?.[0] || null
    },
    textDraftCandidates: {
      personalNote: patch.personalNote || '',
      inclusions: patch.inclusions || [],
      exclusions: patch.exclusions || [],
      travelRequirements: patch.policies?.travelRequirements || '',
      importantInformation: patch.policies?.importantInformation || ''
    },
    conflicts,
    warnings,
    protectedFields: ['customerSnapshot', 'manualPricing', 'pricing', 'paymentTerms.depositPercent', 'paymentTerms.balanceDueDays'],
    summary: {
      daysAdded: patch.itinerary?.length || 0,
      imagesLinked: images,
      staySuggestions: patch.hotelOptions?.length || 0,
      activitySuggestions: patch.activities?.length || 0,
      commercialPricingChanged: false
    },
    planSummary: {
      title: patch.tripRequirements?.title || itinerary.title || '',
      destination: patch.tripRequirements?.destination || itinerary.destination || '',
      duration: patch.tripRequirements?.duration || itinerary.duration || 0,
      travelers: patch.tripRequirements?.totalTravelers || itinerary.travelers || 1,
      travelStyle: patch.tripRequirements?.travelStyle || itinerary.travelStyle || '',
      pace: itinerary.pace || itinerary.plannerContext?.paceRhythm || ''
    },
    autofill: [
      'Journey basics', `${patch.itinerary?.length || 0} itinerary days`,
      patch.presentationSettings?.coverMedia?.url ? 'Cover presentation' : '',
      'Safe policy defaults'
    ].filter(Boolean),
    candidateReview: [
      ...(patch.hotelOptions?.length ? [`${patch.hotelOptions.length} hotel candidates`] : []),
      ...(patch.activities?.length ? [`${patch.activities.length} activity candidates`] : []),
      ...(patch.transportOptions?.length ? ['1 transport candidate'] : [])
    ],
    manualRemaining: ['Customer identity', 'Supplier and availability confirmation', 'Commercial pricing and payment amounts']
  };
}

export function buildSmartQuotationDraft({ lead = {}, itinerary = {}, actor = {} } = {}) {
  const normalized = normalizeImportedItineraryPayload(itinerary, { enforceSize: false });
  const mapped = sanitizeAiQuotationPatch(buildDeterministicPatch(normalized));
  const freeFormRequests = [...new Set([
    text(lead.message, 1100),
    text(mapped.tripPreferences?.customPreferences, 1100)
  ].filter(Boolean))];
  const draft = {
    leadId: lead._id || lead.id || null,
    sourceItineraryId: normalized._id || lead.sourceItineraryId || null,
    customerId: lead.userId || null,
    assignedTo: actor._id || actor.id || lead.assignedToUser || null,
    customerSnapshot: {
      name: text(lead.name, 160),
      email: text(lead.email, 240).toLowerCase(),
      phone: text(lead.phone, 80),
      city: text(lead.city, 120),
      notes: ''
    },
    ...mapped,
    tripRequirements: {
      ...mapped.tripRequirements,
      specialRequests: freeFormRequests.join('\n')
    },
    inclusions: [],
    manualPricing: {
      currency: 'INR', componentReference: 0, finalCustomerPrice: 0, depositAmount: 0,
      balanceAmount: 0, adjustments: [], paymentSchedule: [], priceNotes: ''
    },
    pricing: {},
    paymentTerms: { depositPercent: 10, balanceDueDays: 6, paymentMode: 'PARTIAL', currency: 'INR' },
    presentationSettings: {
      template: 'journey', showComponentPrices: false, showPaymentSchedule: true,
      showAttachments: true, showAdvisor: true, showTerms: true,
      showItineraryGallery: true, showTripPreferences: false
    },
    aiImportProvenance: {
      sourceType: 'LEAD_LINKED_ITINERARY',
      sourceTitle: normalized.title,
      sourceDestination: normalized.destination,
      sourceUpdatedAt: normalized.updatedAt || normalized.createdAt || null,
      sourceVersion: normalized.version || null,
      sourceGeneratedAt: normalized.generatedAt || null,
      buildMode: 'AI_LEAD_SMART_BUILD',
      importedAt: new Date(),
      importedBy: actor._id || actor.id || null
    }
  };
  draft.policies = {
    ...buildQuotationPolicyDefaults(draft),
    ...mapped.policies
  };
  draft.personalNote = mapped.personalNote || buildQuotationFieldFallback({ quotation: draft, field: 'journey.personalNote' });
  return draft;
}

export const buildSmartQuotationSummary = (quotation = {}) => ({
  customerFilled: Boolean(quotation.customerSnapshot?.name && quotation.customerSnapshot?.email && quotation.customerSnapshot?.phone),
  journeyFieldsFilled: Object.values(quotation.tripRequirements || {}).filter((value) => value !== '' && value !== null && value !== undefined).length,
  itineraryDays: quotation.itinerary?.length || 0,
  mediaItems: (quotation.itinerary || []).reduce((total, day) => total + (day.coverMedia?.url ? 1 : 0) + (day.galleryMedia?.length || 0), 0),
  hotelCandidates: (quotation.hotelOptions || []).filter((item) => item.sourceKind === 'AI_PLANNER').length,
  transportCandidates: (quotation.transportOptions || []).filter((item) => item.sourceKind === 'AI_PLANNER').length,
  activityCandidates: (quotation.activities || []).filter((item) => item.sourceKind === 'AI_PLANNER').length,
  policiesFilled: Object.values(quotation.policies || {}).filter(Boolean).length,
  pricingChanged: false
});

export function sanitizeQuotationSourcePlan(itinerary = {}) {
  const normalized = normalizeImportedItineraryPayload(itinerary, { enforceSize: false });
  return pick(normalized, [
    '_id', 'title', 'destination', 'duration', 'plannerContext', 'days', 'staySuggestions',
    'foodSuggestions', 'packingList', 'localTips', 'budgetBreakdown', 'healthReport',
    'weather', 'seasonContext', 'bestTimeToVisit', 'version', 'generatedAt', 'updatedAt'
  ]);
}

const comparison = (key, current, source) => ({
  key,
  changed: JSON.stringify(current ?? null) !== JSON.stringify(source ?? null),
  current: clone(current),
  source: clone(source)
});

export function buildQuotationSourceComparison(quotation = {}, itinerary = {}) {
  const normalized = normalizeImportedItineraryPayload(itinerary, { enforceSize: false });
  const mapped = sanitizeAiQuotationPatch(buildDeterministicPatch(normalized));
  const itineraryFields = ['day', 'title', 'locationName', 'destination', 'description', 'morning', 'afternoon', 'evening', 'stay', 'transferDetails'];
  const stayFields = ['hotelName', 'city', 'nights', 'sourceDayNumbers'];
  const transportFields = ['type', 'pickup', 'drop', 'capacity'];
  const activityFields = ['dayNumber', 'name', 'location', 'description'];
  const groups = [
    comparison('Journey', pick(quotation.tripRequirements, ['title', 'destination', 'origin', 'duration', 'travelStyle']), pick(mapped.tripRequirements, ['title', 'destination', 'origin', 'duration', 'travelStyle'])),
    comparison('Dates', pick(quotation.tripRequirements, ['datesFlexible', 'flexibleMonth', 'startDate', 'endDate']), pick(mapped.tripRequirements, ['datesFlexible', 'flexibleMonth', 'startDate', 'endDate'])),
    comparison('Travelers', pick(quotation.tripRequirements, ['adults', 'children', 'infants', 'seniors', 'totalTravelers']), pick(mapped.tripRequirements, ['adults', 'children', 'infants', 'seniors', 'totalTravelers'])),
    comparison('Preferences', quotation.tripPreferences || {}, mapped.tripPreferences || {}),
    comparison('Itinerary', (quotation.itinerary || []).map((day) => pick(day, itineraryFields)), (mapped.itinerary || []).map((day) => pick(day, itineraryFields))),
    comparison('Media', (quotation.itinerary || []).map((day) => ({ day: day.day, coverMedia: day.coverMedia, galleryMedia: day.galleryMedia })), (mapped.itinerary || []).map((day) => ({ day: day.day, coverMedia: day.coverMedia, galleryMedia: day.galleryMedia }))),
    comparison('Stay suggestions', (quotation.hotelOptions || []).filter((item) => item.sourceKind === 'AI_PLANNER' || String(item.optionId || '').startsWith('ai_hotel_')).map((item) => pick(item, stayFields)), (mapped.hotelOptions || []).map((item) => pick(item, stayFields))),
    comparison('Transport preference', (quotation.transportOptions || []).filter((item) => item.sourceKind === 'AI_PLANNER' || String(item.optionId || '').startsWith('ai_transport_')).map((item) => pick(item, transportFields)), (mapped.transportOptions || []).map((item) => pick(item, transportFields))),
    comparison('Activity candidates', (quotation.activities || []).filter((item) => item.sourceKind === 'AI_PLANNER' || String(item.activityId || '').startsWith('ai_act_')).map((item) => pick(item, activityFields)), (mapped.activities || []).map((item) => pick(item, activityFields)))
  ];
  return {
    source: { version: normalized.version || null, generatedAt: normalized.generatedAt || null, updatedAt: normalized.updatedAt || null },
    sourceChanged: Boolean(
      (normalized.version && normalized.version !== quotation.aiImportProvenance?.sourceVersion)
      || (normalized.updatedAt && (!quotation.aiImportProvenance?.sourceUpdatedAt
        || new Date(normalized.updatedAt) > new Date(quotation.aiImportProvenance.sourceUpdatedAt)))
    ),
    groups,
    changedGroups: groups.filter((group) => group.changed).map((group) => group.key)
  };
}

export async function listImportableItineraries(user, search = '') {
  const role = String(user?.role || '').toLowerCase();
  const leadFilter = ['admin', 'super_admin'].includes(role)
    ? { sourceItineraryId: { $ne: null } }
    : { sourceItineraryId: { $ne: null }, $or: [
      { leadType: 'callback_request' }, { leadType: 'trip_enquiry', source: 'ai_planner' }
    ] };
  const leads = await Lead.find(leadFilter).select('_id sourceItineraryId').sort({ updatedAt: -1 }).limit(100).lean();
  const ids = [...new Set(leads.map((lead) => String(lead.sourceItineraryId)).filter(Boolean))];
  const needle = text(search, 80);
  const ownId = mongoose.Types.ObjectId.isValid(user?._id || user?.id) ? (user._id || user.id) : null;
  const filter = { $and: [{ $or: [
    { _id: { $in: ids } },
    ...(ownId ? [{ user: ownId }] : [])
  ] }] };
  if (needle) filter.$and.push({ $or: [
    { title: { $regex: needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
    { destination: { $regex: needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
  ] });
  const docs = await Itinerary.find(filter).select('title destination duration travelers updatedAt').sort({ updatedAt: -1 }).limit(30).lean();
  return docs.map((doc) => ({
    itineraryId: String(doc._id),
    leadId: String(leads.find((lead) => String(lead.sourceItineraryId) === String(doc._id))?._id || ''),
    title: doc.title, destination: doc.destination, duration: doc.duration,
    travelers: doc.travelers, updatedAt: doc.updatedAt,
    source: leads.some((lead) => String(lead.sourceItineraryId) === String(doc._id)) ? 'Lead linked plan' : 'Staff owned plan'
  }));
}

const allowedDraftFields = new Set([
  'personalNote',
  'journeyTitle',
  'dayDescriptions',
  'inclusions',
  'exclusions',
  'travelRequirements',
  'importantInformation',
  'hotelNotes',
  'transportNotes',
  'activityDescriptions',
  'policies'
]);

const sanitizeDrafts = (value = {}) => ({
  ...(text(value.personalNote, 1200) ? { personalNote: text(value.personalNote, 1200) } : {}),
  ...(text(value.journeyTitle, 180) ? { journeyTitle: text(value.journeyTitle, 180) } : {}),
  ...(Array.isArray(value.dayDescriptions) ? {
    dayDescriptions: value.dayDescriptions.map((item) => ({
      day: number(item.day, 0),
      description: text(item.description, 900)
    })).filter((item) => item.day && item.description)
  } : {}),
  ...(Array.isArray(value.inclusions) ? { inclusions: list(value.inclusions, 20, 220) } : {}),
  ...(Array.isArray(value.exclusions) ? { exclusions: list(value.exclusions, 20, 220) } : {}),
  ...(text(value.travelRequirements, 1600) ? { travelRequirements: text(value.travelRequirements, 1600) } : {}),
  ...(text(value.importantInformation, 1600) ? { importantInformation: text(value.importantInformation, 1600) } : {}),
  ...(Array.isArray(value.hotelNotes) ? { hotelNotes: value.hotelNotes.map((item) => ({
    index: number(item.index, -1), notes: text(item.notes, 900)
  })).filter((item) => item.index >= 0 && item.notes) } : {}),
  ...(Array.isArray(value.transportNotes) ? { transportNotes: value.transportNotes.map((item) => ({
    index: number(item.index, -1), notes: text(item.notes, 900)
  })).filter((item) => item.index >= 0 && item.notes) } : {}),
  ...(Array.isArray(value.activityDescriptions) ? { activityDescriptions: value.activityDescriptions.map((item) => ({
    index: number(item.index, -1), description: text(item.description, 900)
  })).filter((item) => item.index >= 0 && item.description) } : {}),
  ...(isPlainObject(value.policies) ? { policies: normalizeQuotationPolicies({ policies: value.policies }) } : {})
});

export async function generateQuotationTextDrafts({ quotation = {}, itinerary = null, fields = [] }) {
  const requested = (Array.isArray(fields) ? fields : []).filter((field) => allowedDraftFields.has(field));
  if (!requested.length) throw Object.assign(new Error('Choose at least one missing-copy section.'), { status: 422 });
  const drafts = {};
  if (requested.includes('personalNote')) drafts.personalNote = buildQuotationFieldFallback({ quotation, field: 'journey.personalNote' });
  if (requested.includes('journeyTitle')) drafts.journeyTitle = buildQuotationFieldFallback({ quotation, field: 'journey.title' });
  if (requested.includes('dayDescriptions')) drafts.dayDescriptions = buildQuotationFieldFallback({ quotation, field: 'itinerary.missingDescriptions' });
  if (requested.includes('inclusions')) drafts.inclusions = buildFactualInclusions(quotation);
  if (requested.includes('exclusions')) drafts.exclusions = buildSafeExclusions();
  if (requested.includes('travelRequirements')) drafts.travelRequirements = buildQuotationFieldFallback({ quotation, field: 'policies.travelRequirements' });
  if (requested.includes('importantInformation')) drafts.importantInformation = buildQuotationFieldFallback({ quotation, field: 'policies.importantInformation' });
  if (requested.includes('hotelNotes')) drafts.hotelNotes = (quotation.hotelOptions || []).map((_, index) => ({
    index,
    notes: buildQuotationFieldFallback({ quotation, field: 'hotel.notes', index })
  })).filter((item) => item.notes);
  if (requested.includes('transportNotes')) drafts.transportNotes = (quotation.transportOptions || []).map((_, index) => ({
    index,
    notes: buildQuotationFieldFallback({ quotation, field: 'transport.notes', index })
  })).filter((item) => item.notes);
  if (requested.includes('activityDescriptions')) drafts.activityDescriptions = (quotation.activities || []).map((_, index) => ({
    index,
    description: buildQuotationFieldFallback({ quotation, field: 'activity.description', index })
  })).filter((item) => item.description);
  if (requested.includes('policies')) drafts.policies = buildQuotationPolicyDefaults(quotation);

  const safeDrafts = sanitizeDrafts(drafts);
  const available = isMeaningfulQuotationSuggestion(safeDrafts);
  return {
    available,
    drafts: available ? safeDrafts : {},
    warnings: [],
    provider: 'deterministic',
    source: 'deterministic',
    model: null,
    referenceId: null,
    code: available ? null : 'NO_CONFIRMED_CONTEXT'
  };
}
