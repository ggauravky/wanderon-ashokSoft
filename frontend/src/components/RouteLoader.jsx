import React from 'react';

const RouteLoader = ({ compact = false }) => (
  <div
    className={`flex w-full items-center justify-center ${compact ? 'min-h-64' : 'min-h-[45vh]'}`}
    role="status"
    aria-live="polite"
    aria-label="Loading page"
  >
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" aria-hidden="true" />
      <span>Loading workspace…</span>
    </div>
  </div>
);

export default RouteLoader;
