export const SMART_IMPORT_SOURCES = Object.freeze([
  'LEAD_LINKED_ITINERARY', 'SAVED_ITINERARY', 'SHARED_ITINERARY',
  'JSON_UPLOAD', 'PASTED_ITINERARY', 'DEMO_SAMPLE'
]);

export const resolveDefaultImportSource = ({ initialItineraryId, linkedLeadId } = {}) => (
  initialItineraryId ? 'SAVED_ITINERARY' : linkedLeadId ? 'LEAD_LINKED_ITINERARY' : 'PASTED_ITINERARY'
);

export const parseStructuredItineraryText = (value) => {
  const text = String(value || '').trim();
  if (!text) throw new Error('Paste structured itinerary JSON first.');
  if (new TextEncoder().encode(text).length > 1024 * 1024) throw new Error('Itinerary JSON must be 1 MB or smaller.');
  try {
    return JSON.parse(text);
  } catch (error) {
    const position = String(error?.message || '').match(/position\s+(\d+)/i)?.[1];
    throw new Error(position ? `Invalid JSON near position ${position}.` : 'Invalid JSON. Check the copied plan and try again.');
  }
};

export const buildQuotationReadyExport = (itinerary = {}, plannerContext = {}) => {
  const { _id, id, user, userEmail, shareToken, isPublic, ...safeItinerary } = itinerary || {};
  void _id; void id; void user; void userEmail; void shareToken; void isPublic;
  return {
    schema: 'wanderluxe-ai-itinerary', schemaVersion: 1,
    exportedAt: new Date().toISOString(), itinerary: safeItinerary,
    plannerContext: itinerary?.plannerContext || plannerContext || {}
  };
};

export const quotationAiPrerequisite = (quotation = {}, field, index = 0) => {
  const item = field.startsWith('hotel.') ? quotation.hotelOptions?.[index]
    : field.startsWith('transport.') ? quotation.transportOptions?.[index]
      : field.startsWith('activity.') ? quotation.activities?.[index]
        : field.startsWith('addon.') ? quotation.addOns?.[index]
          : field.startsWith('itinerary.') ? quotation.itinerary?.[index] : null;
  if (field === 'journey.title' || field === 'journey.personalNote') return quotation.tripRequirements?.destination ? '' : 'Add the destination first.';
  if (field.startsWith('hotel.')) return item?.hotelName || item?.label ? '' : 'Add the hotel name first.';
  if (field.startsWith('transport.')) return item?.title || item?.vehicle || item?.mode || item?.type || item?.pickup || item?.drop || item?.route?.from || item?.route?.to ? '' : 'Add a transport title, mode, or route first.';
  if (field.startsWith('activity.')) return item?.name ? '' : 'Add the activity name first.';
  if (field.startsWith('addon.')) return item?.name ? '' : 'Add the add-on name first.';
  if (field.startsWith('itinerary.') && field !== 'itinerary.missingDescriptions') return item?.title || item?.destination || item?.locationName || item?.morning || item?.afternoon || item?.evening ? '' : 'Add a day title, location, or activity first.';
  return '';
};

export const selectMissingCopyFields = (quotation = {}) => [
  !quotation.tripRequirements?.title && 'journeyTitle',
  !quotation.personalNote && 'personalNote',
  (quotation.itinerary || []).some((day) => !day.description) && 'dayDescriptions',
  (quotation.hotelOptions || []).some((item) => !item.notes) && 'hotelNotes',
  (quotation.transportOptions || []).some((item) => !item.notes) && 'transportNotes',
  (quotation.activities || []).some((item) => !item.description) && 'activityDescriptions',
  !(quotation.inclusions || []).length && 'inclusions',
  !(quotation.exclusions || []).length && 'exclusions',
  Object.values(quotation.policies || {}).some((value) => !value) && 'policies'
].filter(Boolean);
