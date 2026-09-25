import { buildQuotationPolicyDefaults, POLICY_FIELDS, normalizeQuotationPolicies } from '../config/quotationPolicyPresets.js';
import {
  FALLBACK_COPY_FIELDS,
  buildFactualInclusions as buildPresetFactualInclusions,
  buildFallbackExclusions,
  buildQuotationFieldFallback,
  buildSafeInclusionCandidates,
  dedupeQuotationLines,
  isMeaningfulQuotationSuggestion
} from '../config/quotationCopyPresets.js';
import { createAiOutputRejectedError, generateStructuredJson } from './geminiService.js';

const FIELDS = new Set([
  'customer.notes', 'journey.title', 'journey.specialRequests', 'journey.personalNote',
  'itinerary.title', 'itinerary.description', 'itinerary.morning', 'itinerary.afternoon',
  'itinerary.evening', 'itinerary.transferDetails', 'itinerary.missingDescriptions', 'hotel.label', 'hotel.notes',
  'transport.title', 'transport.notes', 'activity.description', 'addon.description',
  'inclusions', 'exclusions', ...POLICY_FIELDS.map((field) => `policies.${field}`), 'policies.all'
]);
const MODES = new Set(['generate', 'improve', 'shorten', 'format']);
const FALLBACK_ERROR_CODES = new Set([
  'AI_NOT_CONFIGURED', 'AI_AUTH_FAILED', 'AI_MODEL_NOT_FOUND', 'AI_QUOTA_EXCEEDED',
  'AI_RATE_LIMITED', 'AI_PROVIDER_UNAVAILABLE', 'AI_INVALID_RESPONSE', 'AI_OUTPUT_REJECTED'
]);
const SYSTEM_INSTRUCTION = 'Rewrite only the requested travel-quotation field using supplied facts. Be concise. Never invent price, availability, supplier, meals, inclusions, legal terms, customer identity, or guarantees. Return only schema-compliant JSON.';

const SINGLE_TEXT_SCHEMA = {
  type: 'object',
  properties: { suggestion: { type: 'string' } },
  required: ['suggestion'],
  additionalProperties: false
};
const STRING_LIST_SCHEMA = {
  type: 'object',
  properties: { suggestion: { type: 'array', items: { type: 'string' }, maxItems: 20 } },
  required: ['suggestion'],
  additionalProperties: false
};
const DAY_DESCRIPTIONS_SCHEMA = {
  type: 'object',
  properties: {
    suggestion: {
      type: 'array',
      maxItems: 21,
      items: {
        type: 'object',
        properties: { day: { type: 'number' }, description: { type: 'string' } },
        required: ['day', 'description'],
        additionalProperties: false
      }
    }
  },
  required: ['suggestion'],
  additionalProperties: false
};
const POLICY_BUNDLE_SCHEMA = {
  type: 'object',
  properties: {
    suggestion: {
      type: 'object',
      properties: Object.fromEntries(POLICY_FIELDS.map((key) => [key, { type: 'string' }])),
      required: POLICY_FIELDS,
      additionalProperties: false
    }
  },
  required: ['suggestion'],
  additionalProperties: false
};

const FIELD_TOKEN_LIMITS = {
  'journey.title': 80,
  'journey.personalNote': 180,
  'journey.specialRequests': 250,
  'hotel.label': 80,
  'hotel.notes': 150,
  'transport.title': 80,
  'transport.notes': 150,
  'activity.description': 150,
  'addon.description': 150,
  'itinerary.title': 80,
  'itinerary.description': 220,
  'itinerary.morning': 150,
  'itinerary.afternoon': 150,
  'itinerary.evening': 150,
  'itinerary.transferDetails': 150,
  inclusions: 250,
  exclusions: 200,
  'policies.all': 900
};

const FIELD_CHARACTER_LIMITS = {
  'journey.title': 160,
  'journey.personalNote': 900,
  'journey.specialRequests': 1100,
  'hotel.label': 160,
  'hotel.notes': 750,
  'transport.title': 160,
  'transport.notes': 750,
  'activity.description': 750,
  'addon.description': 750,
  'itinerary.title': 160,
  'itinerary.description': 1000,
  'itinerary.morning': 650,
  'itinerary.afternoon': 650,
  'itinerary.evening': 650,
  'itinerary.transferDetails': 650,
  inclusions: 240,
  exclusions: 240
};

const trimmed = (value, max = 1000) => typeof value === 'string'
  ? value.trim().replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email]')
    .replace(/(?:\+?\d[\d\s().-]{8,}\d)/g, '[phone]')
    .replace(/(?:₹|\$|INR\s*|Rs\.?\s*)[\d,.]+/gi, '[amount]')
    .replace(/(?:supplier cost|internal cost|margin|commission|unit cost|price per night)[^\n.]*/gi, '[internal detail]')
    .slice(0, max)
  : '';
const cleanList = (value, max = 20, maxChars = 240) => Array.isArray(value)
  ? dedupeQuotationLines(value.filter((item) => typeof item === 'string').map((item) => trimmed(item, maxChars)).filter(Boolean)).slice(0, max)
  : [];
const numbers = (value) => (String(value || '').match(/\d+(?:\.\d+)?%?/g) || []).sort();
const sameNumbers = (left, right) => JSON.stringify(numbers(left)) === JSON.stringify(numbers(right));

const stripEmpty = (value) => {
  if (Array.isArray(value)) {
    const items = value.map(stripEmpty).filter((item) => item !== undefined);
    return items.length ? items : undefined;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(([key, item]) => [key, stripEmpty(item)]).filter(([, item]) => item !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  if (value === null || value === undefined || value === '') return undefined;
  return value;
};

const selectedServices = (quotation = {}) => ({
  hotels: (quotation.hotelOptions || []).filter((item) => item.selected === true && item.hotelName).map((item) => ({ name: trimmed(item.hotelName, 120), city: trimmed(item.city, 80), mealPlan: trimmed(item.mealPlan, 80) })),
  transport: (quotation.transportOptions || []).filter((item) => item.selected === true).map((item) => ({ title: trimmed(item.title || item.vehicle || item.mode, 120), from: trimmed(item.pickup || item.route?.from, 80), to: trimmed(item.drop || item.route?.to, 80) })),
  activities: (quotation.activities || []).filter((item) => item.selected === true && item.isIncluded === true && item.name).map((item) => trimmed(item.name, 120)),
  addOns: (quotation.addOns || []).filter((item) => item.selected === true && item.name).map((item) => trimmed(item.name, 120))
});

export const buildFactualInclusions = buildPresetFactualInclusions;
export const buildSafeExclusions = buildFallbackExclusions;

const currentValue = (quotation, field, index) => {
  if (field === 'customer.notes') return trimmed(quotation.customerSnapshot?.notes);
  if (field === 'journey.title') return trimmed(quotation.tripRequirements?.title);
  if (field === 'journey.specialRequests') return trimmed(quotation.tripRequirements?.specialRequests);
  if (field === 'journey.personalNote') return trimmed(quotation.personalNote);
  const [section, key] = field.split('.');
  const collection = { itinerary: 'itinerary', hotel: 'hotelOptions', transport: 'transportOptions', activity: 'activities', addon: 'addOns' }[section];
  if (collection) return trimmed(quotation[collection]?.[index]?.[key]);
  if (section === 'policies') return trimmed(normalizeQuotationPolicies(quotation)[key]);
  return field === 'inclusions' ? cleanList(quotation.inclusions) : cleanList(quotation.exclusions);
};

const tripContext = (trip, fields) => Object.fromEntries(fields.map((key) => [key, trimmed(trip[key], key === 'specialRequests' ? 500 : 160)]));

export const buildFieldContext = (quotation = {}, field, index = 0) => {
  if (!FIELDS.has(field)) throw Object.assign(new Error('Unsupported AI field.'), { status: 422 });
  const trip = quotation.tripRequirements || {};
  const current = currentValue(quotation, field, index);
  const [section] = field.split('.');
  const collection = { itinerary: 'itinerary', hotel: 'hotelOptions', transport: 'transportOptions', activity: 'activities', addon: 'addOns' }[section];
  const row = collection ? quotation[collection]?.[index] : null;
  if (collection && !row && field !== 'itinerary.missingDescriptions') throw Object.assign(new Error('Select a valid quotation item.'), { status: 422 });

  let context = { field, current };
  if (field === 'journey.title') context.trip = tripContext(trip, ['destination', 'duration', 'travelStyle']);
  else if (field === 'journey.personalNote') context.trip = tripContext(trip, ['destination', 'duration', 'travelStyle', 'specialRequests']);
  else if (field === 'journey.specialRequests' || field === 'customer.notes') context.trip = tripContext(trip, ['destination']);
  else if (field === 'itinerary.missingDescriptions') context.missingDays = (quotation.itinerary || [])
    .filter((day) => !trimmed(day.description)).slice(0, 21).map((day) => stripEmpty({
      day: day.day, title: trimmed(day.title), location: trimmed(day.destination || day.locationName),
      morning: trimmed(day.morning), afternoon: trimmed(day.afternoon), evening: trimmed(day.evening), stay: trimmed(day.stay)
    }));
  else if (section === 'itinerary') context.facts = stripEmpty({
    day: row?.day, title: trimmed(row?.title), location: trimmed(row?.destination || row?.locationName),
    morning: trimmed(row?.morning), afternoon: trimmed(row?.afternoon), evening: trimmed(row?.evening),
    stay: trimmed(row?.stay), transferDetails: trimmed(row?.transferDetails), current
  });
  else if (section === 'hotel') context.facts = stripEmpty({
    name: trimmed(row?.hotelName, 120), city: trimmed(row?.city, 80), roomType: trimmed(row?.roomType, 80),
    mealPlan: trimmed(row?.mealPlan, 80), amenities: cleanList(row?.amenities, 12), current
  });
  else if (section === 'transport') context.facts = stripEmpty({
    title: trimmed(row?.title, 120), mode: trimmed(row?.mode, 80), vehicle: trimmed(row?.vehicle, 120),
    from: trimmed(row?.pickup || row?.route?.from, 80), to: trimmed(row?.drop || row?.route?.to, 80), current
  });
  else if (section === 'activity') context.facts = stripEmpty({
    name: trimmed(row?.name, 120), location: trimmed(row?.location, 80), day: row?.dayNumber, current
  });
  else if (section === 'addon') context.facts = stripEmpty({
    name: trimmed(row?.name, 120), category: trimmed(row?.category, 80), current
  });
  else if (section === 'policies') {
    const defaults = buildQuotationPolicyDefaults(quotation);
    context.policy = {
      defaults: field === 'policies.all' ? defaults : { [field.split('.')[1]]: defaults[field.split('.')[1]] },
      current: field === 'policies.all' ? normalizeQuotationPolicies(quotation) : current
    };
  } else if (field === 'inclusions' || field === 'exclusions') {
    context.services = selectedServices(quotation);
    context.current = field === 'inclusions' ? cleanList(quotation.inclusions) : cleanList(quotation.exclusions);
  }
  return stripEmpty(context) || { field };
};

export const quotationFieldRequirement = (quotation = {}, field, index = 0) => {
  const context = buildFieldContext(quotation, field, index);
  if (field === 'itinerary.missingDescriptions' && !context.missingDays?.length) return 'Every itinerary day already has a description.';
  if ((field === 'customer.notes' || field === 'journey.specialRequests') && !context.current) return 'Add the existing request or note first.';
  if ((field === 'journey.title' || field === 'journey.personalNote') && !context.trip?.destination) return 'Add the destination first.';
  if (field.startsWith('hotel.') && !context.facts?.name) return 'Add the hotel name first.';
  if (field.startsWith('activity.') && !context.facts?.name) return 'Add the activity name first.';
  if (field.startsWith('addon.') && !context.facts?.name) return 'Add the add-on name first.';
  if (field.startsWith('transport.') && !context.facts?.title && !context.facts?.mode && !context.facts?.from && !context.facts?.to) return 'Add a transport title, mode, or route first.';
  if (field.startsWith('itinerary.') && field !== 'itinerary.missingDescriptions'
    && !context.facts?.title && !context.facts?.location && !context.facts?.morning
    && !context.facts?.afternoon && !context.facts?.evening) return 'Add a day title, location, or activity first.';
  return '';
};

const schemaForField = (field) => {
  if (field === 'itinerary.missingDescriptions') return DAY_DESCRIPTIONS_SCHEMA;
  if (field === 'policies.all') return POLICY_BUNDLE_SCHEMA;
  if (['inclusions', 'exclusions'].includes(field)) return STRING_LIST_SCHEMA;
  return SINGLE_TEXT_SCHEMA;
};

export const maxOutputTokensForQuotationField = (field, context = {}) => {
  if (field === 'itinerary.missingDescriptions') return Math.min(1_200, Math.max(220, (context.missingDays?.length || 1) * 220));
  if (field.startsWith('policies.') && field !== 'policies.all') return 300;
  return FIELD_TOKEN_LIMITS[field] || 180;
};

const normalizeGeneratedSuggestion = (raw, field, context) => {
  if (field === 'itinerary.missingDescriptions') return (Array.isArray(raw) ? raw : []).slice(0, 21)
    .filter((item) => context.missingDays?.some((day) => Number(day.day) === Number(item.day)))
    .map((item) => ({ day: Number(item.day), description: trimmed(item.description, 1000) })).filter((item) => item.description);
  if (field === 'policies.all') return Object.fromEntries(POLICY_FIELDS.map((key) => [key, trimmed(raw?.[key], 1800)]));
  if (['inclusions', 'exclusions'].includes(field)) return cleanList(raw, 20, FIELD_CHARACTER_LIMITS[field]);
  return trimmed(raw, FIELD_CHARACTER_LIMITS[field] || (field.startsWith('policies.') ? 1800 : 900));
};

const deterministicResult = ({ field, mode, suggestion, source = 'default' }) => ({
  available: true,
  provider: 'deterministic',
  source,
  model: null,
  field,
  mode,
  suggestion,
  deterministic: true,
  fallback: false,
  warnings: []
});

const fallbackWarning = (code) => code === 'AI_OUTPUT_REJECTED'
  ? 'AI wording was rejected by safety checks. A safe starter version is shown instead.'
  : 'AI writing was unavailable, so a safe starter suggestion was generated.';

const providerFallbackResult = ({ field, mode, suggestion, error }) => ({
  available: true,
  provider: 'fallback',
  source: 'fallback',
  fallback: true,
  deterministic: true,
  code: error.code,
  model: error.model || null,
  field,
  mode,
  suggestion,
  warning: fallbackWarning(error.code),
  warnings: [fallbackWarning(error.code)],
  referenceId: error.referenceId
});

const generatedDefault = (quotation, field, index) => {
  if (field === 'inclusions') {
    const factual = buildFactualInclusions(quotation);
    if (factual.length) return deterministicResult({ field, mode: 'generate', suggestion: factual, source: 'quotation' });
    const candidates = buildSafeInclusionCandidates(quotation);
    if (candidates.length) return deterministicResult({ field, mode: 'generate', suggestion: candidates, source: 'quotation' });
    return {
      available: false,
      code: 'NO_CONFIRMED_INCLUSIONS',
      reason: 'No confirmed services are available yet. Select a hotel, transport option, included activity, or add-on before generating factual inclusions.',
      field,
      mode: 'generate'
    };
  }
  if (field === 'exclusions') return deterministicResult({ field, mode: 'generate', suggestion: buildSafeExclusions(), source: 'quotation' });
  if (!FALLBACK_COPY_FIELDS.has(field)) return null;
  const suggestion = buildQuotationFieldFallback({ quotation, field, index });
  return isMeaningfulQuotationSuggestion(suggestion)
    ? deterministicResult({ field, mode: 'generate', suggestion, source: 'default' })
    : null;
};

export const generateQuotationFieldSuggestion = async ({ quotation = {}, field, index = 0, mode = 'generate', client = null }) => {
  if (!MODES.has(mode)) throw Object.assign(new Error('Unsupported AI action.'), { status: 422 });
  if (!Number.isInteger(index) || index < 0 || index > 60) throw Object.assign(new Error('Invalid item index.'), { status: 422 });
  const context = buildFieldContext(quotation, field, index);
  const missingReason = quotationFieldRequirement(quotation, field, index);
  if (missingReason) return { available: false, code: 'AI_CONTEXT_INSUFFICIENT', reason: missingReason, field, mode };

  if (mode === 'generate') {
    const smartDefault = generatedDefault(quotation, field, index);
    if (smartDefault) return smartDefault;
  }
  if (mode !== 'generate' && !context.current && field !== 'policies.all') throw Object.assign(new Error('Add text before improving or shortening it.'), { status: 422 });

  const safeFallback = buildQuotationFieldFallback({ quotation, field, index });
  try {
    const prompt = `Field: ${field}\nMode: ${mode}\nFacts: ${JSON.stringify(context)}`;
    const generated = await generateStructuredJson({
      action: field,
      purpose: 'quotation',
      contents: prompt,
      systemInstruction: SYSTEM_INSTRUCTION,
      responseJsonSchema: schemaForField(field),
      temperature: 0.2,
      maxOutputTokens: maxOutputTokensForQuotationField(field, context),
      timeoutMs: 15_000,
      client
    });
    const suggestion = normalizeGeneratedSuggestion(generated.data?.suggestion, field, context);
    const warnings = [];
    if (field === 'policies.all') {
      const defaults = context.policy.defaults;
      for (const key of POLICY_FIELDS) {
        const authority = key === 'paymentTerms' ? defaults[key] : (context.policy.current?.[key] || defaults[key]);
        if (!suggestion[key] || !sameNumbers(suggestion[key], authority)) {
          suggestion[key] = authority;
          warnings.push(`${key} used the protected policy wording because AI changed or omitted a protected term.`);
        }
      }
    } else if (field.startsWith('policies.')) {
      const key = field.split('.')[1];
      const authority = key === 'paymentTerms' ? context.policy.defaults[key] : (context.current || context.policy.defaults[key]);
      if (!suggestion || !sameNumbers(suggestion, authority)) {
        throw createAiOutputRejectedError('AI wording changed or omitted a protected policy term.', {
          model: generated.model,
          referenceId: generated.referenceId
        });
      }
    }
    const sourceNumbers = new Set(numbers(JSON.stringify(context)));
    const output = typeof suggestion === 'string' ? suggestion : JSON.stringify(suggestion);
    if (!field.startsWith('policies.') && numbers(output).some((token) => !sourceNumbers.has(token))) {
      throw createAiOutputRejectedError('AI wording introduced a number that was absent from the confirmed context.', {
        model: generated.model,
        referenceId: generated.referenceId
      });
    }
    if (!isMeaningfulQuotationSuggestion(suggestion)) return {
      available: false,
      code: 'AI_CONTEXT_INSUFFICIENT',
      reason: 'There is not enough confirmed information for this suggestion.',
      field,
      mode
    };
    return {
      available: true,
      provider: generated.provider,
      source: 'ai',
      model: generated.model,
      field,
      mode,
      suggestion,
      deterministic: false,
      fallback: false,
      warnings,
      usage: generated.usage,
      referenceId: generated.referenceId
    };
  } catch (error) {
    if (error?.code === 'AI_AUTH_FAILED') console.error(`[QuotationAI] configuration_error code=${error.code} referenceId=${error.referenceId}`);
    if (FALLBACK_ERROR_CODES.has(error?.code) && isMeaningfulQuotationSuggestion(safeFallback)) {
      return providerFallbackResult({ field, mode, suggestion: safeFallback, error });
    }
    throw error;
  }
};
