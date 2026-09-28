import path from 'node:path';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0']);

export const isProductionLikeRuntime = (env = process.env) => env.NODE_ENV === 'production'
  || String(env.RENDER || '').toLowerCase() === 'true'
  || Boolean(env.RENDER_SERVICE_ID || env.RENDER_EXTERNAL_HOSTNAME);

export const isCloudinaryConfigured = (env = process.env) => Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

export const getMediaStorageStatus = (env = process.env) => {
  const configured = isCloudinaryConfigured(env);
  const productionLike = isProductionLikeRuntime(env);
  return {
    provider: configured ? 'cloudinary' : productionLike ? 'unavailable' : 'local-development',
    configured,
    uploadReady: configured || !productionLike
  };
};

export const assertMediaStorageAvailable = (env = process.env) => {
  if (!isCloudinaryConfigured(env) && isProductionLikeRuntime(env)) {
    throw Object.assign(new Error('Media upload storage is not configured. Contact the administrator.'), {
      code: 'MEDIA_STORAGE_UNAVAILABLE',
      status: 503
    });
  }
};

export const assertDemoSeedAllowed = (env = process.env) => {
  if (isProductionLikeRuntime(env) && String(env.ALLOW_DEMO_SEED || '').toLowerCase() !== 'true') {
    throw new Error('Refusing to seed production database without ALLOW_DEMO_SEED=true.');
  }
};

export const escapeRegexValue = (value, maxLength = 100) => String(value || '')
  .trim()
  .slice(0, maxLength)
  .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isPrivateHostname = (hostname) => {
  const host = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
  if (!host || LOOPBACK_HOSTS.has(host) || host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (/^(10|127)\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host)) return true;
  if (/^198\.(18|19)\./.test(host)) return true;
  return host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:');
};

const configuredLocalUploadOrigin = (env) => {
  try {
    const backendUrl = new URL(String(env.BACKEND_URL || `http://localhost:${env.PORT || 5000}`));
    if (!LOOPBACK_HOSTS.has(backendUrl.hostname.toLowerCase())) return null;
    return backendUrl.origin;
  } catch {
    return null;
  }
};

export const isSafeMediaUrl = (value, { env = process.env } = {}) => {
  try {
    const url = new URL(String(value || '').trim());
    if (url.username || url.password) return false;
    const productionLike = isProductionLikeRuntime(env);
    if (!productionLike && url.protocol === 'http:') {
      const allowedOrigin = configuredLocalUploadOrigin(env);
      return Boolean(allowedOrigin && url.origin === allowedOrigin && url.pathname.startsWith('/uploads/'));
    }
    if (url.protocol !== 'https:' || isPrivateHostname(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
};

export const mediaUrlValidationMessage = (env = process.env) => isProductionLikeRuntime(env)
  ? 'Only secure public HTTPS image URLs are permitted.'
  : 'Only public HTTPS URLs or files served from this development server\'s /uploads path are permitted.';

export const normalizeUploadedMedia = (result = {}, file = {}) => {
  const source = String(result.source || '').trim();
  const originalName = String(result.original_filename || file.originalname || 'media');
  const extension = path.extname(originalName).slice(1).toLowerCase();
  const secureUrl = String(result.secureUrl || result.secure_url || result.url || '').trim();
  const publicId = String(result.publicId || result.public_id || '').trim();
  return {
    ...result,
    source: source || (publicId.startsWith('local/') ? 'local_fallback' : 'cloudinary'),
    provider: source === 'local_fallback' || publicId.startsWith('local/') ? 'local' : 'cloudinary',
    publicId,
    public_id: publicId,
    secureUrl,
    secure_url: secureUrl,
    width: Number(result.width) || 0,
    height: Number(result.height) || 0,
    bytes: Number(result.bytes || file.size) || 0,
    format: String(result.format || extension || '').toLowerCase(),
    resourceType: String(result.resourceType || result.resource_type || '').trim(),
    originalFilename: originalName
  };
};

