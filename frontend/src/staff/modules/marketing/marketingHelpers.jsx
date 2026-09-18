export const CAMPAIGN_TYPES = ['meta_ads', 'google_ads', 'influencer', 'email', 'organic', 'festival_promo', 'other'];
export const CAMPAIGN_STATUSES = ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'];
export const BANNER_PLACEMENTS = ['home_hero', 'top_bar', 'destination_highlight', 'offer_strip', 'popup'];
export const BANNER_STATUSES = ['inactive', 'scheduled', 'active'];

export const titleCase = (value = '') => String(value).replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
export const formatDate = (value) => value ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : 'Open-ended';
export const toDateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';
export const formatMoney = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);

const tones = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', scheduled: 'bg-blue-50 text-blue-700 ring-blue-600/20', paused: 'bg-amber-50 text-amber-700 ring-amber-600/20', completed: 'bg-slate-100 text-slate-700 ring-slate-500/20', expired: 'bg-rose-50 text-rose-700 ring-rose-600/20', cancelled: 'bg-rose-50 text-rose-700 ring-rose-600/20', inactive: 'bg-slate-100 text-slate-600 ring-slate-500/20', draft: 'bg-violet-50 text-violet-700 ring-violet-600/20'
};

export const StatusBadge = ({ status }) => <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${tones[status] || tones.inactive}`}>{titleCase(status)}</span>;
export const MarketingEmptyState = ({ title, description, action }) => <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center"><h2 className="text-sm font-semibold text-slate-900">{title}</h2><p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p>{action}</div>;
