import React from 'react';

const AdminMetricCard = ({ label, value, icon: Icon, hint, loading = false }) => (
  <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
    <div className="flex items-start justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>{Icon && <Icon size={17} className="text-slate-400" aria-hidden="true" />}</div>
    {loading ? <div className="mt-4 h-8 w-24 animate-pulse rounded-md bg-slate-100" /> : <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>}
    {!loading && hint && <p className="mt-1.5 text-xs leading-5 text-slate-500">{hint}</p>}
  </article>
);

export default AdminMetricCard;
