import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { LOST_REASONS } from '../salesNavigation.js';
import SalesModalShell from './SalesModalShell.jsx';

const fieldClass = 'mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100';

const LostReasonModal = ({ lead, saving, onClose, onSubmit }) => {
  const [lostReason, setLostReason] = useState(LOST_REASONS[0]);
  const [lostReasonDetail, setLostReasonDetail] = useState('');

  return (
    <SalesModalShell title="Mark request as lost" description={`Record why ${lead?.referenceId || 'this request'} did not progress.`} icon={AlertTriangle} onClose={onClose}>
      <form onSubmit={(event) => { event.preventDefault(); onSubmit({ status: 'LOST', lostReason, lostReasonDetail }); }} className="space-y-4 p-5">
        <label className="block text-sm font-medium text-slate-700">Lost reason<select value={lostReason} onChange={(event) => setLostReason(event.target.value)} className={fieldClass} required>{LOST_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}</select></label>
        <label className="block text-sm font-medium text-slate-700">Details<textarea value={lostReasonDetail} onChange={(event) => setLostReasonDetail(event.target.value)} rows={3} className={`${fieldClass} py-2.5`} placeholder="Add useful context for the team" /></label>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={saving} className="min-h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-60">{saving ? 'Saving…' : 'Confirm lost'}</button>
        </div>
      </form>
    </SalesModalShell>
  );
};

export default LostReasonModal;
