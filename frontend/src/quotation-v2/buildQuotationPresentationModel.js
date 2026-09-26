const numeric = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const text = (value) => typeof value === 'string' ? value.trim() : '';
const list = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const unique = (items) => [...new Set(items.map(text).filter(Boolean))];
const httpsUrl = (value) => {
  try {
    const url = new URL(text(value));
    return url.protocol === 'https:' ? url.href : '';
  } catch { return ''; }
};
const mediaItem = (value, fallback = '') => {
  const item = typeof value === 'string' ? { url: value } : value || {};
  const url = text(item.url || item.secureUrl || item.imageUrl || item.src);
  return url ? { url, altText: text(item.altText || item.alt || fallback), caption: text(item.caption), isPrimary: item.isPrimary === true || item.primary === true } : null;
};
const mediaList = (items, fallback = '') => list(items).map((item) => mediaItem(item, fallback)).filter(Boolean)
  .filter((item, index, all) => all.findIndex((candidate) => candidate.url === item.url) === index);
const isAiCandidate = (item, type) => item?.sourceKind === 'AI_PLANNER'
  || (type === 'hotel' && String(item?.optionId || '').startsWith('ai_hotel_'))
  || (type === 'transport' && String(item?.optionId || '').startsWith('ai_transport_'))
  || (type === 'activity' && String(item?.activityId || '').startsWith('ai_act_'));
const travelerLabel = (travelers) => [
  ['Adult', travelers.adults], ['Child', travelers.children], ['Infant', travelers.infants], ['Senior', travelers.seniors]
].filter(([, count]) => count > 0).map(([label, count]) => `${count} ${label}${count === 1 ? '' : label === 'Child' ? 'ren' : 's'}`).join(' · ');

const attachmentAllowed = (attachment, { approved, booked }) => {
  const visibility = attachment?.visibility || 'INTERNAL_ONLY';
  if (visibility === 'CUSTOMER_VISIBLE') return true;
  if (visibility === 'CUSTOMER_VISIBLE_AFTER_APPROVAL') return approved;
  if (visibility === 'CUSTOMER_VISIBLE_AFTER_BOOKING') return booked;
  return false;
};

const safeAttachment = (item = {}, relation = null) => ({
  id: item.id || item._id || '',
  category: text(item.category),
  documentType: text(item.type || item.documentType || item.category) || 'Travel document',
  title: text(item.title || item.fileName) || 'Travel document',
  fileName: text(item.fileName),
  mimeType: text(item.mimeType),
  secureUrl: httpsUrl(item.secureUrl),
  bookingReference: text(item.bookingReference),
  passengerName: text(item.passengerName),
  visibility: text(item.visibility),
  relation
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
  heroImage: mediaList(item.gallery, item.hotelName).find((media) => media.isPrimary)
    || mediaItem(item.imageUrl, item.hotelName)
    || mediaList(item.gallery, item.hotelName)[0] || null,
  gallery: mediaList(item.gallery, item.hotelName),
  amenities: list(item.amenities).map(text).filter(Boolean),
  notes: text(item.customerNotes || item.description),
  recommendationType: text(item.recommendationType),
  selected: item.selected === true,
  documents: []
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
  reference: text(item.reference?.bookingReference || item.reference?.pnr || item.reference?.flightNumber || item.reference?.trainNumber || item.reference?.busNumber || item.reference),
  cabinClass: text(item.cabinClass),
  seatDetails: text(item.seatDetails?.seatNumber || item.seatDetails),
  baggage: text(item.baggage?.cabin || item.baggage?.checkIn || item.baggage),
  notes: text(item.customerNotes),
  selected: item.selected !== false,
  media: mediaList(item.vehicleMedia, item.vehicle || item.title),
  documents: []
});

const priority = (item) => item.selected ? 0 : /recommend/i.test(item.recommendationType || item.label) ? 1 : 2;

export function buildQuotationPresentationModel(quotation = {}, options = {}) {
  const settings = {
    showComponentPrices: quotation.presentationSettings?.showComponentPrices === true,
    showPaymentSchedule: quotation.presentationSettings?.showPaymentSchedule !== false,
    showAttachments: quotation.presentationSettings?.showAttachments !== false,
    showAdvisor: quotation.presentationSettings?.showAdvisor !== false,
    showTerms: quotation.presentationSettings?.showTerms !== false,
    showItineraryGallery: quotation.presentationSettings?.showItineraryGallery !== false,
    showTripPreferences: quotation.presentationSettings?.showTripPreferences === true
  };
  const pricingSource = quotation.pricing?.finalCustomerPrice !== undefined ? quotation.pricing : (quotation.manualPricing || {});
  const status = text(options.status || quotation.status || quotation.commercialState || 'DRAFT').toUpperCase();
  const booked = ['BOOKED', 'CONVERTED'].includes(status) || Boolean(quotation.bookingId || quotation.booked);
  // Booking is downstream of approval. Treating the states as mutually exclusive
  // made AFTER_APPROVAL documents disappear from an otherwise valid booked PDF.
  const approved = booked || status === 'APPROVED' || Boolean(quotation.approval?.approvedAt);
  const itinerary = list(quotation.itinerary).map(safeItinerary);
  const rawHotels = list(quotation.hotelOptions).filter((item) => !(isAiCandidate(item, 'hotel') && item.selected !== true));
  const rawTransport = list(quotation.transportOptions).filter((item) => !(isAiCandidate(item, 'transport') && item.selected !== true));
  const hotels = rawHotels.map(safeHotel).sort((a, b) => priority(a) - priority(b));
  const transport = rawTransport.map(safeTransport).sort((a, b) => Number(b.selected) - Number(a.selected));
  const activities = list(quotation.activities).filter((item) => !(isAiCandidate(item, 'activity') && item.selected !== true)).map((item, index) => ({
    id: item.activityId || String(index), dayNumber: numeric(item.dayNumber), date: item.date || '', name: text(item.name),
    description: text(item.description), location: text(item.location), selected: item.selected !== false,
    optional: item.isOptional === true
  })).filter((item) => item.name);
  const addOns = list(quotation.addOns).filter((item) => item.selected === true).map((item, index) => ({
    id: item.addonId || String(index), name: text(item.name), description: text(item.description), category: text(item.category),
    selected: item.selected === true
  })).filter((item) => item.name);
  const routeStops = unique(itinerary.map((day) => day.destination));
  const images = unique([
    text(quotation.tripRequirements?.coverImage),
    ...itinerary.flatMap((day) => [day.coverMedia?.url, ...day.galleryMedia.map((media) => media.url)]),
    ...[...hotels].sort((a, b) => Number(b.selected) - Number(a.selected)).map((hotel) => hotel.heroImage?.url),
    ...transport.flatMap((item) => item.media.map((media) => media.url))
  ]);
  const totalTravelers = numeric(quotation.tripRequirements?.totalTravelers)
    || numeric(quotation.tripRequirements?.adults) + numeric(quotation.tripRequirements?.children) + numeric(quotation.tripRequirements?.infants) + numeric(quotation.tripRequirements?.seniors)
    || 1;
  const travelerCounts = {
    adults: numeric(quotation.tripRequirements?.adults), children: numeric(quotation.tripRequirements?.children),
    infants: numeric(quotation.tripRequirements?.infants), seniors: numeric(quotation.tripRequirements?.seniors), total: totalTravelers
  };
  const dateLabel = quotation.tripRequirements?.datesFlexible === true
    ? [text(quotation.tripRequirements?.flexibleMonth), 'Flexible dates'].filter(Boolean).join(' · ')
    : '';
  const finalCustomerPrice = numeric(pricingSource.finalCustomerPrice);
  const depositAmount = numeric(pricingSource.depositAmount);
  const visibility = { approved, booked };
  const generalAttachments = [];
  const allCustomerDocuments = [];
  const seenDocuments = new Set();
  const addDocument = (item, relation, target) => {
    if (!settings.showAttachments || !attachmentAllowed(item, visibility)) return;
    const safe = safeAttachment(item, relation);
    if (!safe.secureUrl) return;
    const key = safe.id || safe.secureUrl;
    if (seenDocuments.has(key)) return;
    seenDocuments.add(key);
    target.push(safe);
    allCustomerDocuments.push(safe);
  };
  rawHotels.forEach((item) => {
    const hotel = hotels.find((entry) => entry.id === (item.optionId || String(rawHotels.indexOf(item))));
    if (!hotel) return;
    list(item.documents).forEach((document) => addDocument(document, { kind: 'hotel', id: hotel.id, name: hotel.hotelName, city: hotel.city, checkIn: hotel.checkIn, checkOut: hotel.checkOut }, hotel.documents));
  });
  rawTransport.forEach((item) => {
    const segment = transport.find((entry) => entry.id === (item.optionId || String(rawTransport.indexOf(item))));
    if (!segment) return;
    list(item.documents).forEach((document) => addDocument(document, { kind: 'transport', id: segment.id, name: segment.title, route: [segment.pickup, segment.drop].filter(Boolean).join(' to '), schedule: segment.schedule }, segment.documents));
  });
  list(quotation.attachments).forEach((document) => {
    const hotel = document.sectionType === 'HOTEL' && hotels.find((item) => item.id === document.sectionId);
    const segment = document.sectionType === 'TRANSPORT' && transport.find((item) => item.id === document.sectionId);
    const relation = hotel ? { kind: 'hotel', id: hotel.id, name: hotel.hotelName, city: hotel.city, checkIn: hotel.checkIn, checkOut: hotel.checkOut }
      : segment ? { kind: 'transport', id: segment.id, name: segment.title, route: [segment.pickup, segment.drop].filter(Boolean).join(' to '), schedule: segment.schedule }
        : null;
    addDocument(document, relation, hotel?.documents || segment?.documents || generalAttachments);
  });
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
      origin: text(quotation.tripRequirements?.origin),
      startDate: quotation.tripRequirements?.startDate || '',
      endDate: quotation.tripRequirements?.endDate || '',
      datesFlexible: quotation.tripRequirements?.datesFlexible === true,
      flexibleMonth: text(quotation.tripRequirements?.flexibleMonth),
      duration: text(quotation.tripRequirements?.duration) || `${numeric(quotation.tripRequirements?.days) || itinerary.length} days`,
      days: numeric(quotation.tripRequirements?.days) || itinerary.length,
      nights: numeric(quotation.tripRequirements?.nights),
      travelStyle: text(quotation.tripRequirements?.travelStyle),
      travelers: {
        ...travelerCounts,
        label: travelerLabel(travelerCounts)
      },
      dateLabel,
      routeStops,
      specialRequests: text(quotation.tripRequirements?.specialRequests),
      personalNote: text(quotation.personalNote),
      coverImage: images[0] || '',
      secondaryImages: images.slice(1, 5),
      highlights
    },
    preferences: settings.showTripPreferences ? {
      interests: list(quotation.tripPreferences?.interests).map(text).filter(Boolean),
      stayPreference: text(quotation.tripPreferences?.stayPreference),
      dietaryPreference: text(quotation.tripPreferences?.dietaryPreference)
    } : null,
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
      paymentTerms: text(quotation.policies?.paymentTerms), cancellationPolicy: text(quotation.policies?.cancellationPolicy || list(quotation.cancellationPolicy).map(text).filter(Boolean).join('\n')),
      refundNotes: text(quotation.policies?.refundNotes), travelRequirements: text(quotation.policies?.travelRequirements),
      importantInformation: text(quotation.policies?.importantInformation), termsAndConditions: text(quotation.policies?.termsAndConditions || list(quotation.termsAndConditions).map(text).filter(Boolean).join('\n'))
    } : {},
    generalAttachments,
    allCustomerDocuments,
    attachments: allCustomerDocuments,
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
