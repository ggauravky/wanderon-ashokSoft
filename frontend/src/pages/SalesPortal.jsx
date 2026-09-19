import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Headphones, PhoneCall, Clock, CheckCircle2, AlertCircle, Search, Filter, 
  User, Mail, Phone, ExternalLink, Calendar, MapPin, Sparkles, 
  ShieldCheck, MessageSquare, Plus, CheckSquare, X, ChevronRight,
  ArrowRight, RefreshCw, Eye, Tag, FileText, Ticket,
  Loader2, Send, CornerDownRight, AlertTriangle, MessageCircle, LogOut,
  Shield, ArrowLeft, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  getAdminLeadsApi, 
  getLeadByIdApi, 
  logLeadContactApi, 
  updateLeadStatusApi, 
  createFollowUpApi,
  getSalesDashboardApi
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
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr === 1) return '1h ago';
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

// Callback Schedule Badge
function getCallbackBadge(dateStr, leadStatus) {
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

const SalesPortal = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userRole = (user?.role || 'sales').toLowerCase();
  const userId = user?._id || user?.id;
  const isSuperOrAdmin = ['admin', 'super_admin', 'operations'].includes(userRole);

  // Leads & Loading State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Tab & Filters: Default to 'all' for Shared Sales Queue
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Lead Detail Drawer State
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadDetailLoading, setLeadDetailLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Action Modals
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);

  // Close drawer on Escape
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

  // Fetch leads with server scoping (returns all callback_requests for shared queue)
  const fetchLeads = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setErrorMsg('');

    try {
      const params = {
        limit: 100,
        sortBy: 'newest'
      };

      if (activeTab === 'new') {
        params.quickFilter = 'new';
      } else if (activeTab === 'due_today') {
        params.quickFilter = 'due_today';
      } else if (activeTab === 'overdue') {
        params.quickFilter = 'overdue';
      } else if (activeTab === 'in_progress') {
        params.quickFilter = 'in_progress';
      } else if (activeTab === 'qualified') {
        params.quickFilter = 'qualified';
      }

      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await getAdminLeadsApi(params);
      const items = Array.isArray(data) ? data : (data?.leads || data?.items || []);
      setLeads(items);
    } catch (err) {
      console.error('Error fetching sales leads:', err);
      setErrorMsg(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [activeTab, statusFilter, priorityFilter]);

  // Open Lead Dossier
  const handleOpenLead = async (lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
    setLeadDetailLoading(true);

    try {
      const detailed = await getLeadByIdApi(lead._id || lead.id);
      if (detailed?.lead) {
        setSelectedLead(detailed.lead);
      }
    } catch (err) {
      console.warn('Could not fetch detailed lead dossier:', err.message);
    } finally {
      setLeadDetailLoading(false);
    }
  };

  // Status Change Handler (Permitted for any specialist in shared queue)
  const handleStatusChange = async (leadId, newStatus) => {
    if (newStatus === 'LOST') {
      setShowLostModal(true);
      return;
    }

    try {
      const res = await updateLeadStatusApi(leadId, { status: newStatus });
      if (res.lead) {
        setLeads(prev => prev.map(l => (String(l._id || l.id) === String(leadId) ? res.lead : l)));
        if (selectedLead && String(selectedLead._id || selectedLead.id) === String(leadId)) {
          setSelectedLead(res.lead);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to update request status.');
    }
  };

  // Shared Queue Metrics (Unified across all sales specialists)
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const totalCount = leads.length;
    const newCount = leads.filter(l => l.status === 'NEW').length;
    const dueTodayCount = leads.filter(l => l.preferredCallDate === todayStr && !['CONVERTED', 'LOST'].includes(l.status)).length;
    const overdueCount = leads.filter(l => {
      if (['CONVERTED', 'LOST'].includes(l.status)) return false;
      const callbackOverdue = l.preferredCallDate && l.preferredCallDate < todayStr;
      const followUpOverdue = l.nextFollowUpAt && new Date(l.nextFollowUpAt) <= new Date();
      return callbackOverdue || followUpOverdue;
    }).length;
    const inProgressCount = leads.filter(l => ['CONTACTED', 'IN_PROGRESS'].includes(l.status)).length;
    const qualifiedCount = leads.filter(l => l.status === 'QUALIFIED').length;

    return {
      totalCount,
      newCount,
      dueTodayCount,
      overdueCount,
      inProgressCount,
      qualifiedCount
    };
  }, [leads]);

  // Client-side search filtering
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const q = searchQuery.toLowerCase().trim();
    return leads.filter(l => 
      (l.name || '').toLowerCase().includes(q) ||
      (l.referenceId || '').toLowerCase().includes(q) ||
      (l.phone || '').includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.tripTitle || '').toLowerCase().includes(q) ||
      (l.destination || '').toLowerCase().includes(q)
    );
  }, [leads, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER NAVIGATION */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Workspace Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
              <Headphones size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">WanderLuxe Sales Desk</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Users size={11} /> Shared Sales Queue
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Welcome back, <span className="text-slate-200 font-bold">{user?.name || 'Sales Specialist'}</span> • Open team collaboration
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2.5">
            {isSuperOrAdmin && (
              <Link
                to="/admin"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
                title="Switch to Master Admin Dashboard"
              >
                <ArrowLeft size={14} /> Master Admin
              </Link>
            )}

            <button
              type="button"
              onClick={() => fetchLeads(true)}
              disabled={refreshing}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Sign Out of Sales Portal"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Metric Summary Cards (Shared Team KPIs) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div 
            onClick={() => setActiveTab('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'all' ? 'bg-emerald-950/60 border-emerald-500/50 text-white shadow-lg shadow-emerald-950/40' : 'bg-slate-900/60 border-white/10 hover:border-white/20 text-slate-300'
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Total Requests</div>
            <div className="text-2xl font-black mt-1 text-white">{metrics.totalCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Shared consultation queue</div>
          </div>

          <div 
            onClick={() => setActiveTab('new')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'new' ? 'bg-teal-950/60 border-teal-500/50 text-white shadow-lg shadow-teal-950/40' : 'bg-slate-900/60 border-white/10 hover:border-white/20 text-slate-300'
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-wider text-teal-400">New Inquiries</div>
            <div className="text-2xl font-black mt-1 text-teal-300">{metrics.newCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Awaiting first contact</div>
          </div>

          <div 
            onClick={() => setActiveTab('due_today')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'due_today' ? 'bg-amber-950/60 border-amber-500/50 text-white shadow-lg shadow-amber-950/40' : 'bg-slate-900/60 border-white/10 hover:border-white/20 text-slate-300'
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">Due Today</div>
            <div className="text-2xl font-black mt-1 text-amber-300">{metrics.dueTodayCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Scheduled callbacks</div>
          </div>

          <div 
            onClick={() => setActiveTab('in_progress')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'in_progress' ? 'bg-indigo-950/60 border-indigo-500/50 text-white shadow-lg shadow-indigo-950/40' : 'bg-slate-900/60 border-white/10 hover:border-white/20 text-slate-300'
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-wider text-indigo-400">In Progress</div>
            <div className="text-2xl font-black mt-1 text-indigo-300">{metrics.inProgressCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Active conversations</div>
          </div>

          <div 
            onClick={() => setActiveTab('qualified')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'qualified' ? 'bg-purple-950/60 border-purple-500/50 text-white shadow-lg shadow-purple-950/40' : 'bg-slate-900/60 border-white/10 hover:border-white/20 text-slate-300'
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-wider text-purple-400">Qualified Leads</div>
            <div className="text-2xl font-black mt-1 text-purple-300">{metrics.qualifiedCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Ready for quotation</div>
          </div>
        </div>

        {/* Tab Selection Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-white/10 pb-4">
          {[
            { id: 'all', label: 'All Requests', badge: metrics.totalCount },
            { id: 'new', label: 'New', badge: metrics.newCount },
            { id: 'due_today', label: 'Due Today', badge: metrics.dueTodayCount },
            { id: 'overdue', label: 'Overdue / Follow-ups', badge: metrics.overdueCount },
            { id: 'in_progress', label: 'In Progress', badge: metrics.inProgressCount },
            { id: 'qualified', label: 'Qualified', badge: metrics.qualifiedCount }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900/80 text-slate-300 border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === tab.id ? 'bg-slate-950 text-emerald-400' : 'bg-white/10 text-slate-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full md:max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search traveler name, phone, reference ID, destination..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none cursor-pointer hover:border-white/20"
            >
              <option value="all">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="CONVERTED">CONVERTED</option>
              <option value="LOST">LOST</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none cursor-pointer hover:border-white/20"
            >
              <option value="all">All Priorities</option>
              <option value="URGENT">URGENT</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>

        {/* Requests Table / Cards */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 size={32} className="animate-spin text-emerald-400 mx-auto" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading consultation requests...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-slate-900/40 rounded-3xl border border-white/10 p-12 text-center space-y-3">
            <Headphones size={36} className="text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No Consultation Requests Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No requests matched the current filter criteria in the shared queue.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block bg-slate-900/60 rounded-3xl border border-white/10 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Request</th>
                      <th className="py-3 px-4">Traveler</th>
                      <th className="py-3 px-4">Trip / Destination</th>
                      <th className="py-3 px-4">Callback Schedule</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Last Activity</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {filteredLeads.map((lead) => {
                      const scheduleBadge = getCallbackBadge(lead.preferredCallDate, lead.status);
                      const lastOutcome = Array.isArray(lead.callOutcomes) && lead.callOutcomes.length > 0
                        ? lead.callOutcomes[lead.callOutcomes.length - 1]
                        : null;

                      return (
                        <tr 
                          key={lead._id || lead.id}
                          className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                          onClick={() => handleOpenLead(lead)}
                        >
                          {/* Reference ID */}
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                            {lead.referenceId || lead._id?.slice(-6)?.toUpperCase()}
                          </td>

                          {/* Customer */}
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-white">{lead.name}</div>
                            <div className="text-[11px] text-slate-400">{lead.phone}</div>
                          </td>

                          {/* Trip */}
                          <td className="py-3.5 px-4 max-w-[200px]">
                            <div className="font-bold text-slate-200 truncate">{lead.tripTitle || lead.destination}</div>
                            <div className="text-[11px] text-slate-400">{lead.travelersCount || 1} Travelers • {lead.travelMonth || 'Flexible'}</div>
                          </td>

                          {/* Callback */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] border ${scheduleBadge.color}`}>
                              {scheduleBadge.label}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">{lead.preferredCallWindow || 'Anytime'}</div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              lead.status === 'NEW' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              lead.status === 'QUALIFIED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                              lead.status === 'CONTACTED' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                              lead.status === 'LOST' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                              'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {lead.status}
                            </span>
                          </td>

                          {/* Priority */}
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-black ${
                              lead.priority === 'URGENT' ? 'text-rose-400' :
                              lead.priority === 'HIGH' ? 'text-amber-400' :
                              'text-slate-400'
                            }`}>
                              {lead.priority || 'MEDIUM'}
                            </span>
                          </td>

                          {/* Last Activity (Attribution) */}
                          <td className="py-3.5 px-4 text-[11px]">
                            {lastOutcome ? (
                              <div>
                                <span className="font-bold text-slate-200 block">{lastOutcome.outcome}</span>
                                <span className="text-[10px] text-slate-400">
                                  by {lastOutcome.loggedByName || 'Specialist'} ({formatRelativeTime(lastOutcome.loggedAt)})
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">No contact yet</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                            {lead.phone && (
                              <a
                                href={`tel:${lead.phone}`}
                                className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg inline-flex items-center justify-center transition-all"
                                title="Call Traveler"
                              >
                                <Phone size={13} />
                              </a>
                            )}
                            {lead.phone && (
                              <a
                                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${lead.name}, greetings from WanderLuxe! I am connecting regarding your travel inquiry for ${lead.tripTitle || lead.destination}.`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded-lg inline-flex items-center justify-center transition-all"
                                title="WhatsApp Traveler"
                              >
                                <MessageCircle size={13} />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenLead(lead)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards (Responsive 360px - 768px) */}
            <div className="md:hidden space-y-3">
              {filteredLeads.map((lead) => {
                const scheduleBadge = getCallbackBadge(lead.preferredCallDate, lead.status);
                const lastOutcome = Array.isArray(lead.callOutcomes) && lead.callOutcomes.length > 0
                  ? lead.callOutcomes[lead.callOutcomes.length - 1]
                  : null;

                return (
                  <div
                    key={lead._id || lead.id}
                    onClick={() => handleOpenLead(lead)}
                    className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-3 cursor-pointer hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-emerald-400">
                        {lead.referenceId || lead._id?.slice(-6)?.toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        lead.status === 'NEW' ? 'bg-emerald-500/20 text-emerald-300' :
                        lead.status === 'QUALIFIED' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {lead.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-white text-sm">{lead.name}</h4>
                      <p className="text-xs text-slate-400 font-bold">{lead.tripTitle || lead.destination}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border ${scheduleBadge.color}`}>
                        {scheduleBadge.label} • {lead.preferredCallWindow || 'Anytime'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatRelativeTime(lead.createdAt)}
                      </span>
                    </div>

                    {lastOutcome && (
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5 flex items-center justify-between">
                        <span>Last: <strong className="text-slate-200">{lastOutcome.outcome}</strong></span>
                        <span>by {lastOutcome.loggedByName || 'Specialist'} ({formatRelativeTime(lastOutcome.loggedAt)})</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <Phone size={13} /> Call
                        </a>
                      )}
                      {lead.phone && (
                        <a
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle size={13} /> WhatsApp
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenLead(lead)}
                        className="px-3 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-bold"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 3. DETAIL DOSSIER DRAWER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isDrawerOpen && selectedLead && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-slate-900 border-l border-white/10 shadow-2xl h-full flex flex-col z-10 text-slate-100"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {selectedLead.referenceId || selectedLead._id}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300">
                      {selectedLead.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-white mt-1">{selectedLead.name}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Direct Contact Bar */}
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <Phone size={14} /> Call Traveler
                  </a>
                  <a
                    href={`https://wa.me/${selectedLead.phone?.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-600/20"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Mail size={14} /> Email
                  </a>
                </div>

                {/* Traveler & Trip Details Card */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-3">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Inquiry Dossier</h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Trip / Destination</span>
                      <span className="text-white font-bold">{selectedLead.tripTitle || selectedLead.destination}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Travelers</span>
                      <span className="text-white font-bold">{selectedLead.travelersCount || 1} Travelers</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Target Month / Date</span>
                      <span className="text-white font-bold">{selectedLead.travelMonth || selectedLead.travelDate || 'Flexible'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Budget Per Person</span>
                      <span className="text-white font-bold">{selectedLead.budgetPerPerson || 'Standard Experience'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Callback Schedule</span>
                      <span className="text-amber-400 font-bold">{selectedLead.preferredCallDate || 'Anytime'} ({selectedLead.preferredCallWindow || 'Flexible'})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Queue Access</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Users size={12} /> Shared Sales Queue
                      </span>
                    </div>
                  </div>

                  {selectedLead.message && (
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Traveler Note</span>
                      <p className="text-xs text-slate-300 italic bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                        "{selectedLead.message}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Consultation Workflow Actions (Accessible by all specialists) */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Specialist Actions</h4>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setShowOutcomeModal(true)}
                        className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/10"
                      >
                        <PhoneCall size={14} className="text-emerald-400" /> Log Call Outcome
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowFollowUpModal(true)}
                        className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/10"
                      >
                        <Calendar size={14} className="text-indigo-400" /> Schedule Follow-up
                      </button>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400 font-bold whitespace-nowrap">Status:</label>
                      <select
                        value={selectedLead.status}
                        onChange={(e) => handleStatusChange(selectedLead._id || selectedLead.id, e.target.value)}
                        className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer"
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="QUALIFIED">QUALIFIED</option>
                        <option value="LOST">LOST (Mark as Unresponsive/Budget Unfit)</option>
                      </select>
                    </div>

                    {/* Create Quotation if Qualified */}
                    {selectedLead.status === 'QUALIFIED' && (
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/admin/quotations?leadId=${selectedLead._id || selectedLead.id}`);
                        }}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-purple-600/20 cursor-pointer flex items-center justify-center gap-2 mt-2"
                      >
                        <FileText size={16} /> Open Quotation Builder for Traveler
                      </button>
                    )}
                  </div>
                </div>

                {/* Call History / Activity Timeline */}
                {Array.isArray(selectedLead.callOutcomes) && selectedLead.callOutcomes.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Interaction History & Action Attribution</h4>
                    <div className="space-y-2.5">
                      {selectedLead.callOutcomes.map((co, idx) => (
                        <div key={idx} className="p-3 bg-slate-950/80 rounded-xl border border-white/5 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-400">{co.outcome}</span>
                            <span className="text-[10px] text-slate-500">{formatRelativeTime(co.loggedAt)}</span>
                          </div>
                          {co.notes && <p className="text-slate-300 text-[11px]">{co.notes}</p>}
                          <div className="text-[10px] text-slate-400 pt-0.5">
                            Logged by: <span className="font-bold text-slate-200">{co.loggedByName || 'Specialist'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 4. MODAL: LOG CONTACT OUTCOME */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showOutcomeModal && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs" onClick={() => setShowOutcomeModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full z-10 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                  <PhoneCall size={18} className="text-emerald-400" /> Log Contact Outcome
                </h4>
                <button 
                  type="button" 
                  onClick={() => setShowOutcomeModal(false)} 
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
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
                className="space-y-3.5 text-xs"
              >
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Contact Outcome *
                  </label>
                  <select
                    name="outcome"
                    required
                    defaultValue="CONNECTED"
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl font-bold text-white outline-none"
                  >
                    <option value="CONNECTED">Connected & Spoke with Traveler</option>
                    <option value="NO_ANSWER">No Answer</option>
                    <option value="BUSY">Line Busy</option>
                    <option value="CALL_LATER">Call Later Requested</option>
                    <option value="WHATSAPP_SENT">WhatsApp Message Shared</option>
                    <option value="EMAIL_SENT">Email Sent</option>
                    <option value="WRONG_NUMBER">Wrong Number</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Channel</label>
                  <select
                    name="channel"
                    defaultValue="call"
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl font-bold text-white outline-none"
                  >
                    <option value="call">Phone Call (tel:)</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Interaction Notes</label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Specific questions answered, destination preferences discussed..."
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-white outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Optional: Auto-Schedule Next Follow-Up
                  </label>
                  <input
                    type="date"
                    name="nextFollowUpDate"
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl font-bold text-white outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOutcomeModal(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-md cursor-pointer"
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
      {/* 5. MODAL: SCHEDULE FOLLOW-UP */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showFollowUpModal && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs" onClick={() => setShowFollowUpModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full z-10 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-400" /> Schedule CRM Follow-Up
                </h4>
                <button 
                  type="button" 
                  onClick={() => setShowFollowUpModal(false)} 
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const scheduledDate = e.target.scheduledDate.value;
                  const callWindow = e.target.callWindow.value;
                  const notes = e.target.notes.value;

                  try {
                    await createFollowUpApi({
                      leadId: selectedLead._id || selectedLead.id,
                      scheduledAt: scheduledDate,
                      callWindow,
                      notes,
                      title: `Follow-up on ${selectedLead.tripTitle || selectedLead.destination}`
                    });

                    setShowFollowUpModal(false);
                    fetchLeads(true);
                    alert('Follow-up scheduled successfully.');
                  } catch (err) {
                    alert(err.message || 'Failed to schedule follow-up.');
                  }
                }}
                className="space-y-3.5 text-xs"
              >
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Date *</label>
                  <input
                    type="date"
                    name="scheduledDate"
                    required
                    defaultValue={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl font-bold text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Time Window</label>
                  <select
                    name="callWindow"
                    defaultValue="Morning (10 AM - 1 PM)"
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl font-bold text-white outline-none"
                  >
                    <option value="Morning (10 AM - 1 PM)">Morning (10 AM - 1 PM)</option>
                    <option value="Afternoon (1 PM - 5 PM)">Afternoon (1 PM - 5 PM)</option>
                    <option value="Evening (5 PM - 8 PM)">Evening (5 PM - 8 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Notes</label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Follow up on custom itinerary options and pricing approval..."
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-white outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFollowUpModal(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black shadow-md cursor-pointer"
                  >
                    Confirm Follow-Up
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 6. MODAL: MARK AS LOST */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showLostModal && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs" onClick={() => setShowLostModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full z-10 shadow-2xl space-y-4"
            >
              <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-400" /> Mark Lead as LOST
              </h4>
              <p className="text-xs text-slate-400">
                Please provide a business reason for marking this inquiry as LOST.
              </p>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const lostReason = e.target.lostReason.value;
                  const lostDetail = e.target.lostDetail.value;

                  try {
                    const res = await updateLeadStatusApi(selectedLead._id || selectedLead.id, {
                      status: 'LOST',
                      lostReason,
                      lostReasonDetail: lostDetail
                    });
                    if (res.lead) {
                      setSelectedLead(res.lead);
                      setLeads(prev => prev.map(l => (String(l._id || l.id) === String(selectedLead._id || selectedLead.id) ? res.lead : l)));
                    }
                    setShowLostModal(false);
                  } catch (err) {
                    alert(err.message || 'Failed to update lead');
                  }
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Reason *</label>
                  <select
                    name="lostReason"
                    required
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl font-bold text-white outline-none"
                  >
                    <option value="Budget Mismatch">Budget Mismatch</option>
                    <option value="Date Unavailable">Departure Date Unavailable</option>
                    <option value="Booked Elsewhere">Booked Elsewhere / With Competitor</option>
                    <option value="Unresponsive">Unresponsive after multiple contacts</option>
                    <option value="Trip Cancelled">Traveler Cancelled Plans</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Details</label>
                  <textarea
                    name="lostDetail"
                    rows={2}
                    placeholder="Specific notes on traveler response..."
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-white outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLostModal(false)}
                    className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black"
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

export default SalesPortal;
