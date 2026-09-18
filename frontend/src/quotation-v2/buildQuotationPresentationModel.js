const numeric = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const text = (value) => typeof value === 'string' ? value.trim() : '';
const list = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const unique = (items) => [...new Set(items.map(text).filter(Boolean))];

const attachmentAllowed = (attachment, { approved, booked }) => {
  const visibility = attachment?.visibility || 'INTERNAL_ONLY';
  if (visibility === 'CUSTOMER_VISIBLE') return true;
  if (visibility === 'CUSTOMER_VISIBLE_AFTER_APPROVAL') return approved;
  if (visibility === 'CUSTOMER_VISIBLE_AFTER_BOOKING') return booked;
  return false;
};

const safeAttachment = (item = {}) => ({
  id: item.id || item._id || '',
  category: text(item.category),
  title: text(item.title || item.fileName) || 'Travel document',
  fileName: text(item.fileName),
  mimeType: text(item.mimeType),
  secureUrl: text(item.secureUrl)
});

const safeItinerary = (item = {}, index) => ({
  day: numeric(item.day) || index + 1,
  date: item.date || '',
  title: text(item.title) || `Day ${index + 1}`,
  destination: text(item.destination || item.locationName),
  description: text(item.description),
  morning: text(item.morning),
  afternoon: text(item.afternoon),
  evening: text(item.evening),
  stay: text(item.stay),
  mealsIncluded: list(item.mealsIncluded).map(text).filter(Boolean),
  transferDetails: text(item.transferDetails),
  activityHighlights: list(item.activityHighlights).map(text).filter(Boolean),
  coverMedia: item.coverMedia?.url ? {
    url: text(item.coverMedia.url),
    altText: text(item.coverMedia.altText || item.title || item.locationName),
    caption: text(item.coverMedia.caption)
  } : null,
  galleryMedia: list(item.galleryMedia).map((media) => ({ url: text(media.url), altText: text(media.altText), caption: text(media.caption) })).filter((media) => media.url)
});

const safeHotel = (item = {}, index) => ({
  id: item.optionId || String(index),
  label: text(item.label),
  hotelName: text(item.hotelName || item.label) || `Stay option ${index + 1}`,
  city: text(item.city || item.location),
  category: text(item.category || item.tier),
  roomType: text(item.roomType),
  rooms: numeric(item.rooms),
  occupancy: text(item.occupancy),
  mealPlan: text(item.mealPlan),
  checkIn: item.checkIn || '',
  checkOut: item.checkOut || '',
  nights: numeric(item.nights),
  imageUrl: text(item.imageUrl),
  amenities: list(item.amenities).map(text).filter(Boolean),
  notes: text(item.customerNotes || item.description),
  recommendationType: text(item.recommendationType),
  selected: item.selected === true
});

const safeTransport = (item = {}, index) => ({
  id: item.optionId || String(index),
  mode: text(item.mode || item.type || 'OTHER'),
  title: text(item.title || item.vehicle || item.mode || item.type) || `Transport option ${index + 1}`,
  vehicle: text(item.vehicle),
  pickup: text(item.pickup || item.route?.from),
  drop: text(item.drop || item.route?.to),
  schedule: {
    departureDate: item.schedule?.departureDate || item.startDate || '',
    departureTime: text(item.schedule?.departureTime),
    arrivalDate: item.schedule?.arrivalDate || item.endDate || '',
    arrivalTime: text(item.schedule?.arrivalTime)
  },
  reference: text(item.reference),
  cabinClass: text(item.cabinClass),
  seatDetails: text(item.seatDetails),
  baggage: text(item.baggage),
  notes: text(item.customerNotes),
  selected: item.selected !== false,
  vehicleMedia: list(item.vehicleMedia).map((media) => ({ url: text(media.url || media.secureUrl), altText: text(media.altText || item.vehicle) })).filter((media) => media.url)
});

const priority = (item) => item.selected ? 0 : /recommend/i.test(item.recommendationType || item.label) ? 1 : 2;

export function buildQuotationPresentationModel(quotation = {}, options = {}) {
  const settings = {
    showComponentPrices: quotation.presentationSettings?.showComponentPrices === true,
    showPaymentSchedule: quotation.presentationSettings?.showPaymentSchedule !== false,
    showAttachments: quotation.presentationSettings?.showAttachments !== false,
    showAdvisor: quotation.presentationSettings?.showAdvisor !== false,
    showTerms: quotation.presentationSettings?.showTerms !== false,
    showItineraryGallery: quotation.presentationSettings?.showItineraryGallery !== false
  };
  const pricingSource = quotation.pricing?.finalCustomerPrice !== undefined ? quotation.pricing : (quotation.manualPricing || {});
  const status = text(options.status || quotation.status || quotation.commercialState || 'DRAFT').toUpperCase();
  const approved = status === 'APPROVED' || Boolean(quotation.approval?.approvedAt);
  const booked = status === 'CONVERTED' || Boolean(quotation.bookingId);
  const itinerary = list(quotation.itinerary).map(safeItinerary);
  const hotels = list(quotation.hotelOptions).map(safeHotel).sort((a, b) => priority(a) - priority(b));
  const transport = list(quotation.transportOptions).map(safeTransport).sort((a, b) => Number(b.selected) - Number(a.selected));
  const activities = list(quotation.activities).map((item, index) => ({
    id: item.activityId || String(index), dayNumber: numeric(item.dayNumber), date: item.date || '', name: text(item.name),
    description: text(item.description), location: text(item.location), selected: item.selected !== false,
    optional: item.isOptional === true
  })).filter((item) => item.name);
  const addOns = list(quotation.addOns).map((item, index) => ({
    id: item.addonId || String(index), name: text(item.name), description: text(item.description), category: text(item.category),
    selected: item.selected === true
  })).filter((item) => item.name);
  const routeStops = unique(itinerary.map((day) => day.destination));
  const images = unique([
    text(quotation.tripRequirements?.coverImage),
    ...itinerary.flatMap((day) => [day.coverMedia?.url, ...day.galleryMedia.map((media) => media.url)]),
    ...[...hotels].sort((a, b) => Number(b.selected) - Number(a.selected)).map((hotel) => hotel.imageUrl),
    ...transport.flatMap((item) => item.vehicleMedia.map((media) => media.url))
  ]);
  const totalTravelers = numeric(quotation.tripRequirements?.totalTravelers)
    || numeric(quotation.tripRequirements?.adults) + numeric(quotation.tripRequirements?.children) + numeric(quotation.tripRequirements?.infants)
    || 1;
  const finalCustomerPrice = numeric(pricingSource.finalCustomerPrice);
  const depositAmount = numeric(pricingSource.depositAmount);
  const visibility = { approved, booked };
  const topLevelAttachments = settings.showAttachments
    ? list(quotation.attachments).filter((item) => attachmentAllowed(item, visibility)).map(safeAttachment)
    : [];
  const nestedAttachments = settings.showAttachments
    ? [
      ...list(quotation.hotelOptions).flatMap((item) => list(item.documents)),
      ...list(quotation.transportOptions).flatMap((item) => list(item.documents))
    ].filter((item) => attachmentAllowed(item, visibility)).map(safeAttachment)
    : [];
  const highlights = unique([
    ...activities.filter((item) => item.selected).map((item) => item.name),
    ...itinerary.flatMap((day) => day.activityHighlights),
    ...addOns.filter((item) => item.selected).map((item) => item.name)
  ]).slice(0, 6);
  const customerVisibleComponents = settings.showComponentPrices ? [
    ['Stays', list(quotation.hotelOptions).filter((item) => item.selected === true).reduce((sum, item) => sum + numeric(item.totalPrice || item.pricePerNight), 0)],
    ['Transport', list(quotation.transportOptions).filter((item) => item.selected !== false).reduce((sum, item) => sum + numeric(item.totalPrice || item.unitPrice), 0)],
    ['Activities', list(quotation.activities).filter((item) => item.selected !== false).reduce((sum, item) => sum + numeric(item.totalPrice || item.unitPrice), 0)],
    ['Add-ons', list(quotation.addOns).filter((item) => item.selected === true).reduce((sum, item) => sum + numeric(item.totalPrice || item.unitPrice), 0)]
  ].filter(([, amount]) => amount > 0) : [];

  return {
    meta: {
      quotationNumber: text(quotation.quotationNumber) || 'Private proposal',
      version: numeric(quotation.version) || 1,
      status,
      validUntil: quotation.validUntil || '',
      issuedAt: quotation.finalizedAt || quotation.manualPricing?.finalizedAt || quotation.createdAt || '',
      isDraft: options.isDraft ?? (!quotation.manualPricing?.finalizedAt && !quotation.pricing?.finalCustomerPrice),
      isApproved: approved,
      isSuperseded: Boolean(options.isSuperseded ?? quotation.superseded)
    },
    customer: {
      name: text(quotation.customerSnapshot?.name) || 'Traveler',
      email: text(quotation.customerSnapshot?.email),
      phone: text(quotation.customerSnapshot?.phone),
      city: text(quotation.customerSnapshot?.city)
    },
    journey: {
      title: text(quotation.tripRequirements?.title) || 'A thoughtfully composed journey',
      destination: text(quotation.tripRequirements?.destination),
      startDate: quotation.tripRequirements?.startDate || '',
      endDate: quotation.tripRequirements?.endDate || '',
      duration: text(quotation.tripRequirements?.duration) || `${numeric(quotation.tripRequirements?.days) || itinerary.length} days`,
      days: numeric(quotation.tripRequirements?.days) || itinerary.length,
      nights: numeric(quotation.tripRequirements?.nights),
      travelStyle: text(quotation.tripRequirements?.travelStyle),
      travelers: {
        adults: numeric(quotation.tripRequirements?.adults), children: numeric(quotation.tripRequirements?.children),
        infants: numeric(quotation.tripRequirements?.infants), total: totalTravelers
      },
      routeStops,
      specialRequests: text(quotation.tripRequirements?.specialRequests),
      personalNote: text(quotation.personalNote),
      coverImage: images[0] || '',
      secondaryImages: images.slice(1, 5),
      highlights
    },
    itinerary,
    hotels,
    transport,
    activities,
    addOns,
    pricing: {
      currency: text(pricingSource.currency) || 'INR', finalCustomerPrice, depositAmount,
      balanceAmount: numeric(pricingSource.balanceAmount) || Math.max(0, finalCustomerPrice - depositAmount),
      paymentSchedule: settings.showPaymentSchedule ? list(pricingSource.paymentSchedule).map((item) => ({
        label: text(item.label), amount: numeric(item.amount), dueDate: item.dueDate || '', notes: text(item.notes)
      })).filter((item) => item.label && item.amount > 0) : [],
      priceNotes: text(pricingSource.priceNotes), customerVisibleComponents
    },
    inclusions: list(quotation.inclusions).map(text).filter(Boolean),
    exclusions: list(quotation.exclusions).map(text).filter(Boolean),
    policies: settings.showTerms ? {
      paymentTerms: text(quotation.policies?.paymentTerms), cancellationPolicy: text(quotation.policies?.cancellationPolicy),
      refundNotes: text(quotation.policies?.refundNotes), travelRequirements: text(quotation.policies?.travelRequirements),
      importantInformation: text(quotation.policies?.importantInformation), termsAndConditions: text(quotation.policies?.termsAndConditions),
      legacyTerms: list(quotation.termsAndConditions).map(text).filter(Boolean),
      legacyCancellation: list(quotation.cancellationPolicy).map(text).filter(Boolean)
    } : {},
    attachments: [...new Map([...topLevelAttachments, ...nestedAttachments].map((item) => [item.id || item.secureUrl, item])).values()],
    advisor: settings.showAdvisor ? {
      name: text(quotation.advisor?.name || quotation.assignedToSnapshot?.name),
      email: text(quotation.advisor?.email || quotation.assignedToSnapshot?.email),
      phone: text(quotation.advisor?.phone || quotation.assignedToSnapshot?.phone)
    } : null,
    approval: quotation.approval ? {
      method: text(quotation.approval.method), approvedAt: quotation.approval.approvedAt || '',
      approvedByName: text(quotation.approval.approvedByName)
    } : null,
    settings
  };
}
