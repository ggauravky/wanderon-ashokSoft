const TONES = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
  sky: 'border-sky-200 bg-sky-50 text-sky-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700'
};

export default function OperationsMetricCard({ label, value, detail, icon: Icon, tone = 'slate' }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value ?? 0}</p></div><span className={`flex h-9 w-9 items-center justify-center rounded-lg border ${TONES[tone]}`}><Icon size={17} strokeWidth={1.8} aria-hidden="true" /></span></div>
    {detail && <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>}
  </article>;
}
