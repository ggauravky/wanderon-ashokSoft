import React, { useState } from 'react';
import { PhoneCall } from 'lucide-react';
import { CONTACT_OUTCOMES } from '../salesNavigation.js';
import SalesModalShell from './SalesModalShell.jsx';

const fieldClass = 'mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

const ContactOutcomeModal = ({ lead, saving, onClose, onSubmit }) => {
  const [outcome, setOutcome] = useState('CONNECTED');
  const [channel, setChannel] = useState('call');
  const [notes, setNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ outcome, channel, notes, nextFollowUpDate: nextFollowUpDate || undefined });
  };

  return (
    <SalesModalShell title="Log contact outcome" description={`Record the result for ${lead?.name || 'this traveler'}. Opening a contact link alone never changes status.`} icon={PhoneCall} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <label className="block text-sm font-medium text-slate-700">
          Outcome
          <select value={outcome} onChange={(event) => setOutcome(event.target.value)} className={fieldClass} required>
            {CONTACT_OUTCOMES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Channel
          <select value={channel} onChange={(event) => setChannel(event.target.value)} className={fieldClass}>
            <option value="call">Phone call</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Notes
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className={`${fieldClass} py-2.5`} placeholder="What was discussed or agreed?" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Optional next follow-up
          <input type="datetime-local" value={nextFollowUpDate} onChange={(event) => setNextFollowUpDate(event.target.value)} className={fieldClass} />
        </label>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={saving} className="min-h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">{saving ? 'Saving…' : 'Save outcome'}</button>
        </div>
      </form>
    </SalesModalShell>
  );
};

export default ContactOutcomeModal;
