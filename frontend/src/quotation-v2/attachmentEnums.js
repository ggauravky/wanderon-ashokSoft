export const QUOTATION_ATTACHMENT_CATEGORIES = Object.freeze([
  { value: 'HOTEL_VOUCHER', label: 'Hotel Voucher' },
  { value: 'HOTEL_CONFIRMATION', label: 'Hotel Confirmation' },
  { value: 'FLIGHT_TICKET', label: 'Flight Ticket' },
  { value: 'TRAIN_TICKET', label: 'Train Ticket' },
  { value: 'BUS_TICKET', label: 'Bus Ticket' },
  { value: 'TRANSPORT_VOUCHER', label: 'Transport Voucher' },
  { value: 'ACTIVITY_TICKET', label: 'Activity Ticket' },
  { value: 'ACTIVITY_VOUCHER', label: 'Activity Voucher' },
  { value: 'PERMIT', label: 'Permit' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'GENERAL', label: 'General' },
  { value: 'OTHER', label: 'Other' }
]);

export const QUOTATION_ATTACHMENT_VISIBILITIES = Object.freeze([
  { value: 'INTERNAL_ONLY', label: 'Internal Only' },
  { value: 'CUSTOMER_VISIBLE', label: 'Customer Visible' },
  { value: 'CUSTOMER_VISIBLE_AFTER_APPROVAL', label: 'Customer Visible After Approval' },
  { value: 'CUSTOMER_VISIBLE_AFTER_BOOKING', label: 'Customer Visible After Booking' }
]);

const categoryValues = new Set(QUOTATION_ATTACHMENT_CATEGORIES.map((item) => item.value));
const visibilityValues = new Set(QUOTATION_ATTACHMENT_VISIBILITIES.map((item) => item.value));
const transportTypes = new Set([
  'FLIGHT_TICKET', 'TRAIN_TICKET', 'BUS_TICKET', 'TRANSPORT_VOUCHER',
  'BOOKING_CONFIRMATION', 'BOARDING_DOCUMENT', 'PERMIT', 'SUPPLIER_INVOICE', 'OTHER'
]);

const normalizeKnown = (value, allowed, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toUpperCase().replace(/[\s-]+/g, '_');
  return allowed.has(normalized) ? normalized : value;
};

const normalizeShared = (item = {}) => ({
  ...item,
  category: normalizeKnown(item.category, categoryValues, 'GENERAL'),
  visibility: normalizeKnown(item.visibility, visibilityValues, 'INTERNAL_ONLY')
});

export const normalizeQuotationAttachmentState = (quotation) => {
  if (!quotation) return quotation;
  return {
    ...quotation,
    attachments: (quotation.attachments || []).map(normalizeShared),
    hotelOptions: (quotation.hotelOptions || []).map((item) => ({ ...item, documents: (item.documents || []).map(normalizeShared) })),
    transportOptions: (quotation.transportOptions || []).map((item) => ({
      ...item,
      documents: (item.documents || []).map((document) => ({
        ...document,
        type: normalizeKnown(document.type, transportTypes, 'TRANSPORT_VOUCHER'),
        visibility: normalizeKnown(document.visibility, visibilityValues, 'CUSTOMER_VISIBLE')
      }))
    })),
    activities: (quotation.activities || []).map((item) => ({ ...item, attachments: (item.attachments || []).map(normalizeShared) })),
    addOns: (quotation.addOns || []).map((item) => ({ ...item, attachments: (item.attachments || []).map(normalizeShared) }))
  };
};
