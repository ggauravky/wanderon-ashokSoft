export const CATEGORIES = Object.freeze([
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'creator', label: 'Creators' }
]);

export const RANGES = Object.freeze([
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'custom', label: 'Custom' },
  { value: 'all', label: 'All Time' }
]);

export const formatNumber = (value) => new Intl.NumberFormat('en-IN').format(Number(value || 0));
export const formatMoney = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
export const formatPercent = (value) => `${Number(value || 0).toFixed(Number(value || 0) % 1 ? 1 : 0)}%`;
export const formatChange = (value) => value === undefined || value === null ? '' : `${Number(value) >= 0 ? '+' : ''}${formatNumber(value)} vs previous period`;
export const formatDuration = (milliseconds) => {
  const minutes = Math.round(Number(milliseconds || 0) / 60000);
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};
export const formatDateTime = (value, fallback = 'No tracked activity') => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(value)) : fallback;
export const titleCase = (value) => String(value || '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
