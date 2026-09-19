import React, { useState } from 'react';
import { 
  X, Phone, MessageSquare, Mail, Calendar, User, MapPin, 
  DollarSign, Clock, CheckCircle, AlertTriangle, Shield, 
  FileText, ArrowRight, PlusCircle, Edit3, Send, ChevronRight,
  TrendingUp, Sparkles, AlertCircle
} from 'lucide-react';

export default function LeadDetailDrawer({
  isOpen,
  onClose,
  lead,
  agents = [],
  onUpdateStatus,
  onUpdatePriority,
  onAssignAgent,
  onLogInteractionClick,
  onScheduleAction,
  onConvertToQuotation
}) {
  const [quickNote, setQuickNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  if (!isOpen || !lead) return null;

  const getStatusBadge = (status) => {
    const map = {
      new: 'bg-blue-100 text-blue-800 border-blue-200',
      contacted: 'bg-purple-100 text-purple-800 border-purple-200',
      qualified: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      proposal_sent: 'bg-amber-100 text-amber-800 border-amber-200',
      negotiation: 'bg-orange-100 text-orange-800 border-orange-200',
      converted: 'bg-emerald-600 text-white border-emerald-700',
      lost: 'bg-rose-100 text-rose-800 border-rose-200',
      spam: 'bg-slate-200 text-slate-700 border-slate-300'
    };
    return map[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getPriorityBadge = (priority) => {
    const map = {
      urgent: 'bg-rose-500 text-white',
      high: 'bg-amber-500 text-white',
      medium: 'bg-blue-500 text-white',
      low: 'bg-slate-400 text-white'
    };
    return map[priority] || 'bg-slate-400 text-white';
  };

  const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9+]/g, '') : '';
  const waNumber = cleanPhone.startsWith('+') ? cleanPhone.replace('+', '') : `91${cleanPhone}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300 overflow-hidden"
      >
        
        {/* Drawer Header */}
        <div className="bg-slate-900 text-white p-6 flex flex-col gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xl">
                {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white">{lead.name}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${getPriorityBadge(lead.priority)}`}>
                    {lead.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lead Ref: <span className="font-mono text-emerald-400">{lead._id?.substring(lead._id.length - 8) || 'N/A'}</span> • Created {new Date(lead.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Contact Fast-Actions Bar */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
            {lead.phone && (
              <>
                <a
                  href={`tel:${cleanPhone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600/30 text-xs font-semibold text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
                >
                  <Phone size={13} />
                  <span>Call {cleanPhone}</span>
                </a>

                <a
                  href={`https://wa.me/${waNumber}?text=Hi%20${encodeURIComponent(lead.name)},%20greetings%20from%20WanderLuxe%20Concierge!%20We%20received%20your%20enquiry%20regarding%20${encodeURIComponent(lead.tripDetails?.destination || 'your dream trip')}.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600/30 text-xs font-semibold text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
                >
                  <MessageSquare size={13} />
                  <span>WhatsApp Chat</span>
                </a>
              </>
            )}

            {lead.email && (
              <a
                href={`mailto:${lead.email}?subject=Your%20Bespoke%20Journey%20with%20WanderLuxe`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-blue-600/30 text-xs font-semibold text-blue-300 border border-blue-500/30 transition-all cursor-pointer"
              >
                <Mail size={13} />
                <span>Send Email</span>
              </a>
            )}

            <button
              onClick={() => onLogInteractionClick(lead)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all ml-auto cursor-pointer shadow-sm"
            >
              <PlusCircle size={13} />
              <span>Log Call / Note</span>
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800">
          
          {/* Quick Management Status Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Current Stage</label>
              <select
                value={lead.status}
                onChange={(e) => onUpdateStatus(lead._id || lead.id, e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
              >
                <option value="new">New Lead</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal_sent">Proposal Sent</option>
                <option value="negotiation">Negotiation</option>
                <option value="converted">Closed Won / Converted</option>
                <option value="lost">Lost</option>
                <option value="spam">Spam</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Priority</label>
              <select
                value={lead.priority}
                onChange={(e) => onUpdatePriority(lead._id || lead.id, e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
              >
                <option value="urgent">🔥 Urgent</option>
                <option value="high">⭐ High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Assigned Concierge</label>
              <select
                value={lead.assignedTo?._id || lead.assignedTo || ''}
                onChange={(e) => onAssignAgent(lead._id || lead.id, e.target.value || null)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
              >
                <option value="">-- Unassigned --</option>
                {agents.map(ag => (
                  <option key={ag._id} value={ag._id}>{ag.name || ag.email}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Converted / Quotation Section */}
          {lead.convertedQuotationId ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">Quotation Created & Linked</h4>
                  <p className="text-xs text-emerald-700">
                    Quote Ref: {typeof lead.convertedQuotationId === 'object' ? lead.convertedQuotationId.quotationNumber || lead.convertedQuotationId._id : lead.convertedQuotationId}
                  </p>
                </div>
              </div>
              <a
                href={`/quotations`}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View Quotes</span>
                <ArrowRight size={13} />
              </a>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">Sales Conversion</span>
                <h4 className="text-sm font-black text-white">Generate Official Quotation</h4>
                <p className="text-xs text-slate-300">Convert this lead into an approved WanderLuxe booking quotation.</p>
              </div>
              <button
                onClick={() => onConvertToQuotation(lead)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Sparkles size={14} />
                <span>Create Quote</span>
              </button>
            </div>
          )}

          {/* Travel Requirements Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin size={16} className="text-emerald-600" />
              Travel Preferences & Requirements
            </h3>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Destination</span>
                <span className="text-sm font-extrabold text-slate-800">{lead.tripDetails?.destination || 'Not Specified'}</span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Preferred Dates</span>
                <span className="text-sm font-semibold text-slate-800">
                  {lead.tripDetails?.startDate ? new Date(lead.tripDetails.startDate).toLocaleDateString() : 'Flexible / TBD'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Travelers</span>
                <span className="text-sm font-semibold text-slate-800">
                  {lead.tripDetails?.adults || 1} Adults{lead.tripDetails?.children ? `, ${lead.tripDetails.children} Kids` : ''}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Budget Est.</span>
                <span className="text-sm font-bold text-emerald-700">
                  {lead.tripDetails?.budget ? `₹${lead.tripDetails.budget.toLocaleString('en-IN')}` : 'Flexible'}
                </span>
              </div>
            </div>

            {lead.tripDetails?.specialRequirements && (
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-xs text-amber-950">
                <span className="font-bold block mb-0.5">Special Traveler Notes:</span>
                {lead.tripDetails.specialRequirements}
              </div>
            )}
          </div>

          {/* Scheduled Next Action */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} className="text-emerald-600" />
              Scheduled Next Action
            </h3>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              {lead.nextActionDate ? (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Due: {new Date(lead.nextActionDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    {new Date(lead.nextActionDate) < new Date() && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">Overdue</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{lead.nextActionNotes || 'No specific agenda logged.'}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No scheduled follow-up action. Keep momentum by scheduling one.</p>
              )}

              <button
                onClick={() => onScheduleAction(lead)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {lead.nextActionDate ? 'Reschedule' : 'Set Follow-up'}
              </button>
            </div>
          </div>

          {/* Communication Timeline & Interaction History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-emerald-600" />
                Interactions & Touchpoints ({lead.interactions?.length || 0})
              </h3>
            </div>

            {/* Interactions List */}
            {lead.interactions && lead.interactions.length > 0 ? (
              <div className="space-y-3 pl-2 border-l-2 border-slate-200">
                {lead.interactions.slice().reverse().map((item, idx) => (
                  <div key={idx} className="relative pl-4">
                    <div className="absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-100" />
                    
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                            {item.channel || 'Note'}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{item.summary}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {item.details && (
                        <p className="text-xs text-slate-600 pt-1">{item.details}</p>
                      )}

                      {item.outcome && (
                        <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50/60 px-2 py-0.5 rounded inline-block mt-1">
                          Outcome: {item.outcome.replace(/_/g, ' ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                No recorded interactions yet. Click "Log Call / Note" to start the trail.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
