import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  PhoneCall, Clock, CheckCircle2, AlertCircle, Search, Filter, 
  User, Mail, Phone, ExternalLink, Calendar, MapPin, Sparkles, 
  ShieldCheck, MessageSquare, Plus, CheckSquare, X, ChevronRight,
  ArrowRight, RefreshCw, Eye, Tag, FileText, Ticket,
  Loader2, Send, CornerDownRight, AlertTriangle, MessageCircle, MoreVertical,
  Headphones
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  getAdminLeadsApi, 
  getLeadByIdApi, 
  logLeadContactApi, 
  updateLeadStatusApi, 
  createFollowUpApi 
} from '../services/api.js';

// Relative time formatter helper
function formatRelativeTime(dateString) {
  if (!dateString) return 'Recent';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr === 1) return '1 hr ago';
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

// Operational badge derived from callback date & window
function getCallbackScheduleBadge(dateStr, windowStr, leadStatus) {
  if (['CONVERTED', 'LOST'].includes(leadStatus)) {
    return { label: 'Closed', color: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
  if (!dateStr) {
    return { label: 'Flexible', color: 'bg-slate-100 text-slate-700 border-slate-200' };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  if (dateStr < todayStr) {
    return { label: 'OVERDUE', color: 'bg-rose-100 text-rose-800 border-rose-300 font-black' };
  }
  if (dateStr === todayStr) {
    return { label: 'DUE TODAY', color: 'bg-amber-100 text-amber-900 border-amber-300 font-black' };
  }
  if (dateStr === tomorrowStr) {
    return { label: 'Tomorrow', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
  }
  return { label: dateStr, color: 'bg-slate-100 text-slate-700 border-slate-200' };
}

const AdminExpertRequests = ({ onOpenQuotationBuilder, onViewBooking }) => {
  const { user } = useAuth();
  const userRole = (user?.role || 'admin').toLowerCase();
  const userId = user?._id || user?.id;
  const isSuperOrAdmin = ['admin', 'super_admin', 'operations'].includes(userRole);

  // Data & List State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState('all'); // 'all' | 'new' | 'due_today' | 'overdue' | 'in_progress' | 'qualified'
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [destinationFilter, setDestinationFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 25;

  // Drawer & Modals State
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadDetailLoading, setLeadDetailLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Modals
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostModalLead, setLostModalLead] = useState(null);

  // Drawer Keyboard Listener (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showOutcomeModal) setShowOutcomeModal(false);
        else if (showFollowUpModal) setShowFollowUpModal(false);
        else if (showLostModal) setShowLostModal(false);
        else if (isDrawerOpen) setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, showOutcomeModal, showFollowUpModal, showLostModal]);

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 280);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Leads on filter changes
  const fetchLeads = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setErrorMsg('');

    try {
      const params = {
        leadType: 'callback_request',
        search: debouncedSearch,
        status: statusFilter,
        priority: priorityFilter,
        destination: destinationFilter,
        quickFilter: quickFilter !== 'all' ? quickFilter : undefined,
        sortBy: 'newest'
      };

      const result = await getAdminLeadsApi(params);
      const leadList = Array.isArray(result) ? result : (result?.items || result?.leads || []);
      setLeads(leadList);
    } catch (err) {
      console.error('Failed to load expert requests:', err);
      setErrorMsg(err.message || 'Unable to load Expert Requests from database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [debouncedSearch, quickFilter, statusFilter, priorityFilter, destinationFilter]);

  // Open Drawer and load complete lead dossier
  const handleOpenDrawer = async (lead) => {
    setSelectedLeadId(lead._id || lead.id);
    setSelectedLead(lead);
    setIsDrawerOpen(true);
    setLeadDetailLoading(true);

    try {
      const fullLead = await getLeadByIdApi(lead._id || lead.id);
      setSelectedLead(fullLead);
    } catch (err) {
      console.warn('Failed to load full lead dossier:', err);
    } finally {
      setLeadDetailLoading(false);
    }
  };

  // Update Status directly
  const handleStatusChange = async (leadId, newStatus) => {
    if (newStatus === 'LOST') {
      const lead = leads.find(l => String(l._id || l.id) === String(leadId)) || selectedLead;
      setLostModalLead(lead);
      setShowLostModal(true);
      return;
    }
    try {
      const res = await updateLeadStatusApi(leadId, { status: newStatus });
      const updated = res.lead || { ...selectedLead, status: newStatus };
      setLeads(prev => prev.map(l => (String(l._id || l.id) === String(leadId) ? { ...l, status: newStatus } : l)));
      if (selectedLead && String(selectedLead._id || selectedLead.id) === String(leadId)) {
        setSelectedLead(updated);
      }
    } catch (err) {
      alert(err.message || 'Failed to update lead status');
    }
  };

  // Calculate Real Metric KPI Counts
  const metrics = useMemo(() => {
    const total = leads.length;
    let newCount = 0;
    let inProgressCount = 0;
    let dueTodayCount = 0;
    let overdueCount = 0;
    let qualifiedCount = 0;
    let convertedCount = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    leads.forEach(l => {
      if (l.status === 'NEW') newCount++;
      if (['IN_PROGRESS', 'CONTACTED'].includes(l.status)) inProgressCount++;
      if (l.preferredCallDate === todayStr && !['CONVERTED', 'LOST'].includes(l.status)) dueTodayCount++;
      if (l.preferredCallDate && l.preferredCallDate < todayStr && !['CONVERTED', 'LOST'].includes(l.status)) overdueCount++;
      if (l.status === 'QUALIFIED') qualifiedCount++;
      if (l.status === 'CONVERTED') convertedCount++;
    });

    return { total, newCount, inProgressCount, dueTodayCount, overdueCount, qualifiedCount, convertedCount };
  }, [leads]);

  // Unique destinations for filter dropdown
  const availableDestinations = useMemo(() => {
    const set = new Set();
    leads.forEach(l => {
      if (l.destination) set.add(l.destination);
    });
    return Array.from(set);
  }, [leads]);

  return (
    <div className="space-y-6">
      {/* Module Title Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
            <PhoneCall size={12} /> Real Customer Sales Pipeline
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Expert Requests
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
              {metrics.newCount} NEW
            </span>
          </h2>
          <p className="text-xs text-slate-300 font-medium max-w-xl">
            High-intent travelers requesting consultation from trip pages. Shared sales queue, callbacks, qualifications, and direct quotation dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 shrink-0">
          {isSuperOrAdmin && (
            <Link
              to="/staff/sales"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              title="Open Dedicated Sales Portal Desk"
            >
              <Headphones size={15} />
              <span>Open Sales Desk</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => fetchLeads(true)}
            disabled={refreshing}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Refresh requests"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 5-Card Operational Metrics Bar (Shared Queue Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div 
          onClick={() => setQuickFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            quickFilter === 'all' ? 'bg-slate-900 text-white shadow-md border-slate-900' : 'bg-white text-slate-900 border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider opacity-70">Total Requests</div>
          <div className="text-2xl font-black mt-1">{metrics.total}</div>
          <div className="text-[10px] opacity-60 mt-0.5">Shared callback pool</div>
        </div>

        <div 
          onClick={() => setQuickFilter('new')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            quickFilter === 'new' ? 'bg-emerald-700 text-white shadow-md border-emerald-700' : 'bg-white text-slate-900 border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600 opacity-90">New Inquiries</div>
          <div className="text-2xl font-black mt-1 text-emerald-700">{metrics.newCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Awaiting first contact</div>
        </div>

        <div 
          onClick={() => setQuickFilter('due_today')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            quickFilter === 'due_today' ? 'bg-amber-600 text-white shadow-md border-amber-600' : 'bg-white text-slate-900 border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-amber-700 opacity-90">Due Today</div>
          <div className="text-2xl font-black mt-1 text-amber-600">{metrics.dueTodayCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Scheduled call window</div>
        </div>

        <div 
          onClick={() => setQuickFilter('in_progress')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            quickFilter === 'in_progress' ? 'bg-indigo-900 text-white shadow-md border-indigo-900' : 'bg-white text-slate-900 border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-indigo-600 opacity-90">In Progress</div>
          <div className="text-2xl font-black mt-1 text-indigo-700">{metrics.inProgressCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active conversations</div>
        </div>

        <div 
          onClick={() => setQuickFilter('qualified')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            quickFilter === 'qualified' ? 'bg-purple-900 text-white shadow-md border-purple-900' : 'bg-white text-slate-900 border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-purple-600 opacity-90">Qualified</div>
          <div className="text-2xl font-black mt-1 text-purple-700">{metrics.qualifiedCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ready for Quotation</div>
        </div>
      </div>

      {/* Quick Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {[
          { id: 'all', label: 'All Inquiries' },
          { id: 'new', label: 'New' },
          { id: 'due_today', label: 'Due Today' },
          { id: 'overdue', label: 'Overdue' },
          { id: 'in_progress', label: 'In Progress' },
          { id: 'qualified', label: 'Qualified' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setQuickFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
              quickFilter === tab.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Advanced Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search traveler name, reference ID, phone, destination..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-500"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 outline-none cursor-pointer hover:border-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="QUALIFIED">QUALIFIED</option>
            <option value="CONVERTED">CONVERTED</option>
            <option value="LOST">LOST</option>
          </select>



          {/* Destination Filter */}
          {availableDestinations.length > 0 && (
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 outline-none cursor-pointer hover:border-slate-300 max-w-[140px]"
            >
              <option value="all">All Destinations</option>
              {availableDestinations.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 outline-none cursor-pointer hover:border-slate-300"
          >
            <option value="all">All Priorities</option>
            <option value="URGENT">URGENT</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button 
            type="button" 
            onClick={() => fetchLeads()} 
            className="px-3 py-1 bg-rose-600 text-white rounded-xl text-[11px] font-black cursor-pointer hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Table View (Desktop) & Cards (Mobile) */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/90 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 size={32} className="animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading Expert Requests from database...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <PhoneCall size={20} />
            </div>
            <h4 className="text-sm font-black text-slate-800">No Expert Requests Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              New "Talk to a Travel Expert" submissions from trip pages will appear here in real-time.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table (> 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white uppercase font-black text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Request</th>
                    <th className="p-4">Traveler</th>
                    <th className="p-4">Trip Package</th>
                    <th className="p-4">Callback Window</th>
                    <th className="p-4">Travelers</th>
                    <th className="p-4">Last Activity</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Received</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {leads.map((l) => {
                    const leadId = l._id || l.id;
                    const cleanPhone = String(l.phone || '').replace(/\D/g, '');
                    const waPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
                    const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(`Hi ${l.name || 'Traveler'}, this is regarding your callback request for ${l.tripTitle || l.destination || 'WanderLuxe'}. Is now a good time to connect?`)}`;
                    const schedBadge = getCallbackScheduleBadge(l.preferredCallDate, l.preferredCallWindow, l.status);

                    return (
                      <tr 
                        key={leadId} 
                        onClick={() => handleOpenDrawer(l)}
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                          selectedLeadId === leadId ? 'bg-emerald-50/40' : ''
                        }`}
                      >
                        {/* REQUEST */}
                        <td className="p-4 font-mono font-bold text-slate-900">
                          <div className="space-y-1">
                            <span className="text-emerald-700 hover:underline flex items-center gap-1 font-black text-xs">
                              {l.referenceId || `WLX-EXP-${leadId.slice(-6).toUpperCase()}`}
                            </span>
                            {l.priority === 'URGENT' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-800 uppercase block w-max">
                                URGENT
                              </span>
                            )}
                            {l.priority === 'HIGH' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-900 uppercase block w-max">
                                HIGH
                              </span>
                            )}
                          </div>
                        </td>

                        {/* TRAVELER */}
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{l.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{l.phone}</div>
                        </td>

                        {/* TRIP */}
                        <td className="p-4">
                          <div className="space-y-0.5 max-w-[200px]">
                            <div className="font-bold text-slate-900 truncate" title={l.tripTitle || l.destination}>
                              {l.tripTitle || l.destination}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-medium">
                              {l.destination} {l.selectedBatch ? `• ${l.selectedBatch}` : ''}
                            </div>
                          </div>
                        </td>

                        {/* CALLBACK */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] border ${schedBadge.color}`}>
                              {schedBadge.label}
                            </span>
                            <div className="text-[10px] text-slate-600 font-bold">
                              {l.preferredCallWindow || 'Anytime'}
                            </div>
                          </div>
                        </td>

                        {/* TRAVELERS */}
                        <td className="p-4 font-bold text-slate-700">
                          {l.travelersCount || 1} Pax
                        </td>

                        {/* LAST ACTIVITY */}
                        <td className="p-4">
                          {l.callOutcomes && l.callOutcomes.length > 0 ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                <User size={12} className="text-emerald-600" />
                                <span>{l.callOutcomes[l.callOutcomes.length - 1].loggedByName || 'Specialist'}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {l.callOutcomes[l.callOutcomes.length - 1].outcome} • {formatRelativeTime(l.callOutcomes[l.callOutcomes.length - 1].loggedAt)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">No contact yet</span>
                          )}
                        </td>

                        {/* STATUS */}
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap ${
                            l.status === 'CONVERTED' ? 'bg-emerald-100 text-emerald-800' :
                            l.status === 'CONTACTED' ? 'bg-blue-100 text-blue-800' :
                            l.status === 'QUALIFIED' ? 'bg-purple-100 text-purple-800' :
                            l.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-800' :
                            l.status === 'LOST' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {l.status}
                          </span>
                        </td>

                        {/* RECEIVED */}
                        <td className="p-4 text-slate-400 text-[11px] whitespace-nowrap">
                          {formatRelativeTime(l.createdAt)}
                        </td>

                        {/* ACTIONS */}
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Fast Call Button */}
                            <a
                              href={`tel:${l.phone}`}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              title="Call Traveler"
                            >
                              <Phone size={13} />
                            </a>

                            {/* Fast WhatsApp Button */}
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare size={13} />
                            </a>

                            {/* View Detail Drawer Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenDrawer(l)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="Inspect Details"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards List (< 768px) */}
            <div className="md:hidden divide-y divide-slate-100">
              {leads.map((l) => {
                const leadId = l._id || l.id;
                const schedBadge = getCallbackScheduleBadge(l.preferredCallDate, l.preferredCallWindow, l.status);
                const lastOutcome = Array.isArray(l.callOutcomes) && l.callOutcomes.length > 0
                  ? l.callOutcomes[l.callOutcomes.length - 1]
                  : null;

                return (
                  <div 
                    key={leadId}
                    onClick={() => handleOpenDrawer(l)}
                    className="p-4 space-y-3 active:bg-slate-50 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-mono font-black text-emerald-700">
                          {l.referenceId || `WLX-EXP-${leadId.slice(-6).toUpperCase()}`}
                        </span>
                        <h4 className="text-sm font-black text-slate-900">{l.name}</h4>
                        <div className="text-xs text-slate-500 font-mono">{l.phone}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        l.status === 'CONVERTED' ? 'bg-emerald-100 text-emerald-800' :
                        l.status === 'QUALIFIED' ? 'bg-purple-100 text-purple-800' :
                        l.status === 'CONTACTED' ? 'bg-blue-100 text-blue-800' :
                        l.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {l.status}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-2xl text-xs space-y-1">
                      <div className="font-bold text-slate-800 truncate">{l.tripTitle || l.destination}</div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>Window: {l.preferredCallWindow || 'Anytime'}</span>
                        <span className={`px-2 py-0.5 rounded-full border ${schedBadge.color}`}>
                          {schedBadge.label}
                        </span>
                      </div>
                      {lastOutcome && (
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                          <span>Last: <strong className="text-slate-700">{lastOutcome.outcome}</strong></span>
                          <span>by {lastOutcome.loggedByName || 'Specialist'} ({formatRelativeTime(lastOutcome.loggedAt)})</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(l.createdAt)}
                      </span>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(l)}
                          className="px-3 py-1 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          View <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* RIGHT-SIDE DETAIL SLIDE-OVER DRAWER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isDrawerOpen && selectedLead && (
          <div 
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-lead-title"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            {/* Slide-over Content Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="relative bg-white w-full max-w-xl h-full shadow-2xl z-10 flex flex-col overflow-hidden border-l border-slate-200"
            >
              {/* Drawer Header */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 shrink-0 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-emerald-300">
                        {selectedLead.referenceId || `WLX-EXP-${(selectedLead._id || selectedLead.id).slice(-6).toUpperCase()}`}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        selectedLead.status === 'CONVERTED' ? 'bg-emerald-500/30 text-emerald-300' :
                        selectedLead.status === 'QUALIFIED' ? 'bg-purple-500/30 text-purple-300' :
                        selectedLead.status === 'CONTACTED' ? 'bg-blue-500/30 text-blue-300' :
                        selectedLead.status === 'LOST' ? 'bg-rose-500/30 text-rose-300' : 'bg-amber-500/30 text-amber-300'
                      }`}>
                        {selectedLead.status}
                      </span>
                      {selectedLead.priority && selectedLead.priority !== 'MEDIUM' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/10 text-white">
                          {selectedLead.priority}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-300 font-medium">
                      Received {formatRelativeTime(selectedLead.createdAt)} ({selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleString('en-IN') : 'Recent'})
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Close drawer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Direct Action Contact Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="py-2.5 px-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-white"
                  >
                    <Phone size={13} className="text-emerald-400" />
                    <span>Call Now</span>
                  </a>

                  {(() => {
                    const cleanPhone = String(selectedLead.phone || '').replace(/\D/g, '');
                    const waPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
                    const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(`Hi ${selectedLead.name || 'Traveler'}, this is regarding your callback request for ${selectedLead.tripTitle || selectedLead.destination || 'WanderLuxe'}. How can we assist you today?`)}`;
                    return (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors text-white shadow-xs"
                      >
                        <MessageSquare size={13} />
                        <span>WhatsApp</span>
                      </a>
                    );
                  })()}

                  <a
                    href={`mailto:${selectedLead.email}?subject=${encodeURIComponent(`WanderLuxe Expedition: ${selectedLead.tripTitle || selectedLead.destination}`)}`}
                    className="py-2.5 px-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-white"
                  >
                    <Mail size={13} className="text-sky-400" />
                    <span>Email</span>
                  </a>
                </div>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {leadDetailLoading && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Synchronizing latest Lead details...</span>
                  </div>
                )}

                {/* 1. TRAVELER PROFILE SECTION */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Traveler Contact Dossier
                  </span>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                        <User size={15} className="text-slate-400" />
                        <span>{selectedLead.name}</span>
                      </div>
                      {selectedLead.userId ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Registered User
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                          Guest Inquiry
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Phone</span>
                        <span className="font-mono font-bold text-slate-900">{selectedLead.phone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Email</span>
                        <span className="font-mono font-bold text-slate-900 break-all">{selectedLead.email}</span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span>Travelers Count:</span>
                      <span className="font-black text-slate-900">{selectedLead.travelersCount || 1} Person(s)</span>
                    </div>
                  </div>
                </div>

                {/* 2. TRIP CONTEXT SECTION */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Expedition Context
                    </span>
                    {selectedLead.tripSlug && (
                      <a
                        href={`/trip/${selectedLead.tripSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        View Trip <ExternalLink size={10} />
                      </a>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
                    <div className="flex items-start gap-3">
                      {selectedLead.tripRef?.image ? (
                        <img 
                          src={selectedLead.tripRef.image} 
                          alt="" 
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                          <MapPin size={20} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-slate-900 truncate">
                          {selectedLead.tripTitle || selectedLead.destination}
                        </h4>
                        <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                          {selectedLead.destination}
                        </div>
                        {selectedLead.selectedBatch && (
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                            Batch: <span className="font-bold text-slate-700">{selectedLead.selectedBatch}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedLead.tripPriceSnapshot > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs">
                        <span className="text-slate-500">Authoritative Price Snapshot:</span>
                        <span className="font-black text-slate-900">
                          ₹{Number(selectedLead.tripPriceSnapshot).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. SCHEDULED CALLBACK DETAILS */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Callback Schedule Window
                  </span>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Requested Date:</span>
                      <span className="font-black text-slate-900">{selectedLead.preferredCallDate || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Preferred Window:</span>
                      <span className="font-black text-emerald-700">{selectedLead.preferredCallWindow || 'Anytime'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500">Schedule Status:</span>
                      {(() => {
                        const b = getCallbackScheduleBadge(selectedLead.preferredCallDate, selectedLead.preferredCallWindow, selectedLead.status);
                        return (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] border ${b.color}`}>
                            {b.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* 4. CUSTOMER INTERESTS & NATURAL NOTES */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Traveler Interests & Topics
                  </span>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
                    {Array.isArray(selectedLead.topics) && selectedLead.topics.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedLead.topics.map((top, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-100 text-emerald-900">
                            {top}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No specific interest topics marked</span>
                    )}

                    {selectedLead.message && (
                      <div className="pt-2 border-t border-slate-200/60 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Customer Note:</span>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                          {selectedLead.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. SHARED SALES QUEUE & RECENT ACTIVITY */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Shared Queue & Action Attribution
                  </span>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-black text-xs">
                          <Headphones size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900">
                            Shared Sales Queue
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            Visible to all Sales Specialists
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Open Shared Access
                      </span>
                    </div>

                    {/* Latest contact attribution */}
                    {Array.isArray(selectedLead.callOutcomes) && selectedLead.callOutcomes.length > 0 ? (
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Latest Contact:</span>
                        <span className="font-bold text-slate-800">
                          {selectedLead.callOutcomes[selectedLead.callOutcomes.length - 1].loggedByName || 'Specialist'} ({formatRelativeTime(selectedLead.callOutcomes[selectedLead.callOutcomes.length - 1].loggedAt)})
                        </span>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-400 italic">
                        No calls recorded yet. Any sales specialist can contact and log outcome.
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. NEXT FOLLOW-UP SECTION */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Next Follow-Up
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowFollowUpModal(true)}
                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} /> Schedule Follow-Up
                    </button>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                    {selectedLead.nextFollowUpAt ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-indigo-600" />
                          <span className="font-bold text-slate-800">
                            {new Date(selectedLead.nextFollowUpAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-900 uppercase">
                          Scheduled
                        </span>
                      </div>
                    ) : (
                      <div className="text-slate-400 italic">
                        No pending follow-up scheduled yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* 7. CONTACT OUTCOME & HISTORY LOG */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Contact History & Logged Attempts ({selectedLead.contactCount || 0})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowOutcomeModal(true)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={11} /> Log Outcome
                    </button>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    {Array.isArray(selectedLead.callOutcomes) && selectedLead.callOutcomes.length > 0 ? (
                      <div className="space-y-3">
                        {selectedLead.callOutcomes.map((co, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-800 uppercase text-[10px] px-2 py-0.5 rounded bg-slate-100">
                                {co.outcome} ({co.channel || 'call'})
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {co.loggedAt ? new Date(co.loggedAt).toLocaleString('en-IN') : 'Logged'}
                              </span>
                            </div>
                            {co.notes && (
                              <p className="text-slate-700 font-medium pt-1">
                                {co.notes}
                              </p>
                            )}
                            <div className="text-[10px] text-slate-400 pt-0.5">
                              Logged by {co.loggedByName || 'Specialist'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No call or contact attempts recorded yet. Click "Log Outcome" after interacting.
                      </p>
                    )}
                  </div>
                </div>

                {/* 8. QUOTATIONS & BOOKING INTEGRATION */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Quotations & Live Bookings
                    </span>
                    {selectedLead.status !== 'LOST' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenQuotationBuilder) {
                            onOpenQuotationBuilder(selectedLead);
                          } else {
                            alert('Quotation Builder ready. Click "Create Quote" to proceed.');
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <FileText size={12} /> Create Quotation
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    {/* Linked Quotations */}
                    {Array.isArray(selectedLead.quotations) && selectedLead.quotations.length > 0 ? (
                      <div className="space-y-2">
                        {selectedLead.quotations.map((q, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <span className="font-mono font-bold text-slate-900 block">
                                {q.quotationNumber || `Quote #${idx + 1}`}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-700">
                                ₹{Number(q.pricing?.finalTotal || q.pricing?.totalPrice || 0).toLocaleString()}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                              {q.status || 'DRAFT'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        No custom quotation linked yet. Mark lead as QUALIFIED to dispatch a proposal.
                      </div>
                    )}

                    {/* Linked Converted Booking */}
                    {(selectedLead.convertedBookingCode || selectedLead.convertedBookingId) && (
                      <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                            Converted Booking
                          </span>
                          <span className="font-mono font-black text-slate-900">
                            {selectedLead.convertedBookingCode || selectedLead.convertedBookingId?.bookingId || 'Confirmed Booking'}
                          </span>
                        </div>
                        {onViewBooking && (
                          <button
                            type="button"
                            onClick={() => onViewBooking(selectedLead.convertedBookingCode || selectedLead.convertedBookingId?.bookingId)}
                            className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg text-xs font-bold"
                          >
                            View Booking
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 9. LEAD STAGE QUICK-TRANSITION */}
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Update Pipeline Stage
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {['NEW', 'CONTACTED', 'IN_PROGRESS', 'QUALIFIED', 'LOST'].map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleStatusChange(selectedLead._id || selectedLead.id, st)}
                        className={`py-2 px-1 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                          selectedLead.status === st
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* ========================================================================= */}
      {/* MODAL: LOG CONTACT OUTCOME */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showOutcomeModal && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setShowOutcomeModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-3xl p-6 max-w-md w-full z-10 shadow-2xl space-y-4 border border-slate-200"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <PhoneCall size={18} className="text-emerald-600" /> Log Contact Outcome
                </h4>
                <button 
                  type="button" 
                  onClick={() => setShowOutcomeModal(false)} 
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const outcome = e.target.outcome.value;
                  const channel = e.target.channel.value;
                  const notes = e.target.notes.value;
                  const nextDate = e.target.nextFollowUpDate.value;

                  try {
                    const res = await logLeadContactApi(selectedLead._id || selectedLead.id, {
                      outcome,
                      channel,
                      notes,
                      nextFollowUpDate: nextDate || undefined
                    });

                    if (res.lead) {
                      setSelectedLead(res.lead);
                      setLeads(prev => prev.map(l => (String(l._id || l.id) === String(selectedLead._id || selectedLead.id) ? res.lead : l)));
                    }
                    setShowOutcomeModal(false);
                  } catch (err) {
                    alert(err.message || 'Failed to log contact outcome');
                  }
                }}
                className="space-y-3.5"
              >
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Call / Contact Outcome *
                  </label>
                  <select
                    name="outcome"
                    required
                    defaultValue="CONNECTED"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none"
                  >
                    <option value="CONNECTED">Connected & Discussed</option>
                    <option value="NO_ANSWER">No Answer</option>
                    <option value="BUSY">Line Busy</option>
                    <option value="CALL_LATER">Call Later Requested</option>
                    <option value="WHATSAPP_SENT">WhatsApp Message Sent</option>
                    <option value="EMAIL_SENT">Email Sent</option>
                    <option value="WRONG_NUMBER">Wrong Number</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Channel
                  </label>
                  <select
                    name="channel"
                    defaultValue="call"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none"
                  >
                    <option value="call">Phone Call (tel:)</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Interaction Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Specific requirements discussed, budget preferences, questions asked..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Optional: Auto-Schedule Next Follow-Up
                  </label>
                  <input
                    type="date"
                    name="nextFollowUpDate"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOutcomeModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black shadow-md cursor-pointer"
                  >
                    Save Outcome
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: SCHEDULE FOLLOW-UP */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showFollowUpModal && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setShowFollowUpModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-3xl p-6 max-w-md w-full z-10 shadow-2xl space-y-4 border border-slate-200"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Calendar size={18} className="text-emerald-600" /> Schedule CRM Follow-Up
                </h4>
                <button 
                  type="button" 
                  onClick={() => setShowFollowUpModal(false)} 
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const title = e.target.title.value;
                  const scheduledAt = e.target.scheduledAt.value;
                  const channel = e.target.channel.value;
                  const priority = e.target.priority.value;
                  const notes = e.target.notes.value;

                  try {
                    await createFollowUpApi({
                      leadId: selectedLead._id || selectedLead.id,
                      title,
                      scheduledAt,
                      channel,
                      priority,
                      notes,
                      salesUserId: userId,
                      salesUserName: user?.name
                    });

                    // Update local state
                    const updatedLead = { ...selectedLead, nextFollowUpAt: new Date(scheduledAt) };
                    setSelectedLead(updatedLead);
                    setLeads(prev => prev.map(l => (String(l._id || l.id) === String(selectedLead._id || selectedLead.id) ? updatedLead : l)));
                    setShowFollowUpModal(false);
                  } catch (err) {
                    alert(err.message || 'Failed to schedule follow-up');
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Follow-Up Purpose *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={`Follow-up on ${selectedLead.tripTitle || selectedLead.destination}`}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="scheduledAt"
                      required
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Channel
                    </label>
                    <select
                      name="channel"
                      defaultValue="call"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none"
                    >
                      <option value="call">Phone Call</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    defaultValue="medium"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Specific items to prepare before calling..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFollowUpModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black shadow-md cursor-pointer"
                  >
                    Schedule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: MARK LOST */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showLostModal && assignModalLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setShowLostModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-3xl p-6 max-w-md w-full z-10 shadow-2xl space-y-4 border border-slate-200"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-base font-black text-rose-700 flex items-center gap-2">
                  <AlertTriangle size={18} /> Mark Lead as LOST
                </h4>
                <button 
                  type="button" 
                  onClick={() => setShowLostModal(false)} 
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const lostReason = e.target.lostReason.value;
                  const lostReasonDetail = e.target.lostReasonDetail.value;

                  try {
                    const res = await updateLeadStatusApi(assignModalLead._id || assignModalLead.id, {
                      status: 'LOST',
                      lostReason,
                      lostReasonDetail
                    });
                    const updated = res.lead || { ...assignModalLead, status: 'LOST', lostReason };
                    setLeads(prev => prev.map(l => (String(l._id || l.id) === String(assignModalLead._id || assignModalLead.id) ? updated : l)));
                    if (selectedLead && String(selectedLead._id || selectedLead.id) === String(assignModalLead._id || assignModalLead.id)) {
                      setSelectedLead(updated);
                    }
                    setShowLostModal(false);
                  } catch (err) {
                    alert(err.message || 'Failed to update status to LOST');
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Primary Reason *
                  </label>
                  <select
                    name="lostReason"
                    required
                    defaultValue="Not Interested"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none"
                  >
                    <option value="Not Interested">Not Interested</option>
                    <option value="Budget Mismatch">Budget Mismatch</option>
                    <option value="Dates Unavailable">Dates Unavailable</option>
                    <option value="Unreachable">Unreachable after multiple attempts</option>
                    <option value="Booked Elsewhere">Booked Elsewhere</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Details / Explanation
                  </label>
                  <textarea
                    name="lostReasonDetail"
                    rows={2}
                    placeholder="Specific feedback from customer..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLostModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black shadow-md cursor-pointer"
                  >
                    Confirm Lost
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminExpertRequests;
