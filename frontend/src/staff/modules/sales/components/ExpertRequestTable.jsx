import React from 'react';
import { Eye, Users } from 'lucide-react';
import ContactActionLinks from './ContactActionLinks.jsx';
import {
  formatDate,
  formatDateTime,
  getCallbackState,
  getLastActivity,
  getPriorityClasses,
  getStatusClasses,
  getTripTitle
} from '../salesUtils.js';

const Badge = ({ children, classes }) => (
  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${classes}`}>{children}</span>
);

const ExpertRequestTable = ({ leads, onView }) => (
  <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white xl:block">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] border-collapse text-left">
        <thead className="border-b border-slate-200 bg-slate-50/80">
          <tr className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            {['Request', 'Traveler', 'Trip', 'Callback', 'Last activity', 'Status', 'Priority', 'Actions'].map((heading) => (
              <th key={heading} className="px-4 py-3">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.map((lead) => {
            const callback = getCallbackState(lead);
            const activity = getLastActivity(lead);
            return (
              <tr key={lead._id || lead.id} className="align-top transition-colors hover:bg-slate-50/70">
                <td className="px-4 py-4">
                  <button type="button" onClick={() => onView(lead)} className="font-mono text-xs font-semibold text-slate-900 hover:text-emerald-700">
                    {lead.referenceId || 'No reference'}
                  </button>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(lead.createdAt)}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="max-w-48 truncate text-sm font-semibold text-slate-900">{lead.name || 'Not provided'}</p>
                  <p className="mt-1 text-xs text-slate-500">{lead.phone || '—'}</p>
                  <p className="max-w-48 truncate text-xs text-slate-400">{lead.email || '—'}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Users size={12} aria-hidden="true" /> {lead.travelersCount || 1}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="max-w-48 text-sm font-medium text-slate-800">{getTripTitle(lead)}</p>
                  <p className="mt-1 text-xs text-slate-500">{lead.destination || 'Destination not provided'}</p>
                  <p className="mt-1 text-xs text-slate-400">{lead.selectedBatch || 'Batch not selected'}</p>
                </td>
                <td className="px-4 py-4">
                  <Badge classes={callback.classes}>{callback.label}</Badge>
                  <p className="mt-2 text-xs text-slate-600">{formatDate(lead.preferredCallDate, 'Flexible date')}</p>
                  <p className="mt-1 text-xs text-slate-400">{lead.preferredCallWindow || 'Anytime'}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-xs font-medium text-slate-700">{activity.label}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(activity.at, 'No activity')}</p>
                  {activity.by && <p className="mt-1 max-w-36 truncate text-xs text-slate-500">{activity.by}</p>}
                </td>
                <td className="px-4 py-4">
                  <Badge classes={getStatusClasses(lead.status)}>{(lead.status || 'NEW').replaceAll('_', ' ')}</Badge>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-xs font-semibold ${getPriorityClasses(lead.effectivePriority)}`} title={(lead.priorityReasons || []).join(' · ')}>{lead.effectivePriority || lead.priority || 'MEDIUM'}</span>
                  <p className="mt-1 max-w-40 text-[11px] leading-4 text-slate-500">{(lead.priorityReasons || ['No immediate action due']).slice(0, 2).join(' · ')}</p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => onView(lead)} className="flex min-h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800">
                      <Eye size={14} aria-hidden="true" /> View
                    </button>
                    <ContactActionLinks lead={lead} compact />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default ExpertRequestTable;
