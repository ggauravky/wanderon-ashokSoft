const buckets = new Map();

export const quotationRateLimit = ({ action, limit = 8, windowMs = 10 * 60 * 1000 }) => (req, res, next) => {
  const now = Date.now();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const token = String(req.params?.token || '').slice(0, 16);
  const key = `${action}:${req.ip || req.socket?.remoteAddress || 'unknown'}:${token}:${email}`;
  if (buckets.size > 2000) {
    for (const [storedKey, value] of buckets) if (value.resetAt <= now) buckets.delete(storedKey);
  }
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }
  if (current.count >= limit) {
    res.set('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ success: false, message: 'Too many attempts. Please try again later.' });
  }
  current.count += 1;
  return next();
};
