import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';

const PayoutActionModal = ({ action, busy, error, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  if (!action) return null;
  const rejecting = action === 'reject';
  const title = action === 'approve' ? 'Approve payout' : action === 'process' ? 'Mark payout processed' : 'Reject payout';
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-950">{title}</h2><button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></div><form onSubmit={(event) => { event.preventDefault(); onConfirm(reason); }} className="space-y-4 p-5"><p className="text-sm leading-6 text-slate-600">{action === 'process' ? 'This records the payout as processed in the manual workflow. It does not confirm a bank or UPI transfer.' : action === 'approve' ? 'Approval records the actor and timestamp before manual processing.' : 'Rejected payouts become read-only. Create a separate record if needed later.'}</p>{rejecting && <label className="block text-sm font-medium text-slate-700">Reason<textarea required rows="3" value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-3" /></label>}{error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold">Cancel</button><button disabled={busy} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-50 ${rejecting ? 'bg-rose-600' : 'bg-emerald-600'}`}>{busy && <Loader2 size={15} className="animate-spin" />}Confirm</button></div></form></div></div>;
};
export default PayoutActionModal;

