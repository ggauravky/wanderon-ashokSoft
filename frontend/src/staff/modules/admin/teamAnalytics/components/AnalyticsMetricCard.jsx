import React from 'react';

const AnalyticsMetricCard = ({ label, value, hint }) => (
  <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
    <p className="text-xs font-semibold text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 [font-variant-numeric:tabular-nums]">{value ?? '—'}</p>
    {hint && <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>}
  </article>
);

export default AnalyticsMetricCard;
