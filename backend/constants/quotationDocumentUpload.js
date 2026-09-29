export const QUOTATION_DOCUMENT_MAX_BYTES = 15 * 1024 * 1024;
export const QUOTATION_DOCUMENT_EXTENSIONS = Object.freeze(['pdf', 'jpg', 'jpeg', 'png', 'webp']);
export const QUOTATION_DOCUMENT_MIME_TYPES = Object.freeze(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const extensionOf = (name = '') => String(name).toLowerCase().split('.').pop();

export function validateQuotationDocumentUpload(file = {}) {
  const extension = extensionOf(file.originalname);
  if (!QUOTATION_DOCUMENT_EXTENSIONS.includes(extension) || !QUOTATION_DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
    return { valid: false, message: `Invalid document type (${file.mimetype || 'unknown'}). Allowed formats: PDF, JPG, JPEG, PNG, WEBP.` };
  }
  const expected = extension === 'pdf' ? ['application/pdf']
    : ['jpg', 'jpeg'].includes(extension) ? ['image/jpeg', 'image/jpg']
      : [`image/${extension}`];
  if (!expected.includes(file.mimetype)) return { valid: false, message: 'The file extension does not match its MIME type.' };
  return { valid: true, message: '' };
}

