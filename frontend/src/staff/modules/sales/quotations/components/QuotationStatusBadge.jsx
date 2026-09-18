import React from 'react';

const STATUS_CLASSES = {
  DRAFT: 'border-slate-200 bg-slate-100 text-slate-700',
  CONTENT_READY: 'border-blue-200 bg-blue-50 text-blue-700',
  AWAITING_PRICING: 'border-amber-200 bg-amber-50 text-amber-800',
  READY_TO_SHARE: 'border-violet-200 bg-violet-50 text-violet-700',
  SENT: 'border-sky-200 bg-sky-50 text-sky-700',
  SHARED: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  VIEWED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  CHANGES_REQUESTED: 'border-orange-200 bg-orange-50 text-orange-800',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  EXPIRED: 'border-amber-200 bg-amber-50 text-amber-800',
  CONVERTED: 'border-teal-200 bg-teal-50 text-teal-700',
  ARCHIVED: 'border-slate-200 bg-slate-50 text-slate-500'
};

const QuotationStatusBadge = ({ status }) => (
  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLASSES[status] || STATUS_CLASSES.DRAFT}`}>
    {(status || 'DRAFT').replaceAll('_', ' ')}
  </span>
);

export default QuotationStatusBadge;
