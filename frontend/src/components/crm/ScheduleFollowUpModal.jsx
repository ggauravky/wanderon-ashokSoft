import React, { useState } from 'react';
import { 
  X, Calendar, Clock, Phone, MessageSquare, Mail, 
  Users, AlertCircle, Loader2, Check, Sparkles 
} from 'lucide-react';

export default function ScheduleFollowUpModal({
  isOpen,
  onClose,
  lead,
  salesUsers = [],
  currentUser,
  onSubmit,
  loading = false
}) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('11:00');
  const [channel, setChannel] = useState('call');
  const [priority, setPriority] = useState('medium');
  const [callWindow, setCallWindow] = useState('Morning');
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [notes, setNotes] = useState('');

  // Initial default settings when modal opens
  React.useEffect(() => {
    if (lead) {
      setTitle(`Follow-up with ${lead.name} regarding ${lead.tripTitle || lead.destination || 'WanderLuxe Inquiry'}`);
      
      // Default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split('T')[0]);

      if (lead.assignedToUser) {
        setAssignedToUserId(lead.assignedToUser._id || lead.assignedToUser);
      } else if (currentUser) {
        setAssignedToUserId(currentUser._id || currentUser.id || '');
      }

      if (lead.preferredCallWindow) {
        setCallWindow(lead.preferredCallWindow);
      }
    }
  }, [lead, currentUser]);

  if (!isOpen || !lead) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date || !time) return;

    const scheduledDateObj = new Date(`${date}T${time}:00`);
    
    onSubmit({
      leadId: lead._id || lead.id,
      title: title.trim(),
      scheduledAt: scheduledDateObj.toISOString(),
      channel,
      priority,
      preferredCallWindow: callWindow,
      assignedToUserId: assignedToUserId || undefined,
      notes: notes.trim()
    });
  };

  const applyPreset = (daysOffset, presetTime, presetWindow) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysOffset);
    setDate(targetDate.toISOString().split('T')[0]);
    setTime(presetTime);
    setCallWindow(presetWindow);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Schedule Follow-Up Task</h2>
              <p className="text-xs text-slate-400">Lead: {lead.name} ({lead.phone})</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 font-bold text-[11px] shrink-0">Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset(0, '16:00', 'Afternoon')}
            className="px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 text-[11px] font-bold rounded-lg shrink-0 cursor-pointer shadow-2xs"
          >
            Today 4:00 PM
          </button>
          <button
            type="button"
            onClick={() => applyPreset(1, '10:30', 'Morning')}
            className="px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 text-[11px] font-bold rounded-lg shrink-0 cursor-pointer shadow-2xs"
          >
            Tomorrow Morning
          </button>
          <button
            type="button"
            onClick={() => applyPreset(2, '14:00', 'Afternoon')}
            className="px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 text-[11px] font-bold rounded-lg shrink-0 cursor-pointer shadow-2xs"
          >
            In 2 Days
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Task Title / Objective:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Date:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Time:</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Preferred Call Window:</label>
              <select
                value={callWindow}
                onChange={(e) => setCallWindow(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
              >
                <option value="Morning">Morning (9 AM - 12 PM)</option>
                <option value="Afternoon">Afternoon (12 PM - 4 PM)</option>
                <option value="Evening">Evening (4 PM - 8 PM)</option>
                <option value="Anytime">Anytime</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Priority Level:</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 outline-none font-bold"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">🚨 Urgent (Immediate follow-up)</option>
              </select>
            </div>
          </div>

          {/* Channel Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Contact Channel:</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'call', label: 'Phone Call', icon: Phone },
                { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                { id: 'email', label: 'Email', icon: Mail },
                { id: 'meeting', label: 'Meeting', icon: Users },
              ].map(ch => {
                const Icon = ch.icon;
                const isSelected = channel === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setChannel(ch.id)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold shadow-2xs ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-[11px]">{ch.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assigned Specialist */}
          {salesUsers && salesUsers.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Assigned Specialist:</label>
              <select
                value={assignedToUserId}
                onChange={(e) => setAssignedToUserId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
              >
                <option value="">-- Assign to Current User / Default --</option>
                {salesUsers.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role}) - {u.activeLeadsCount || 0} active leads
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Agenda & Notes:</label>
            <textarea
              rows={2}
              placeholder="e.g. Call to finalize quotation discount and discuss hotel upgrade in Shillong."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !date || !time}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
              Schedule Follow-Up
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
