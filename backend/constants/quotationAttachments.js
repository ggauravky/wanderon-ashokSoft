export const QUOTATION_ATTACHMENT_CATEGORIES = Object.freeze([
  'HOTEL_VOUCHER',
  'HOTEL_CONFIRMATION',
  'FLIGHT_TICKET',
  'TRAIN_TICKET',
  'BUS_TICKET',
  'TRANSPORT_VOUCHER',
  'ACTIVITY_TICKET',
  'ACTIVITY_VOUCHER',
  'PERMIT',
  'INSURANCE',
  'INVOICE',
  'GENERAL',
  'OTHER'
]);

export const QUOTATION_ATTACHMENT_VISIBILITIES = Object.freeze([
  'INTERNAL_ONLY',
  'CUSTOMER_VISIBLE',
  'CUSTOMER_VISIBLE_AFTER_APPROVAL',
  'CUSTOMER_VISIBLE_AFTER_BOOKING'
]);

export const TRANSPORT_DOCUMENT_TYPES = Object.freeze([
  'FLIGHT_TICKET',
  'TRAIN_TICKET',
  'BUS_TICKET',
  'TRANSPORT_VOUCHER',
  'BOOKING_CONFIRMATION',
  'BOARDING_DOCUMENT',
  'PERMIT',
  'SUPPLIER_INVOICE',
  'OTHER'
]);

const canonicalKey = (value) => String(value || '')
  .trim()
  .toUpperCase()
  .replace(/[\s-]+/g, '_');

const normalizeWhitelisted = (value, allowed, message, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = canonicalKey(value);
  if (!allowed.includes(normalized)) {
    throw Object.assign(new Error(message), { status: 422 });
  }
  return normalized;
};

export const normalizeAttachmentCategory = (value, fallback = 'GENERAL') => normalizeWhitelisted(
  value,
  QUOTATION_ATTACHMENT_CATEGORIES,
  'Invalid attachment category.',
  fallback
);

export const normalizeAttachmentVisibility = (value, fallback = 'INTERNAL_ONLY') => normalizeWhitelisted(
  value,
  QUOTATION_ATTACHMENT_VISIBILITIES,
  'Invalid attachment visibility.',
  fallback
);

export const normalizeTransportDocumentType = (value, fallback = 'TRANSPORT_VOUCHER') => normalizeWhitelisted(
  value,
  TRANSPORT_DOCUMENT_TYPES,
  'Invalid transport document type.',
  fallback
);

export const normalizeQuotationAttachment = (attachment = {}) => ({
  ...attachment,
  category: normalizeAttachmentCategory(attachment.category),
  visibility: normalizeAttachmentVisibility(attachment.visibility)
});

const normalizeAttachmentList = (items) => Array.isArray(items)
  ? items.map((item) => normalizeQuotationAttachment(item))
  : items;

const normalizeTransportDocumentList = (items) => Array.isArray(items)
  ? items.map((item) => ({
      ...item,
      type: normalizeTransportDocumentType(item.type),
      visibility: normalizeAttachmentVisibility(item.visibility, 'CUSTOMER_VISIBLE')
    }))
  : items;

export const normalizeQuotationAttachmentPayload = (input = {}) => ({
  ...input,
  ...(Object.prototype.hasOwnProperty.call(input, 'attachments')
    ? { attachments: normalizeAttachmentList(input.attachments) }
    : {}),
  ...(Object.prototype.hasOwnProperty.call(input, 'hotelOptions')
    ? { hotelOptions: (input.hotelOptions || []).map((item) => ({ ...item, documents: normalizeAttachmentList(item.documents) || [] })) }
    : {}),
  ...(Object.prototype.hasOwnProperty.call(input, 'transportOptions')
    ? { transportOptions: (input.transportOptions || []).map((item) => ({ ...item, documents: normalizeTransportDocumentList(item.documents) || [] })) }
    : {}),
  ...(Object.prototype.hasOwnProperty.call(input, 'activities')
    ? { activities: (input.activities || []).map((item) => ({ ...item, attachments: normalizeAttachmentList(item.attachments) || [] })) }
    : {}),
  ...(Object.prototype.hasOwnProperty.call(input, 'addOns')
    ? { addOns: (input.addOns || []).map((item) => ({ ...item, attachments: normalizeAttachmentList(item.attachments) || [] })) }
    : {})
});
