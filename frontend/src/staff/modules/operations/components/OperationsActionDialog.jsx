import { useState } from 'react';
import OperationsDialog from './OperationsDialog.jsx';

export default function OperationsActionDialog({ title, description, label = 'Reason', placeholder, confirmLabel, dangerous = false, onClose, onConfirm, optional = false, children }) {
  const [value, setValue] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const submit = async (event) => { event.preventDefault(); if (!optional && !value.trim()) { setError(`${label} is required.`); return; } setBusy(true); setError(''); try { await onConfirm(value.trim()); onClose(); } catch (requestError) { setError(requestError.message || 'Unable to complete this action.'); } finally { setBusy(false); } };
  return <OperationsDialog title={title} description={description} onClose={onClose} footer={<><button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700">Cancel</button><button form="operations-action-form" disabled={busy} className={`min-h-10 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-50 ${dangerous ? 'bg-rose-600' : 'bg-emerald-600'}`}>{busy ? 'Saving…' : confirmLabel}</button></>}>
    <form id="operations-action-form" onSubmit={submit}>{children}<label className="block text-sm font-medium text-slate-700">{label}<textarea autoFocus rows="4" value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} className="mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500"/></label>{error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}</form>
  </OperationsDialog>;
}
