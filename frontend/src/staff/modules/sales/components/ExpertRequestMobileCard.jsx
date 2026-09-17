import React from 'react';
import { CalendarClock, ChevronRight, MapPin, Users } from 'lucide-react';
import ContactActionLinks from './ContactActionLinks.jsx';
import { formatDate, getCallbackState, getPriorityClasses, getStatusClasses, getTripTitle } from '../salesUtils.js';

const ExpertRequestMobileCard = ({ lead, onView }) => {
  const callback = getCallbackState(lead);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <button type="button" onClick={() => onView(lead)} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs font-semibold text-emerald-700">{lead.referenceId || 'No reference'}</p>
            <h3 className="mt-1 truncate text-base font-semibold text-slate-950">{lead.name || 'Traveler not provided'}</h3>
            <p className="mt-1 truncate text-sm text-slate-500">{lead.phone || lead.email || 'Contact not provided'}</p>
          </div>
          <ChevronRight size={18} className="mt-1 shrink-0 text-slate-400" aria-hidden="true" />
        </div>

        <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <p className="flex items-center gap-2"><MapPin size={15} className="text-slate-400" aria-hidden="true" /> <span className="truncate">{getTripTitle(lead)}</span></p>
          <p className="flex items-center gap-2"><Users size={15} className="text-slate-400" aria-hidden="true" /> {lead.travelersCount || 1} traveler{Number(lead.travelersCount || 1) === 1 ? '' : 's'}</p>
          <p className="flex items-center gap-2"><CalendarClock size={15} className="text-slate-400" aria-hidden="true" /> {formatDate(lead.preferredCallDate, 'Flexible date')} · {lead.preferredCallWindow || 'Anytime'}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusClasses(lead.status)}`}>{(lead.status || 'NEW').replaceAll('_', ' ')}</span>
          <span className={`text-xs font-semibold ${getPriorityClasses(lead.effectivePriority)}`} title={(lead.priorityReasons || []).join(' · ')}>{lead.effectivePriority || lead.priority || 'MEDIUM'}</span>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${callback.classes}`}>{callback.label}</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">{(lead.priorityReasons || ['No immediate action due']).slice(0, 2).join(' · ')}</p>
      </button>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <ContactActionLinks lead={lead} />
      </div>
    </article>
  );
};

export default ExpertRequestMobileCard;
