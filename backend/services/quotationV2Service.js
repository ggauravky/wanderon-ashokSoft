import crypto from 'node:crypto';
import QuotationEvent from '../models/QuotationEvent.js';
import { getJwtSecret } from '../config/environment.js';
import { QUOTATION_ATTACHMENT_VISIBILITIES } from '../constants/quotationAttachments.js';
import { normalizeQuotationPolicies } from '../config/quotationPolicyPresets.js';

export const V2_TEMPLATES = Object.freeze(['minimal', 'journey', 'signature_luxe']);
export const ATTACHMENT_VISIBILITIES = QUOTATION_ATTACHMENT_VISIBILITIES;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const deepClone = (value) => JSON.parse(JSON.stringify(value ?? null));
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const validDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isAiPlannerCandidate = (item = {}, type = '') => item.sourceKind === 'AI_PLANNER'
  || (type === 'hotel' && String(item.optionId || '').startsWith('ai_hotel_'))
  || (type === 'transport' && String(item.optionId || '').startsWith('ai_transport_'))
  || (type === 'activity' && String(item.activityId || '').startsWith('ai_act_'));

export const isReviewedAiCandidate = (item = {}, type = '') => !isAiPlannerCandidate(item, type)
  || item.reviewStatus === 'REVIEWED';

export const isCommercialAdmin = (user) => ['admin', 'super_admin'].includes(String(user?.role || '').toLowerCase());
export const secureToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
export const tokenHash = (token) => crypto.createHash('sha256').update(String(token || '')).digest('hex');
export const verificationCode = () => String(crypto.randomInt(100000, 1000000));
export const verificationHash = (code) => crypto.createHmac('sha256', getJwtSecret()).update(String(code)).digest('hex');

export const calculateComponentReference = (quotation = {}) => {
  const hotel = (quotation.hotelOptions || [])
    .filter((item) => item.selected !== false)
    .reduce((sum, item) => sum + number(item.totalPrice || (number(item.pricePerNight) * Math.max(1, number(item.nights)) * Math.max(1, number(item.rooms)))), 0);
  const transport = (quotation.transportOptions || [])
    .filter((item) => item.selected !== false)
    .reduce((sum, item) => sum + number(item.totalPrice || (number(item.unitPrice) * Math.max(1, number(item.quantity)))), 0);
  const activities = (quotation.activities || [])
    .filter((item) => item.selected !== false && item.isIncluded !== false)
    .reduce((sum, item) => sum + number(item.totalPrice || (number(item.unitPrice) * Math.max(1, number(item.quantity)))), 0);
  const addOns = (quotation.addOns || [])
    .filter((item) => item.selected === true)
    .reduce((sum, item) => sum + number(item.totalPrice || (number(item.unitPrice) * Math.max(1, number(item.quantity)))), 0);
  return Math.round(hotel + transport + activities + addOns);
};

const issue = (step, code, message) => ({ step, code, message });

export const validateQuotationV2 = (quotation = {}, { forFinalization = false, forShare = false, requireCandidateReview = false } = {}) => {
  const errors = [];
  const warnings = [];
  const customer = quotation.customerSnapshot || {};
  const journey = quotation.tripRequirements || {};
  const pricing = quotation.manualPricing || {};

  if (!String(customer.name || '').trim()) errors.push(issue('customer', 'CUSTOMER_NAME_REQUIRED', 'Customer name is required.'));
  if (!EMAIL_PATTERN.test(String(customer.email || '').trim())) errors.push(issue('customer', 'CUSTOMER_EMAIL_INVALID', 'A valid customer email is required.'));
  if (String(customer.phone || '').replace(/\D/g, '').length < 10) errors.push(issue('customer', 'CUSTOMER_PHONE_INVALID', 'A valid customer phone number is required.'));
  if (!String(journey.title || '').trim()) errors.push(issue('journey', 'TRIP_TITLE_REQUIRED', 'Trip title is required.'));
  if (!String(journey.destination || '').trim()) errors.push(issue('journey', 'DESTINATION_REQUIRED', 'Destination is required.'));

  const start = validDate(journey.startDate);
  const end = validDate(journey.endDate);
  if (start && end && end < start) errors.push(issue('journey', 'DATE_RANGE_INVALID', 'Journey end date cannot be before the start date.'));
  const travelers = number(journey.adults) + number(journey.children) + number(journey.infants) + number(journey.seniors);
  if (travelers <= 0) errors.push(issue('journey', 'TRAVELERS_REQUIRED', 'At least one traveler is required.'));

  (quotation.hotelOptions || []).forEach((hotel, index) => {
    const checkIn = validDate(hotel.checkIn);
    const checkOut = validDate(hotel.checkOut);
    if (checkIn && checkOut && checkOut < checkIn) {
      errors.push(issue('hotels', 'HOTEL_DATE_RANGE_INVALID', `Hotel option ${index + 1} has checkout before check-in.`));
    }
  });

  (quotation.transportOptions || []).forEach((transport, index) => {
    const departure = validDate(transport.schedule?.departureDate || transport.startDate);
    const arrival = validDate(transport.schedule?.arrivalDate || transport.endDate);
    if (departure && arrival && arrival < departure) {
      errors.push(issue('transport', 'TRANSPORT_SCHEDULE_INVALID', `Transport segment ${index + 1} arrives before it departs.`));
    }
  });

  if (!quotation.hotelOptions?.length) warnings.push(issue('hotels', 'NO_HOTELS', 'No hotel options have been added.'));
  if (!quotation.transportOptions?.length) warnings.push(issue('transport', 'NO_TRANSPORT', 'No transportation has been added.'));
  if (!quotation.inclusions?.length) warnings.push(issue('inclusions', 'NO_INCLUSIONS', 'No inclusions have been added.'));
  if (!(quotation.itinerary || []).some((day) => day.coverMedia?.url)) warnings.push(issue('itinerary', 'NO_ITINERARY_IMAGES', 'No itinerary cover images have been selected.'));
  const reviewIssues = [
    ['hotels', 'AI_HOTEL_REVIEW_REQUIRED', 'hotel', quotation.hotelOptions, 'Selected AI stay suggestions require Staff review.'],
    ['transport', 'AI_TRANSPORT_REVIEW_REQUIRED', 'transport', quotation.transportOptions, 'Selected AI transport suggestions require Staff review.'],
    ['activities', 'AI_ACTIVITY_REVIEW_REQUIRED', 'activity', quotation.activities, 'Selected AI activity suggestions require Staff review.']
  ];
  reviewIssues.forEach(([step, code, type, items, message]) => {
    if ((items || []).some((item) => item.selected === true && !isReviewedAiCandidate(item, type))) {
      const target = (forFinalization || forShare || requireCandidateReview) ? errors : warnings;
      target.push(issue(step, code, message));
    }
  });

  const finalPrice = number(pricing.finalCustomerPrice);
  const deposit = number(pricing.depositAmount);
  if ((forFinalization || forShare) && finalPrice <= 0) errors.push(issue('pricing', 'FINAL_PRICE_REQUIRED', 'Admin must enter the final customer price.'));
  if (deposit > finalPrice && finalPrice > 0) errors.push(issue('pricing', 'DEPOSIT_EXCEEDS_TOTAL', 'Deposit cannot exceed the final customer price.'));
  const scheduleTotal = (pricing.paymentSchedule || []).reduce((sum, item) => sum + number(item.amount), 0);
  if ((pricing.adjustments || []).some((item) => number(item.amount) <= 0 || !String(item.label || '').trim())) {
    errors.push(issue('pricing', 'PRICING_ADJUSTMENT_INVALID', 'Every commercial adjustment needs a label and positive amount.'));
  }
  if ((pricing.paymentSchedule || []).some((item) => number(item.amount) <= 0 || !String(item.label || '').trim())) {
    errors.push(issue('pricing', 'PAYMENT_SCHEDULE_INVALID', 'Every payment schedule item needs a label and positive amount.'));
  }
  if (scheduleTotal > 0 && finalPrice > 0 && Math.abs(scheduleTotal - finalPrice) > 1) {
    errors.push(issue('pricing', 'PAYMENT_SCHEDULE_TOTAL_INVALID', 'Payment schedule amounts must equal the final customer price.'));
  }
  if (forShare && !pricing.finalizedAt) errors.push(issue('pricing', 'PRICING_NOT_FINALIZED', 'Admin pricing finalization is required before sharing.'));
  if (forShare && validDate(quotation.validUntil) && validDate(quotation.validUntil) < new Date()) {
    errors.push(issue('terms', 'QUOTATION_EXPIRED', 'Quotation validity has already expired.'));
  }

  return {
    errors,
    warnings,
    sectionsComplete: 12 - new Set(errors.map((item) => item.step)).size,
    ready: errors.length === 0
  };
};

export const buildRevisionSnapshot = (quotation) => {
  const value = quotation?.toObject ? quotation.toObject() : deepClone(quotation);
  return {
    schemaVersion: 2,
    quotationId: value._id,
    quotationNumber: value.quotationNumber,
    version: value.version,
    customerSnapshot: value.customerSnapshot,
    tripRequirements: value.tripRequirements,
    tripPreferences: value.tripPreferences || {},
    planningReference: value.planningReference || null,
    personalNote: value.personalNote || '',
    itinerary: value.itinerary || [],
    hotelOptions: value.hotelOptions || [],
    transportOptions: value.transportOptions || [],
    activities: value.activities || [],
    addOns: value.addOns || [],
    attachments: value.attachments || [],
    inclusions: value.inclusions || [],
    exclusions: value.exclusions || [],
    policies: normalizeQuotationPolicies(value),
    termsAndConditions: [],
    cancellationPolicy: [],
    manualPricing: value.manualPricing || {},
    paymentTerms: value.paymentTerms || {},
    presentationSettings: value.presentationSettings || {},
    validUntil: value.validUntil,
    advisor: value.assignedToSnapshot || {},
    finalizedAt: value.manualPricing?.finalizedAt || null
  };
};

const attachmentAllowed = (attachment, { approved, booked, allowAttachments = true }) => {
  if (!allowAttachments) return false;
  const visibility = attachment?.visibility || 'INTERNAL_ONLY';
  if (visibility === 'CUSTOMER_VISIBLE') return true;
  if (visibility === 'CUSTOMER_VISIBLE_AFTER_APPROVAL') return approved;
  if (visibility === 'CUSTOMER_VISIBLE_AFTER_BOOKING') return booked;
  return false;
};

const publicAttachment = (attachment) => ({
  id: attachment.id,
  category: attachment.category,
  sectionType: attachment.sectionType,
  sectionId: attachment.sectionId,
  title: attachment.title || attachment.fileName || 'Travel document',
  fileName: attachment.fileName,
  mimeType: attachment.mimeType,
  visibility: attachment.visibility,
  size: attachment.size,
  secureUrl: attachment.secureUrl,
  bookingReference: attachment.bookingReference || '',
  passengerName: attachment.passengerName || ''
});

const publicItineraryDay = (item = {}) => ({
  day: item.day,
  title: item.title,
  destination: item.destination || item.locationName,
  description: item.description,
  morning: item.morning,
  afternoon: item.afternoon,
  evening: item.evening,
  stay: item.stay,
  mealsIncluded: item.mealsIncluded || [],
  transferDetails: item.transferDetails,
  activityHighlights: item.activityHighlights || [],
  coverMedia: item.coverMedia ? {
    url: item.coverMedia.url,
    altText: item.coverMedia.altText,
    caption: item.coverMedia.caption,
    width: item.coverMedia.width,
    height: item.coverMedia.height
  } : null,
  galleryMedia: item.galleryMedia || []
});

const publicHotel = (item = {}, context) => ({
  optionId: item.optionId,
  segmentId: item.segmentId,
  segmentName: item.segmentName,
  tier: item.tier,
  label: item.label,
  hotelName: item.hotelName,
  city: item.city,
  location: item.location,
  category: item.category,
  roomType: item.roomType,
  rooms: item.rooms,
  occupancy: item.occupancy,
  mealPlan: item.mealPlan,
  checkIn: item.checkIn,
  checkOut: item.checkOut,
  nights: item.nights,
  ...(context.showComponentPrices ? { pricePerNight: item.pricePerNight, totalPrice: item.totalPrice } : {}),
  imageUrl: item.imageUrl,
  amenities: item.amenities || [],
  gallery: item.gallery || [],
  recommendationType: item.recommendationType,
  selected: item.selected,
  documents: (item.documents || []).filter((attachment) => attachmentAllowed(attachment, context)).map(publicAttachment)
});

const publicTransport = (item = {}, context) => ({
  optionId: item.optionId,
  mode: item.mode,
  type: item.type,
  title: item.title,
  vehicle: item.vehicle,
  pickup: item.pickup,
  drop: item.drop,
  route: item.route,
  schedule: item.schedule,
  reference: item.reference,
  cabinClass: item.cabinClass,
  seatDetails: item.seatDetails,
  baggage: item.baggage,
  startDate: item.startDate,
  endDate: item.endDate,
  capacity: item.capacity,
  quantity: item.quantity,
  pricingType: item.pricingType,
  ...(context.showComponentPrices ? { unitPrice: item.unitPrice, totalPrice: item.totalPrice } : {}),
  inclusions: item.inclusions || [],
  selected: item.selected,
  vehicleMedia: item.vehicleMedia || [],
  documents: (item.documents || []).filter((attachment) => attachmentAllowed(attachment, context)).map(publicAttachment)
});

const publicActivity = (item = {}, context) => ({
  activityId: item.activityId,
  dayNumber: item.dayNumber,
  date: item.date,
  name: item.name,
  description: item.description,
  location: item.location,
  pricingType: item.pricingType,
  quantity: item.quantity,
  ...(context.showComponentPrices ? { unitPrice: item.unitPrice, totalPrice: item.totalPrice } : {}),
  isIncluded: item.isIncluded,
  isOptional: item.isOptional,
  selected: item.selected,
  attachments: (item.attachments || []).filter((attachment) => attachmentAllowed(attachment, context)).map(publicAttachment)
});

const publicAddOn = (item = {}, context) => ({
  addonId: item.addonId,
  category: item.category,
  name: item.name,
  description: item.description,
  pricingType: item.pricingType,
  quantity: item.quantity,
  ...(context.showComponentPrices ? { unitPrice: item.unitPrice, totalPrice: item.totalPrice } : {}),
  selected: item.selected,
  attachments: (item.attachments || []).filter((attachment) => attachmentAllowed(attachment, context)).map(publicAttachment)
});

export const buildPublicRevisionDto = ({ quotation, revision, share }) => {
  const snapshot = deepClone(revision.snapshot);
  const approved = revision.status === 'APPROVED' || Boolean(revision.approval?.approvedAt);
  const booked = Boolean(quotation.bookingId);
  const showAttachments = share.allowAttachments && snapshot.presentationSettings?.showAttachments !== false;
  const context = {
    approved,
    booked,
    allowAttachments: showAttachments,
    showComponentPrices: snapshot.presentationSettings?.showComponentPrices === true
  };
  const manual = snapshot.manualPricing || {};
  const dto = {
    schemaVersion: 2,
    quotationNumber: snapshot.quotationNumber,
    version: revision.version,
    status: revision.status,
    templateKey: share.templateKey,
    customerSnapshot: {
      name: snapshot.customerSnapshot?.name,
      city: snapshot.customerSnapshot?.city
    },
    tripRequirements: snapshot.tripRequirements,
    ...(snapshot.presentationSettings?.showTripPreferences === true ? {
      tripPreferences: {
        interests: snapshot.tripPreferences?.interests || [],
        stayPreference: snapshot.tripPreferences?.stayPreference || '',
        dietaryPreference: snapshot.tripPreferences?.dietaryPreference || ''
      }
    } : {}),
    personalNote: snapshot.personalNote,
    itinerary: (snapshot.itinerary || []).map(publicItineraryDay),
    hotelOptions: (snapshot.hotelOptions || []).filter((item) => !(isAiPlannerCandidate(item, 'hotel') && item.selected !== true)).map((item) => publicHotel(item, context)),
    transportOptions: (snapshot.transportOptions || []).filter((item) => !(isAiPlannerCandidate(item, 'transport') && item.selected !== true)).map((item) => publicTransport(item, context)),
    activities: (snapshot.activities || []).filter((item) => !(isAiPlannerCandidate(item, 'activity') && item.selected !== true)).map((item) => publicActivity(item, context)),
    addOns: (snapshot.addOns || []).map((item) => publicAddOn(item, context)),
    attachments: showAttachments ? [...new Map([...(snapshot.attachments || []), ...(quotation.attachments || [])]
      .filter((attachment) => attachmentAllowed(attachment, context))
      .map((attachment) => [attachment.id, publicAttachment(attachment)])).values()] : [],
    inclusions: snapshot.inclusions,
    exclusions: snapshot.exclusions,
    policies: normalizeQuotationPolicies(snapshot),
    termsAndConditions: [],
    cancellationPolicy: [],
    pricing: {
      currency: manual.currency || 'INR',
      finalCustomerPrice: number(manual.finalCustomerPrice),
      depositAmount: number(manual.depositAmount),
      balanceAmount: number(manual.balanceAmount),
      paymentSchedule: snapshot.presentationSettings?.showPaymentSchedule === false ? [] : (manual.paymentSchedule || []),
      adjustments: snapshot.presentationSettings?.showComponentPrices ? (manual.adjustments || []) : [],
      componentReference: snapshot.presentationSettings?.showComponentPrices ? number(manual.componentReference) : undefined,
      priceNotes: manual.priceNotes || ''
    },
    paymentTerms: snapshot.paymentTerms,
    presentationSettings: snapshot.presentationSettings,
    advisor: snapshot.presentationSettings?.showAdvisor === false ? null : snapshot.advisor,
    validUntil: snapshot.validUntil,
    approval: revision.approval?.approvedAt ? {
      method: revision.approval.method,
      approvedAt: revision.approval.approvedAt,
      approvedByName: revision.approval.approvedByName
    } : null,
    share: {
      id: share._id,
      expiresAt: share.expiresAt,
      allowPdfDownload: share.allowPdfDownload,
      allowAttachments: share.allowAttachments,
      requireEmailVerification: share.requireEmailVerification,
      approvalEnabled: share.approvalEnabled,
      recipientEmailHint: maskEmail(share.recipientEmail),
      isActive: share.isActive,
      isExpired: new Date(share.expiresAt) <= new Date(),
      isRevoked: Boolean(share.revokedAt)
    },
    booked,
    superseded: String(quotation.latestSharedRevisionId || '') !== String(revision._id)
  };
  return dto;
};

export const createQuotationEvent = async ({ quotationId, revisionId = null, shareId = null, type, actor, actorType, details = {} }) => {
  const normalizedActorType = actorType || (actor ? 'STAFF' : 'SYSTEM');
  return QuotationEvent.create({
    quotationId,
    revisionId,
    shareId,
    type,
    actorType: normalizedActorType,
    actorId: actor?._id || actor?.id || null,
    actorName: actor?.name || '',
    actorEmail: actor?.email || '',
    details
  });
};

export const maskEmail = (email) => {
  const [local, domain] = String(email || '').split('@');
  if (!local || !domain) return '';
  return `${local.slice(0, Math.min(2, local.length))}${'*'.repeat(Math.max(2, local.length - 2))}@${domain}`;
};
