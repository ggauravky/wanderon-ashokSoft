import React, { useEffect } from 'react';
import { CalendarPlus, Loader2, PhoneCall, X } from 'lucide-react';
import ExpertRequestDetails from '../ExpertRequestDetails.jsx';
import { LEAD_STATUSES } from '../salesNavigation.js';
import { getStatusClasses } from '../salesUtils.js';
import ContactActionLinks from './ContactActionLinks.jsx';

const ExpertRequestDrawer = ({ lead, loading, saving, modalOpen, onClose, onStatusChange, onLogContact, onScheduleFollowUp, onCreateQuotation, onOpenQuotation, onOpenBooking }) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !modalOpen) onClose();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalOpen, onClose]);

  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-slate-950/45" aria-label="Close request details" />
      <aside role="dialog" aria-modal="true" aria-label={`Expert request ${lead.referenceId || ''}`} className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col border-l border-slate-200 bg-slate-50 shadow-2xl">
        <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-xs font-semibold text-emerald-700">{lead.referenceId || 'No reference'}</p>
              <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-950">{lead.name || 'Traveler details'}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusClasses(lead.status)}`}>{(lead.status || 'NEW').replaceAll('_', ' ')}</span>
                <span className="text-xs text-slate-500">Shared Sales queue</span>
              </div>
            </div>
            <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Close request details"><X size={20} aria-hidden="true" /></button>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
            <ContactActionLinks lead={lead} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onLogContact} className="flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800"><PhoneCall size={15} aria-hidden="true" /> Log outcome</button>
              <button type="button" onClick={onScheduleFollowUp} className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><CalendarPlus size={15} aria-hidden="true" /> Follow-up</button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <label htmlFor="expert-request-status" className="text-xs font-medium text-slate-500">Status</label>
            <select
              id="expert-request-status"
              value={lead.status || 'NEW'}
              onChange={(event) => onStatusChange(event.target.value)}
              disabled={saving}
              className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
            >
              {LEAD_STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
            </select>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex min-h-60 items-center justify-center gap-2 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Loading request dossier…</div>
          ) : (
            <ExpertRequestDetails lead={lead} onCreateQuotation={onCreateQuotation} onOpenQuotation={onOpenQuotation} onOpenBooking={onOpenBooking} />
          )}
        </div>
      </aside>
    </div>
  );
};

export default ExpertRequestDrawer;
