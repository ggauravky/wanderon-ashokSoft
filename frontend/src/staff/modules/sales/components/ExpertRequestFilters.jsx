import React from 'react';
import { Search } from 'lucide-react';
import { LEAD_PRIORITIES, LEAD_STATUSES, SALES_QUICK_VIEWS, getMetricValue } from '../salesNavigation.js';

const ExpertRequestFilters = ({
  view,
  metrics,
  search,
  status,
  priority,
  callbackTiming,
  onViewChange,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onCallbackTimingChange
}) => (
  <section className="space-y-3" aria-label="Expert request filters">
    <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-3">
      {SALES_QUICK_VIEWS.map((item) => {
        const active = view === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onViewChange(item.id)}
            className={[
              'flex min-h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors',
              active
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
            ].join(' ')}
          >
            {item.label}
            <span className={active ? 'text-slate-300' : 'text-slate-400'}>{getMetricValue(metrics, item.id)}</span>
          </button>
        );
      })}
    </div>

    <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[minmax(15rem,1fr)_repeat(3,minmax(9rem,auto))]">
      <label className="relative block">
        <span className="sr-only">Search expert requests</span>
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search ID, traveler, phone, email, trip…"
          className="min-h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
        />
      </label>

      <label className="relative">
        <span className="sr-only">Status</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value)} className="min-h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
          <option value="all">All statuses</option>
          {LEAD_STATUSES.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
        </select>
      </label>

      <label className="relative">
        <span className="sr-only">Priority</span>
        <select value={priority} onChange={(event) => onPriorityChange(event.target.value)} className="min-h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
          <option value="all">All priorities</option>
          {LEAD_PRIORITIES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>

      <label className="relative">
        <span className="sr-only">Callback timing</span>
        <select value={callbackTiming} onChange={(event) => onCallbackTimingChange(event.target.value)} className="min-h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
          <option value="all">Any callback</option>
          <option value="due_today">Due today</option>
          <option value="overdue">Overdue</option>
          <option value="upcoming">Upcoming</option>
          <option value="flexible">Flexible</option>
          <option value="closed">Closed</option>
        </select>
      </label>
    </div>
  </section>
);

export default ExpertRequestFilters;
