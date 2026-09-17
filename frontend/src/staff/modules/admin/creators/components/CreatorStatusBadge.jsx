import React from 'react';

const tones = { pending: 'border-amber-200 bg-amber-50 text-amber-800', approved: 'border-emerald-200 bg-emerald-50 text-emerald-800', rejected: 'border-rose-200 bg-rose-50 text-rose-800' };
const CreatorStatusBadge = ({ status }) => <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${tones[status] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>{status || 'Unknown'}</span>;

export default CreatorStatusBadge;

