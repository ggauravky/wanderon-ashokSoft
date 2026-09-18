import mongoose from 'mongoose';
import Banner from '../models/Banner.js';
import Campaign from '../models/Campaign.js';
import MediaAsset from '../models/MediaAsset.js';
import { sendErrorResponse } from '../utils/httpResponse.js';
import { recordStaffActivity } from '../services/staffActivityService.js';
import { normalizeUtmValue } from '../services/marketingAttributionService.js';

const isDbConnected = () => mongoose.connection?.readyState === 1;
const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const actorMongoId = (req) => req.authContext?.source === 'database' && mongoose.Types.ObjectId.isValid(req.authContext.mongoUserId)
  ? req.authContext.mongoUserId : undefined;
const requireDatabase = (res, publicRead = false) => {
  if (isDbConnected()) return true;
  res.status(503).json({ success: false, message: publicRead ? 'Promotional content is temporarily unavailable.' : 'Marketing data is unavailable while the database is disconnected.' });
  return false;
};
const parseDate = (value, label, { endOfDay = false } = {}) => {
  if (value === '' || value == null) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw Object.assign(new Error(`Enter a valid ${label}.`), { status: 400 });
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) date.setUTCHours(23, 59, 59, 999);
  return date;
};
const validateSchedule = (startDate, endDate) => {
  if (startDate && endDate && endDate < startDate) throw Object.assign(new Error('End date must be on or after the start date.'), { status: 400 });
};
const normalizeCampaignStatus = (status, startDate, endDate, now = new Date()) => {
  if (['draft', 'paused', 'completed', 'cancelled'].includes(status)) return status;
  if (endDate && endDate < now) return 'completed';
  if (startDate && startDate > now) return 'scheduled';
  return status === 'scheduled' ? 'active' : status;
};
const campaignDisplayStatus = (campaign, now = new Date()) => normalizeCampaignStatus(campaign.status, campaign.startDate, campaign.endDate, now);
const bannerDisplayStatus = (banner, now = new Date()) => {
  if (banner.endDate && banner.endDate < now) return 'expired';
  if (banner.status === 'inactive') return 'inactive';
  if (banner.startDate && banner.startDate > now) return 'scheduled';
  return banner.status === 'scheduled' ? 'active' : banner.status;
};
const currentScheduleFilter = (now = new Date()) => ({ $and: [
  { $or: [{ startDate: null }, { startDate: { $exists: false } }, { startDate: { $lte: now } }] },
  { $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gte: now } }] }
] });
const serializeCampaign = (document) => { const value = document?.toObject ? document.toObject() : document; return { ...value, displayStatus: campaignDisplayStatus(value) }; };
const serializeBanner = (document) => { const value = document?.toObject ? document.toObject() : document; return { ...value, displayStatus: bannerDisplayStatus(value) }; };
const populateCampaign = (query) => query.populate('createdBy', 'name email').populate('updatedBy', 'name email');
const populateBanner = (query) => query.populate('createdBy', 'name email').populate('updatedBy', 'name email').populate('mediaAssetId', 'title altText storage.secureUrl');

const campaignStatusQuery = (status, now = new Date()) => {
  const current = currentScheduleFilter(now);
  if (status === 'active') return { status: { $in: ['active', 'scheduled'] }, ...current };
  if (status === 'scheduled') return { status: { $in: ['active', 'scheduled'] }, startDate: { $gt: now } };
  if (status === 'completed') return { $or: [{ status: 'completed' }, { status: { $in: ['active', 'scheduled'] }, endDate: { $lt: now } }] };
  return { status };
};
const bannerStatusQuery = (status, now = new Date()) => {
  const current = currentScheduleFilter(now);
  if (status === 'active') return { status: { $in: ['active', 'scheduled'] }, ...current };
  if (status === 'scheduled') return { status: { $in: ['active', 'scheduled'] }, startDate: { $gt: now } };
  if (status === 'expired') return { endDate: { $lt: now } };
  return { status };
};

export const getMarketingDashboard = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const now = new Date();
    const current = currentScheduleFilter(now);
    const [totalCampaigns, activeCampaigns, scheduledCampaigns, totalBanners, activeBanners, scheduledBanners, expiredPromotions, recentCampaigns, recentBanners] = await Promise.all([
      Campaign.countDocuments(),
      Campaign.countDocuments({ status: { $in: ['active', 'scheduled'] }, ...current }),
      Campaign.countDocuments({ status: { $in: ['active', 'scheduled'] }, startDate: { $gt: now } }),
      Banner.countDocuments(),
      Banner.countDocuments({ status: { $in: ['active', 'scheduled'] }, ...current }),
      Banner.countDocuments({ status: { $in: ['active', 'scheduled'] }, startDate: { $gt: now } }),
      Banner.countDocuments({ endDate: { $lt: now } }),
      populateCampaign(Campaign.find().sort({ updatedAt: -1 }).limit(5)),
      populateBanner(Banner.find().sort({ updatedAt: -1 }).limit(5))
    ]);
    res.json({ success: true, dashboard: { totalCampaigns, activeCampaigns, scheduledCampaigns, totalBanners, activeBanners, scheduledBanners, expiredPromotions, recentCampaigns: recentCampaigns.map(serializeCampaign), recentBanners: recentBanners.map(serializeBanner) } });
  } catch (error) { return sendErrorResponse(res, error, 'Unable to load the Marketing overview.'); }
};

export const getCampaigns = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const { search = '', status = 'all', type = 'all', from, to, page = 1, limit = 25 } = req.query;
    const conditions = [];
    if (search.trim()) { const pattern = new RegExp(escapeRegex(search.trim()), 'i'); conditions.push({ $or: [{ name: pattern }, { code: pattern }, { targetAudience: pattern }] }); }
    if (status !== 'all') conditions.push(campaignStatusQuery(status));
    if (type !== 'all') conditions.push({ type });
    if (from || to) {
      const start = parseDate(from || '1970-01-01', 'campaign filter start');
      const end = parseDate(to || '9999-12-31', 'campaign filter end', { endOfDay: true });
      conditions.push({ $or: [{ startDate: { $gte: start, $lte: end } }, { endDate: { $gte: start, $lte: end } }, { startDate: { $lte: start }, endDate: { $gte: end } }] });
    }
    const filter = conditions.length ? { $and: conditions } : {};
    const pageNumber = Math.max(1, Number(page) || 1); const pageSize = Math.min(100, Math.max(1, Number(limit) || 25));
    const [campaigns, total] = await Promise.all([populateCampaign(Campaign.find(filter).sort({ updatedAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize)), Campaign.countDocuments(filter)]);
    res.json({ success: true, campaigns: campaigns.map(serializeCampaign), types: Campaign.schema.path('type').enumValues, statuses: Campaign.schema.path('status').enumValues, pagination: { page: pageNumber, limit: pageSize, total, pages: Math.ceil(total / pageSize) } });
  } catch (error) { return sendErrorResponse(res, error, 'Unable to load campaigns.'); }
};

export const getCampaignById = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const campaign = mongoose.Types.ObjectId.isValid(req.params.id) ? await populateCampaign(Campaign.findById(req.params.id)) : null;
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });
    res.json({ success: true, campaign: serializeCampaign(campaign) });
  } catch (error) { return sendErrorResponse(res, error, 'Unable to load the campaign.'); }
};

const campaignInput = (body, existing = {}) => {
  const name = String(body.name ?? existing.name ?? '').trim(); const code = String(body.code ?? existing.code ?? '').trim().toUpperCase();
  if (!name || !code) throw Object.assign(new Error('Campaign name and code are required.'), { status: 400 });
  const startDate = parseDate(body.startDate === '' ? null : body.startDate ?? existing.startDate, 'campaign start date');
  const endDate = parseDate(body.endDate === '' ? null : body.endDate ?? existing.endDate, 'campaign end date', { endOfDay: true });
  validateSchedule(startDate, endDate);
  const requestedStatus = String(body.status ?? existing.status ?? 'draft');
  if (!Campaign.schema.path('status').enumValues.includes(requestedStatus)) throw Object.assign(new Error('Unsupported campaign status.'), { status: 400 });
  const type = String(body.type ?? existing.type ?? 'other');
  if (!Campaign.schema.path('type').enumValues.includes(type)) throw Object.assign(new Error('Unsupported campaign type.'), { status: 400 });
  const budget = Number(body.budget ?? existing.budget ?? 0);
  if (!Number.isFinite(budget) || budget < 0) throw Object.assign(new Error('Campaign budget must be zero or greater.'), { status: 400 });
  const spend = Number(body.spend ?? existing.spend ?? 0);
  if (!Number.isFinite(spend) || spend < 0) throw Object.assign(new Error('Actual spend must be zero or greater.'), { status: 400 });
  const landingPath = String(body.landingPath ?? existing.landingPath ?? '/').trim() || '/';
  if (!landingPath.startsWith('/') || landingPath.startsWith('//') || /^\/\\/.test(landingPath)) throw Object.assign(new Error('Landing page must be a WanderLuxe site path.'), { status: 400 });
  const asList = (value) => Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
  return { name, code, type, status: normalizeCampaignStatus(requestedStatus, startDate, endDate), startDate, endDate, budget, spend, landingPath, utmSource: normalizeUtmValue(body.utmSource ?? existing.utmSource), utmMedium: normalizeUtmValue(body.utmMedium ?? existing.utmMedium), utmCampaign: normalizeUtmValue(body.utmCampaign ?? existing.utmCampaign), targetAudience: String(body.targetAudience ?? existing.targetAudience ?? '').trim(), targetDestinations: asList(body.targetDestinations ?? existing.targetDestinations), featuredTrips: asList(body.featuredTrips ?? existing.featuredTrips), notes: String(body.notes ?? existing.notes ?? '').trim() };
};

export const createCampaign = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const input = campaignInput(req.body);
    if (await Campaign.exists({ code: input.code })) return res.status(409).json({ success: false, message: 'Campaign code already exists.' });
    const campaign = await Campaign.create({ ...input, createdBy: actorMongoId(req), updatedBy: actorMongoId(req) });
    await recordStaffActivity({ req, department: 'marketing', action: 'CAMPAIGN_CREATED', entityType: 'Campaign', entityId: campaign._id, entityKey: campaign.code, entityLabel: campaign.name, metadata: { status: campaign.status } });
    res.status(201).json({ success: true, message: 'Campaign configured.', campaign: serializeCampaign(campaign) });
  } catch (error) { return sendErrorResponse(res, error, 'Unable to create the campaign.'); }
};

export const updateCampaign = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const campaign = mongoose.Types.ObjectId.isValid(req.params.id) ? await Campaign.findById(req.params.id) : null;
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });
    const input = campaignInput(req.body, campaign.toObject());
    if (input.code !== campaign.code) return res.status(409).json({ success: false, message: 'Campaign code cannot be changed because active attribution links depend on it.' });
    const previousStatus = campaign.status;
    Object.assign(campaign, input, { updatedBy: actorMongoId(req) }); await campaign.save();
    await recordStaffActivity({ req, department: 'marketing', action: previousStatus !== campaign.status ? 'CAMPAIGN_STATUS_CHANGED' : 'CAMPAIGN_UPDATED', entityType: 'Campaign', entityId: campaign._id, entityKey: campaign.code, entityLabel: campaign.name, metadata: previousStatus !== campaign.status ? { fromStatus: previousStatus, toStatus: campaign.status } : {} });
    res.json({ success: true, message: 'Campaign updated.', campaign: serializeCampaign(campaign) });
  } catch (error) { return sendErrorResponse(res, error, 'Unable to update the campaign.'); }
};

export const deleteCampaign = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const deleted = mongoose.Types.ObjectId.isValid(req.params.id) ? await Campaign.findByIdAndDelete(req.params.id) : null;
    if (!deleted) return res.status(404).json({ success: false, message: 'Campaign not found.' });
    await recordStaffActivity({ req, department: 'marketing', action: 'CAMPAIGN_DELETED', entityType: 'Campaign', entityId: deleted._id, entityKey: deleted.code, entityLabel: deleted.name, metadata: { lastStatus: deleted.status } });
    res.json({ success: true, id: deleted._id, message: 'Campaign deleted.' });
  } catch (error) { return sendErrorResponse(res, error, 'Unable to delete the campaign.'); }
};

export const getBanners = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const { search = '', status = 'all', placement = 'all', from, to, page = 1, limit = 25 } = req.query;
    const conditions = [];
    if (search.trim()) { const pattern = new RegExp(escapeRegex(search.trim()), 'i'); conditions.push({ $or: [{ title: pattern }, { subtitle: pattern }, { tag: pattern }] }); }
    if (status !== 'all') conditions.push(bannerStatusQuery(status));
    if (placement !== 'all') conditions.push({ placement });
    if (from || to) { const start = parseDate(from || '1970-01-01', 'banner filter start'); const end = parseDate(to || '9999-12-31', 'banner filter end', { endOfDay: true }); conditions.push({ $or: [{ startDate: { $gte: start, $lte: end } }, { endDate: { $gte: start, $lte: end } }, { startDate: { $lte: start }, endDate: { $gte: end } }] }); }
    const filter = conditions.length ? { $and: conditions } : {}; const pageNumber = Math.max(1, Number(page) || 1); const pageSize = Math.min(100, Math.max(1, Number(limit) || 25));
    const [banners, total] = await Promise.all([populateBanner(Banner.find(filter).sort({ priorityOrder: 1, updatedAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize)), Banner.countDocuments(filter)]);
    res.json({ success: true, banners: banners.map(serializeBanner), placements: Banner.schema.path('placement').enumValues, statuses: [...Banner.schema.path('status').enumValues, 'expired'], pagination: { page: pageNumber, limit: pageSize, total, pages: Math.ceil(total / pageSize) } });
  } catch (error) { return sendErrorResponse(res, error, 'Unable to load banners.'); }
};

export const getActiveBanners = async (req, res) => {
  try {
    if (!requireDatabase(res, true)) return;
    const placement = String(req.query.placement || '').trim(); const filter = { status: { $in: ['active', 'scheduled'] }, ...currentScheduleFilter() };
    if (placement) {
      if (!Banner.schema.path('placement').enumValues.includes(placement)) return res.status(400).json({ success: false, message: 'Unsupported banner placement.' });
      filter.placement = placement;
    }
    const banners = await Banner.find(filter).sort({ priorityOrder: 1, updatedAt: -1 }).select('title subtitle tag imageUrl mobileImageUrl ctaText ctaLink placement priorityOrder startDate endDate');
    res.json({ success: true, banners, count: banners.length });
  } catch (error) { return sendErrorResponse(res, error, 'Unable to load promotional content.'); }
};

export const getBannerById = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const banner = mongoose.Types.ObjectId.isValid(req.params.id) ? await populateBanner(Banner.findById(req.params.id)) : null;
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found.' });
    res.json({ success: true, banner: serializeBanner(banner) });
  } catch (error) { return sendErrorResponse(res, error, 'Unable to load the banner.'); }
};

const bannerInput = async (body, existing = {}) => {
  const title = String(body.title ?? existing.title ?? '').trim();
  if (!title) throw Object.assign(new Error('Banner title is required.'), { status: 400 });
  const placement = String(body.placement ?? existing.placement ?? 'home_hero'); const requestedStatus = String(body.status ?? existing.status ?? 'inactive');
  if (!Banner.schema.path('placement').enumValues.includes(placement)) throw Object.assign(new Error('Unsupported banner placement.'), { status: 400 });
  if (!Banner.schema.path('status').enumValues.includes(requestedStatus)) throw Object.assign(new Error('Unsupported banner status.'), { status: 400 });
  const startDate = parseDate(body.startDate === '' ? null : body.startDate ?? existing.startDate, 'banner start date'); const endDate = parseDate(body.endDate === '' ? null : body.endDate ?? existing.endDate, 'banner end date', { endOfDay: true }); validateSchedule(startDate, endDate);
  let mediaAssetId = body.mediaAssetId === '' ? null : body.mediaAssetId ?? existing.mediaAssetId ?? null; let imageUrl = String(body.imageUrl ?? existing.imageUrl ?? '').trim();
  if (mediaAssetId) {
    if (!mongoose.Types.ObjectId.isValid(mediaAssetId)) throw Object.assign(new Error('Selected media asset is invalid.'), { status: 400 });
    const asset = await MediaAsset.findOne({ _id: mediaAssetId, active: true, type: 'IMAGE' });
    if (!asset) throw Object.assign(new Error('Selected media asset is unavailable.'), { status: 409 });
    imageUrl = asset.storage.secureUrl;
  }
  if (!imageUrl) throw Object.assign(new Error('Select a banner image.'), { status: 400 });
  const priorityOrder = Number(body.priorityOrder ?? existing.priorityOrder ?? 1); if (!Number.isInteger(priorityOrder) || priorityOrder < 0) throw Object.assign(new Error('Priority must be a non-negative whole number.'), { status: 400 });
  let status = requestedStatus; const now = new Date(); if (status === 'active' && startDate && startDate > now) status = 'scheduled'; if (status === 'scheduled' && (!startDate || startDate <= now)) status = 'active'; if (endDate && endDate < now) status = 'inactive';
  const ctaLink = String(body.ctaLink ?? existing.ctaLink ?? '/trips').trim();
  if (ctaLink && !ctaLink.startsWith('/') && !/^https?:\/\//i.test(ctaLink)) throw Object.assign(new Error('CTA link must be a site path or an HTTP(S) URL.'), { status: 400 });
  return { title, subtitle: String(body.subtitle ?? existing.subtitle ?? '').trim(), tag: String(body.tag ?? existing.tag ?? '').trim(), imageUrl, mediaAssetId, mobileImageUrl: String(body.mobileImageUrl ?? existing.mobileImageUrl ?? '').trim(), ctaText: String(body.ctaText ?? existing.ctaText ?? '').trim(), ctaLink, placement, status, priorityOrder, startDate, endDate, targetAudience: String(body.targetAudience ?? existing.targetAudience ?? 'All').trim() };
};

export const createBanner = async (req, res) => {
  try { if (!requireDatabase(res)) return; const input = await bannerInput(req.body); const banner = await Banner.create({ ...input, createdBy: actorMongoId(req), updatedBy: actorMongoId(req) }); await recordStaffActivity({ req, department: 'marketing', action: 'BANNER_CREATED', entityType: 'Banner', entityId: banner._id, entityKey: String(banner._id), entityLabel: banner.title, metadata: { status: banner.status, placement: banner.placement } }); res.status(201).json({ success: true, message: 'Banner configured.', banner: serializeBanner(banner) }); }
  catch (error) { return sendErrorResponse(res, error, 'Unable to create the banner.'); }
};

export const updateBanner = async (req, res) => {
  try { if (!requireDatabase(res)) return; const banner = mongoose.Types.ObjectId.isValid(req.params.id) ? await Banner.findById(req.params.id) : null; if (!banner) return res.status(404).json({ success: false, message: 'Banner not found.' }); const previousStatus = banner.status; const input = await bannerInput(req.body, banner.toObject()); Object.assign(banner, input, { updatedBy: actorMongoId(req) }); await banner.save(); await recordStaffActivity({ req, department: 'marketing', action: previousStatus !== banner.status ? 'BANNER_STATUS_CHANGED' : 'BANNER_UPDATED', entityType: 'Banner', entityId: banner._id, entityKey: String(banner._id), entityLabel: banner.title, metadata: previousStatus !== banner.status ? { fromStatus: previousStatus, toStatus: banner.status } : { placement: banner.placement } }); res.json({ success: true, message: 'Banner updated.', banner: serializeBanner(banner) }); }
  catch (error) { return sendErrorResponse(res, error, 'Unable to update the banner.'); }
};

export const deleteBanner = async (req, res) => {
  try { if (!requireDatabase(res)) return; const deleted = mongoose.Types.ObjectId.isValid(req.params.id) ? await Banner.findByIdAndDelete(req.params.id) : null; if (!deleted) return res.status(404).json({ success: false, message: 'Banner not found.' }); await recordStaffActivity({ req, department: 'marketing', action: 'BANNER_DELETED', entityType: 'Banner', entityId: deleted._id, entityKey: String(deleted._id), entityLabel: deleted.title, metadata: { lastStatus: deleted.status, placement: deleted.placement } }); res.json({ success: true, id: deleted._id, message: 'Banner deleted.' }); }
  catch (error) { return sendErrorResponse(res, error, 'Unable to delete the banner.'); }
};
