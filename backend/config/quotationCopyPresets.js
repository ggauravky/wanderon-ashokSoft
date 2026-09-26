import { buildQuotationPolicyDefaults } from './quotationPolicyPresets.js';

const text = (value, max = 500) => typeof value === 'string'
  ? value.trim().replace(/\s+/g, ' ').slice(0, max)
  : '';

const list = (value, max = 20) => Array.isArray(value)
  ? value.map((item) => text(item, 180)).filter(Boolean).slice(0, max)
  : [];

const normalizeLine = (value) => text(value).toLowerCase();
const reviewedForInclusion = (item, prefix) => {
  const aiCandidate = item?.sourceKind === 'AI_PLANNER' || String(item?.optionId || item?.activityId || '').startsWith(prefix);
  return !aiCandidate || item.reviewStatus === 'REVIEWED';
};

export const dedupeQuotationLines = (values = []) => {
  const seen = new Set();
  return values.filter((value) => {
    const normalized = normalizeLine(value);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  }).map((value) => text(value, 240));
};

export const isMeaningfulQuotationSuggestion = (value) => {
  if (typeof value === 'string') return Boolean(text(value));
  if (Array.isArray(value)) return value.some((item) => typeof item === 'object'
    ? Boolean(text(item?.description))
    : Boolean(text(item)));
  if (value && typeof value === 'object') return Object.values(value).some((item) => isMeaningfulQuotationSuggestion(item));
  return false;
};

const tripFacts = (quotation = {}) => quotation.tripRequirements || {};
const durationWords = (duration) => {
  const value = text(duration, 40);
  const days = value.match(/^(\d+)\s*d/i)?.[1];
  return days ? `${days}-Day` : value;
};

export const buildFallbackJourneyTitle = (quotation = {}) => {
  const trip = tripFacts(quotation);
  const destination = text(trip.destination, 120);
  if (!destination) return '';
  return [durationWords(trip.duration), destination, 'Journey'].filter(Boolean).join(' ');
};

export const buildFallbackPersonalNote = (quotation = {}) => {
  const trip = tripFacts(quotation);
  const destination = text(trip.destination, 120);
  if (!destination) return '';
  const firstName = text(quotation.customerSnapshot?.name, 80).split(' ')[0];
  const greeting = firstName ? `${firstName}, we've` : `We've`;
  const duration = durationWords(trip.duration);
  return `${greeting} prepared this ${[duration, destination, 'journey'].filter(Boolean).join(' ')} around the preferences shared with our travel team. Please review the itinerary and selected services, and let us know if you'd like any changes.`;
};

export const buildFallbackDayDescription = (day = {}) => {
  const morning = text(day.morning);
  const afternoon = text(day.afternoon);
  const evening = text(day.evening);
  const parts = [morning, afternoon, evening].filter(Boolean);
  if (!parts.length) {
    const title = text(day.title);
    const location = text(day.destination || day.locationName || day.location);
    return title ? `${title}${location ? ` in ${location}` : ''}.` : '';
  }
  const sentences = [];
  if (morning) sentences.push(`Begin the morning with ${morning}.`);
  if (afternoon) sentences.push(`Continue in the afternoon with ${afternoon}.`);
  if (evening) sentences.push(`Spend the evening with ${evening}.`);
  return sentences.join(' ');
};

export const buildFallbackHotelNotes = (hotel = {}) => {
  const name = text(hotel.hotelName || hotel.name, 120);
  if (!name) return '';
  const city = text(hotel.city || hotel.location, 80);
  const room = text(hotel.roomType, 80);
  const meal = text(hotel.mealPlan, 80);
  return `Proposed stay at ${name}${city ? `, ${city}` : ''}${room ? ` in a ${room}` : ''}${meal ? ` with ${meal}` : ''}.`;
};

export const buildFallbackTransportNotes = (transport = {}) => {
  const vehicle = text(transport.title || transport.vehicle || transport.mode, 120);
  const from = text(transport.pickup || transport.route?.from, 80);
  const to = text(transport.drop || transport.route?.to, 80);
  if (!vehicle && !from && !to) return '';
  if (from && to) return `${vehicle || 'Planned'} transfer from ${from} to ${to}.`;
  return `${[vehicle, from || to].filter(Boolean).join(' transfer at ')}.`;
};

export const buildFallbackActivityDescription = (activity = {}) => {
  const name = text(activity.name, 120);
  if (!name) return '';
  const location = text(activity.location, 80);
  return `${name}${location ? ` near ${location}` : ''} is planned as part of the day experience.`;
};

export const buildFactualInclusions = (quotation = {}) => {
  const hotels = (quotation.hotelOptions || []).filter((item) => item.selected === true && reviewedForInclusion(item, 'ai_hotel_') && text(item.hotelName));
  const transport = (quotation.transportOptions || []).filter((item) => item.selected === true
    && reviewedForInclusion(item, 'ai_transport_')
    && (text(item.title || item.vehicle || item.mode) || text(item.pickup || item.route?.from) || text(item.drop || item.route?.to)));
  const activities = (quotation.activities || []).filter((item) => item.selected === true && reviewedForInclusion(item, 'ai_act_') && item.isIncluded === true && text(item.name));
  const addOns = (quotation.addOns || []).filter((item) => item.selected === true && text(item.name));
  return dedupeQuotationLines([
    ...hotels.map((item) => `Accommodation at ${text(item.hotelName, 120)}${text(item.city, 80) ? `, ${text(item.city, 80)}` : ''}${text(item.mealPlan, 80) ? ` (${text(item.mealPlan, 80)})` : ''}`),
    ...transport.map((item) => {
      const title = text(item.title || item.vehicle || item.mode, 120);
      const from = text(item.pickup || item.route?.from, 80);
      const to = text(item.drop || item.route?.to, 80);
      return `Transport: ${title || 'Selected service'}${from && to ? ` from ${from} to ${to}` : ''}`;
    }),
    ...activities.map((item) => `Included activity: ${text(item.name, 120)}`),
    ...addOns.map((item) => `Selected add-on: ${text(item.name, 120)}`)
  ]);
};

export const buildSafeInclusionCandidates = (quotation = {}) => dedupeQuotationLines([
  (quotation.hotelOptions || []).some((item) => text(item.hotelName))
    ? 'Accommodation as specified in the final selected hotel option' : '',
  (quotation.transportOptions || []).some((item) => text(item.title || item.vehicle || item.mode) || text(item.pickup) || text(item.drop))
    ? 'Transport services as specified in the final selected transport option' : '',
  (quotation.activities || []).some((item) => item.isIncluded === true && text(item.name))
    ? 'Activities explicitly marked as included in this quotation' : '',
  (quotation.itinerary || []).some((day) => text(day.title) || text(day.description) || text(day.morning) || text(day.afternoon) || text(day.evening))
    ? 'Services expressly listed in the final confirmed itinerary' : ''
]);

export const buildFallbackInclusions = (quotation = {}) => {
  const factual = buildFactualInclusions(quotation);
  return factual.length ? factual : buildSafeInclusionCandidates(quotation);
};

export const buildFallbackExclusions = () => [
  'Personal expenses and services not expressly listed as included',
  'Optional activities unless expressly listed as included'
];

export const buildFallbackTravelRequirements = (quotation = {}) => buildQuotationPolicyDefaults(quotation).travelRequirements;
export const buildFallbackImportantInformation = (quotation = {}) => buildQuotationPolicyDefaults(quotation).importantInformation;

export const buildQuotationFieldFallback = ({ quotation = {}, field, index = 0 } = {}) => {
  const row = (collection) => quotation[collection]?.[index] || {};
  if (field === 'journey.title') return buildFallbackJourneyTitle(quotation);
  if (field === 'journey.personalNote') return buildFallbackPersonalNote(quotation);
  if (field === 'itinerary.description') return buildFallbackDayDescription(row('itinerary'));
  if (field === 'itinerary.missingDescriptions') return (quotation.itinerary || [])
    .filter((day) => !text(day.description))
    .map((day) => ({ day: Number(day.day), description: buildFallbackDayDescription(day) }))
    .filter((item) => item.description);
  if (field === 'hotel.notes') return buildFallbackHotelNotes(row('hotelOptions'));
  if (field === 'hotel.label') return [text(row('hotelOptions').hotelName), text(row('hotelOptions').city)].filter(Boolean).join(' · ');
  if (field === 'transport.notes') return buildFallbackTransportNotes(row('transportOptions'));
  if (field === 'transport.title') return text(row('transportOptions').title || row('transportOptions').vehicle || row('transportOptions').mode);
  if (field === 'activity.description') return buildFallbackActivityDescription(row('activities'));
  if (field === 'addon.description') {
    const addon = row('addOns');
    return text(addon.name) ? `${text(addon.name)}${text(addon.category) ? ` (${text(addon.category)})` : ''}.` : '';
  }
  if (field === 'inclusions') return buildFallbackInclusions(quotation);
  if (field === 'exclusions') return buildFallbackExclusions();
  if (field === 'policies.all') return buildQuotationPolicyDefaults(quotation);
  if (field.startsWith('policies.')) return buildQuotationPolicyDefaults(quotation)[field.split('.')[1]] || '';
  return '';
};

export const FALLBACK_COPY_FIELDS = new Set([
  'journey.title', 'journey.personalNote', 'itinerary.description', 'itinerary.missingDescriptions',
  'hotel.label', 'hotel.notes', 'transport.title', 'transport.notes', 'activity.description',
  'addon.description', 'inclusions', 'exclusions', 'policies.all',
  'policies.paymentTerms', 'policies.cancellationPolicy', 'policies.refundNotes',
  'policies.travelRequirements', 'policies.importantInformation', 'policies.termsAndConditions'
]);

export const cleanFallbackList = list;
