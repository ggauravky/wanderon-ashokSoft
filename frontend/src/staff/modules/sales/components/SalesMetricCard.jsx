import React from 'react';

const SalesMetricCard = ({ label, value, description, icon: Icon, active = false, loading = false, unavailable = false, onClick }) => {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {Icon && <Icon size={16} strokeWidth={1.8} className={active ? 'text-emerald-700' : 'text-slate-400'} aria-hidden="true" />}
      </div>
      {loading ? (
        <span className="mt-3 block h-7 w-14 animate-pulse rounded bg-slate-100" aria-label="Loading metric" />
      ) : unavailable ? (
        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-400">—</p>
      ) : (
        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{Number(value || 0).toLocaleString('en-IN')}</p>
      )}
      {description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
    </>
  );

  const classes = [
    'min-h-28 rounded-xl border bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors',
    active ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200',
    onClick ? 'w-full hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-emerald-500' : ''
  ].join(' ');

  return onClick ? (
    <button type="button" onClick={onClick} className={classes}>{content}</button>
  ) : (
    <div className={classes}>{content}</div>
  );
};

export default SalesMetricCard;
