export const QUOTATION_V2_STEPS = Object.freeze([
  ['customer', 'Customer'],
  ['journey', 'Journey'],
  ['itinerary', 'Itinerary'],
  ['hotels', 'Hotels'],
  ['transport', 'Transportation'],
  ['activities', 'Activities'],
  ['attachments', 'Attachments'],
  ['inclusions', 'Inclusions & exclusions'],
  ['pricing', 'Pricing'],
  ['terms', 'Terms'],
  ['presentation', 'Presentation'],
  ['review', 'Review']
]);

const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const issue = (step, code, message) => ({ step, code, message });

export function validateQuotationV2Client(quotation = {}, { forFinalization = false, forShare = false } = {}) {
  const errors = [];
  const warnings = [];
  const customer = quotation.customerSnapshot || {};
  const journey = quotation.tripRequirements || {};
  const pricing = quotation.manualPricing || {};
  if (!String(customer.name || '').trim()) errors.push(issue('customer', 'CUSTOMER_NAME_REQUIRED', 'Customer name is required.'));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customer.email || ''))) errors.push(issue('customer', 'CUSTOMER_EMAIL_INVALID', 'Enter a valid customer email.'));
  if (String(customer.phone || '').replace(/\D/g, '').length < 10) errors.push(issue('customer', 'CUSTOMER_PHONE_INVALID', 'Enter a valid customer phone number.'));
  if (!String(journey.title || '').trim()) errors.push(issue('journey', 'TRIP_TITLE_REQUIRED', 'Trip title is required.'));
  if (!String(journey.destination || '').trim()) errors.push(issue('journey', 'DESTINATION_REQUIRED', 'Destination is required.'));
  if (journey.startDate && journey.endDate && new Date(journey.endDate) < new Date(journey.startDate)) errors.push(issue('journey', 'DATE_RANGE_INVALID', 'End date cannot be before start date.'));
  if (number(journey.adults) + number(journey.children) + number(journey.infants) <= 0) errors.push(issue('journey', 'TRAVELERS_REQUIRED', 'At least one traveler is required.'));
  (quotation.hotelOptions || []).forEach((hotel, index) => {
    if (hotel.checkIn && hotel.checkOut && new Date(hotel.checkOut) < new Date(hotel.checkIn)) errors.push(issue('hotels', 'HOTEL_DATE_RANGE_INVALID', `Hotel ${index + 1} has an invalid date range.`));
  });
  if (!quotation.itinerary?.length) warnings.push(issue('itinerary', 'NO_ITINERARY', 'No itinerary days have been added.'));
  if (!quotation.hotelOptions?.length) warnings.push(issue('hotels', 'NO_HOTELS', 'No hotels have been added.'));
  if (!quotation.transportOptions?.length) warnings.push(issue('transport', 'NO_TRANSPORT', 'No transportation has been added.'));
  if (!quotation.inclusions?.length) warnings.push(issue('inclusions', 'NO_INCLUSIONS', 'No inclusions have been added.'));
  if ((quotation.hotelOptions || []).some((item) => String(item.optionId || '').startsWith('ai_hotel_') && item.selected === true)) warnings.push(issue('hotels', 'AI_SUGGESTED_HOTEL_UNVERIFIED', 'Review availability, room allocation, meal plan, and supplier details for selected AI stay suggestions.'));
  if ((quotation.transportOptions || []).some((item) => String(item.optionId || '').startsWith('ai_transport_') && item.selected === true)) warnings.push(issue('transport', 'TRANSPORT_REQUIRES_REVIEW', 'Confirm provider, route, schedule, and price for selected AI transport suggestions.'));
  if ((quotation.activities || []).some((item) => String(item.activityId || '').startsWith('ai_act_') && item.selected === true)) warnings.push(issue('activities', 'ACTIVITY_REQUIRES_COMMERCIAL_REVIEW', 'Confirm inclusion and price for selected AI activity suggestions.'));
  const finalPrice = number(pricing.finalCustomerPrice);
  const deposit = number(pricing.depositAmount);
  if ((forFinalization || forShare) && finalPrice <= 0) errors.push(issue('pricing', 'FINAL_PRICE_REQUIRED', 'Admin must enter a final customer price.'));
  if (deposit > finalPrice && finalPrice > 0) errors.push(issue('pricing', 'DEPOSIT_EXCEEDS_TOTAL', 'Deposit cannot exceed the final price.'));
  const schedule = pricing.paymentSchedule || [];
  if ((pricing.adjustments || []).some((item) => number(item.amount) <= 0 || !String(item.label || '').trim())) errors.push(issue('pricing', 'PRICING_ADJUSTMENT_INVALID', 'Every commercial adjustment needs a label and positive amount.'));
  const scheduleTotal = schedule.reduce((sum, item) => sum + number(item.amount), 0);
  if (schedule.some((item) => !String(item.label || '').trim() || number(item.amount) <= 0)) errors.push(issue('pricing', 'PAYMENT_SCHEDULE_INVALID', 'Every payment milestone needs a label and positive amount.'));
  if (scheduleTotal && finalPrice && Math.abs(scheduleTotal - finalPrice) > 1) errors.push(issue('pricing', 'PAYMENT_SCHEDULE_TOTAL_INVALID', 'Payment milestones must equal the final price.'));
  if (forShare && !pricing.finalizedAt) errors.push(issue('pricing', 'PRICING_NOT_FINALIZED', 'Pricing must be finalized before sharing.'));
  return { errors, warnings, ready: errors.length === 0, sectionsComplete: 12 - new Set(errors.map((item) => item.step)).size };
}

export const formatQuotationCurrency = (value, currency = 'INR') => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency, maximumFractionDigits: 0
}).format(number(value));

export const formatQuotationV2Date = (value) => {
  if (!value) return 'To be confirmed';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'To be confirmed' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const getPublicPricing = (quotation) => quotation?.pricing?.finalCustomerPrice !== undefined
  ? quotation.pricing
  : quotation?.manualPricing || {};

const PDF_TEMPLATE_NAMES = { signature_luxe: 'Signature-Luxe', journey: 'Journey-Journal', minimal: 'Expedition-Dossier' };

export const quotationPdfFileName = (quotation, templateKey) => {
  const numberValue = String(quotation?.quotationNumber || 'quotation').replace(/[^a-z0-9_-]/gi, '-');
  const version = quotation?.version || 1;
  const template = templateKey ? `_${PDF_TEMPLATE_NAMES[templateKey] || String(templateKey).replace(/[^a-z0-9_-]/gi, '-')}` : '';
  return `WanderLuxe_${numberValue}_v${version}${template}.pdf`;
};
