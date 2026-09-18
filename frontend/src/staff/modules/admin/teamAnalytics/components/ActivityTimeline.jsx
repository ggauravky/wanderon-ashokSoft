import React from 'react';
import { Link } from 'react-router-dom';
import { formatDateTime, titleCase } from '../teamAnalyticsHelpers.js';

const ActivityTimeline = ({ items = [] }) => <section className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h3 className="font-semibold text-slate-950">Recent activity</h3><p className="mt-1 text-xs text-slate-500">Successful persisted actions and commercial events.</p></div>{items.length ? <ol className="divide-y divide-slate-100">{items.map((item) => <li key={`${item.id}-${item.at}`} className="flex gap-3 px-5 py-4"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500"/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><p className="text-sm font-semibold text-slate-900">{titleCase(item.action)}</p><time className="text-xs text-slate-400">{formatDateTime(item.at)}</time></div><p className="mt-1 truncate text-sm text-slate-600">{item.href ? <Link to={item.href} className="font-medium text-emerald-700 hover:underline">{item.label}</Link> : item.label}{item.detail ? ` · ${item.detail}` : ''}</p></div></li>)}</ol> : <p className="px-5 py-10 text-center text-sm text-slate-500">No activity recorded for this period.</p>}</section>;

export default ActivityTimeline;
