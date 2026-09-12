import React, { useState } from 'react';
import { 
  X, User, Phone, Mail, MapPin, Calendar, Clock, DollarSign, 
  MessageSquare, UserCheck, ShieldCheck, Tag, Plus, CheckCircle2, 
  AlertTriangle, ArrowRight, ExternalLink, FileText, Send, PhoneCall
} from 'lucide-react';

export default function LeadDetailModal({ 
  lead, 
  onClose, 
  currentUser,
  onClaim, 
  onAssign, 
  onScheduleFollowUp, 
  onLogContact, 
  onCreateQuote,
  onStatusChange 
}) {
  if (!lead) return null;

  const cleanPhone = String(lead.phone || '').replace(/\D/g, '');
  const waLink = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(`Hi ${lead.name || 'Traveler'}, this is regarding your inquiry for ${lead.tripTitle || lead.destination || 'WanderLuxe'}. How can we assist you today?`)}`;
  
  const isAssignedToMe = lead.assignedToUser && (
    String(lead.assignedToUser._id || lead.assignedToUser) === String(currentUser?._id || currentUser?.id)
  );

  const getPriorityBadge = (priority) => {
    switch (String(priority || '').toUpperCase()) {
      case 'URGENT':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'LOW':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'MEDIUM':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONVERTED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'QUALIFIED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'IN_PROGRESS':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'CONTACTED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOST':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'NEW':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-md">
                {lead.referenceId || lead._id || 'LEAD'}
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getPriorityBadge(lead.priority)}`}>
                {lead.priority || 'MEDIUM'} PRIORITY
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(lead.status)}`}>
                {lead.status || 'NEW'}
              </span>
            </div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              {lead.name}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800">
          
          {/* Quick Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`tel:${lead.phone}`}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 text-slate-800 hover:text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Phone size={13} className="text-emerald-600" /> Call ({lead.phone})
              </a>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <MessageSquare size={13} className="text-emerald-600" /> WhatsApp
              </a>
              <button
                onClick={() => onLogContact(lead)}
                className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-800 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <PhoneCall size={13} className="text-indigo-600" /> Log Outcome
              </button>
              <button
                onClick={() => onScheduleFollowUp(lead)}
                className="px-3 py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Clock size={13} className="text-blue-600" /> Schedule Follow-Up
              </button>
            </div>

            <button
              onClick={() => onCreateQuote(lead)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileText size={14} /> Create Quotation
            </button>
          </div>

          {/* Traveler & Assignment Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Contact Details Card */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <User size={14} className="text-slate-600" /> Traveler Contact Info
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Full Name:</span>
                  <span className="font-bold text-slate-900">{lead.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Email:</span>
                  <a href={`mailto:${lead.email}`} className="font-mono font-bold text-indigo-600 hover:underline">{lead.email}</a>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Phone:</span>
                  <span className="font-mono font-bold text-slate-900">{lead.phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Preferred Window:</span>
                  <span className="font-bold text-indigo-700">
                    {lead.preferredCallWindow || 'Anytime'} {lead.preferredCallDate ? `(${lead.preferredCallDate})` : ''}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Lead Type:</span>
                  <span className="font-bold text-slate-800 uppercase">{lead.leadType || 'trip_enquiry'}</span>
                </div>
              </div>
            </div>

            {/* Concierge Assignment Card */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <UserCheck size={14} className="text-slate-600" /> Sales Concierge Assignment
                </h3>
                {isAssignedToMe ? (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Assigned to You
                  </span>
                ) : null}
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 items-center">
                  <span className="text-slate-500 font-medium">Current Specialist:</span>
                  <span className="font-bold text-slate-900">
                    {lead.assignedToUserName || lead.assignedTo || 'Unassigned / Sales Pool'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Assigned At:</span>
                  <span className="font-mono text-slate-700">
                    {lead.assignedAt ? new Date(lead.assignedAt).toLocaleString('en-IN') : 'Not yet assigned'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Next Scheduled Follow-up:</span>
                  <span className="font-bold text-indigo-600 font-mono">
                    {lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleString('en-IN') : 'None scheduled'}
                  </span>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  {!isAssignedToMe && (
                    <button
                      onClick={() => onClaim(lead)}
                      className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black transition-colors cursor-pointer"
                    >
                      ⚡ Claim Lead
                    </button>
                  )}
                  <button
                    onClick={() => onAssign(lead)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Reassign Specialist
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Trip Details Card */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <MapPin size={14} className="text-slate-600" /> Trip Package & Requirements
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Destination</span>
                <span className="font-bold text-slate-900">{lead.destination || 'Meghalaya'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Trip Title</span>
                <span className="font-bold text-slate-900 truncate block" title={lead.tripTitle}>
                  {lead.tripTitle || 'Custom Expedition'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Travelers</span>
                <span className="font-bold text-slate-900">{lead.travelersCount || 1} Pax</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Budget / Person</span>
                <span className="font-bold text-slate-900">{lead.budgetPerPerson || 'Flexible'}</span>
              </div>
            </div>

            {lead.message && (
              <div className="mt-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 text-xs">
                <span className="text-[10px] uppercase text-amber-800 font-bold block mb-1">Traveler Message:</span>
                <p className="text-slate-700 italic">{lead.message}</p>
              </div>
            )}
          </div>

          {/* Contact History & Activity Logs */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <PhoneCall size={14} className="text-slate-600" /> Contact Logs & Call Outcomes ({lead.callOutcomes?.length || 0})
              </h3>
              <button
                onClick={() => onLogContact(lead)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Log New Call
              </button>
            </div>

            {lead.callOutcomes && lead.callOutcomes.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {lead.callOutcomes.map((log, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          log.outcome === 'CONNECTED' ? 'bg-emerald-100 text-emerald-800' :
                          log.outcome === 'BUSY' ? 'bg-amber-100 text-amber-800' :
                          log.outcome === 'CALL_LATER' ? 'bg-blue-100 text-blue-800' :
                          log.outcome === 'WHATSAPP_SENT' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {log.outcome}
                        </span>
                        <span className="text-[11px] text-slate-400 capitalize font-medium">via {log.channel || 'call'}</span>
                      </div>
                      {log.notes && <p className="text-slate-700 font-medium">{log.notes}</p>}
                    </div>
                    <div className="text-right shrink-0 text-[10px] text-slate-400 font-mono">
                      <div>{log.loggedAt ? new Date(log.loggedAt).toLocaleDateString('en-IN') : ''}</div>
                      <div>{log.loggedByName || 'Specialist'}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400 italic">
                No contact attempts logged yet. Click "Log Outcome" after calling or messaging the traveler.
              </div>
            )}
          </div>

          {/* Linked Quotations */}
          {lead.quotations && lead.quotations.length > 0 && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <FileText size={14} className="text-slate-600" /> Linked Quotations ({lead.quotations.length})
              </h3>
              <div className="space-y-2">
                {lead.quotations.map((q, idx) => (
                  <div key={idx} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-800">{q.quotationNumber || 'QUOTE'}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-white border border-emerald-200 text-emerald-800">
                        {q.status || 'SENT'}
                      </span>
                    </div>
                    <div className="font-black text-slate-900">
                      ₹{Number(q.pricing?.finalPayable || q.pricing?.totalPrice || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Lead Status:</span>
            <select
              value={lead.status}
              onChange={(e) => onStatusChange(lead._id || lead.id, e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="CONVERTED">CONVERTED</option>
              <option value="LOST">LOST</option>
            </select>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
