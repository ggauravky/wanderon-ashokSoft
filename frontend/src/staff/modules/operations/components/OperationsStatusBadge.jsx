const PHASE_TONES = {
  UPCOMING: 'border-sky-200 bg-sky-50 text-sky-700',
  ONGOING: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  COMPLETED: 'border-slate-200 bg-slate-100 text-slate-700',
  DATE_UNRESOLVED: 'border-rose-200 bg-rose-50 text-rose-700',
  HIGH: 'border-rose-200 bg-rose-50 text-rose-700',
  MEDIUM: 'border-amber-200 bg-amber-50 text-amber-800'
};

export default function OperationsStatusBadge({ value }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[.06em] ${PHASE_TONES[value] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>{String(value || '—').replaceAll('_', ' ')}</span>;
}
