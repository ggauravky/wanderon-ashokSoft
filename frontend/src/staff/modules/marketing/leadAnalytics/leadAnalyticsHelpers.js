export const formatCount = (value) => new Intl.NumberFormat('en-IN').format(Number(value) || 0);
export const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;
export const formatCurrency = (value, currency = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value) || 0);
export const formatDuration = (value, unit) => {
  if (value == null) return 'Not available';
  if (unit === 'minutes' && value >= 60) return `${(value / 60).toFixed(1)} hr`;
  if (unit === 'hours' && value >= 24) return `${(value / 24).toFixed(1)} days`;
  return `${Number(value).toFixed(1)} ${unit === 'minutes' ? 'min' : 'hr'}`;
};
export const titleCase = (value) => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

