import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const RejectCreatorModal = ({ application, busy, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  useEffect(() => setReason(''), [application]);
  if (!application) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl"><header className="flex items-start justify-between border-b border-slate-200 p-5"><div><h2 className="font-semibold text-slate-950">Reject creator application</h2><p className="mt-1 text-xs text-slate-500">{application.name} · {application.email}</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={17} /></button></header><div className="p-5"><label className="block text-sm font-medium text-slate-700">Rejection reason<textarea required rows="5" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Record the decision reason…" className="mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-rose-500" /></label><p className="mt-2 text-xs leading-5 text-slate-500">The reason and reviewing Staff actor are persisted with the application.</p></div><footer className="flex justify-end gap-2 border-t border-slate-200 p-4"><button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700">Cancel</button><button type="button" disabled={busy || !reason.trim()} onClick={() => onConfirm(reason.trim())} className="min-h-10 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Rejecting…' : 'Reject application'}</button></footer></div></div>;
};

export default RejectCreatorModal;

