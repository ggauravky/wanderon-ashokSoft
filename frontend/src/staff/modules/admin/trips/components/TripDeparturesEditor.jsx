import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toDateInput } from '../tripHelpers';

const inputClass = 'min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500';
const blankBatch = () => ({ batchId: '', startDate: '', endDate: '', dates: '', capacity: '', bookedSeats: 0, status: 'available', pricing: {}, bookingAmount: '', totalAmount: '' });

const TripDeparturesEditor = ({ value, onChange }) => {
  const batches = value.batches || [];
  const update = (index, patch) => onChange({ ...value, batches: batches.map((batch, idx) => idx === index ? { ...batch, ...patch } : batch) });
  const remove = (index) => {
    if (Number(batches[index]?.bookedSeats || 0) > 0) return;
    onChange({ ...value, batches: batches.filter((_, idx) => idx !== index) });
  };
  return <div className="space-y-4">
    <div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold text-slate-900">Departure inventory</h3><p className="mt-1 text-xs text-slate-500">Booked seats are payment-driven and cannot be edited here.</p></div><button type="button" onClick={() => onChange({ ...value, batches: [...batches, blankBatch()] })} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white"><Plus size={15} />Add departure</button></div>
    {batches.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No departures configured. This trip cannot be booked until a departure is added.</div>}
    {batches.map((batch, index) => { const available = Math.max(0, Number(batch.capacity || 0) - Number(batch.bookedSeats || 0)); return <section key={batch._id || batch.batchId || index} className="rounded-xl border border-slate-200 p-4">
      <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold text-slate-900">Departure {index + 1}</p><p className="text-xs text-slate-500">{batch.batchId || 'ID assigned on save'} · {available} seats available</p></div><button type="button" disabled={Number(batch.bookedSeats || 0) > 0} onClick={() => remove(index)} title={Number(batch.bookedSeats || 0) > 0 ? 'Departures with booked seats cannot be removed' : 'Remove departure'} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-35"><Trash2 size={15} /></button></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-xs font-medium text-slate-600"><span>Date label</span><input className={inputClass} value={batch.dates || ''} onChange={(e) => update(index, { dates: e.target.value })} placeholder="12 Sep - 17 Sep, 2026" /></label>
        <label className="space-y-1 text-xs font-medium text-slate-600"><span>Start date</span><input type="date" className={inputClass} value={toDateInput(batch.startDate)} onChange={(e) => update(index, { startDate: e.target.value })} /></label>
        <label className="space-y-1 text-xs font-medium text-slate-600"><span>End date</span><input type="date" className={inputClass} value={toDateInput(batch.endDate)} onChange={(e) => update(index, { endDate: e.target.value })} /></label>
        <label className="space-y-1 text-xs font-medium text-slate-600"><span>Status</span><select className={inputClass} value={batch.status || 'available'} disabled={available === 0} onChange={(e) => update(index, { status: e.target.value })}><option value="available">Available</option><option value="filling_fast">Filling fast</option><option value="sold_out">Sold out</option></select></label>
        <label className="space-y-1 text-xs font-medium text-slate-600"><span>Capacity</span><input type="number" min={Number(batch.bookedSeats || 0)} className={inputClass} value={batch.capacity ?? ''} onChange={(e) => update(index, { capacity: e.target.value })} /></label>
        <label className="space-y-1 text-xs font-medium text-slate-600"><span>Booked seats</span><input readOnly className={`${inputClass} bg-slate-50 text-slate-500`} value={batch.bookedSeats || 0} /></label>
        <label className="space-y-1 text-xs font-medium text-slate-600"><span>Booking amount</span><input type="number" min="0" className={inputClass} value={batch.bookingAmount ?? ''} onChange={(e) => update(index, { bookingAmount: e.target.value })} /></label>
        <label className="space-y-1 text-xs font-medium text-slate-600"><span>Total amount</span><input type="number" min="0" className={inputClass} value={batch.totalAmount ?? ''} onChange={(e) => update(index, { totalAmount: e.target.value })} /></label>
        {[['tripleSharing', 'Triple sharing'], ['doubleSharing', 'Double sharing'], ['singleSharing', 'Single sharing']].map(([field, label]) => <label key={field} className="space-y-1 text-xs font-medium text-slate-600"><span>{label}</span><input type="number" min="0" className={inputClass} value={batch.pricing?.[field] ?? ''} onChange={(e) => update(index, { pricing: { ...(batch.pricing || {}), [field]: e.target.value } })} /></label>)}
      </div>
    </section>; })}
  </div>;
};

export default TripDeparturesEditor;
