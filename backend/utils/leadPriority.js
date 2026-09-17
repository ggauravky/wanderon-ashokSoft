const TERMINAL_STATUSES = new Set(['CONVERTED', 'LOST']);
const DAY_MS = 24 * 60 * 60 * 1000;

const validDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const utcDayStart = (date) => new Date(Date.UTC(
  date.getUTCFullYear(),
  date.getUTCMonth(),
  date.getUTCDate()
));

const addReason = (reasons, reason) => {
  if (reason && !reasons.includes(reason)) reasons.push(reason);
};

const levelForScore = (score) => {
  if (score >= 60) return 'URGENT';
  if (score >= 35) return 'HIGH';
  if (score >= 15) return 'MEDIUM';
  return 'LOW';
};

export const calculateLeadPriority = (lead, { followUps = [], now = new Date() } = {}) => {
  const status = String(lead?.status || 'NEW').toUpperCase();
  if (TERMINAL_STATUSES.has(status)) {
    return {
      effectivePriority: 'LOW',
      priorityScore: 0,
      priorityReasons: [`Closed - ${status.toLowerCase()}`],
      nextActionAt: null
    };
  }

  let score = 0;
  const reasons = [];
  const today = utcDayStart(now);
  const tomorrow = new Date(today.getTime() + DAY_MS);
  const actionDates = [];

  const callbackDate = /^\d{4}-\d{2}-\d{2}$/.test(String(lead?.preferredCallDate || ''))
    ? validDate(`${lead.preferredCallDate}T00:00:00.000Z`)
    : validDate(lead?.preferredCallDate);
  if (callbackDate) {
    actionDates.push(callbackDate);
    if (callbackDate < today) {
      score += 35;
      addReason(reasons, 'Callback overdue');
    } else if (callbackDate < tomorrow) {
      score += 20;
      addReason(reasons, 'Callback due today');
    }
  }

  const followUpDates = [
    validDate(lead?.nextFollowUpAt),
    ...followUps
      .filter((item) => ['pending', 'missed'].includes(String(item?.status || 'pending').toLowerCase()))
      .map((item) => validDate(item?.scheduledAt))
  ].filter(Boolean);
  const nextFollowUp = followUpDates.sort((a, b) => a - b)[0] || null;
  if (nextFollowUp) {
    actionDates.push(nextFollowUp);
    if (nextFollowUp < now) {
      score += 40;
      addReason(reasons, 'Follow-up overdue');
    } else if (nextFollowUp < tomorrow) {
      score += 20;
      addReason(reasons, 'Follow-up due today');
    }
  }

  const stageScores = {
    CONTACTED: [8, 'Customer contacted'],
    IN_PROGRESS: [15, 'In progress'],
    QUALIFIED: [25, 'Qualified lead']
  };
  if (stageScores[status]) {
    score += stageScores[status][0];
    addReason(reasons, stageScores[status][1]);
  }

  const outcomes = Array.isArray(lead?.callOutcomes) ? lead.callOutcomes : [];
  if (outcomes.some((item) => String(item?.outcome || '').toUpperCase() === 'CONNECTED')) {
    score += 8;
    addReason(reasons, 'Customer connected');
  }
  const unsuccessfulAttempts = outcomes.filter((item) => ['NO_ANSWER', 'BUSY'].includes(String(item?.outcome || '').toUpperCase())).length;
  const overdueActionExists = Boolean((callbackDate && callbackDate < now) || (nextFollowUp && nextFollowUp < now));
  if (unsuccessfulAttempts >= 2 && overdueActionExists) {
    score += 5;
    addReason(reasons, 'Repeated contact attempts');
  }

  const travelers = Math.max(1, Number(lead?.travelersCount) || 1);
  if (travelers >= 8) {
    score += 18;
    addReason(reasons, `${travelers} travelers`);
  } else if (travelers >= 4) {
    score += 10;
    addReason(reasons, `${travelers} travelers`);
  }

  const intentText = [lead?.message, ...(Array.isArray(lead?.topics) ? lead.topics : [])].join(' ');
  if (/corporate|custom/i.test(intentText)) {
    score += 10;
    addReason(reasons, 'Custom or corporate request');
  }
  if (/discount/i.test(intentText)) {
    score += 5;
    addReason(reasons, 'Pricing intent');
  }

  const travelDate = validDate(lead?.travelDate);
  if (travelDate && travelDate >= now) {
    const daysUntilTravel = Math.ceil((travelDate - now) / DAY_MS);
    if (daysUntilTravel <= 7) {
      score += 20;
      addReason(reasons, 'Travel within 7 days');
    } else if (daysUntilTravel <= 30) {
      score += 10;
      addReason(reasons, 'Travel within 30 days');
    }
  }

  const untouched = !lead?.firstContactAt && Number(lead?.contactCount || 0) === 0;
  const createdAt = validDate(lead?.createdAt);
  if (status === 'NEW' && untouched && createdAt) {
    const ageHours = (now - createdAt) / (60 * 60 * 1000);
    if (ageHours >= 24) {
      score += 20;
      addReason(reasons, 'New request untouched for 24+ hours');
    } else if (ageHours >= 6) {
      score += 10;
      addReason(reasons, 'New request untouched for 6+ hours');
    }
  }

  const storedPriority = String(lead?.priority || '').toUpperCase();
  if (storedPriority === 'URGENT') {
    score += 12;
    addReason(reasons, 'Marked urgent');
  } else if (storedPriority === 'HIGH') {
    score += 8;
    addReason(reasons, 'High business priority');
  }

  if (!reasons.length) reasons.push('No immediate action due');
  const nextActionAt = actionDates.sort((a, b) => a - b)[0] || null;
  return {
    effectivePriority: levelForScore(score),
    priorityScore: score,
    priorityReasons: reasons,
    nextActionAt: nextActionAt?.toISOString() || null
  };
};

export const withLeadPriority = (lead, context) => {
  const value = lead?.toObject ? lead.toObject() : { ...lead };
  return { ...value, ...calculateLeadPriority(value, context) };
};

export const compareLeadPriority = (left, right) => {
  const scoreDifference = Number(right?.priorityScore || 0) - Number(left?.priorityScore || 0);
  if (scoreDifference) return scoreDifference;
  const leftAction = validDate(left?.nextActionAt)?.getTime() ?? Number.POSITIVE_INFINITY;
  const rightAction = validDate(right?.nextActionAt)?.getTime() ?? Number.POSITIVE_INFINITY;
  if (leftAction !== rightAction) return leftAction - rightAction;
  return (validDate(left?.createdAt)?.getTime() || 0) - (validDate(right?.createdAt)?.getTime() || 0);
};
