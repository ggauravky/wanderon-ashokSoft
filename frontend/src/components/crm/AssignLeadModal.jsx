import React, { useState } from 'react';
import { X, UserCheck, Shield, Users, Check, AlertCircle, Loader2 } from 'lucide-react';

export default function AssignLeadModal({
  isOpen,
  onClose,
  lead,
  salesUsers = [],
  onAssignSubmit,
  loading = false
}) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [customName, setCustomName] = useState('');
  const [useCustomName, setUseCustomName] = useState(false);
  const [notes, setNotes] = useState('');

  if (!isOpen || !lead) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (useCustomName) {
      if (!customName.trim()) return;
      onAssignSubmit({
        leadId: lead._id || lead.id,
        assignedToName: customName.trim(),
        notes
      });
    } else {
      const user = salesUsers.find(u => String(u._id) === String(selectedUserId));
      if (!user) return;
      onAssignSubmit({
        leadId: lead._id || lead.id,
        assignedToUserId: user._id,
        assignedToName: user.name,
        notes
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <UserCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Assign Sales Concierge</h2>
              <p className="text-xs text-slate-400">Lead: {lead.name} ({lead.referenceId || lead._id})</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-slate-800">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-700">Assignment Mode:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUseCustomName(false)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  !useCustomName ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Registered Team
              </button>
              <button
                type="button"
                onClick={() => setUseCustomName(true)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  useCustomName ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Custom Concierge
              </button>
            </div>
          </div>

          {!useCustomName ? (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Select Specialist ({salesUsers.length} available):
              </label>
              
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {salesUsers.map(u => {
                  const isSelected = String(selectedUserId) === String(u._id);
                  return (
                    <div
                      key={u._id}
                      onClick={() => setSelectedUserId(u._id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            {u.name}
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                              {u.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full block">
                          {u.activeLeadsCount || 0} active leads
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Specialist / Concierge Team Name:
              </label>
              <input
                type="text"
                placeholder="e.g. Ashok Travel Specialist or Northeast Team"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                required={useCustomName}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Internal Assignment Notes (Optional):
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Customer requested immediate phone consultation for Meghalaya 5D luxury package."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
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
              disabled={loading || (!useCustomName && !selectedUserId) || (useCustomName && !customName.trim())}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
              Confirm Assignment
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
