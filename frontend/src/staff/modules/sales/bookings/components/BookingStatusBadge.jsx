import React from 'react';

const STYLES = {
  DRAFT: 'border-slate-200 bg-slate-50 text-slate-700',
  PENDING_PAYMENT: 'border-amber-200 bg-amber-50 text-amber-800',
  PROVISIONALLY_CONFIRMED: 'border-blue-200 bg-blue-50 text-blue-800',
  CONFIRMED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  CANCELLED: 'border-slate-200 bg-slate-100 text-slate-600',
  FAILED: 'border-rose-200 bg-rose-50 text-rose-800',
  UNPAID: 'border-amber-200 bg-amber-50 text-amber-800',
  PARTIALLY_PAID: 'border-blue-200 bg-blue-50 text-blue-800',
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  REFUNDED: 'border-violet-200 bg-violet-50 text-violet-800'
};

const BookingStatusBadge = ({ status, neutralLabel = 'Unknown' }) => {
  const normalized = String(status || '').toUpperCase();
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STYLES[normalized] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>{normalized ? normalized.replaceAll('_', ' ') : neutralLabel}</span>;
};

export default BookingStatusBadge;
