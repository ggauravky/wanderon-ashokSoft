import React from 'react';
import { ADMIN_ANALYTICS_RANGES } from '../adminHelpers.js';

const AnalyticsRangeSelector = ({ value, onChange, disabled = false }) => <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1" aria-label="Analytics date range">{ADMIN_ANALYTICS_RANGES.map((range) => <button key={range.id} type="button" onClick={() => onChange(range.id)} disabled={disabled} className={`min-h-9 rounded-md px-3 text-xs font-semibold transition-colors disabled:opacity-50 ${value === range.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}>{range.label}</button>)}</div>;

export default AnalyticsRangeSelector;
