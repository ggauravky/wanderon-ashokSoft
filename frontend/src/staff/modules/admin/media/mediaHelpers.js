export const MEDIA_TYPES = Object.freeze(['IMAGE', 'VIDEO', 'DOCUMENT']);
export const MEDIA_SOURCES = Object.freeze(['ADMIN_UPLOAD', 'PROJECT_ASSET', 'AUTHORIZED_EXTERNAL_SOURCE', 'PARTNER_MEDIA', 'UNSPLASH_CURATED', 'PEXELS_CURATED']);

export const getMediaUrl = (asset) => asset?.storage?.secureUrl || '';
export const formatMediaDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
export const formatMediaBytes = (value) => {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
export const humanizeMediaValue = (value) => String(value || 'Unknown').toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

