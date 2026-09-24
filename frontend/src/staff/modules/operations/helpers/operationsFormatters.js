export const formatOperationsDate = (value) => value
  ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(value))
  : 'Date unresolved';

export const formatOperationsWindow = (departure) => {
  if (!departure?.startDate) return 'Travel dates unresolved';
  const start = formatOperationsDate(departure.startDate);
  const end = departure.endDate ? formatOperationsDate(departure.endDate) : null;
  return end && end !== start ? `${start} – ${end}` : start;
};

export const formatOperationsMoney = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0
}).format(Number(value || 0));

export const formatStartTiming = (departure) => {
  if (departure?.operationalPhase === 'ONGOING') return 'In progress now';
  if (departure?.daysUntilStart === 0) return 'Starts today';
  if (departure?.daysUntilStart === 1) return 'Starts tomorrow';
  if (Number.isFinite(departure?.daysUntilStart) && departure.daysUntilStart > 1) return `Starts in ${departure.daysUntilStart} days`;
  return departure?.operationalPhase === 'COMPLETED' ? 'Completed' : 'Date needs review';
};

export const attentionReasonText = (reason) => reason.count > 1 ? `${reason.label} ×${reason.count}` : reason.label;
