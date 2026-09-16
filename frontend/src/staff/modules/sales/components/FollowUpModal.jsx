import React, { useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { getTripTitle } from '../salesUtils.js';
import SalesModalShell from './SalesModalShell.jsx';

const fieldClass = 'mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

const FollowUpModal = ({ lead, saving, onClose, onSubmit }) => {
  const defaultDate = useMemo(() => {
    const next = new Date(Date.now() + 24 * 60 * 60 * 1000);
    next.setMinutes(0, 0, 0);
    return new Date(next.getTime() - next.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }, []);
  const [scheduledAt, setScheduledAt] = useState(defaultDate);
  const [channel, setChannel] = useState('call');
  const [priority, setPriority] = useState('medium');
  const [callWindow, setCallWindow] = useState('Anytime');
  const [title, setTitle] = useState(`Follow up on ${getTripTitle(lead)}`);
  const [notes, setNotes] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ leadId: lead?._id || lead?.id, scheduledAt, channel, priority, callWindow, title, notes });
  };

  return (
    <SalesModalShell title="Schedule follow-up" description="This follow-up remains scoped to the staff member scheduling it." icon={CalendarClock} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <label className="block text-sm font-medium text-slate-700">Date and time<input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className={fieldClass} required /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">Channel<select value={channel} onChange={(event) => setChannel(event.target.value)} className={fieldClass}><option value="call">Call</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="meeting">Meeting</option></select></label>
          <label className="block text-sm font-medium text-slate-700">Priority<select value={priority} onChange={(event) => setPriority(event.target.value)} className={fieldClass}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
        </div>
        <label className="block text-sm font-medium text-slate-700">Call window<select value={callWindow} onChange={(event) => setCallWindow(event.target.value)} className={fieldClass}><option value="Anytime">Anytime</option><option value="Morning">Morning</option><option value="Afternoon">Afternoon</option><option value="Evening">Evening</option></select></label>
        <label className="block text-sm font-medium text-slate-700">Title<input value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} required /></label>
        <label className="block text-sm font-medium text-slate-700">Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className={`${fieldClass} py-2.5`} placeholder="Purpose, context, or next step" /></label>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={saving} className="min-h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">{saving ? 'Scheduling…' : 'Schedule follow-up'}</button>
        </div>
      </form>
    </SalesModalShell>
  );
};

export default FollowUpModal;
