import crypto from 'node:crypto';
import QuotationEvent from '../models/QuotationEvent.js';

export const V2_TEMPLATES = Object.freeze(['minimal', 'journey', 'signature_luxe']);
export const ATTACHMENT_VISIBILITIES = Object.freeze([
  'INTERNAL_ONLY',
  'CUSTOMER_VISIBLE',
  'CUSTOMER_VISIBLE_AFTER_APPROVAL',
  'CUSTOMER_VISIBLE_AFTER_BOOKING'
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const deepClone = (value) => JSON.parse(JSON.stringify(value ?? null));
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const validDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isCommercialAdmin = (user) => ['admin', 'super_admin'].includes(String(user?.role || '').toLowerCase());
export const secureToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
export const tokenHash = (token) => crypto.createHash('sha256').update(String(token || '')).digest('hex');
export const verificationCode = () => String(crypto.randomInt(100000, 1000000));
export const verificationHash = (code) => crypto.createHmac('sha256', process.env.JWT_SECRET || 'quotation-verification').update(String(code)).digest('hex');

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

export const validateQuotationV2 = (quotation = {}, { forFinalization = false, forShare = false } = {}) => {
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
  const travelers = number(journey.adults) + number(journey.children) + number(journey.infants);
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

  const finalPrice = number(pricing.finalCustomerPrice);
  const deposit = number(pricing.depositAmount);
  if ((forFinalization || forShare) && finalPrice <= 0) errors.push(issue('pricing', 'FINAL_PRICE_REQUIRED', 'Admin must enter the final customer price.'));
  if (deposit > finalPrice && finalPrice > 0) errors.push(issue('pricing', 'DEPOSIT_EXCEEDS_TOTAL', 'Deposit cannot exceed the final customer price.'));
  const scheduleTotal = (pricing.paymentSchedule || []).reduce((sum, item) => sum + number(item.amount), 0);
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
    personalNote: value.personalNote || '',
    itinerary: value.itinerary || [],
    hotelOptions: value.hotelOptions || [],
    transportOptions: value.transportOptions || [],
    activities: value.activities || [],
    addOns: value.addOns || [],
    attachments: value.attachments || [],
    inclusions: value.inclusions || [],
    exclusions: value.exclusions || [],
    policies: value.policies || {},
    termsAndConditions: value.termsAndConditions || [],
    cancellationPolicy: value.cancellationPolicy || [],
    manualPricing: value.manualPricing || {},
    paymentTerms: value.paymentTerms || {},
    presentationSettings: value.presentationSettings || {},
    validUntil: value.validUntil,
    advisor: value.assignedToSnapshot || {},
    finalizedAt: value.manualPricing?.finalizedAt || null
  };
};

const attachmentAllowed = (attachment, { approved, booked }) => {
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
  size: attachment.size,
  secureUrl: attachment.secureUrl,
  bookingReference: attachment.bookingReference || '',
  passengerName: attachment.passengerName || ''
});

const sanitizeNestedAttachments = (items, context, field = 'attachments') => (items || []).map((item) => {
  const safe = { ...deepClone(item) };
  delete safe.unitCost;
  delete safe.totalCost;
  delete safe.costPerNight;
  delete safe.provider;
  delete safe.driverDetails;
  if (Array.isArray(safe[field])) safe[field] = safe[field].filter((attachment) => attachmentAllowed(attachment, context)).map(publicAttachment);
  if (Array.isArray(safe.documents)) safe.documents = safe.documents.filter((attachment) => attachmentAllowed(attachment, context)).map(publicAttachment);
  return safe;
});

export const buildPublicRevisionDto = ({ quotation, revision, share }) => {
  const snapshot = deepClone(revision.snapshot);
  const approved = revision.status === 'APPROVED' || Boolean(revision.approval?.approvedAt);
  const booked = Boolean(quotation.bookingId);
  const context = { approved, booked };
  const showAttachments = share.allowAttachments && snapshot.presentationSettings?.showAttachments !== false;
  const manual = snapshot.manualPricing || {};
  const dto = {
    schemaVersion: 2,
    quotationNumber: snapshot.quotationNumber,
    version: revision.version,
    status: revision.status,
    templateKey: share.templateKey,
    customerSnapshot: snapshot.customerSnapshot,
    tripRequirements: snapshot.tripRequirements,
    personalNote: snapshot.personalNote,
    itinerary: snapshot.itinerary,
    hotelOptions: sanitizeNestedAttachments(snapshot.hotelOptions, context, 'documents'),
    transportOptions: sanitizeNestedAttachments(snapshot.transportOptions, context, 'documents'),
    activities: sanitizeNestedAttachments(snapshot.activities, context),
    addOns: sanitizeNestedAttachments(snapshot.addOns, context),
    attachments: showAttachments ? (snapshot.attachments || []).filter((attachment) => attachmentAllowed(attachment, context)).map(publicAttachment) : [],
    inclusions: snapshot.inclusions,
    exclusions: snapshot.exclusions,
    policies: snapshot.policies,
    termsAndConditions: snapshot.termsAndConditions,
    cancellationPolicy: snapshot.cancellationPolicy,
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
      isActive: share.isActive,
      isExpired: new Date(share.expiresAt) <= new Date(),
      isRevoked: Boolean(share.revokedAt)
    },
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
