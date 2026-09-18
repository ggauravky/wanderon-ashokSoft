const firstValue = (...values) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const validateImageUploadFile = (file, maxBytes = 10 * 1024 * 1024) => {
  if (!file) return 'Please select an image file to upload.';
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) return 'Use a JPG, PNG, or WEBP image.';
  if (Number(file.size) > maxBytes) return 'Image must be 10 MB or smaller.';
  return '';
};

export const normalizeImageUploadResult = (response = {}) => {
  const raw = response?.data && !Array.isArray(response.data) ? response.data : response;
  const secureUrl = String(firstValue(raw?.secureUrl, raw?.secure_url, raw?.url) || '').trim();
  const publicId = String(firstValue(raw?.publicId, raw?.public_id) || '').trim();

  return {
    ...raw,
    secureUrl,
    publicId,
    // Preserve the legacy aliases while every upload consumer moves to the
    // canonical camel-case contract.
    secure_url: secureUrl,
    public_id: publicId,
    width: Number(raw?.width) || 0,
    height: Number(raw?.height) || 0,
    bytes: Number(raw?.bytes) || 0,
    format: String(raw?.format || '').trim()
  };
};
