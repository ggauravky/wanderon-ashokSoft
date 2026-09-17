import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

const ApproveCreatorModal = ({ application, busy, onClose, onConfirm }) => {
  const [notes, setNotes] = useState('');
  useEffect(() => setNotes(''), [application]);
  if (!application) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl"><header className="flex items-start justify-between border-b border-slate-200 p-5"><div><h2 className="font-semibold text-slate-950">Approve creator</h2><p className="mt-1 text-xs text-slate-500">{application.name} · {application.email}</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={17} /></button></header><div className="space-y-4 p-5"><p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-900"><CheckCircle2 size={17} className="mb-1" />Approval updates this MongoDB User to the existing <strong>influencer</strong> role and approved creator status.</p><label className="block text-sm font-medium text-slate-700">Decision notes (optional)<textarea rows="4" value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500" /></label></div><footer className="flex justify-end gap-2 border-t border-slate-200 p-4"><button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700">Cancel</button><button type="button" disabled={busy} onClick={() => onConfirm(notes)} className="min-h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Approving…' : 'Approve creator'}</button></footer></div></div>;
};

export default ApproveCreatorModal;

