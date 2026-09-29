export const QUOTATION_DOCUMENT_MAX_BYTES = 15 * 1024 * 1024;
export const QUOTATION_DOCUMENT_EXTENSIONS = Object.freeze(['pdf', 'jpg', 'jpeg', 'png', 'webp']);
export const QUOTATION_DOCUMENT_MIME_TYPES = Object.freeze(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const extensionOf = (name = '') => String(name).toLowerCase().split('.').pop();

export function validateQuotationDocumentFile(file) {
  if (!file) return 'Choose a document to upload.';
  const extension = extensionOf(file.name);
  if (!QUOTATION_DOCUMENT_EXTENSIONS.includes(extension) || !QUOTATION_DOCUMENT_MIME_TYPES.includes(file.type)) {
    return 'Use PDF, JPG, JPEG, PNG, or WEBP documents only.';
  }
  const expected = extension === 'pdf' ? ['application/pdf']
    : ['jpg', 'jpeg'].includes(extension) ? ['image/jpeg', 'image/jpg']
      : [`image/${extension}`];
  if (!expected.includes(file.type)) return 'The file extension does not match its MIME type.';
  if (Number(file.size) > QUOTATION_DOCUMENT_MAX_BYTES) return 'Document must be 15 MB or smaller.';
  return '';
}

