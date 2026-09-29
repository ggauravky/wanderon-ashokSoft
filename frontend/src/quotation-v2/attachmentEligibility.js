export const TICKET_ATTACHMENT_CATEGORIES = new Set([
  'FLIGHT_TICKET', 'TRAIN_TICKET', 'BUS_TICKET', 'ACTIVITY_TICKET',
  'ACTIVITY_VOUCHER', 'HOTEL_VOUCHER', 'HOTEL_CONFIRMATION', 'TRANSPORT_VOUCHER'
]);

const normalized = (value, fallback = '') => String(value || fallback).trim().toUpperCase();

export function resolveAttachmentPdfEligibility({
  attachment = {},
  showAttachments = true,
  approved = false,
  booked = false,
  templateKey = null
} = {}) {
  const visibility = normalized(attachment.visibility, 'INTERNAL_ONLY');
  const pdfDisplayMode = normalized(attachment.pdfDisplayMode, 'AUTO');
  const category = normalized(attachment.category || attachment.documentType, 'GENERAL');

  if (!showAttachments) return { allowedBySecurity: false, included: false, display: 'hidden', reason: 'Attachments are disabled for this quotation.' };
  if (visibility === 'INTERNAL_ONLY') return { allowedBySecurity: false, included: false, display: 'hidden', reason: 'Internal-only document; never customer-facing.' };
  if (visibility === 'CUSTOMER_VISIBLE_AFTER_APPROVAL' && !approved) return { allowedBySecurity: false, included: false, display: 'hidden', reason: 'Available after quotation approval.' };
  if (visibility === 'CUSTOMER_VISIBLE_AFTER_BOOKING' && !booked) return { allowedBySecurity: false, included: false, display: 'hidden', reason: 'Available after booking.' };
  if (!['CUSTOMER_VISIBLE', 'CUSTOMER_VISIBLE_AFTER_APPROVAL', 'CUSTOMER_VISIBLE_AFTER_BOOKING'].includes(visibility)) {
    return { allowedBySecurity: false, included: false, display: 'hidden', reason: 'Visibility setting does not permit customer access.' };
  }

  if (pdfDisplayMode === 'HIDDEN') return { allowedBySecurity: true, included: false, display: 'hidden', reason: 'Hidden from PDF by staff.' };
  if (pdfDisplayMode === 'LINK_ONLY') return { allowedBySecurity: true, included: true, display: 'link', reason: 'Included as a document link/card.' };
  if (pdfDisplayMode === 'ALWAYS_PREVIEW') return { allowedBySecurity: true, included: true, display: 'preview', reason: 'Included with an embedded preview.' };
  if (!templateKey) return { allowedBySecurity: true, included: true, display: 'auto', reason: 'Customer-visible; template profile decides presentation.' };
  if (templateKey === 'minimal') return { allowedBySecurity: true, included: true, display: 'link', reason: 'Compact profile includes AUTO documents in the register.' };
  if (templateKey === 'signature_luxe' || TICKET_ATTACHMENT_CATEGORIES.has(category)) {
    return { allowedBySecurity: true, included: true, display: 'preview', reason: 'Template profile includes an embedded preview.' };
  }
  return { allowedBySecurity: true, included: true, display: 'link', reason: 'Balanced profile includes this document as a link/card.' };
}

