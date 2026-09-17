import React from 'react';
const tones = { active: 'bg-emerald-50 text-emerald-700 ring-emerald-200', paused: 'bg-amber-50 text-amber-700 ring-amber-200', expired: 'bg-slate-100 text-slate-600 ring-slate-200', revoked: 'bg-rose-50 text-rose-700 ring-rose-200' };
const DiscountStatusBadge = ({ status }) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${tones[status] || tones.paused}`}>{status || 'paused'}</span>;
export default DiscountStatusBadge;

