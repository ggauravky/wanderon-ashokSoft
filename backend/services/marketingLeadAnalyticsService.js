import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Campaign from '../models/Campaign.js';
import Lead from '../models/Lead.js';
import Quotation from '../models/Quotation.js';

const DAY = 86_400_000;
const TZ = 'Asia/Kolkata';
const safeRate = (value, total) => total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
const money = (value) => Math.round((Number(value) || 0) * 100) / 100;
const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const dateKey = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(date));
const trendKey = (date, rangeKey) => {
  const dayKey = dateKey(date);
  if (rangeKey === 'all') return dayKey.slice(0, 7);
  if (rangeKey !== '90d') return dayKey;
  const local = new Date(`${dayKey}T00:00:00+05:30`);
  const daysFromMonday = (local.getDay() + 6) % 7;
  return dateKey(new Date(local.getTime() - daysFromMonday * DAY));
};

const indiaBoundary = (value, end = false) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) throw Object.assign(new Error('Invalid analytics date range.'), { status: 400 });
  const date = new Date(`${value}T${end ? '23:59:59.999' : '00:00:00.000'}+05:30`);
  if (Number.isNaN(date.getTime())) throw Object.assign(new Error('Invalid analytics date range.'), { status: 400 });
  return date;
};

export const parseAnalyticsRange = (query = {}, now = new Date()) => {
  const key = String(query.range || '30d').toLowerCase();
  let from = null;
  let to = now;
  if (key === 'custom') {
    from = indiaBoundary(query.from);
    to = indiaBoundary(query.to, true);
  } else if (key === 'all') {
    to = null;
  } else {
    const days = { '7d': 7, '30d': 30, '90d': 90 }[key];
    if (!days) throw Object.assign(new Error('Invalid analytics date range.'), { status: 400 });
    from = indiaBoundary(dateKey(new Date(now.getTime() - (days - 1) * DAY)));
    to = indiaBoundary(dateKey(now), true);
  }
  if (from && to && from > to) throw Object.assign(new Error('Invalid analytics date range.'), { status: 400 });
  return { key, from, to, timezone: TZ, mode: 'LEAD_COHORT' };
};

const validBooking = (booking) => !['CANCELLED', 'FAILED'].includes(booking.bookingStatus);
const campaignLabel = (lead) => lead.marketingAttribution?.campaignNameSnapshot || lead.campaign?.name || 'Direct / Unattributed';
const sourceOf = (lead) => lead.marketingAttribution?.firstTouch?.source || 'unattributed';
const mediumOf = (lead) => lead.marketingAttribution?.firstTouch?.medium || (sourceOf(lead) === 'direct' ? 'none' : 'unknown');
const stageOf = ({ lead, quotations, bookings }) => {
  const usableBookings = bookings.filter(validBooking);
  if (usableBookings.some((item) => Number(item.pricing?.amountPaid) > 0)) return 'PAID CUSTOMER';
  if (usableBookings.length) return 'BOOKING';
  if (quotations.length) return 'QUOTATION';
  if (['QUALIFIED', 'CONVERTED'].includes(lead.status)) return 'QUALIFIED';
  if (lead.status === 'LOST') return 'LOST';
  if (lead.firstContactAt || lead.contactCount > 0 || lead.callOutcomes?.length || ['CONTACTED', 'IN_PROGRESS'].includes(lead.status)) return 'CONTACTED';
  return 'NEW';
};

const makeBreakdown = () => ({ leads: 0, contacted: 0, qualified: 0, quotations: 0, bookings: 0, paying: 0, bookingValue: 0, paidRevenue: 0 });

export const summarizeMarketingCohort = (rows, range) => {
  const campaignMap = new Map();
  const sourceMap = new Map();
  const captureMap = new Map();
  const destinationMap = new Map();
  const lostMap = new Map();
  const creativeMap = new Map();
  const keywordMap = new Map();
  const trendMap = new Map();
  const firstContactMinutes = [];
  const leadToBookingHours = [];
  const currencies = new Map();
  let contactedLeads = 0; let qualifiedLeads = 0; let quotationLeads = 0; let approvedQuotationLeads = 0;
  let bookingLeads = 0; let payingCustomers = 0; let fullyPaidCustomers = 0; let lostLeads = 0; let attributed = 0;

  const add = (map, key, facts, meta = {}) => {
    const row = map.get(key) || { key, ...meta, ...makeBreakdown() };
    row.leads += 1;
    for (const field of ['contacted', 'qualified', 'quotations', 'bookings', 'paying']) row[field] += facts[field] ? 1 : 0;
    row.bookingValue = money(row.bookingValue + facts.bookingValue);
    row.paidRevenue = money(row.paidRevenue + facts.paidRevenue);
    map.set(key, row);
  };

  const recentLeads = rows.map((entry) => {
    const lead = entry.lead || entry;
    const quotations = entry.quotations || [];
    const bookings = (entry.bookings || []).filter(validBooking);
    const hasContact = Boolean(lead.firstContactAt || lead.contactCount > 0 || lead.callOutcomes?.length || ['CONTACTED', 'IN_PROGRESS', 'QUALIFIED', 'CONVERTED'].includes(lead.status));
    const hasQualified = ['QUALIFIED', 'CONVERTED'].includes(lead.status) || quotations.length > 0 || bookings.length > 0;
    const hasQuotation = quotations.length > 0;
    const hasApproved = quotations.some((item) => item.approvedRevisionId || item.status === 'APPROVED' || item.status === 'CONVERTED');
    const hasBooking = bookings.length > 0;
    const hasPaid = bookings.some((item) => Number(item.pricing?.amountPaid) > 0);
    const fullyPaid = bookings.some((item) => item.paymentStatus === 'PAID');
    const inrBookings = bookings.filter((item) => (item.pricing?.currency || 'INR') === 'INR');
    const bookingValue = inrBookings.reduce((sum, item) => sum + (Number(item.pricing?.finalAmount) || 0), 0);
    const paidRevenue = inrBookings.reduce((sum, item) => sum + Math.max(0, Number(item.pricing?.amountPaid) || 0), 0);
    const facts = { contacted: hasContact, qualified: hasQualified, quotations: hasQuotation, bookings: hasBooking, paying: hasPaid, bookingValue, paidRevenue };
    contactedLeads += hasContact ? 1 : 0; qualifiedLeads += hasQualified ? 1 : 0; quotationLeads += hasQuotation ? 1 : 0;
    approvedQuotationLeads += hasApproved ? 1 : 0; bookingLeads += hasBooking ? 1 : 0; payingCustomers += hasPaid ? 1 : 0;
    fullyPaidCustomers += fullyPaid ? 1 : 0; lostLeads += lead.status === 'LOST' ? 1 : 0;
    const source = sourceOf(lead); const medium = mediumOf(lead);
    if (source && !['direct', 'unattributed'].includes(source)) attributed += 1;
    if (lead.firstContactAt && new Date(lead.firstContactAt) >= new Date(lead.createdAt)) firstContactMinutes.push((new Date(lead.firstContactAt) - new Date(lead.createdAt)) / 60_000);
    if (bookings.length) {
      const first = [...bookings].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
      if (new Date(first.createdAt) >= new Date(lead.createdAt)) leadToBookingHours.push((new Date(first.createdAt) - new Date(lead.createdAt)) / 3_600_000);
    }
    bookings.forEach((item) => {
      const currency = item.pricing?.currency || 'INR';
      const current = currencies.get(currency) || { currency, bookingValue: 0, paidRevenue: 0 };
      current.bookingValue += Number(item.pricing?.finalAmount) || 0; current.paidRevenue += Math.max(0, Number(item.pricing?.amountPaid) || 0);
      currencies.set(currency, current);
    });
    const campaignKey = String(lead.marketingAttribution?.campaignId || 'unattributed');
    add(campaignMap, campaignKey, facts, { campaignId: campaignKey === 'unattributed' ? null : campaignKey, campaign: campaignLabel(lead), code: lead.marketingAttribution?.campaignCodeSnapshot || '', source, medium, spend: Number(lead.campaign?.spend) || 0 });
    add(sourceMap, `${source}|${medium}`, facts, { source, medium });
    add(captureMap, lead.source || 'unknown', facts, { capturePoint: lead.source || 'unknown' });
    add(destinationMap, lead.destination || 'Unspecified', facts, { destination: lead.destination || 'Unspecified' });
    if (lead.status === 'LOST') lostMap.set(lead.lostReason || 'Unspecified', (lostMap.get(lead.lostReason || 'Unspecified') || 0) + 1);
    const creative = lead.marketingAttribution?.firstTouch?.content; if (creative) add(creativeMap, creative, facts, { creative });
    const term = lead.marketingAttribution?.firstTouch?.term; if (term) add(keywordMap, term, facts, { term });
    const acquired = trendKey(lead.createdAt, range.key); const trend = trendMap.get(acquired) || { date: acquired, leads: 0, bookings: 0, paying: 0 };
    trend.leads += 1; trend.bookings += hasBooking ? 1 : 0; trend.paying += hasPaid ? 1 : 0; trendMap.set(acquired, trend);
    return { referenceId: lead.referenceId, acquiredAt: lead.createdAt, destination: lead.destination || 'Unspecified', source, medium, campaign: campaignLabel(lead), stage: stageOf({ lead, quotations, bookings }), hasQuotation, hasBooking, paymentState: hasPaid ? (fullyPaid ? 'PAID' : 'PARTIALLY PAID') : 'UNPAID' };
  }).sort((a, b) => new Date(b.acquiredAt) - new Date(a.acquiredAt)).slice(0, 15);

  const potentialLeads = rows.length;
  const currencyBreakdown = [...currencies.values()].map((item) => ({ ...item, bookingValue: money(item.bookingValue), paidRevenue: money(item.paidRevenue) }));
  const primary = currencyBreakdown.find((item) => item.currency === 'INR') || { currency: 'INR', bookingValue: 0, paidRevenue: 0 };
  const finalize = (row) => ({ ...row, leadToPaidRate: safeRate(row.paying, row.leads), costPerLead: row.spend > 0 && row.leads ? money(row.spend / row.leads) : null, customerAcquisitionCost: row.spend > 0 && row.paying ? money(row.spend / row.paying) : null, paidRoas: row.spend > 0 ? Math.round((row.paidRevenue / row.spend) * 100) / 100 : null });
  const funnel = [
    ['Potential Customers', potentialLeads], ['Contacted', contactedLeads], ['Qualified', qualifiedLeads], ['Quotation', quotationLeads], ['Booking', bookingLeads], ['Paying Customer', payingCustomers]
  ].map(([stage, count]) => ({ stage, count, cohortRate: safeRate(count, potentialLeads) }));
  return {
    range,
    summary: { potentialLeads, contactedLeads, qualifiedLeads, quotationLeads, approvedQuotationLeads, bookingLeads, payingCustomers, fullyPaidCustomers, lostLeads, leadToBookingRate: safeRate(bookingLeads, potentialLeads), leadToPaidRate: safeRate(payingCustomers, potentialLeads), bookingValue: money(primary.bookingValue), paidRevenue: money(primary.paidRevenue), currency: primary.currency, currencyBreakdown, averageFirstContactMinutes: mean(firstContactMinutes), averageLeadToBookingHours: mean(leadToBookingHours), attributionCoverage: safeRate(attributed, potentialLeads) },
    funnel,
    trend: [...trendMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
    campaignBreakdown: [...campaignMap.values()].map(finalize).sort((a, b) => b.leads - a.leads),
    sourceBreakdown: [...sourceMap.values()].map(finalize).sort((a, b) => b.leads - a.leads),
    capturePointBreakdown: [...captureMap.values()].map(finalize).sort((a, b) => b.leads - a.leads),
    destinationBreakdown: [...destinationMap.values()].map(finalize).sort((a, b) => b.leads - a.leads),
    lostReasonBreakdown: [...lostMap].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
    creativeBreakdown: [...creativeMap.values()].map(finalize).sort((a, b) => b.leads - a.leads),
    keywordBreakdown: [...keywordMap.values()].map(finalize).sort((a, b) => b.leads - a.leads),
    recentLeads
  };
};

export const getMarketingLeadAnalytics = async (query = {}) => {
  const range = parseAnalyticsRange(query);
  const match = {};
  if (range.from || range.to) match.createdAt = { ...(range.from ? { $gte: range.from } : {}), ...(range.to ? { $lte: range.to } : {}) };
  if (query.campaignId === 'unattributed') match['marketingAttribution.campaignId'] = null;
  else if (query.campaignId) {
    if (!mongoose.Types.ObjectId.isValid(query.campaignId)) throw Object.assign(new Error('Invalid campaign filter.'), { status: 400 });
    if (!await Campaign.exists({ _id: query.campaignId })) throw Object.assign(new Error('Campaign not found.'), { status: 404 });
    match['marketingAttribution.campaignId'] = new mongoose.Types.ObjectId(query.campaignId);
  }
  if (query.source) match['marketingAttribution.firstTouch.source'] = query.source;
  if (query.medium) match['marketingAttribution.firstTouch.medium'] = query.medium;
  if (query.destination) match.destination = query.destination;
  if (query.leadType) match.leadType = query.leadType;

  const rows = await Lead.aggregate([
    { $match: match },
    { $lookup: { from: Quotation.collection.name, localField: '_id', foreignField: 'leadId', as: 'quotations', pipeline: [{ $project: { status: 1, approvedRevisionId: 1, createdAt: 1 } }] } },
    { $lookup: { from: Booking.collection.name, localField: '_id', foreignField: 'leadId', as: 'bookings', pipeline: [{ $project: { bookingStatus: 1, paymentStatus: 1, pricing: 1, createdAt: 1 } }] } },
    { $lookup: { from: Campaign.collection.name, localField: 'marketingAttribution.campaignId', foreignField: '_id', as: 'campaign', pipeline: [{ $project: { name: 1, code: 1, spend: 1 } }] } },
    { $set: { campaign: { $first: '$campaign' } } },
    { $project: { referenceId: 1, createdAt: 1, firstContactAt: 1, contactCount: 1, callOutcomes: 1, status: 1, lostReason: 1, destination: 1, leadType: 1, source: 1, marketingAttribution: 1, quotations: 1, bookings: 1, campaign: 1 } }
  ]);
  return { success: true, filters: { campaignId: query.campaignId || null, source: query.source || 'all', medium: query.medium || 'all', destination: query.destination || 'all', leadType: query.leadType || 'all' }, ...summarizeMarketingCohort(rows.map((lead) => ({ lead, quotations: lead.quotations, bookings: lead.bookings })), range) };
};

export const getMarketingLeadAnalyticsOptions = async () => {
  const [campaigns, values] = await Promise.all([
    Campaign.find().select('_id name code status utmSource utmMedium utmCampaign').sort({ name: 1 }).lean(),
    Lead.aggregate([{ $facet: {
      sources: [{ $group: { _id: '$marketingAttribution.firstTouch.source' } }],
      mediums: [{ $group: { _id: '$marketingAttribution.firstTouch.medium' } }],
      destinations: [{ $group: { _id: '$destination' } }],
      leadTypes: [{ $group: { _id: '$leadType' } }]
    } }])
  ]);
  const list = (key) => (values[0]?.[key] || []).map((item) => item._id).filter(Boolean).sort();
  return { success: true, options: { campaigns, sources: list('sources'), mediums: list('mediums'), destinations: list('destinations'), leadTypes: list('leadTypes') } };
};
