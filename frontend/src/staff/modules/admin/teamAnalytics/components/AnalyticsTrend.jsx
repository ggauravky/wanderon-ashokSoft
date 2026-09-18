import React from 'react';
import { formatDateTime, titleCase } from '../teamAnalyticsHelpers.js';

const AnalyticsTrend = ({ title = 'Activity trend', data = [], keys = [] }) => {
  const max = Math.max(1, ...data.flatMap((row) => keys.map((key) => Number(row[key.value] || 0))));
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold text-slate-950">{title}</h3><p className="mt-1 text-xs text-slate-500">Operational records grouped by the selected period.</p></div><div className="flex flex-wrap gap-3">{keys.map((key) => <span key={key.value} className="flex items-center gap-1.5 text-xs text-slate-500"><span className={`h-2 w-2 rounded-full ${key.color}`}/>{key.label}</span>)}</div></div>
    {data.length ? <div className="mt-6 flex min-h-40 items-end gap-2 overflow-x-auto pb-1">{data.map((row, index) => <div key={row.date || row.label || index} className="flex min-w-12 flex-1 flex-col justify-end"><div className="flex h-28 items-end justify-center gap-1">{keys.map((key) => <div key={key.value} title={`${key.label}: ${row[key.value] || 0}`} className={`w-2.5 rounded-t ${key.color}`} style={{ height: `${Math.max(row[key.value] ? 6 : 1, (Number(row[key.value] || 0) / max) * 100)}%` }}/>)}</div><p className="mt-2 truncate text-center text-[10px] text-slate-400">{row.date ? formatDateTime(row.date, '').split(',')[0] : titleCase(row.label)}</p></div>)}</div> : <p className="mt-6 rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No activity recorded for this period.</p>}
  </section>;
};

export default AnalyticsTrend;
