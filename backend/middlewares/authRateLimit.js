const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export const loginRateLimit = (req, res, next) => {
  const now = Date.now();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const key = `${req.ip || req.socket?.remoteAddress || 'unknown'}:${email}`;
  if (attempts.size > 1000) {
    for (const [storedKey, value] of attempts) if (value.resetAt <= now) attempts.delete(storedKey);
  }
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  if (current.count >= MAX_ATTEMPTS) {
    res.set('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ message: 'Too many login attempts. Please try again later.' });
  }
  current.count += 1;
  return next();
};
