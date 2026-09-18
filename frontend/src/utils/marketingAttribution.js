const FIRST_KEY = 'wlx_marketing_first_touch';
const LAST_KEY = 'wlx_marketing_last_touch';
const VERSION = 1;
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const UTM_KEYS = ['utm_id', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const SEARCH_ENGINES = new Set(['google.com', 'www.google.com', 'bing.com', 'www.bing.com', 'duckduckgo.com', 'www.duckduckgo.com', 'search.yahoo.com']);

export const sanitizeUtmValue = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 160);
const safeRead = (key) => {
  try {
    const value = JSON.parse(window.localStorage.getItem(key));
    if (!value || value.schemaVersion !== VERSION || new Date(value.expiresAt).getTime() <= Date.now()) return null;
    return value;
  } catch { return null; }
};
const safeWrite = (key, value) => { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* Lead capture must remain available. */ } };
const externalReferrer = () => {
  try {
    const url = document.referrer ? new URL(document.referrer) : null;
    return url && url.host !== window.location.host ? url.hostname.toLowerCase() : '';
  } catch { return ''; }
};

export const readMarketingTouch = (search = window.location.search, pathname = window.location.pathname) => {
  const params = new URLSearchParams(search);
  const explicit = UTM_KEYS.some((key) => params.get(key));
  const referrerHost = externalReferrer();
  const organic = SEARCH_ENGINES.has(referrerHost);
  const source = explicit ? sanitizeUtmValue(params.get('utm_source')) : organic ? referrerHost.split('.').at(-2) : referrerHost ? referrerHost : 'direct';
  const medium = explicit ? sanitizeUtmValue(params.get('utm_medium')) : organic ? 'organic' : referrerHost ? 'referral' : 'none';
  const now = new Date();
  return {
    schemaVersion: VERSION,
    utmId: String(params.get('utm_id') || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 100),
    source: source || 'direct',
    medium: medium || 'none',
    campaign: sanitizeUtmValue(params.get('utm_campaign')),
    content: sanitizeUtmValue(params.get('utm_content')),
    term: sanitizeUtmValue(params.get('utm_term')),
    landingPath: String(pathname || '/').startsWith('/') ? String(pathname || '/').slice(0, 500) : '/',
    referrerHost,
    capturedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + RETENTION_MS).toISOString(),
    explicit: explicit || Boolean(referrerHost)
  };
};

export const captureMarketingAttribution = (search, pathname) => {
  if (typeof window === 'undefined') return null;
  const touch = readMarketingTouch(search, pathname);
  const first = safeRead(FIRST_KEY);
  const shouldPromoteExplicitTouch = first?.source === 'direct' && touch.explicit;
  if (!first || shouldPromoteExplicitTouch) safeWrite(FIRST_KEY, touch);
  if (touch.explicit) safeWrite(LAST_KEY, touch);
  return { firstTouch: shouldPromoteExplicitTouch ? touch : (first || touch), lastTouch: touch.explicit ? touch : (safeRead(LAST_KEY) || first || touch) };
};

const payloadTouch = (touch) => touch ? ({
  utmId: touch.utmId, source: touch.source, medium: touch.medium, campaign: touch.campaign,
  content: touch.content, term: touch.term, landingPath: touch.landingPath,
  referrerHost: touch.referrerHost, capturedAt: touch.capturedAt
}) : null;

export const getLeadAttributionPayload = () => {
  if (typeof window === 'undefined') return null;
  try {
    const first = safeRead(FIRST_KEY);
    const last = safeRead(LAST_KEY) || first;
    if (!first) return null;
    return {
      schemaVersion: VERSION,
      model: 'FIRST_TOUCH',
      firstTouch: payloadTouch(first),
      lastTouch: payloadTouch(last),
      leadCapture: { ...payloadTouch(last || first), landingPath: window.location.pathname, capturedAt: new Date().toISOString() }
    };
  } catch { return null; }
};
