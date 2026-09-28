const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

const extensionOf = (value) => {
  const clean = String(value || '').split(/[?#]/, 1)[0];
  const match = clean.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : '';
};

export function resolveAttachmentMediaType(attachment = {}) {
  const mimeType = String(attachment.mimeType || '').trim().toLowerCase();
  if (IMAGE_MIME_TYPES.has(mimeType)) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  const extension = extensionOf(attachment.fileName || attachment.title || attachment.secureUrl);
  if (IMAGE_EXTENSIONS.has(extension)) return 'image';
  if (extension === 'pdf') return 'pdf';
  return 'document';
}

export function attachmentAspectClass(width, height) {
  const ratio = Number(width) > 0 && Number(height) > 0 ? Number(width) / Number(height) : 1;
  if (ratio < 0.48) return 'is-tall';
  if (ratio < 0.86) return 'is-portrait';
  if (ratio > 1.35) return 'is-landscape';
  return 'is-square';
}
