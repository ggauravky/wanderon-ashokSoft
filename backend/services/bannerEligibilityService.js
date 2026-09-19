const inWindow = (banner, now) => (!banner.startDate || new Date(banner.startDate) <= now)
  && (!banner.endDate || new Date(banner.endDate) >= now);

export const getBannerEffectiveState = (banner, now = new Date()) => {
  const storedStatus = banner.status;
  if (banner.endDate && new Date(banner.endDate) < now) return { storedStatus, effectiveStatus: 'expired', eligible: false, reason: 'EXPIRED' };
  if (storedStatus === 'inactive') return { storedStatus, effectiveStatus: 'inactive', eligible: false, reason: 'INACTIVE_MANUALLY' };
  if (banner.startDate && new Date(banner.startDate) > now) return { storedStatus, effectiveStatus: 'scheduled', eligible: false, reason: 'SCHEDULED_FOR_FUTURE' };
  if (['active', 'scheduled'].includes(storedStatus) && inWindow(banner, now)) return { storedStatus, effectiveStatus: 'active', eligible: true, reason: 'ACTIVE_IN_WINDOW' };
  return { storedStatus, effectiveStatus: 'inactive', eligible: false, reason: 'OUTSIDE_WINDOW' };
};

const currentWindow = (now) => ({ $and: [
  { $or: [{ startDate: null }, { startDate: { $exists: false } }, { startDate: { $lte: now } }] },
  { $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gte: now } }] }
] });

export const bannerStatusQuery = (status, now = new Date()) => {
  if (status === 'active') return { status: { $in: ['active', 'scheduled'] }, ...currentWindow(now) };
  if (status === 'scheduled') return { status: { $in: ['active', 'scheduled'] }, startDate: { $gt: now }, $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gte: now } }] };
  if (status === 'expired') return { endDate: { $lt: now } };
  if (status === 'inactive') return { status: 'inactive', $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gte: now } }] };
  return { status };
};

export const normalizeBannerStatus = (requestedStatus, startDate, endDate, now = new Date()) => {
  if (requestedStatus !== 'inactive' && endDate && endDate < now) {
    throw Object.assign(new Error('This banner cannot be activated because its end date has already passed. Update the schedule or remove the end date.'), { status: 400 });
  }
  if (requestedStatus === 'inactive') return 'inactive';
  if (startDate && startDate > now) return 'scheduled';
  return 'active';
};
