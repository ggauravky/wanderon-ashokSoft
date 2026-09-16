import React from 'react';

const tones = {
  published: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  draft: 'border-amber-200 bg-amber-50 text-amber-700',
  inactive: 'border-slate-200 bg-slate-100 text-slate-600'
};

const TripStatusBadge = ({ status }) => (
  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${tones[status] || tones.inactive}`}>
    {status || 'inactive'}
  </span>
);

export default TripStatusBadge;

