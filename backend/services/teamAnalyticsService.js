const IST_OFFSET = '+05:30';
export const ANALYTICS_TIMEZONE = 'Asia/Kolkata';
export const CATEGORY_ROLE = Object.freeze({ sales: 'sales', marketing: 'marketing', creator: 'influencer' });

const invalidRange = (message) => Object.assign(new Error(message), { status: 400 });
const dateOnly = /^\d{4}-\d{2}-\d{2}$/;

const parseIndiaDate = (value, end = false) => {
  if (!dateOnly.test(String(value || ''))) throw invalidRange('Invalid analytics date range.');
  const [year, month, day] = String(value).split('-').map(Number);
  const calendarCheck = new Date(Date.UTC(year, month - 1, day));
  if (calendarCheck.getUTCFullYear() !== year || calendarCheck.getUTCMonth() !== month - 1 || calendarCheck.getUTCDate() !== day) {
    throw invalidRange('Invalid analytics date range.');
  }
  const parsed = new Date(`${value}T${end ? '23:59:59.999' : '00:00:00.000'}${IST_OFFSET}`);
  if (Number.isNaN(parsed.getTime())) throw invalidRange('Invalid analytics date range.');
  return parsed;
};

export const resolveAnalyticsRange = ({ range = '30d', from, to }, now = new Date()) => {
  const allowed = new Set(['7d', '30d', '90d', 'custom', 'all']);
  if (!allowed.has(range)) throw invalidRange('Unsupported analytics range.');
  if (range === 'all') return { key: range, from: null, to: now, previousFrom: null, previousTo: null, timezone: ANALYTICS_TIMEZONE };

  let start;
  let end = now;
  if (range === 'custom') {
    start = parseIndiaDate(from);
    end = parseIndiaDate(to, true);
    if (start > end) throw invalidRange('Invalid analytics date range.');
  } else {
    const days = Number(range.slice(0, -1));
    const indiaToday = new Intl.DateTimeFormat('en-CA', { timeZone: ANALYTICS_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    start = parseIndiaDate(indiaToday);
    start.setUTCDate(start.getUTCDate() - (days - 1));
  }
  const duration = end.getTime() - start.getTime() + 1;
  return {
    key: range,
    from: start,
    to: end,
    previousFrom: new Date(start.getTime() - duration),
    previousTo: new Date(start.getTime() - 1),
    timezone: ANALYTICS_TIMEZONE
  };
};

export const dateMatch = (field, range) => range.from ? { [field]: { $gte: range.from, $lte: range.to } } : { [field]: { $lte: range.to } };
export const inRange = (range) => range.from ? { $gte: range.from, $lte: range.to } : { $lte: range.to };

export const SALES_ATTRIBUTION = Object.freeze({
  travelerContacted: 'Lead.callOutcomes.loggedBy',
  followUp: 'FollowUp.salesUserId / createdBy / completedBy',
  quotationCreated: 'Quotation.createdBy',
  quotationActivity: 'QuotationEvent.actorId',
  primaryBooking: 'Booking.sourceQuotationId → Quotation.createdBy',
  assistedConversion: 'Lead touched by member + current converted state'
});

export const MARKETING_ATTRIBUTION = Object.freeze({
  authored: 'Campaign/Banner.createdBy',
  currentEditor: 'Campaign/Banner.updatedBy',
  actions: 'StaffActivityEvent.actorId',
  commercialImpact: 'Not inferred from record edits'
});

export const CREATOR_ATTRIBUTION = Object.freeze({
  coupons: 'Coupon.creatorUserId',
  bookings: 'Booking.couponRedemption.couponId',
  payouts: 'Payout.creatorUserId',
  commissions: 'Commission.couponCode matched to creator-linked Coupon records'
});
