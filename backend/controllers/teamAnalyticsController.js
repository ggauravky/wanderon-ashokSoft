import mongoose from 'mongoose';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import FollowUp from '../models/FollowUp.js';
import Quotation from '../models/Quotation.js';
import QuotationEvent from '../models/QuotationEvent.js';
import QuotationRevision from '../models/QuotationRevision.js';
import QuotationShare from '../models/QuotationShare.js';
import Booking from '../models/Booking.js';
import Campaign from '../models/Campaign.js';
import Banner from '../models/Banner.js';
import Coupon from '../models/Coupon.js';
import Payout from '../models/Payout.js';
import Commission from '../models/Commission.js';
import StaffActivityEvent from '../models/StaffActivityEvent.js';
import { sendErrorResponse } from '../utils/httpResponse.js';
import {
  CATEGORY_ROLE,
  CREATOR_ATTRIBUTION,
  MARKETING_ATTRIBUTION,
  SALES_ATTRIBUTION,
  dateMatch,
  inRange,
  resolveAnalyticsRange
} from '../services/teamAnalyticsService.js';

const connected = () => mongoose.connection?.readyState === 1;
const oid = (value) => new mongoose.Types.ObjectId(String(value));
const countMap = (rows = []) => Object.fromEntries(rows.map((row) => [String(row._id || '').toLowerCase(), row.count]));
const pct = (numerator, denominator) => denominator ? Math.round((numerator / denominator) * 1000) / 10 : 0;
const sum = (rows, field) => rows.reduce((total, row) => total + Number(row[field] || 0), 0);
const serializeRange = (range) => ({ ...range, from: range.from?.toISOString() || null, to: range.to.toISOString(), previousFrom: range.previousFrom?.toISOString() || null, previousTo: range.previousTo?.toISOString() || null });
const memberPayload = (member, category) => ({
  id: member._id,
  name: member.name,
  email: member.email,
  role: member.role,
  roleLabel: category === 'creator' ? 'Creator' : category === 'marketing' ? 'Marketing' : 'Sales',
  avatar: member.avatar || '',
  isActive: member.isActive !== false,
  ...(category === 'creator' ? { influencerStatus: member.influencerStatus, profile: member.influencerApplication || {} } : {})
});

const dateBucket = (range) => {
  const days = range.from ? (range.to - range.from) / 86400000 : Infinity;
  return days <= 31 ? 'day' : 'week';
};

const mergeTrend = (series) => {
  const points = new Map();
  series.forEach(({ key, rows }) => rows.forEach((row) => {
    const label = new Date(row._id).toISOString();
    points.set(label, { ...(points.get(label) || { date: label }), [key]: row.count });
  }));
  return [...points.values()].sort((a, b) => a.date.localeCompare(b.date));
};

const timelineItem = ({ id, at, action, label, detail = '', href = '' }) => ({ id, at, action, label, detail, href });

export const getTeamAnalyticsMembers = async (req, res) => {
  try {
    if (!connected()) return res.status(503).json({ success: false, message: 'Team analytics are unavailable while the database is disconnected.' });
    const category = String(req.query.category || '').toLowerCase();
    const role = CATEGORY_ROLE[category];
    if (!role) return res.status(400).json({ success: false, message: 'Category must be sales, marketing, or creator.' });
    const filter = { role };
    if (category === 'creator') filter.influencerStatus = 'approved';
    const members = await User.find(filter).select('name email avatar role isActive influencerStatus').sort({ isActive: -1, name: 1 }).lean();
    return res.json({ success: true, category, members });
  } catch (error) {
    return sendErrorResponse(res, error, 'Unable to load analytics members.');
  }
};

const salesAnalytics = async (userId, range) => {
  const userObjectId = oid(userId);
  const eventRange = inRange(range);
  const unit = dateBucket(range);
  const contactMatch = { 'callOutcomes.loggedBy': userObjectId, 'callOutcomes.loggedAt': eventRange };

  const [contactRows, contactLeads, followSummary, followLeadRows, quotationRows, staffEvents, staffActionCount, followEventLeadRows, previousContactRows] = await Promise.all([
    Lead.aggregate([
      { $match: { leadType: 'callback_request', callOutcomes: { $elemMatch: { loggedBy: userObjectId, loggedAt: eventRange } } } },
      { $unwind: '$callOutcomes' }, { $match: contactMatch },
      { $group: { _id: null, total: { $sum: 1 }, leadIds: { $addToSet: '$_id' }, outcomes: { $push: '$callOutcomes.outcome' }, channels: { $push: '$callOutcomes.channel' } } }
    ]),
    Lead.aggregate([
      { $match: { leadType: 'callback_request', callOutcomes: { $elemMatch: { loggedBy: userObjectId, loggedAt: eventRange } } } },
      { $project: { destination: 1, status: 1, convertedBookingId: 1, firstOutcome: { $arrayElemAt: [{ $sortArray: { input: '$callOutcomes', sortBy: { loggedAt: 1 } } }, 0] }, createdAt: 1 } },
      { $match: { 'firstOutcome.loggedBy': userObjectId, 'firstOutcome.loggedAt': eventRange } },
      { $project: { responseMs: { $subtract: ['$firstOutcome.loggedAt', '$createdAt'] } } },
      { $match: { responseMs: { $gte: 0 } } },
      { $group: { _id: null, averageMs: { $avg: '$responseMs' }, count: { $sum: 1 } } }
    ]),
    FollowUp.aggregate([
      { $match: { $or: [{ salesUserId: userObjectId }, { createdBy: userObjectId }, { completedBy: userObjectId }] } },
      { $group: {
        _id: null,
        created: { $sum: { $cond: [{ $and: [{ $eq: ['$createdBy', userObjectId] }, { $gte: ['$createdAt', range.from || new Date(0)] }, { $lte: ['$createdAt', range.to] }] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $and: [{ $eq: ['$completedBy', userObjectId] }, { $gte: ['$completedAt', range.from || new Date(0)] }, { $lte: ['$completedAt', range.to] }] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        overdue: { $sum: { $cond: [{ $or: [{ $eq: ['$status', 'missed'] }, { $and: [{ $eq: ['$status', 'pending'] }, { $lt: ['$scheduledAt', new Date()] }] }] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        rescheduled: { $sum: { $cond: [{ $eq: ['$status', 'rescheduled'] }, 1, 0] } }
      } }
    ]),
    FollowUp.aggregate([
      { $match: { $or: [
        { createdBy: userObjectId, createdAt: eventRange },
        { completedBy: userObjectId, completedAt: eventRange }
      ] } },
      { $group: { _id: null, leadIds: { $addToSet: '$leadId' } } }
    ]),
    Quotation.aggregate([{ $match: { createdBy: userObjectId, ...dateMatch('createdAt', range) } }, { $group: { _id: null, ids: { $push: '$_id' }, leadIds: { $addToSet: '$leadId' }, created: { $sum: 1 } } }]),
    StaffActivityEvent.find({ actorId: userObjectId, department: 'sales', ...dateMatch('createdAt', range) }).sort({ createdAt: -1 }).limit(20).lean(),
    StaffActivityEvent.countDocuments({ actorId: userObjectId, department: 'sales', ...dateMatch('createdAt', range) }),
    StaffActivityEvent.aggregate([{ $match: { actorId: userObjectId, department: 'sales', entityType: 'FollowUp', ...dateMatch('createdAt', range) } }, { $group: { _id: '$entityKey' } }]),
    range.previousFrom ? Lead.aggregate([{ $match: { leadType: 'callback_request', callOutcomes: { $elemMatch: { loggedBy: userObjectId, loggedAt: { $gte: range.previousFrom, $lte: range.previousTo } } } } }, { $unwind: '$callOutcomes' }, { $match: { 'callOutcomes.loggedBy': userObjectId, 'callOutcomes.loggedAt': { $gte: range.previousFrom, $lte: range.previousTo } } }, { $count: 'count' }]) : []
  ]);

  const contact = contactRows[0] || { total: 0, leadIds: [], outcomes: [], channels: [] };
  const quote = quotationRows[0] || { ids: [], leadIds: [], created: 0 };
  const follow = followSummary[0] || { created: 0, completed: 0, pending: 0, overdue: 0, cancelled: 0, rescheduled: 0 };
  const followEventLeadIds = followEventLeadRows.map((row) => row._id).filter((value) => mongoose.Types.ObjectId.isValid(value));
  const touchedIds = [...new Set([...contact.leadIds, ...(followLeadRows[0]?.leadIds || []), ...followEventLeadIds, ...quote.leadIds].filter(Boolean).map(String))].map(oid);
  const outcomes = contact.outcomes.reduce((acc, value) => ({ ...acc, [value]: (acc[value] || 0) + 1 }), {});
  const channels = contact.channels.reduce((acc, value) => ({ ...acc, [value]: (acc[value] || 0) + 1 }), {});
  const callOutcomeKeys = ['CONNECTED', 'NO_ANSWER', 'BUSY', 'CALL_LATER', 'WRONG_NUMBER'];
  const callActions = callOutcomeKeys.reduce((total, key) => total + Number(outcomes[key] || 0), 0);

  const [leadBreakdown, bookingRows, quoteEventRows, revisions, shares, contactsTrend, followsTrend, quotesTrend, bookingTrend, recentQuoteEvents] = await Promise.all([
    touchedIds.length ? Lead.aggregate([
      { $match: { _id: { $in: touchedIds }, leadType: 'callback_request' } },
      { $facet: {
        stages: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        destinations: [{ $group: { _id: { $ifNull: ['$destination', 'Not specified'] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }],
        assisted: [{ $match: { $or: [{ status: 'CONVERTED' }, { convertedBookingId: { $ne: null } }] } }, { $count: 'count' }]
      } }
    ]) : [],
    quote.ids.length ? Booking.aggregate([
      { $match: { sourceQuotationId: { $in: quote.ids }, ...dateMatch('createdAt', range), bookingStatus: { $nin: ['CANCELLED', 'FAILED'] } } },
      { $group: { _id: null, count: { $sum: 1 }, customers: { $addToSet: { $ifNull: ['$userId', '$customer.email'] } }, paidCustomers: { $addToSet: { $cond: [{ $in: ['$paymentStatus', ['PAID', 'PARTIALLY_PAID']] }, { $ifNull: ['$userId', '$customer.email'] }, '$$REMOVE'] } }, paidRevenue: { $sum: '$pricing.amountPaid' }, bookingValue: { $sum: '$pricing.finalAmount' } } }
    ]) : [],
    quote.ids.length ? QuotationEvent.aggregate([{ $match: { quotationId: { $in: quote.ids }, ...dateMatch('createdAt', range) } }, { $group: { _id: '$type', count: { $sum: 1 } } }]) : [],
    QuotationRevision.countDocuments({ createdBy: userObjectId, ...dateMatch('createdAt', range) }),
    QuotationShare.countDocuments({ createdBy: userObjectId, ...dateMatch('createdAt', range) }),
    Lead.aggregate([{ $match: { leadType: 'callback_request' } }, { $unwind: '$callOutcomes' }, { $match: contactMatch }, { $group: { _id: { $dateTrunc: { date: '$callOutcomes.loggedAt', unit, timezone: 'Asia/Kolkata' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    FollowUp.aggregate([{ $match: { completedBy: userObjectId, completedAt: eventRange } }, { $group: { _id: { $dateTrunc: { date: '$completedAt', unit, timezone: 'Asia/Kolkata' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Quotation.aggregate([{ $match: { createdBy: userObjectId, ...dateMatch('createdAt', range) } }, { $group: { _id: { $dateTrunc: { date: '$createdAt', unit, timezone: 'Asia/Kolkata' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    quote.ids.length ? Booking.aggregate([{ $match: { sourceQuotationId: { $in: quote.ids }, ...dateMatch('createdAt', range), bookingStatus: { $nin: ['CANCELLED', 'FAILED'] } } }, { $group: { _id: { $dateTrunc: { date: '$createdAt', unit, timezone: 'Asia/Kolkata' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]) : [],
    QuotationEvent.find({ actorId: userObjectId, ...dateMatch('createdAt', range) }).sort({ createdAt: -1 }).limit(20).populate('quotationId', 'quotationNumber').lean()
  ]);

  const stages = countMap(leadBreakdown[0]?.stages);
  const assisted = leadBreakdown[0]?.assisted?.[0]?.count || 0;
  const booking = bookingRows[0] || { count: 0, customers: [], paidCustomers: [], paidRevenue: 0, bookingValue: 0 };
  const eventCounts = countMap(quoteEventRows);
  const recentActivity = [
    ...staffEvents.map((event) => timelineItem({ id: event._id, at: event.createdAt, action: event.action, label: event.entityLabel || event.entityKey || event.entityType, detail: event.metadata?.outcome || '', href: event.entityType === 'Lead' ? `/staff/sales/expert-requests?leadId=${event.entityId}` : '' })),
    ...recentQuoteEvents.map((event) => timelineItem({ id: event._id, at: event.createdAt, action: event.type, label: event.quotationId?.quotationNumber || 'Quotation', href: event.quotationId?._id ? `/staff/sales/quotations/${event.quotationId._id}` : '' }))
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 30);

  return {
    summary: {
      uniqueTravelersContacted: contact.leadIds.length,
      contactActions: contact.total,
      connectedConversations: outcomes.CONNECTED || 0,
      connectionRate: pct(outcomes.CONNECTED || 0, callActions),
      uniqueLeadsTouched: touchedIds.length,
      assistedConversions: assisted,
      quotationsCreated: quote.created,
      bookingsGenerated: booking.count,
      customersConverted: booking.customers.length,
      paidCustomers: booking.paidCustomers.length,
      paidRevenue: booking.paidRevenue,
      bookingValue: booking.bookingValue,
      trackedActions: staffActionCount + sum(quoteEventRows, 'count'),
      recordsWorkedOn: touchedIds.length + quote.ids.length,
      lastActivity: recentActivity[0]?.at || null
    },
    breakdowns: {
      channels: { calls: channels.call || 0, whatsapp: channels.whatsapp || 0, email: channels.email || 0, other: channels.other || 0 },
      outcomes,
      followUps: { ...follow, completionRate: pct(follow.completed, follow.created) },
      averageFirstResponseMs: Math.round(contactLeads[0]?.averageMs || 0),
      firstResponseLeadCount: contactLeads[0]?.count || 0,
      stages,
      topDestinations: leadBreakdown[0]?.destinations || [],
      quotations: {
        revisionsCreated: revisions,
        sharesCreated: shares,
        customerViews: eventCounts.public_viewed || 0,
        customerApprovals: (eventCounts.customer_approved || 0) + (eventCounts.admin_approval_override || 0),
        changeRequests: eventCounts.customer_changes_requested || 0,
        bookingConversions: eventCounts.booking_created || booking.count,
        assistedLeadConversionRate: pct(assisted, touchedIds.length),
        quotationToBookingRate: pct(booking.count, quote.created)
      }
    },
    trend: mergeTrend([{ key: 'contacts', rows: contactsTrend }, { key: 'followUpsCompleted', rows: followsTrend }, { key: 'quotations', rows: quotesTrend }, { key: 'bookings', rows: bookingTrend }]),
    comparisons: range.previousFrom ? { contactActions: contact.total - Number(previousContactRows[0]?.count || 0) } : {},
    recentActivity,
    dataAvailability: {},
    attribution: SALES_ATTRIBUTION
  };
};

const marketingAnalytics = async (userId, range) => {
  const userObjectId = oid(userId);
  const unit = dateBucket(range);
  const [eventStatsRows, events, previousEventCount] = await Promise.all([
    StaffActivityEvent.aggregate([{ $match: { actorId: userObjectId, department: 'marketing', ...dateMatch('createdAt', range) } }, { $group: { _id: null, total: { $sum: 1 }, campaignActions: { $sum: { $cond: [{ $eq: ['$entityType', 'Campaign'] }, 1, 0] } }, bannerActions: { $sum: { $cond: [{ $eq: ['$entityType', 'Banner'] }, 1, 0] } }, campaignIds: { $addToSet: { $cond: [{ $and: [{ $eq: ['$entityType', 'Campaign'] }, { $ne: ['$entityId', null] }] }, '$entityId', '$$REMOVE'] } }, bannerIds: { $addToSet: { $cond: [{ $and: [{ $eq: ['$entityType', 'Banner'] }, { $ne: ['$entityId', null] }] }, '$entityId', '$$REMOVE'] } } } }]),
    StaffActivityEvent.find({ actorId: userObjectId, department: 'marketing', ...dateMatch('createdAt', range) }).sort({ createdAt: -1 }).limit(30).lean(),
    range.previousFrom ? StaffActivityEvent.countDocuments({ actorId: userObjectId, department: 'marketing', createdAt: { $gte: range.previousFrom, $lte: range.previousTo } }) : 0
  ]);
  const eventStats = eventStatsRows[0] || { total: 0, campaignActions: 0, bannerActions: 0, campaignIds: [], bannerIds: [] };
  const campaignEventIds = eventStats.campaignIds || [];
  const bannerEventIds = eventStats.bannerIds || [];
  const campaignFilter = { $or: [{ createdBy: userObjectId, ...dateMatch('createdAt', range) }, { updatedBy: userObjectId, ...dateMatch('updatedAt', range) }, ...(campaignEventIds.length ? [{ _id: { $in: campaignEventIds } }] : [])] };
  const bannerFilter = { $or: [{ createdBy: userObjectId, ...dateMatch('createdAt', range) }, { updatedBy: userObjectId, ...dateMatch('updatedAt', range) }, ...(bannerEventIds.length ? [{ _id: { $in: bannerEventIds } }] : [])] };
  const [campaignRows, bannerRows, trendRows] = await Promise.all([
    Campaign.aggregate([{ $match: campaignFilter }, { $group: { _id: null, ids: { $addToSet: '$_id' }, budget: { $sum: '$budget' }, statuses: { $push: '$status' }, created: { $sum: { $cond: [{ $and: [{ $eq: ['$createdBy', userObjectId] }, { $gte: ['$createdAt', range.from || new Date(0)] }, { $lte: ['$createdAt', range.to] }] }, 1, 0] } }, activeAuthored: { $sum: { $cond: [{ $and: [{ $eq: ['$createdBy', userObjectId] }, { $eq: ['$status', 'active'] }] }, 1, 0] } } } }]),
    Banner.aggregate([{ $match: bannerFilter }, { $project: { createdBy: 1, statusKey: { $cond: [{ $and: ['$endDate', { $lt: ['$endDate', new Date()] }] }, 'expired', { $cond: [{ $and: [{ $in: ['$status', ['active', 'scheduled']] }, '$startDate', { $gt: ['$startDate', new Date()] }] }, 'scheduled', '$status'] }] }, createdAt: 1 } }, { $group: { _id: null, ids: { $addToSet: '$_id' }, statuses: { $push: '$statusKey' }, created: { $sum: { $cond: [{ $and: [{ $eq: ['$createdBy', userObjectId] }, { $gte: ['$createdAt', range.from || new Date(0)] }, { $lte: ['$createdAt', range.to] }] }, 1, 0] } } } }]),
    StaffActivityEvent.aggregate([{ $match: { actorId: userObjectId, department: 'marketing', ...dateMatch('createdAt', range) } }, { $group: { _id: { date: { $dateTrunc: { date: '$createdAt', unit, timezone: 'Asia/Kolkata' } }, entityType: '$entityType' }, count: { $sum: 1 }, activated: { $sum: { $cond: [{ $in: ['$action', ['CAMPAIGN_STATUS_CHANGED', 'BANNER_STATUS_CHANGED']] }, 1, 0] } } } }, { $group: { _id: '$_id.date', campaignActions: { $sum: { $cond: [{ $eq: ['$_id.entityType', 'Campaign'] }, '$count', 0] } }, bannerActions: { $sum: { $cond: [{ $eq: ['$_id.entityType', 'Banner'] }, '$count', 0] } }, recordsActivated: { $sum: '$activated' } } }, { $sort: { _id: 1 } }])
  ]);
  const campaign = campaignRows[0] || { ids: [], statuses: [], budget: 0, created: 0 };
  const banner = bannerRows[0] || { ids: [], statuses: [], created: 0 };
  const campaignStatuses = campaign.statuses.reduce((acc, status) => ({ ...acc, [status]: (acc[status] || 0) + 1 }), {});
  const bannerStatuses = banner.statuses.reduce((acc, status) => ({ ...acc, [status]: (acc[status] || 0) + 1 }), {});
  const campaignActions = eventStats.campaignActions;
  const bannerActions = eventStats.bannerActions;
  const recentActivity = events.slice(0, 30).map((event) => timelineItem({ id: event._id, at: event.createdAt, action: event.action, label: event.entityLabel || event.entityKey || event.entityType, href: event.entityId ? `/staff/marketing/${event.entityType === 'Campaign' ? 'campaigns' : 'banners'}/${event.entityId}/edit` : '' }));
  return {
    summary: { campaignsCreated: campaign.created, campaignsWorkedOn: campaign.ids.length, campaignActions, bannersCreated: banner.created, bannersWorkedOn: banner.ids.length, bannerActions, activeCampaignsAuthored: campaign.activeAuthored || 0, scheduledCampaigns: campaignStatuses.scheduled || 0, completedCampaigns: campaignStatuses.completed || 0, activePromotions: bannerStatuses.active || 0, scheduledPromotions: bannerStatuses.scheduled || 0, totalMarketingActions: eventStats.total, configuredCampaignBudget: campaign.budget, trackedActions: eventStats.total, recordsWorkedOn: campaign.ids.length + banner.ids.length, lastActivity: recentActivity[0]?.at || null },
    breakdowns: { campaigns: campaignStatuses, banners: bannerStatuses },
    trend: trendRows.map((row) => ({ date: row._id, campaignActions: row.campaignActions, bannerActions: row.bannerActions, recordsActivated: row.recordsActivated })),
    comparisons: range.previousFrom ? { totalMarketingActions: eventStats.total - previousEventCount } : {},
    recentActivity,
    dataAvailability: { impactTrackingAvailable: false, impactTrackingReason: 'Campaign impact counters have no verified platform tracking write path.' },
    attribution: MARKETING_ATTRIBUTION
  };
};

const creatorAnalytics = async (userId, range) => {
  const userObjectId = oid(userId);
  const unit = dateBucket(range);
  const coupons = await Coupon.find({ creatorUserId: userObjectId }).select('code status isActive usageCount totalRedemptions revenueGenerated commissionEarned startsAt endsAt').lean();
  const couponIds = coupons.map((coupon) => coupon._id);
  const couponCodes = coupons.map((coupon) => coupon.code);
  const [bookingRows, bookingByCoupon, commissionRows, payoutRows, recentBookings, recentCommissions, recentPayouts, creatorTrend, previousReferralBookings, commissionByCoupon] = await Promise.all([
    couponIds.length ? Booking.aggregate([{ $match: { 'couponRedemption.couponId': { $in: couponIds }, ...dateMatch('createdAt', range), bookingStatus: { $nin: ['CANCELLED', 'FAILED'] } } }, { $group: { _id: null, bookings: { $sum: 1 }, paidBookings: { $sum: { $cond: [{ $in: ['$paymentStatus', ['PAID', 'PARTIALLY_PAID']] }, 1, 0] } }, referralRevenue: { $sum: '$pricing.finalAmount' }, collectedRevenue: { $sum: '$pricing.amountPaid' } } }]) : [],
    couponIds.length ? Booking.aggregate([{ $match: { 'couponRedemption.couponId': { $in: couponIds }, ...dateMatch('createdAt', range), bookingStatus: { $nin: ['CANCELLED', 'FAILED'] } } }, { $group: { _id: '$couponRedemption.couponId', redemptions: { $sum: 1 }, revenue: { $sum: '$pricing.finalAmount' }, collectedRevenue: { $sum: '$pricing.amountPaid' } } }, { $sort: { revenue: -1 } }]) : [],
    couponCodes.length ? Commission.aggregate([{ $match: { couponCode: { $in: couponCodes }, ...dateMatch('createdAt', range) } }, { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }]) : [],
    Payout.aggregate([{ $match: { creatorUserId: userObjectId, ...dateMatch('createdAt', range) } }, { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }]),
    couponIds.length ? Booking.find({ 'couponRedemption.couponId': { $in: couponIds }, ...dateMatch('createdAt', range) }).sort({ createdAt: -1 }).limit(12).select('bookingId couponRedemption pricing paymentStatus createdAt').lean() : [],
    couponCodes.length ? Commission.find({ couponCode: { $in: couponCodes }, ...dateMatch('createdAt', range) }).sort({ createdAt: -1 }).limit(12).lean() : [],
    Payout.find({ creatorUserId: userObjectId, ...dateMatch('createdAt', range) }).sort({ createdAt: -1 }).limit(12).lean(),
    couponIds.length ? Booking.aggregate([{ $match: { 'couponRedemption.couponId': { $in: couponIds }, ...dateMatch('createdAt', range), bookingStatus: { $nin: ['CANCELLED', 'FAILED'] } } }, { $group: { _id: { $dateTrunc: { date: '$createdAt', unit, timezone: 'Asia/Kolkata' } }, redemptions: { $sum: 1 }, revenue: { $sum: '$pricing.finalAmount' }, collectedRevenue: { $sum: '$pricing.amountPaid' } } }, { $sort: { _id: 1 } }]) : [],
    couponIds.length && range.previousFrom ? Booking.countDocuments({ 'couponRedemption.couponId': { $in: couponIds }, createdAt: { $gte: range.previousFrom, $lte: range.previousTo }, bookingStatus: { $nin: ['CANCELLED', 'FAILED'] } }) : 0,
    couponCodes.length ? Commission.aggregate([{ $match: { couponCode: { $in: couponCodes }, ...dateMatch('createdAt', range), status: { $nin: ['REVERSED', 'DISPUTED'] } } }, { $group: { _id: '$couponCode', amount: { $sum: '$amount' } } }]) : []
  ]);
  const booking = bookingRows[0] || { bookings: 0, paidBookings: 0, referralRevenue: 0, collectedRevenue: 0 };
  const commissionMap = Object.fromEntries(commissionRows.map((row) => [row._id, row]));
  const payoutMap = Object.fromEntries(payoutRows.map((row) => [row._id, row]));
  const couponLookup = new Map(coupons.map((coupon) => [String(coupon._id), coupon]));
  const commissionByCode = new Map(commissionByCoupon.map((row) => [row._id, row.amount]));
  const topCoupons = bookingByCoupon.map((row) => { const coupon = couponLookup.get(String(row._id)); return { code: coupon?.code || 'Unknown', status: coupon?.status || 'unknown', redemptions: row.redemptions, revenue: row.revenue, collectedRevenue: row.collectedRevenue, commission: commissionByCode.get(coupon?.code) || 0 }; });
  const earnedStatuses = ['APPROVED', 'AVAILABLE', 'PAID'];
  const earnedCommission = earnedStatuses.reduce((total, status) => total + Number(commissionMap[status]?.amount || 0), 0);
  const paidCommission = Number(commissionMap.PAID?.amount || 0);
  const pendingCommission = ['PENDING', 'APPROVED', 'AVAILABLE'].reduce((total, status) => total + Number(commissionMap[status]?.amount || 0), 0);
  const totalPayouts = sum(payoutRows, 'count');
  const paidPayout = Number(payoutMap.PAID?.amount || 0);
  const recentActivity = [
    ...recentBookings.map((record) => timelineItem({ id: record._id, at: record.createdAt, action: 'COUPON_REDEEMED', label: record.bookingId, detail: record.paymentStatus, href: `/staff/admin/bookings/${record.bookingId}` })),
    ...recentCommissions.map((record) => timelineItem({ id: record._id, at: record.createdAt, action: 'COMMISSION_RECORDED', label: record.couponCode, detail: record.status })),
    ...recentPayouts.map((record) => timelineItem({ id: record._id, at: record.createdAt, action: `PAYOUT_${record.status}`, label: record.reference || 'Payout', detail: `${record.currency || 'INR'} ${record.amount}`, href: `/staff/admin/payouts/${record._id}` }))
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 30);
  return {
    summary: { coupons: coupons.length, activeCoupons: coupons.filter((coupon) => coupon.isActive && coupon.status === 'active').length, couponRedemptions: booking.bookings, referralBookings: booking.bookings, paidReferralBookings: booking.paidBookings, referralRevenue: booking.referralRevenue, collectedRevenue: booking.collectedRevenue, commissionEarned: earnedCommission, pendingCommission, paidCommission, payoutRequests: totalPayouts, pendingPayouts: Number(payoutMap.REQUESTED?.count || 0) + Number(payoutMap.UNDER_REVIEW?.count || 0), processingPayouts: Number(payoutMap.PROCESSING?.count || 0), paidPayouts: Number(payoutMap.PAID?.count || 0), failedOrCancelledPayouts: Number(payoutMap.FAILED?.count || 0) + Number(payoutMap.CANCELLED?.count || 0), totalPaidPayout: paidPayout, trackedActions: booking.bookings + sum(commissionRows, 'count') + totalPayouts, recordsWorkedOn: coupons.length, lastActivity: recentActivity[0]?.at || null },
    breakdowns: { payouts: Object.fromEntries(payoutRows.map((row) => [row._id, { count: row.count, amount: row.amount }])), commissions: Object.fromEntries(commissionRows.map((row) => [row._id, { count: row.count, amount: row.amount }])), topCoupons },
    trend: creatorTrend.map((row) => ({ date: row._id, redemptions: row.redemptions, revenue: row.revenue, collectedRevenue: row.collectedRevenue })),
    comparisons: range.previousFrom ? { referralBookings: booking.bookings - previousReferralBookings } : {},
    recentActivity,
    dataAvailability: { contentProductionTrackingAvailable: false },
    attribution: CREATOR_ATTRIBUTION
  };
};

export const getTeamMemberAnalytics = async (req, res) => {
  try {
    if (!connected()) return res.status(503).json({ success: false, message: 'Team analytics are unavailable while the database is disconnected.' });
    const category = String(req.query.category || '').toLowerCase();
    const expectedRole = CATEGORY_ROLE[category];
    if (!expectedRole || !mongoose.Types.ObjectId.isValid(req.params.userId)) return res.status(400).json({ success: false, message: 'Select a valid category and member.' });
    const member = await User.findById(req.params.userId).select('name email avatar role isActive influencerStatus influencerApplication').lean();
    if (!member || member.role !== expectedRole || (category === 'creator' && member.influencerStatus !== 'approved')) return res.status(400).json({ success: false, message: 'Invalid category-member combination.' });
    const range = resolveAnalyticsRange(req.query);
    const analytics = category === 'sales' ? await salesAnalytics(member._id, range) : category === 'marketing' ? await marketingAnalytics(member._id, range) : await creatorAnalytics(member._id, range);
    return res.json({ success: true, member: memberPayload(member, category), range: serializeRange(range), category, ...analytics });
  } catch (error) {
    return sendErrorResponse(res, error, 'Unable to load member analytics.');
  }
};
