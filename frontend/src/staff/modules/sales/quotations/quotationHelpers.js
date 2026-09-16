export const QUOTATION_STATUSES = Object.freeze([
  'DRAFT',
  'SENT',
  'VIEWED',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'CONVERTED',
  'ARCHIVED'
]);

export const EDITABLE_QUOTATION_STATUSES = new Set(['DRAFT', 'REJECTED', 'EXPIRED']);
export const REVISION_QUOTATION_STATUSES = new Set(['SENT', 'VIEWED']);

export const getQuotationId = (quotation) => quotation?._id || quotation?.id;

export const canEditQuotation = (quotation) => EDITABLE_QUOTATION_STATUSES.has(quotation?.status);
export const canSendQuotation = (quotation) => quotation?.status === 'DRAFT';
export const canCreateQuotationRevision = (quotation) => REVISION_QUOTATION_STATUSES.has(quotation?.status);

export const formatQuotationMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatQuotationDate = (value, includeTime = false) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  });
};

export const getPublicQuotationPath = (quotation) => (
  quotation?.publicShare?.token ? `/quotation/${quotation.publicShare.token}` : ''
);

export const getQuotationTraveler = (quotation) => quotation?.customerSnapshot || quotation?.leadId || {};
