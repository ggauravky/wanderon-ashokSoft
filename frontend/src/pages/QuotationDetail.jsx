import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, Send, CheckCircle2, XCircle, AlertTriangle,
  Compass, CreditCard, ExternalLink, Copy, Check, Calendar, MapPin,
  Users, Hotel, Car, Tag, ShieldCheck, Clock, Download, RefreshCw,
  Edit3, Trash2, Archive, Phone, Mail, ChevronRight, Eye, Shield,
  Plane, Train, Bus, Lock, Camera
} from 'lucide-react';
import {
  getQuotationByIdApi,
  sendQuotationApi,
  approveQuotationApi,
  rejectQuotationApi,
  archiveQuotationApi,
  createQuotationRevisionApi,
  convertQuotationToTripApi,
  createBookingFromQuotationApi,
  deleteQuotationApi
} from '../services/quotationService.js';
import QuotationPreviewModal from '../components/QuotationPreviewModal';
import ShareQuotationModal from '../components/ShareQuotationModal';
import BookingDetailsModal from '../components/BookingDetailsModal';
import DocumentPreviewModal from '../components/DocumentPreviewModal';

export default function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Modals
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getQuotationByIdApi(id);
      if (res.quotation) {
        setQuotation(res.quotation);
      } else {
        setQuotation(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to load quotation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchQuotation();
  }, [id]);

  // Actions
  const handleSend = async () => {
    if (!quotation) return;
    try {
      setActionLoading(true);
      await sendQuotationApi(quotation._id || quotation.id);
      await fetchQuotation();
      setShowShareModal(true);
    } catch (err) {
      alert('Failed to send quotation: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!quotation) return;
    try {
      setActionLoading(true);
      await approveQuotationApi(quotation._id || quotation.id, { reason: 'Manually approved by Administrator' });
      await fetchQuotation();
    } catch (err) {
      alert('Failed to approve quotation: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateRevision = async () => {
    if (!quotation) return;
    const reason = window.prompt('Reason for creating revision (e.g., Client requested hotel change / dates modified):', 'Client requested changes');
    if (!reason) return;
    try {
      setActionLoading(true);
      await createQuotationRevisionApi(quotation._id || quotation.id, { reason });
      await fetchQuotation();
      alert('New revision created in DRAFT status! You can now edit the itinerary and recalculate pricing.');
    } catch (err) {
      alert('Failed to create revision: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToBooking = async () => {
    if (!quotation) return;
    try {
      setActionLoading(true);
      const res = await createBookingFromQuotationApi(quotation._id || quotation.id);
      await fetchQuotation();
      setShowBookingModal(true);
    } catch (err) {
      alert('Failed to convert to booking: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToTrip = async () => {
    if (!quotation) return;
    try {
      setActionLoading(true);
      const res = await convertQuotationToTripApi(quotation._id || quotation.id);
      await fetchQuotation();
      alert('Quotation converted to draft catalog trip! View it in the Trips CMS tab.');
    } catch (err) {
      alert('Failed to convert to trip: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!quotation) return;
    if (!window.confirm(`Archive quotation ${quotation.quotationNumber}?`)) return;
    try {
      setActionLoading(true);
      await archiveQuotationApi(quotation._id || quotation.id);
      await fetchQuotation();
    } catch (err) {
      alert('Failed to archive quotation: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!quotation) return;
    if (!window.confirm(`Permanently delete quotation ${quotation.quotationNumber}? This action cannot be undone.`)) return;
    try {
      setActionLoading(true);
      await deleteQuotationApi(quotation._id || quotation.id);
      navigate('/admin/quotations');
    } catch (err) {
      alert('Failed to delete quotation: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyPublicLink = () => {
    if (!quotation?.publicShare?.token) return;
    const url = `${window.location.origin}/quotation/${quotation.publicShare.token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Quotation Commercial Record...</p>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-slate-200 shadow-sm space-y-4">
          <AlertTriangle size={36} className="text-amber-500 mx-auto" />
          <h2 className="text-lg font-black text-slate-900">Quotation Not Found</h2>
          <p className="text-xs text-slate-500">{error || 'The requested quotation could not be loaded.'}</p>
          <Link
            to="/admin/quotations"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Quotations Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const cust = quotation.customerSnapshot || {};
  const trip = quotation.tripRequirements || {};
  const pricing = quotation.pricing || {};
  const isConverted = quotation.status === 'CONVERTED';
  const isApproved = quotation.status === 'APPROVED';
  const isDraft = quotation.status === 'DRAFT';
  const isSent = quotation.status === 'SENT' || quotation.status === 'VIEWED';

  const statusBadgeColor = {
    DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
    SENT: 'bg-blue-100 text-blue-800 border-blue-200',
    VIEWED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    CONVERTED: 'bg-emerald-600 text-white border-emerald-600',
    REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
    EXPIRED: 'bg-amber-100 text-amber-800 border-amber-200',
    ARCHIVED: 'bg-slate-200 text-slate-600 border-slate-300'
  }[quotation.status] || 'bg-slate-100 text-slate-700';

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left Info */}
            <div className="flex items-start sm:items-center gap-3">
              <button
                onClick={() => navigate('/admin/quotations')}
                className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer mt-0.5 sm:mt-0"
                title="Back to Quotations List"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900 font-mono">{quotation.quotationNumber}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${statusBadgeColor}`}>
                    {quotation.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                    v{quotation.version || 1}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-medium mt-0.5">
                  <span className="text-slate-700 font-bold">{cust.name}</span>
                  <span>•</span>
                  <span>{trip.destination}</span>
                  <span>•</span>
                  <span>{trip.duration || `${trip.days}D/${trip.nights}N`}</span>
                  <span>•</span>
                  <span>Created {new Date(quotation.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Right Contextual Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Draft Actions */}
              {isDraft && (
                <>
                  <button
                    onClick={() => navigate(`/admin?tab=quotations&quoteId=${quotation._id || quotation.id}`)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 size={13} /> Edit in Builder
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Send size={13} /> Send to Customer
                  </button>
                </>
              )}

              {/* Sent / Viewed Actions */}
              {isSent && (
                <>
                  <button
                    onClick={handleCreateRevision}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <RefreshCw size={13} /> Create Revision
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 size={13} /> Approve
                  </button>
                </>
              )}

              {/* Approved Actions */}
              {isApproved && (
                <>
                  <button
                    onClick={handleConvertToBooking}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <CreditCard size={13} /> Convert to Booking (Path B)
                  </button>
                  <button
                    onClick={handleConvertToTrip}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Compass size={13} /> Convert to Trip (Path A)
                  </button>
                  <button
                    onClick={handleCreateRevision}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={13} /> Create Revision
                  </button>
                </>
              )}

              {/* Converted Quick View */}
              {isConverted && quotation.bookingCode && (
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="px-3 py-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CreditCard size={13} /> View Booking {quotation.bookingCode}
                </button>
              )}

              {/* Universal Preview & Share Actions */}
              <button
                onClick={() => setShowPreviewModal(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Preview Customer Proposal PDF"
              >
                <Eye size={13} /> Preview
              </button>

              {quotation.publicShare?.token && (
                <a
                  href={`/quotation/${quotation.publicShare.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors"
                  title="Open Public Customer Proposal"
                >
                  <ExternalLink size={14} />
                </a>
              )}

              {isDraft && (
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors cursor-pointer"
                  title="Delete Draft Quotation"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 mt-4 pt-3 text-xs font-bold">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'customer', label: 'Customer & Lead' },
              { id: 'itinerary', label: 'Itinerary' },
              { id: 'accommodations', label: 'Stays & Fleet' },
              { id: 'pricing', label: 'Commercials' },
              { id: 'audit', label: 'Audit & Revisions' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Prominent Conversion Banner (Section 4 & 95) */}
        {isConverted && (
          <div className="bg-gradient-to-r from-emerald-900 to-slate-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                    Converted Commercial Agreement
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Snapshot Version v{quotation.version || 1}
                  </span>
                </div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  Converted to Live Private Booking Order
                </h2>
                <p className="text-xs text-slate-300">
                  This quotation has converted into binding booking reference{' '}
                  <span className="font-mono font-bold text-emerald-400">{quotation.bookingCode}</span>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {quotation.bookingCode && (
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                  >
                    <CreditCard size={14} /> View Booking Order
                  </button>
                )}

                {quotation.convertedTripId && (
                  <button
                    onClick={() => navigate('/admin?tab=trips')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black flex items-center gap-2 transition-all border border-white/10 cursor-pointer"
                  >
                    <Compass size={14} /> View Draft Trip in CMS
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Main Summary */}
            <div className="lg:col-span-2 space-y-6">
              {/* Commercial Metrics Grid */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Commercial Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Final Total</div>
                    <div className="text-lg font-black text-slate-900 mt-0.5">
                      ₹{Number(pricing.finalTotal || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">Incl. 5% GST</div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Per Person</div>
                    <div className="text-lg font-black text-slate-900 mt-0.5">
                      ₹{Number(pricing.perPersonPrice || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">For {trip.totalTravelers || 2} Pax</div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">10% Deposit Due</div>
                    <div className="text-lg font-black text-emerald-700 mt-0.5">
                      ₹{Number(pricing.depositRequired || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">To Confirm Booking</div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Projected Margin</div>
                    <div className="text-lg font-black text-slate-900 mt-0.5">
                      {pricing.projectedMarginPercent || 25}%
                    </div>
                    <div className="text-[10px] text-slate-400">₹{Number(pricing.projectedMargin || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Trip Highlights Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Itinerary Highlights</h3>
                  <span className="text-xs font-bold text-slate-500">{quotation.itinerary?.length || 0} Days Planned</span>
                </div>

                <div className="space-y-3">
                  {(quotation.itinerary || []).slice(0, 3).map((day, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0">
                        {day.day || idx + 1}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-black text-slate-900">{day.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-2">{day.description}</div>
                      </div>
                    </div>
                  ))}
                  {(quotation.itinerary || []).length > 3 && (
                    <button
                      onClick={() => setActiveTab('itinerary')}
                      className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 pt-1 cursor-pointer"
                    >
                      View all {quotation.itinerary.length} days <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Quick Details */}
            <div className="space-y-6">
              {/* Customer Quick Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3 text-xs">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Primary Traveler</h3>
                <div className="space-y-1.5">
                  <div className="text-sm font-black text-slate-900">{cust.name}</div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail size={13} className="text-slate-400" /> {cust.email}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone size={13} className="text-slate-400" /> {cust.phone}
                  </div>
                  {cust.phone && (
                    <a
                      href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 pt-1"
                    >
                      WhatsApp Traveler <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>

              {/* Validity & Share Link Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3 text-xs">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Proposal Share Link</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Valid Until:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('en-IN') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Customer Views:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {quotation.publicShare?.viewCount || 0} views
                    </span>
                  </div>

                  {quotation.publicShare?.token && (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={handleCopyPublicLink}
                        className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedLink ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        {copiedLink ? 'Copied' : 'Copy Link'}
                      </button>
                      <a
                        href={`/quotation/${quotation.publicShare.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors"
                        title="Open in new window"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMER & LEAD */}
        {activeTab === 'customer' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <h3 className="text-sm font-black text-slate-900">Customer & Inquiry Linkage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <div>
                  <span className="text-slate-400 font-bold">Full Name</span>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{cust.name}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">Email Address</span>
                  <div className="text-slate-800 font-medium mt-0.5">{cust.email}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">Phone / WhatsApp</span>
                  <div className="text-slate-800 font-medium mt-0.5">{cust.phone}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">City / Hub</span>
                  <div className="text-slate-800 font-medium mt-0.5">{cust.city || 'N/A'}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-slate-400 font-bold">Assigned Sales Specialist</span>
                  <div className="text-slate-800 font-bold mt-0.5">
                    {quotation.assignedToSnapshot?.name || 'Concierge Desk'} ({quotation.assignedToSnapshot?.email || 'sales@wanderluxe.in'})
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">CRM Lead Association</span>
                  <div className="text-slate-800 font-medium mt-0.5">
                    {quotation.leadId ? (
                      <span className="font-mono text-indigo-700 font-bold">
                        Linked Lead ID: {typeof quotation.leadId === 'object' ? quotation.leadId._id : quotation.leadId}
                      </span>
                    ) : (
                      'Direct Custom Quotation'
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">Customer Notes</span>
                  <div className="text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 mt-0.5">
                    {cust.notes || 'No special requests noted.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ITINERARY */}
        {activeTab === 'itinerary' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900">Day-by-Day Journey Plan</h3>
            <div className="space-y-4">
              {(quotation.itinerary || []).map((day, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                        {day.day || idx + 1}
                      </span>
                      <h4 className="text-xs font-black text-slate-900">{day.title}</h4>
                    </div>
                    {day.stay && (
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                        Stay: {day.stay}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600">{day.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                    {day.morning && (
                      <div className="p-2 rounded-xl bg-white border border-slate-100">
                        <span className="font-bold text-amber-700">Morning:</span> {day.morning}
                      </div>
                    )}
                    {day.afternoon && (
                      <div className="p-2 rounded-xl bg-white border border-slate-100">
                        <span className="font-bold text-blue-700">Afternoon:</span> {day.afternoon}
                      </div>
                    )}
                    {day.evening && (
                      <div className="p-2 rounded-xl bg-white border border-slate-100">
                        <span className="font-bold text-indigo-700">Evening:</span> {day.evening}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: STAYS & FLEET */}
        {activeTab === 'accommodations' && (
          <div className="space-y-6">
            {/* Hotels Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Hotel size={16} className="text-emerald-600" /> Accommodation Options
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(quotation.hotelOptions || []).map((h, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      h.selected
                        ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/20'
                        : 'border-slate-200/80 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h.tier} Tier</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5">{h.hotelName}</div>
                        <div className="text-[11px] text-slate-500">{h.roomType} • {h.mealPlan}</div>
                      </div>
                      {h.selected && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="border-t border-slate-100 mt-3 pt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Customer Price</span>
                      <span className="font-black text-slate-900">₹{Number(h.totalPrice || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transport Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Car size={16} className="text-indigo-600" /> Transport Segments & Fleet Inventory
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  {(quotation.transportOptions || []).length} segment(s) configured
                </span>
              </div>

              <div className="space-y-4">
                {(quotation.transportOptions || []).map((t, idx) => (
                  <div
                    key={t.optionId || idx}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      t.selected
                        ? 'border-indigo-500 bg-indigo-50/15 ring-1 ring-indigo-500/20'
                        : 'border-slate-200/80 bg-white opacity-85'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1">
                            {t.mode === 'FLIGHT' ? <Plane size={11} /> : t.mode === 'TRAIN' ? <Train size={11} /> : t.mode === 'BUS' ? <Bus size={11} /> : <Car size={11} />}
                            {t.mode || t.type}
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            {t.route?.from || t.pickup || 'Origin'} ➔ {t.route?.to || t.drop || 'Destination'}
                          </span>
                          {t.selected ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                              Active in Price
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black uppercase">
                              Alternative
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-bold text-slate-800">
                          {t.vehicle || t.title || 'Reserved Transit'}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-slate-900">
                          ₹{Number(t.totalPrice || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">
                          {t.pricingType === 'PER_PERSON' ? 'Per Person' : 'Per Vehicle'}
                        </div>
                      </div>
                    </div>

                    {(t.schedule?.departureDate || t.schedule?.departureTime) && (
                      <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 bg-slate-50 p-2.5 rounded-xl">
                        <span>Depart: {t.schedule.departureDate} {t.schedule.departureTime}</span>
                        {t.schedule.arrivalDate && <span>Arrive: {t.schedule.arrivalDate} {t.schedule.arrivalTime}</span>}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3">
                      {t.reference?.flightNumber && <span>Flight #: <strong className="text-slate-700">{t.reference.flightNumber}</strong></span>}
                      {t.reference?.trainNumber && <span>Train #: <strong className="text-slate-700">{t.reference.trainNumber}</strong></span>}
                      {t.reference?.pnr && <span>PNR: <strong className="text-slate-700 font-mono">{t.reference.pnr}</strong></span>}
                      {t.cabinClass && <span>Class: <strong className="text-slate-700">{t.cabinClass}</strong></span>}
                      {t.seatDetails && <span>Seats: <strong className="text-slate-700">{t.seatDetails}</strong></span>}
                      {t.capacity > 0 && <span>Capacity: {t.capacity} Pax</span>}
                      {t.provider && <span className="flex items-center gap-1"><Lock size={10} className="text-amber-600" /> Supplier: {t.provider}</span>}
                    </div>

                    {/* Fleet Photos */}
                    {(t.vehicleMedia || []).length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Fleet Media:</span>
                        <div className="flex flex-wrap gap-2">
                          {t.vehicleMedia.map((m, mIdx) => (
                            <img
                              key={m.id || mIdx}
                              src={m.url}
                              alt={m.caption || 'Fleet'}
                              className="w-16 h-11 object-cover rounded-lg border border-slate-200"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Attached Travel Documents */}
                    {(t.documents || []).length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tickets & Travel Documents:</span>
                        <div className="space-y-1">
                          {t.documents.map((doc, dIdx) => (
                            <div key={doc.id || dIdx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs border border-slate-200">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText size={14} className="text-slate-500 shrink-0" />
                                <span className="font-bold text-slate-800 truncate">{doc.title || doc.fileName}</span>
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase shrink-0 ${
                                  doc.visibility === 'INTERNAL_ONLY' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {doc.visibility === 'INTERNAL_ONLY' ? 'Internal Only' : 'Customer Visible'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc(doc)}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                                >
                                  Preview
                                </button>
                                {doc.secureUrl && (
                                  <a href={doc.secureUrl} download={doc.fileName} className="text-slate-400 hover:text-slate-700">
                                    <Download size={13} />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: COMMERCIALS */}
        {activeTab === 'pricing' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <h3 className="text-sm font-black text-slate-900">Authoritative Financial Breakdown</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
              {/* Customer Facing Pricing */}
              <div className="space-y-3">
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Customer Facing Charges</div>
                <div className="space-y-2 font-medium">
                  <div className="flex justify-between text-slate-600">
                    <span>Stay Accommodations</span>
                    <span className="font-bold text-slate-900">₹{Number(pricing.customerHotelPrice || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Dedicated Transport</span>
                    <span className="font-bold text-slate-900">₹{Number(pricing.customerTransportPrice || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Activities & Add-Ons</span>
                    <span className="font-bold text-slate-900">
                      ₹{(Number(pricing.customerActivityPrice || 0) + Number(pricing.customerAddOnPrice || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Commercial Subtotal</span>
                    <span className="font-bold text-slate-900">₹{Number(pricing.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {pricing.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Commercial Concession / Discount</span>
                      <span className="font-bold">-₹{Number(pricing.discountAmount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>GST (5% Tour Operator)</span>
                    <span className="font-bold text-slate-900">₹{Number(pricing.gstAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                    <span>Final Total</span>
                    <span>₹{Number(pricing.finalTotal || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Internal Margins (Admin Only) */}
              <div className="space-y-3">
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Internal Supplier & Profit Analysis</div>
                <div className="space-y-2 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Supplier Cost</span>
                    <span className="font-bold text-slate-900">₹{Number(pricing.totalInternalCost || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Markup Applied</span>
                    <span className="font-bold text-slate-900">₹{Number(pricing.markupAmount || 0).toLocaleString()} ({pricing.markupPercent || 0}%)</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Projected Gross Margin</span>
                    <span className="font-bold text-emerald-600">₹{Number(pricing.projectedMargin || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Margin %</span>
                    <span className="font-bold text-emerald-600">{pricing.projectedMarginPercent || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT & REVISIONS */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <h3 className="text-sm font-black text-slate-900">Lifecycle Audit Trail & Version History</h3>

            {/* Revision Snapshots */}
            {Array.isArray(quotation.revisions) && quotation.revisions.length > 0 && (
              <div className="space-y-3">
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Archived Revisions</div>
                <div className="space-y-2">
                  {quotation.revisions.map((rev, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">Revision v{rev.version}</span>
                        <span className="text-slate-400 ml-2">Reason: {rev.reason}</span>
                      </div>
                      <span className="font-mono text-slate-500">
                        {new Date(rev.revisedAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Log */}
            <div className="space-y-3">
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Status Transition History</div>
              <div className="space-y-2">
                {(quotation.statusHistory || []).map((entry, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-bold text-[10px]">
                        {entry.status}
                      </span>
                      <span className="text-slate-600">{entry.reason || 'Status changed'}</span>
                    </div>
                    <span className="font-mono text-slate-400 text-[11px]">
                      {new Date(entry.changedAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showPreviewModal && (
        <QuotationPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          quotationData={quotation}
        />
      )}

      {showShareModal && (
        <ShareQuotationModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          quotationData={quotation}
        />
      )}

      {showBookingModal && (
        <BookingDetailsModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          bookingCode={quotation.bookingCode}
          quotationData={quotation}
        />
      )}

      {previewDoc && (
        <DocumentPreviewModal
          isOpen={Boolean(previewDoc)}
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
