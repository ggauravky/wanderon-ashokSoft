const asText = (value) => (
  typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : ''
);

const asTravelerCount = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
};

const normalizeExactDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = asText(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  if (!match) return '';
  const normalized = `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === normalized
    ? normalized
    : '';
};

const normalizeBudgetReference = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : '';
  const text = asText(value).replaceAll(',', '');
  const match = text.match(/\d+(?:\.\d+)?/);
  if (!match) return '';
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : '';
};

const getTravelerBreakdown = (lead) => {
  const sourceItinerary = lead?.sourceItineraryId;
  const plannerContext = sourceItinerary && typeof sourceItinerary === 'object'
    ? sourceItinerary.plannerContext
    : lead?.plannerContext;
  const breakdown = plannerContext?.travelersBreakdown;
  if (!breakdown || typeof breakdown !== 'object' || Array.isArray(breakdown)) return null;

  const normalized = {
    adults: asTravelerCount(breakdown.adults),
    children: asTravelerCount(breakdown.children),
    infants: asTravelerCount(breakdown.infants),
    seniors: asTravelerCount(breakdown.seniors)
  };
  const total = Object.values(normalized).reduce((sum, count) => sum + count, 0);
  return total > 0 ? normalized : null;
};

const getSelectedBatchText = (value) => {
  if (!value) return '';
  if (typeof value === 'object') {
    return asText(value.label || value.title || value.name || value.startDate);
  }
  return asText(value);
};

export const getReferenceId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return value._id || value.id || null;
  return null;
};

export const leadDraft = (lead, blankDraft) => {
  const draft = blankDraft;
  if (!draft?.tripRequirements || !draft?.customerSnapshot) {
    throw new TypeError('A blank Quotation V2 draft is required.');
  }
  if (!lead || typeof lead !== 'object') return draft;

  draft.leadId = getReferenceId(lead._id) || getReferenceId(lead.id);
  draft.sourceItineraryId = getReferenceId(lead.sourceItineraryId);
  draft.customerSnapshot = {
    name: asText(lead.name),
    email: asText(lead.email),
    phone: asText(lead.phone),
    city: asText(lead.city),
    notes: asText(lead.message || lead.notes)
  };

  const destination = asText(lead.destination);
  draft.tripRequirements.title = asText(lead.tripTitle || lead.tripTitleSnapshot)
    || (destination ? `${destination} journey` : '');
  draft.tripRequirements.destination = destination;

  const travelerBreakdown = getTravelerBreakdown(lead);
  if (travelerBreakdown) {
    Object.assign(draft.tripRequirements, travelerBreakdown);
  } else {
    draft.tripRequirements.adults = Math.max(1, asTravelerCount(lead.travelersCount, 1));
    draft.tripRequirements.children = 0;
    draft.tripRequirements.infants = 0;
    draft.tripRequirements.seniors = 0;
  }
  draft.tripRequirements.totalTravelers = Math.max(
    1,
    draft.tripRequirements.adults
      + draft.tripRequirements.children
      + draft.tripRequirements.infants
      + draft.tripRequirements.seniors
  );

  const exactTravelDate = normalizeExactDate(lead.travelDate);
  if (exactTravelDate) {
    draft.tripRequirements.startDate = exactTravelDate;
  } else {
    const flexibleMonth = asText(lead.travelMonth);
    if (flexibleMonth) {
      draft.tripRequirements.datesFlexible = true;
      draft.tripRequirements.flexibleMonth = flexibleMonth;
    }
  }

  draft.tripRequirements.budgetPerPerson = normalizeBudgetReference(lead.budgetPerPerson);
  const selectedBatch = getSelectedBatchText(lead.selectedBatch);
  const tripSpecificRequest = asText(lead.specialRequests || lead.tripRequirements?.specialRequests);
  draft.tripRequirements.specialRequests = [
    selectedBatch ? `Selected batch: ${selectedBatch}` : '',
    tripSpecificRequest
  ].filter(Boolean).join('\n');

  return draft;
};
