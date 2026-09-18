import Campaign from '../models/Campaign.js';

const MAX_VALUE_LENGTH = 160;
const UTM_SAFE = /[^a-z0-9_-]+/g;

export const normalizeUtmValue = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '_')
  .replace(UTM_SAFE, '_')
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '')
  .slice(0, MAX_VALUE_LENGTH);

const cleanText = (value, max = MAX_VALUE_LENGTH) => String(value || '').trim().slice(0, max);
const cleanPath = (value) => {
  const path = cleanText(value, 500);
  return path.startsWith('/') && !path.startsWith('//') ? path : '';
};
const cleanHost = (value) => cleanText(value, 255).toLowerCase().replace(/[^a-z0-9.-]/g, '');
const safeDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

export const sanitizeAttributionTouch = (touch = {}) => ({
  utmId: cleanText(touch.utmId || touch.utm_id, 100).toUpperCase(),
  source: normalizeUtmValue(touch.source || touch.utm_source),
  medium: normalizeUtmValue(touch.medium || touch.utm_medium),
  campaign: normalizeUtmValue(touch.campaign || touch.utm_campaign),
  content: normalizeUtmValue(touch.content || touch.utm_content),
  term: normalizeUtmValue(touch.term || touch.utm_term),
  landingPath: cleanPath(touch.landingPath),
  referrerHost: cleanHost(touch.referrerHost),
  capturedAt: safeDate(touch.capturedAt) || new Date()
});

export const hasMeaningfulAttribution = (attribution) => Boolean(
  attribution?.firstTouch?.utmId
  || attribution?.firstTouch?.campaign
  || (attribution?.firstTouch?.source && attribution.firstTouch.source !== 'direct')
  || attribution?.firstTouch?.referrerHost
);

export const resolveLeadAttribution = async (clientValue) => {
  if (!clientValue || typeof clientValue !== 'object') return null;
  const firstTouch = sanitizeAttributionTouch(clientValue.firstTouch || clientValue);
  const lastTouch = sanitizeAttributionTouch(clientValue.lastTouch || firstTouch);
  const capture = sanitizeAttributionTouch(clientValue.leadCapture || lastTouch);
  let campaign = null;
  let matchedBy = '';

  if (firstTouch.utmId) {
    campaign = await Campaign.findOne({ code: firstTouch.utmId }).select('_id code name').lean();
    if (campaign) matchedBy = 'UTM_ID';
  }
  if (!campaign && firstTouch.campaign && firstTouch.source && firstTouch.medium) {
    const matches = await Campaign.find({
      utmCampaign: firstTouch.campaign,
      utmSource: firstTouch.source,
      utmMedium: firstTouch.medium
    }).select('_id code name').limit(2).lean();
    if (matches.length === 1) {
      [campaign] = matches;
      matchedBy = 'UTM_TUPLE';
    }
  }

  return {
    schemaVersion: 1,
    model: 'FIRST_TOUCH',
    campaignId: campaign?._id || null,
    campaignCodeSnapshot: campaign?.code || '',
    campaignNameSnapshot: campaign?.name || '',
    matchedBy,
    firstTouch,
    lastTouch,
    leadCapture: {
      source: capture.source,
      medium: capture.medium,
      campaign: capture.campaign,
      landingPath: capture.landingPath,
      capturedAt: capture.capturedAt
    }
  };
};
