import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, Users, Hotel, Car, Compass, CheckCircle2,
  XCircle, Download, Printer, Share2, ShieldCheck, Check, Sparkles,
  AlertCircle, ArrowRight, Phone, Mail, MessageSquare, ChevronDown, ChevronUp, Tag,
  CreditCard, Shield, AlertTriangle, X, Plane, Train, Bus, FileText, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getPublicQuotationByTokenApi,
  updatePublicSelectedOptionsApi,
  customerQuotationDecisionApi
} from '../services/quotationService.js';
import QuotationDocument from '../components/QuotationDocument';
import ShareQuotationModal from '../components/ShareQuotationModal';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import ItineraryDayGallery from '../components/ItineraryDayGallery';
import { exportElementToPdf, printElementDirectly } from '../utils/pdfGenerator';

export default function PublicQuotationView() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingOptions, setUpdatingOptions] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionSuccess, setDecisionSuccess] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  const proposalDocRef = useRef(null);

  // Load Quotation Proposal
  useEffect(() => {
    if (!token) return;
    const fetchProposal = async () => {
      try {
        setLoading(true);
        const res = await getPublicQuotationByTokenApi(token);
        if (res.quotation) {
          setQuotation(res.quotation);
        }
      } catch (err) {
        console.error('Failed to load proposal:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProposal();
  }, [token]);

  // Extract Unique Stay Segments
  const getUniqueStaySegments = (hotels = []) => {
    const map = new Map();
    hotels.forEach((h, idx) => {
      const segId = h.segmentId || `seg_${idx + 1}`;
      const segName = h.segmentName || (hotels.length > 1 ? `Stay Segment ${idx + 1}` : 'Primary Stay');
      if (!map.has(segId)) {
        map.set(segId, {
          segmentId: segId,
          segmentName: segName,
          segmentOrder: h.segmentOrder || (map.size + 1),
          city: h.city || ''
        });
      }
    });
    if (map.size === 0) {
      map.set('seg_1', { segmentId: 'seg_1', segmentName: 'Primary Stay', segmentOrder: 1, city: '' });
    }
    return Array.from(map.values()).sort((a, b) => a.segmentOrder - b.segmentOrder);
  };

  const isExpired = quotation?.validUntil && new Date(quotation.validUntil).getTime() < Date.now();
  const isLocked = quotation?.status === 'APPROVED' || quotation?.status === 'CONVERTED';

  // Customer selects hotel option in a segment
  const handleSelectHotelOption = async (optionId) => {
    if (!quotation || updatingOptions || isExpired || isLocked) return;
    try {
      setUpdatingOptions(true);
      const res = await updatePublicSelectedOptionsApi(token, {
        selectedHotelId: optionId
      });
      if (res.quotation) {
        setQuotation(res.quotation);
      }
    } catch (err) {
      alert('Error updating option: ' + err.message);
    } finally {
      setUpdatingOptions(false);
    }
  };

  // Customer toggles add-on
  const handleToggleAddOn = async (addonId) => {
    if (!quotation || updatingOptions || isExpired || isLocked) return;
    const currentSelected = (quotation.addOns || []).filter(a => a.selected).map(a => a.addonId);
    const updatedSelected = currentSelected.includes(addonId)
      ? currentSelected.filter(id => id !== addonId)
      : [...currentSelected, addonId];

    try {
      setUpdatingOptions(true);
      const res = await updatePublicSelectedOptionsApi(token, {
        selectedAddOnIds: updatedSelected
      });
      if (res.quotation) {
        setQuotation(res.quotation);
      }
    } catch (err) {
      alert('Error updating extras: ' + err.message);
    } finally {
      setUpdatingOptions(false);
    }
  };

  // Customer records decision (Accept)
  const handleConfirmApproval = async () => {
    try {
      setDecisionLoading(true);
      const res = await customerQuotationDecisionApi(token, {
        decision: 'APPROVE'
      });
      if (res.quotation) {
        setQuotation(res.quotation);
        setShowApprovalModal(false);
        setDecisionSuccess('Quotation approved! Our concierge team is preparing your confirmed booking order.');
      }
    } catch (err) {
      alert('Failed to approve proposal: ' + err.message);
    } finally {
      setDecisionLoading(false);
    }
  };

  // Customer records decision (Decline / Request Change)
  const handleRejectProposal = async () => {
    try {
      setDecisionLoading(true);
      const res = await customerQuotationDecisionApi(token, {
        decision: 'REJECT',
        customerNotes: rejectNotes
      });
      if (res.quotation) {
        setQuotation(res.quotation);
        setShowRejectModal(false);
        setDecisionSuccess('Thank you for your feedback. Our specialist will review your notes and prepare a revised itinerary.');
      }
    } catch (err) {
      alert('Failed to record feedback: ' + err.message);
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!proposalDocRef.current) return;
    try {
      await exportElementToPdf(
        proposalDocRef.current,
        {
          filename: `WanderLuxe-Proposal-${quotation.quotationNumber || 'Journey'}.pdf`
        }
      );
    } catch (e) {
      alert('Failed to export PDF');
    }
  };

  const handlePrint = () => {
    if (!proposalDocRef.current) return;
    printElementDirectly(proposalDocRef.current);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4 pt-24">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Loading Journey Proposal...</p>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4 pt-24 text-center">
        <AlertCircle size={48} className="text-amber-400 mb-4" />
        <h2 className="text-2xl font-black mb-2">Proposal Not Found</h2>
        <p className="text-xs text-slate-400 max-w-md mb-6">
          This quotation link may have expired or is invalid. Please contact your WanderLuxe travel specialist.
        </p>
        <Link to="/" className="px-6 py-3 bg-emerald-500 text-slate-950 rounded-xl text-xs font-black uppercase">
          Return to Homepage
        </Link>
      </div>
    );
  }

  const staySegments = getUniqueStaySegments(quotation.hotelOptions);
  const selectedHotels = (quotation.hotelOptions || []).filter(h => h.selected);
  const selectedTransports = (quotation.transportOptions || []).filter(t => t.selected).length > 0 
    ? (quotation.transportOptions || []).filter(t => t.selected) 
    : [(quotation.transportOptions || [])[0]].filter(Boolean);
  const selectedTransport = selectedTransports[0];
  const isChildrenPresent = (quotation.tripRequirements?.children || 0) > 0 || (quotation.tripRequirements?.infants || 0) > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-32 pt-24 md:pt-28">
      <div className="container mx-auto px-3 sm:px-6 md:px-8 max-w-6xl space-y-6 sm:space-y-8">
        
        {/* Expiry Banner Notice (PART 15) */}
        {isExpired && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-3xl p-4 sm:p-5 flex items-start sm:items-center gap-3 text-amber-200 text-xs font-medium shadow-lg">
            <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1">
              <strong className="text-amber-300 font-bold block sm:inline mr-1">Proposal Rate Locked Period Expired:</strong>
              This quotation rates expired on {new Date(quotation.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}. Stays and dynamic flight/hotel rates are subject to availability.
            </div>
            <button
              onClick={() => setShowRejectModal(true)}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-black text-xs shrink-0 cursor-pointer"
            >
              Request Refresh
            </button>
          </div>
        )}

        {/* Top Proposal Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Official Travel Proposal • {quotation.quotationNumber} (v{quotation.version || 1})
              </span>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                quotation.status === 'APPROVED' ? 'bg-emerald-500 text-slate-950' :
                quotation.status === 'REJECTED' ? 'bg-rose-500 text-white' :
                quotation.status === 'CONVERTED' ? 'bg-purple-500 text-white' : 'bg-amber-400 text-slate-950'
              }`}>
                {quotation.status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
              {quotation.tripRequirements?.title}
            </h1>
            <p className="text-xs text-slate-400">
              Curated for <strong className="text-white">{quotation.customerSnapshot?.name}</strong> • {quotation.tripRequirements?.duration} • {quotation.tripRequirements?.totalTravelers} Travelers
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Share2 size={13} /> Share & WhatsApp
            </button>
            <button
              onClick={handleExportPdf}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Download size={13} /> PDF
            </button>
          </div>
        </div>

        {decisionSuccess && (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-black flex items-center gap-2">
            <CheckCircle2 size={18} /> {decisionSuccess}
          </div>
        )}

        {/* Main Grid: Document & Interactive Options */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left 8/12: Printable Document View */}
          <div className="lg:col-span-8 space-y-8">
            <div
              ref={proposalDocRef}
              id="public-quotation-print"
              className="bg-white text-slate-900 p-5 sm:p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-200 space-y-8 overflow-hidden"
            >
              {/* Proposal Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-4">
                <div>
                  <div className="text-emerald-700 font-black text-2xl tracking-tight">WANDERLUXE</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Luxury & Adventure Travel Concierge</div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 pt-3">{quotation.tripRequirements?.title}</h2>
                  <div className="text-xs text-slate-600 font-bold flex flex-wrap items-center gap-2 pt-1.5">
                    <span className="flex items-center gap-1 text-emerald-700"><MapPin size={13} /> {quotation.tripRequirements?.destination}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-indigo-700"><Clock size={13} /> {quotation.tripRequirements?.duration}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-700"><Users size={13} /> {quotation.tripRequirements?.totalTravelers} Travelers</span>
                  </div>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <div className="text-xs font-mono font-black text-slate-900">{quotation.quotationNumber}</div>
                  <div className="text-[10px] text-slate-400">Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  <div className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block">
                    Valid for 7 Calendar Days
                  </div>
                </div>
              </div>

              {/* Interactive Hotel Tier Alternatives by Stay Segment (PART 1, 2, 3, 7) */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Hotel size={16} className="text-emerald-600" /> Accommodation Plan & Hotel Tiers
                  </h3>
                  {updatingOptions && (
                    <span className="text-[10px] text-emerald-600 font-bold animate-pulse">Recalculating...</span>
                  )}
                </div>

                {staySegments.map((seg, sIdx) => {
                  const segHotels = (quotation.hotelOptions || []).filter(h => (h.segmentId || 'seg_1') === seg.segmentId);

                  return (
                    <div key={seg.segmentId} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <span className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-emerald-600 text-white text-[10px] flex items-center justify-center">
                            {sIdx + 1}
                          </span>
                          {seg.segmentName} ({segHotels[0]?.nights || 1} Nights)
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          {segHotels.length} Tier Alternatives (Tap to Select)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {segHotels.map((hotel) => (
                          <div
                            key={hotel.optionId}
                            onClick={() => handleSelectHotelOption(hotel.optionId)}
                            className={`p-4 rounded-xl border transition-all space-y-2 relative ${
                              hotel.selected
                                ? 'bg-emerald-50/80 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            } ${isExpired || isLocked ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                hotel.selected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {hotel.tier || 'Deluxe'}
                              </span>
                              {hotel.selected && (
                                <span className="text-xs text-emerald-700 font-black flex items-center gap-1">
                                  <Check size={13} /> Selected Choice
                                </span>
                              )}
                            </div>

                            <div>
                              <div className="font-black text-slate-900 text-xs sm:text-sm">{hotel.hotelName}</div>
                              <div className="text-[11px] text-slate-500">{hotel.roomType} • {hotel.mealPlan}</div>
                            </div>

                            {hotel.amenities?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {hotel.amenities.map((a, i) => (
                                  <span key={i} className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 font-medium">
                                    {a}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="pt-1.5 border-t border-slate-200/60 flex justify-between items-center text-xs">
                              <span className="text-[10px] text-slate-400">{hotel.nights} Nights Stay</span>
                              <span className="font-mono font-black text-slate-900">₹{(hotel.totalPrice || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Day-by-Day Journey Itinerary */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-600" /> Day-by-Day Experience Breakdown
                </h3>

                <div className="space-y-4">
                  {(quotation.itinerary || []).map((day, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-[10px] flex items-center justify-center shrink-0">
                            D{day.day}
                          </span>
                          <span>{day.title}</span>
                        </div>
                        {day.locationName && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                            📍 {day.locationName}
                          </span>
                        )}
                      </div>

                      {/* Curated 3-Image Nature Gallery Block */}
                      <ItineraryDayGallery
                        day={day}
                        destination={quotation.destination}
                        className="my-2"
                      />

                      {day.description && <p className="text-slate-600 leading-relaxed text-[11px]">{day.description}</p>}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        {day.morning && (
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                            <span className="text-[10px] font-black uppercase text-amber-700 block">Morning</span>
                            <span className="text-slate-700 text-[11px]">{day.morning}</span>
                          </div>
                        )}
                        {day.afternoon && (
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                            <span className="text-[10px] font-black uppercase text-blue-700 block">Afternoon</span>
                            <span className="text-slate-700 text-[11px]">{day.afternoon}</span>
                          </div>
                        )}
                        {day.evening && (
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                            <span className="text-[10px] font-black uppercase text-indigo-700 block">Evening</span>
                            <span className="text-slate-700 text-[11px]">{day.evening}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 pt-1 border-t border-slate-200/40">
                        {day.stay && <span>🏨 Stay: <strong className="text-slate-800">{day.stay}</strong></span>}
                        {day.transferDetails && <span>🚗 Fleet: <strong className="text-slate-800">{day.transferDetails}</strong></span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transportation & Optional Extras */}
              <div className="space-y-4">
                <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
                  <div className="text-[11px] font-black uppercase tracking-wider text-indigo-900 flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Car size={15} className="text-indigo-600" /> Transportation & Fleet Logistics
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">{selectedTransports.length} Segment(s)</span>
                  </div>

                  <div className="space-y-3">
                    {selectedTransports.map((t, idx) => {
                      const fromLoc = t.route?.from || t.pickup || 'Departure Point';
                      const toLoc = t.route?.to || t.drop || 'Arrival Destination';
                      const primaryImg = (t.vehicleMedia || []).find(m => m.isPrimary)?.url || t.vehicleMedia?.[0]?.url;
                      const customerDocs = (t.documents || []).filter(d => d.visibility === 'CUSTOMER_VISIBLE');

                      return (
                        <div key={t.optionId || idx} className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2.5 shadow-2xs">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1">
                                  {t.mode === 'FLIGHT' ? <Plane size={11} /> : t.mode === 'TRAIN' ? <Train size={11} /> : t.mode === 'BUS' ? <Bus size={11} /> : <Car size={11} />}
                                  {t.mode || t.type}
                                </span>
                                <span className="font-black text-slate-900 text-xs">{fromLoc} ➔ {toLoc}</span>
                              </div>
                              <div className="font-bold text-slate-800 text-xs">
                                {t.vehicle || t.title || 'Reserved Transit'}
                              </div>
                            </div>

                            {primaryImg && (
                              <button
                                type="button"
                                onClick={() => setPreviewImg(primaryImg)}
                                className="relative rounded-lg overflow-hidden border border-slate-200 group cursor-pointer"
                                title="Click to view full photo"
                              >
                                <img
                                  src={primaryImg}
                                  alt="Transit vehicle"
                                  className="w-16 h-11 object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                  <Eye size={12} />
                                </div>
                              </button>
                            )}
                          </div>

                          {(t.schedule?.departureDate || t.schedule?.departureTime) && (
                            <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-4 bg-slate-50 p-2 rounded-lg">
                              <span><strong>Depart:</strong> {t.schedule.departureDate} {t.schedule.departureTime}</span>
                              {t.schedule.arrivalDate && <span><strong>Arrive:</strong> {t.schedule.arrivalDate} {t.schedule.arrivalTime}</span>}
                            </div>
                          )}

                          <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-3">
                            {t.reference?.flightNumber && <span>Flight: <strong className="text-slate-700">{t.reference.flightNumber}</strong></span>}
                            {t.reference?.trainNumber && <span>Train: <strong className="text-slate-700">{t.reference.trainNumber}</strong></span>}
                            {t.cabinClass && <span>Class: <strong className="text-slate-700">{t.cabinClass}</strong></span>}
                            {t.seatDetails && <span>Seat: <strong className="text-slate-700">{t.seatDetails}</strong></span>}
                            {t.capacity > 0 && <span>Capacity: {t.capacity} Pax</span>}
                            {t.inclusions?.length > 0 && <span>Inclusions: {t.inclusions.join(', ')}</span>}
                          </div>

                          {/* Customer-Visible Documents & Passes */}
                          {customerDocs.length > 0 && (
                            <div className="pt-2 border-t border-slate-100 space-y-1.5">
                              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <FileText size={11} /> Travel Documents & Tickets
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {customerDocs.map((doc, dIdx) => (
                                  <div
                                    key={doc.id || dIdx}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2 text-[11px]"
                                  >
                                    <span className="font-bold text-slate-800 truncate max-w-[140px]">{doc.title || doc.fileName}</span>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewDoc(doc)}
                                        className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 cursor-pointer"
                                        title="Preview Document"
                                      >
                                        <Eye size={12} />
                                      </button>
                                      {doc.secureUrl && (
                                        <a
                                          href={doc.secureUrl}
                                          download={doc.fileName || 'ticket.pdf'}
                                          className="p-1 hover:bg-emerald-100 rounded text-slate-600 hover:text-emerald-700"
                                          title="Download Document"
                                        >
                                          <Download size={12} />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Extras Toggle */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <div className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1.5">
                    <Tag size={13} /> Optional Extras & Add-ons
                  </div>
                  <div className="space-y-1.5">
                    {(quotation.addOns || []).map((addon) => (
                      <div
                        key={addon.addonId}
                        onClick={() => handleToggleAddOn(addon.addonId)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          addon.selected ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold' : 'bg-white border-slate-200 text-slate-600'
                        } ${isExpired ? 'cursor-not-allowed opacity-90' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={Boolean(addon.selected)} readOnly className="w-3.5 h-3.5 text-emerald-600 rounded" />
                          <span className="text-[11px]">{addon.name}</span>
                        </div>
                        <span className="font-mono text-[11px] font-black">₹{(addon.totalPrice || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inclusions & Exclusions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="font-black uppercase text-emerald-800 border-b border-emerald-100 pb-1 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Confirmed Inclusions
                  </div>
                  <ul className="space-y-1 text-slate-600 text-[11px]">
                    {(quotation.inclusions || []).map((inc, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">✓</span> {inc}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="font-black uppercase text-rose-800 border-b border-rose-100 pb-1 flex items-center gap-1.5">
                    <XCircle size={14} /> Exclusions
                  </div>
                  <ul className="space-y-1 text-slate-600 text-[11px]">
                    {(quotation.exclusions || []).map((exc, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold">✗</span> {exc}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right 4/12: Sticky Pricing & Decision Card (Desktop) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl sticky top-28 space-y-6 text-white">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Transparent Pricing</span>
                <h3 className="text-lg font-black text-white pt-1">Investment Breakdown</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Selected Hotel Stays</span>
                  <span className="font-mono text-white font-bold">₹{(quotation.pricing?.customerHotelPrice || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Transportation & Fleet</span>
                  <span className="font-mono text-white font-bold">₹{(quotation.pricing?.customerTransportPrice || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Experiences & Add-ons</span>
                  <span className="font-mono text-white font-bold">
                    ₹{((quotation.pricing?.customerActivityPrice || 0) + (quotation.pricing?.customerAddOnPrice || 0)).toLocaleString()}
                  </span>
                </div>

                {(quotation.pricing?.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Special Concession</span>
                    <span className="font-mono">- ₹{quotation.pricing.discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400">
                  <span>Tour Operator GST ({quotation.pricing?.gstPercent || 5}%)</span>
                  <span className="font-mono text-white">+ ₹{(quotation.pricing?.gstAmount || 0).toLocaleString()}</span>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="block text-[10px] font-black uppercase text-slate-400">Total Journey Price</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      ₹{(quotation.pricing?.finalTotal || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Per Person</span>
                    <span className="text-sm font-black text-white font-mono">
                      ₹{(quotation.pricing?.perPersonPrice || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Age-based Pax breakdown if children/infants exist */}
                {isChildrenPresent && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px] text-slate-300 font-mono">
                    <div className="flex justify-between">
                      <span>Adults ({quotation.tripRequirements?.adults} Pax):</span>
                      <span>₹{(quotation.pricing?.adultTotal || 0).toLocaleString()}</span>
                    </div>
                    {(quotation.tripRequirements?.children || 0) > 0 && (
                      <div className="flex justify-between text-indigo-300">
                        <span>Children 70% ({quotation.tripRequirements?.children} Pax):</span>
                        <span>₹{(quotation.pricing?.childTotal || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {(quotation.tripRequirements?.infants || 0) > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Infants ({quotation.tripRequirements?.infants} Pax):</span>
                        <span>₹0 (Complimentary)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Deposit Terms Highlight */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-amber-400 font-black text-xs">
                  <span>10% Deposit Due to Confirm:</span>
                  <span className="font-mono">₹{(quotation.pricing?.depositRequired || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>90% Balance Due (6 days prior):</span>
                  <span className="font-mono text-slate-200">₹{(quotation.pricing?.balanceAmount || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Customer Decision Actions (Desktop) */}
              {quotation.status !== 'APPROVED' && quotation.status !== 'CONVERTED' ? (
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => setShowApprovalModal(true)}
                    disabled={decisionLoading || isExpired}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} /> Accept & Proceed to Booking
                  </button>

                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={decisionLoading}
                    className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-2xl text-xs font-bold border border-slate-800 transition-all cursor-pointer"
                  >
                    Request Modification / Decline
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-1">
                  <CheckCircle2 size={24} className="text-emerald-400 mx-auto" />
                  <div className="text-xs font-black text-emerald-400 uppercase">Quotation Approved</div>
                  <p className="text-[11px] text-slate-400 font-medium">Our travel specialist is confirming your room reservations.</p>
                </div>
              )}

              {/* Concierge Contact Card */}
              <div className="pt-3 border-t border-slate-800 text-xs space-y-2 text-slate-400">
                <div className="text-[10px] font-black uppercase text-slate-500">Need Customization Help?</div>
                <div className="flex items-center justify-between font-bold text-white">
                  <span>Sales Specialist:</span>
                  <span className="text-emerald-400">{quotation.assignedToSnapshot?.name || 'Concierge Team'}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`tel:${quotation.assignedToSnapshot?.phone || '+918542036499'}`}
                    className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 rounded-xl text-center text-[11px] font-bold text-slate-200 border border-slate-800 flex items-center justify-center gap-1"
                  >
                    <Phone size={11} /> Call Specialist
                  </a>
                  <a
                    href={`https://wa.me/918542036499?text=${encodeURIComponent(`Hi, I am reviewing my quotation ${quotation.quotationNumber} for ${quotation.tripRequirements?.title}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 rounded-xl text-center text-[11px] font-bold border border-emerald-800/60 flex items-center justify-center gap-1"
                  >
                    <MessageSquare size={11} /> WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* MOBILE STICKY ACTION BAR (PART 17) */}
        {/* ========================================================================= */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-4 flex items-center justify-between shadow-2xl">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-black">Final Proposal Price</div>
            <div className="text-lg font-black text-emerald-400 font-mono">
              ₹{(quotation.pricing?.finalTotal || 0).toLocaleString()}
            </div>
          </div>

          {quotation.status !== 'APPROVED' && quotation.status !== 'CONVERTED' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={decisionLoading}
                className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-700"
              >
                Decline
              </button>
              <button
                onClick={() => setShowApprovalModal(true)}
                disabled={decisionLoading || isExpired}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                <CheckCircle2 size={14} /> Accept Proposal
              </button>
            </div>
          ) : (
            <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-black flex items-center gap-1">
              <CheckCircle2 size={14} /> Approved
            </span>
          )}
        </div>

        {/* ========================================================================= */}
        {/* APPROVAL CONFIRMATION MODAL (PART 9) */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {showApprovalModal && (
            <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-800 text-left"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                      <CheckCircle2 size={18} />
                    </div>
                    <h3 className="text-base font-black text-white">Confirm Quotation Approval</h3>
                  </div>
                  <button onClick={() => setShowApprovalModal(false)} className="text-slate-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>

                <p className="text-xs text-slate-300">
                  Please review your selected trip options before confirming. Our concierge team will immediately proceed with reserving your accommodations and private fleet.
                </p>

                {/* Summary Box */}
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-xs space-y-2.5">
                  <div className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                    Confirmed Choices Snapshot
                  </div>
                  {selectedHotels.map((h, i) => (
                    <div key={i} className="flex justify-between text-slate-300">
                      <span>🏨 {h.segmentName || `Stay ${i+1}`}: {h.hotelName}</span>
                      <strong className="text-white font-mono">₹{(h.totalPrice || 0).toLocaleString()}</strong>
                    </div>
                  ))}
                  <div className="flex justify-between text-slate-300">
                    <span>🚗 Fleet: {selectedTransport?.vehicle || 'Dedicated 4x4 SUV'}</span>
                    <strong className="text-white font-mono">₹{(quotation.pricing?.customerTransportPrice || 0).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>📅 Dates: {quotation.tripRequirements?.startDate ? new Date(quotation.tripRequirements.startDate).toLocaleDateString('en-IN') : 'Flexible'}</span>
                    <span className="text-slate-400">{quotation.tripRequirements?.totalTravelers} Travelers</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                    <span className="font-bold text-white">Final Package Total</span>
                    <span className="font-black text-emerald-400 font-mono">₹{(quotation.pricing?.finalTotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-amber-400 font-bold">
                    <span>10% Advance Deposit Due:</span>
                    <span className="font-mono">₹{(quotation.pricing?.depositRequired || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Back to Proposal
                  </button>
                  <button
                    onClick={handleConfirmApproval}
                    disabled={decisionLoading}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    {decisionLoading ? 'Confirming...' : 'Confirm Approval'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* DECLINE / REQUEST MODIFICATION MODAL (PART 11) */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {showRejectModal && (
            <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-800 text-left"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <MessageSquare size={18} className="text-amber-400" /> Request Modification or Decline
                  </h3>
                  <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Please let us know how we can adjust this proposal (e.g. change hotel tier, adjust dates, modify inclusions, or alter route).
                </p>
                <textarea
                  rows={4}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="e.g. Please change accommodation in Manali to a 5-star heritage suite and add private airport pickup."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500"
                />
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectProposal}
                    disabled={decisionLoading}
                    className="flex-1 py-2.5 bg-amber-500 text-slate-950 rounded-xl text-xs font-black hover:bg-amber-400 transition-all cursor-pointer"
                  >
                    {decisionLoading ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Multi-Channel Share Modal (PART 14) */}
        <ShareQuotationModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          quotation={quotation}
          onExportPdf={handleExportPdf}
          onPrint={handlePrint}
        />

        {/* Document & Ticket Preview Modal */}
        {previewDoc && (
          <DocumentPreviewModal
            isOpen={Boolean(previewDoc)}
            document={previewDoc}
            onClose={() => setPreviewDoc(null)}
          />
        )}

        {/* Vehicle Photo Preview Modal */}
        {previewImg && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setPreviewImg(null)}
          >
            <div className="relative max-w-3xl max-h-[90vh]">
              <button
                onClick={() => setPreviewImg(null)}
                className="absolute -top-10 right-0 p-1.5 text-white/80 hover:text-white bg-slate-800/80 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
              <img
                src={previewImg}
                alt="Vehicle photo enlarged"
                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-slate-700"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
