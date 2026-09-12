import React, { useState } from 'react';
import { X, Phone, MessageSquare, Mail, FileText, Calendar, CheckCircle } from 'lucide-react';

export default function LogInteractionModal({ isOpen, onClose, lead, onSave }) {
  const [channel, setChannel] = useState('call');
  const [direction, setDirection] = useState('outbound');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [outcome, setOutcome] = useState('connected');
  const [nextActionDate, setNextActionDate] = useState('');
  const [nextActionNotes, setNextActionNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!summary) return;

    setLoading(true);
    try {
      await onSave({
        channel,
        direction,
        summary,
        details,
        outcome,
        nextActionDate: nextActionDate || undefined,
        nextActionNotes: nextActionNotes || undefined
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black">Log Touchpoint / Note</h3>
            <p className="text-xs text-slate-400 mt-0.5">Recording interaction with <span className="text-emerald-400 font-bold">{lead.name}</span></p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Channel selector */}
          <div>
            <label className="block text-slate-500 font-bold uppercase tracking-wider mb-2 text-[11px]">Channel</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'call', label: 'Call', icon: Phone },
                { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                { id: 'email', label: 'Email', icon: Mail },
                { id: 'note', label: 'Internal Note', icon: FileText }
              ].map(item => {
                const Icon = item.icon;
                const active = channel === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setChannel(item.id)}
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                      active 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs ring-1 ring-emerald-400' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={16} className={`mb-1 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="text-[11px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Outcome & Direction */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1 text-[11px]">Direction</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-emerald-500"
              >
                <option value="outbound">Outbound (We reached out)</option>
                <option value="inbound">Inbound (Client reached out)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1 text-[11px]">Interaction Outcome</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-emerald-500"
              >
                <option value="connected">Connected / Discussed</option>
                <option value="left_voicemail">Left Voicemail / Message</option>
                <option value="no_answer">No Answer / Busy</option>
                <option value="callback_requested">Callback Requested</option>
                <option value="proposal_requested">Requested Quotation</option>
                <option value="not_interested">Not Interested / Postponed</option>
              </select>
            </div>
          </div>

          {/* Summary / Headline */}
          <div>
            <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1 text-[11px]">Summary Headline *</label>
            <input
              type="text"
              required
              placeholder="e.g., Discussed 4-night luxury package in Leh"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-emerald-500"
            />
          </div>

          {/* Notes / Details */}
          <div>
            <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1 text-[11px]">Key Notes / Discussion Points</label>
            <textarea
              rows={3}
              placeholder="Detailed notes: preferences, dietary needs, hotel tier preferences, objections..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Next Action Scheduling */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
            <span className="font-bold text-slate-800 text-[11px] block">Schedule Next Action (Optional)</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="datetime-local"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="Follow-up agenda/note..."
                value={nextActionNotes}
                onChange={(e) => setNextActionNotes(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !summary}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-md"
            >
              {loading ? 'Saving...' : 'Save Touchpoint'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
