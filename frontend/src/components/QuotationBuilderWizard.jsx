import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, User, MapPin, Calendar, Users, DollarSign, Hotel,
  Car, Compass, Sparkles, CheckCircle2, AlertCircle, Save, Send,
  Download, Printer, Share2, Plus, Trash2, ArrowRight, ArrowLeft,
  Copy, ChevronRight, X, Clock, Tag, ShieldCheck, HelpCircle,
  Eye, Check, ArrowUp, ArrowDown, ExternalLink, RefreshCw, Lock,
  AlertTriangle, Layers, CreditCard, History, ChevronDown, Camera,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  TRANSPORT_TYPES,
  ADDON_PRESETS,
  calculateDuration,
  getInitialQuotationState,
  getEmptyHotelOption,
  getEmptyTransportOption,
  getEmptyActivity,
  getEmptyAddOn,
  getEmptyItineraryDay,
  calculateQuotationPricingPreviewApi,
  createQuotationApi,
  updateQuotationApi,
  getQuotationByIdApi,
  sendQuotationApi,
  createQuotationRevisionApi,
  approveQuotationApi,
  createBookingFromQuotationApi,
  convertQuotationToTripApi
} from '../services/quotationService.js';
import * as travelKnowledgeService from '../services/travelKnowledgeService.js';

const getDestinations = () => (travelKnowledgeService.getDestinations || travelKnowledgeService.default?.getDestinations)?.() || [];
import { exportElementToPdf, printElementDirectly } from '../utils/pdfGenerator';
import QuotationDocument from './QuotationDocument';
import ShareQuotationModal from './ShareQuotationModal';
import TransportSegmentCard from './TransportSegmentCard';
import MediaLibraryModal from './MediaLibraryModal';
import UploadLocationImageModal from './UploadLocationImageModal';
import { resolveItineraryMediaApi } from '../services/api.js';

const WIZARD_STEPS = [
  { id: 1, key: 'customer', title: '1. Customer & Scope', icon: User },
  { id: 2, key: 'itinerary', title: '2. Itinerary Builder', icon: Calendar },
  { id: 3, key: 'hotels', title: '3. Stay Segments & Hotels', icon: Hotel },
  { id: 4, key: 'transport', title: '4. Transport & Fleet', icon: Car },
  { id: 5, key: 'activities', title: '5. Experiences & Add-ons', icon: Compass },
  { id: 6, key: 'pricing', title: '6. Pricing & Margins', icon: DollarSign },
  { id: 7, key: 'terms', title: '7. Payment & Policies', icon: ShieldCheck },
  { id: 8, key: 'preview', title: '8. Review & Proposal', icon: Eye }
];

export default function QuotationBuilderWizard({
  quotationId = null,
  initialLead = null,
  onClose = () => {},
  onQuotationSaved = () => {}
}) {
  const { user } = useAuth();
  const isSuperOrAdmin = ['admin', 'super_admin', 'operations'].includes(user?.role) ||
                         user?.email?.toLowerCase() === (import.meta.env.VITE_ADMIN_EMAIL || 'gaurav999@gmail.com').toLowerCase();

  // Wizard Navigation
  const [currentStep, setCurrentStep] = useState(1);
  const [quotation, setQuotation] = useState(() => {
    const base = getInitialQuotationState();
    if (initialLead) {
      base.leadId = initialLead._id || initialLead.id || null;
      base.customerSnapshot = {
        name: initialLead.name || '',
        email: initialLead.email || '',
        phone: initialLead.phone || '',
        city: '',
        notes: initialLead.message || initialLead.notes || ''
      };
      base.tripRequirements.title = initialLead.tripTitle ? `Curated ${initialLead.tripTitle}` : (initialLead.destination ? `${initialLead.destination} Tailored Journey` : 'Custom Himalayan Odyssey');
      base.tripRequirements.destination = initialLead.destination || 'Spiti Valley, Himachal';
      base.tripRequirements.adults = Math.max(1, Number(initialLead.travelersCount) || 2);
      base.tripRequirements.totalTravelers = Math.max(1, Number(initialLead.travelersCount) || 2);
      base.tripRequirements.specialRequests = initialLead.message || '';
      base.assignedTo = initialLead.assignedTo || user?._id || null;
    }
    return base;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatusMsg, setSaveStatusMsg] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Day Media Selection State
  const [activeMediaPickerDayIdx, setActiveMediaPickerDayIdx] = useState(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isUploadMediaModalOpen, setIsUploadMediaModalOpen] = useState(false);
  const [resolvingDayIdx, setResolvingDayIdx] = useState(null);
  const [isResolvingAllDays, setIsResolvingAllDays] = useState(false);

  // Proposal PDF Ref
  const proposalPrintRef = useRef(null);
  const popularDestinations = getDestinations().map(d => d.name);

  // Load Existing Quotation from MongoDB if quotationId is passed
  useEffect(() => {
    if (quotationId) {
      const loadQuotation = async () => {
        try {
          setIsLoading(true);
          const res = await getQuotationByIdApi(quotationId);
          if (res.quotation) {
            setQuotation(res.quotation);
          }
        } catch (err) {
          alert('Failed to load quotation: ' + err.message);
        } finally {
          setIsLoading(false);
        }
      };
      loadQuotation();
    }
  }, [quotationId]);

  // Recalculate duration automatically whenever startDate or endDate changes
  const handleDateChange = (field, value) => {
    const updatedReqs = { ...quotation.tripRequirements, [field]: value };
    const { days, nights, durationStr } = calculateDuration(
      field === 'startDate' ? value : updatedReqs.startDate,
      field === 'endDate' ? value : updatedReqs.endDate
    );

    updatedReqs.days = days;
    updatedReqs.nights = nights;
    updatedReqs.duration = durationStr;

    // Update hotel nights to match trip nights if single segment
    const segments = getUniqueStaySegments(quotation.hotelOptions);
    let updatedHotels = quotation.hotelOptions;
    if (segments.length <= 1) {
      updatedHotels = (quotation.hotelOptions || []).map(h => ({
        ...h,
        nights: nights
      }));
    }

    updateAndRecalculate({
      tripRequirements: updatedReqs,
      hotelOptions: updatedHotels
    });
  };

  // Helper to extract stay segments
  function getUniqueStaySegments(hotels = []) {
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
  }

  // Central State Updater with Server-Authoritative Price Recalculation
  const updateAndRecalculate = async (partialUpdates = {}) => {
    setIsDirty(true);
    const merged = {
      ...quotation,
      ...partialUpdates
    };

    setQuotation(merged);

    try {
      const calcRes = await calculateQuotationPricingPreviewApi(merged);
      if (calcRes.pricing) {
        setQuotation(prev => ({
          ...prev,
          ...partialUpdates,
          pricing: calcRes.pricing,
          pricingRules: calcRes.pricingRules || prev.pricingRules,
          hotelOptions: calcRes.hotelOptions || prev.hotelOptions,
          transportOptions: calcRes.transportOptions || prev.transportOptions,
          activities: calcRes.activities || prev.activities,
          addOns: calcRes.addOns || prev.addOns,
          paymentTerms: calcRes.paymentTerms || prev.paymentTerms,
          tripRequirements: calcRes.tripRequirements || prev.tripRequirements
        }));
      }
    } catch (err) {
      console.warn('Live preview price recalc warning:', err.message);
    }
  };

  // Step 1 Customer & Requirements Form Updates
  const handleCustomerChange = (field, value) => {
    setIsDirty(true);
    setQuotation(prev => ({
      ...prev,
      customerSnapshot: { ...prev.customerSnapshot, [field]: value }
    }));
  };

  const handleTripReqChange = (field, value) => {
    const updatedReqs = { ...quotation.tripRequirements, [field]: value };
    if (field === 'adults' || field === 'children' || field === 'infants') {
      const a = field === 'adults' ? Math.max(1, parseInt(value, 10) || 1) : (parseInt(quotation.tripRequirements.adults, 10) || 2);
      const c = field === 'children' ? Math.max(0, parseInt(value, 10) || 0) : (parseInt(quotation.tripRequirements.children, 10) || 0);
      const inf = field === 'infants' ? Math.max(0, parseInt(value, 10) || 0) : (parseInt(quotation.tripRequirements.infants, 10) || 0);
      updatedReqs.adults = a;
      updatedReqs.children = c;
      updatedReqs.infants = inf;
      updatedReqs.totalTravelers = a + c + inf;
    }
    updateAndRecalculate({ tripRequirements: updatedReqs });
  };

  // Step 2 Itinerary Actions
  const handleAddDay = () => {
    const nextDayNum = (quotation.itinerary?.length || 0) + 1;
    const newDay = getEmptyItineraryDay(nextDayNum);
    const updated = [...(quotation.itinerary || []), newDay];
    updateAndRecalculate({ itinerary: updated });
  };

  const handleDeleteDay = (idx) => {
    if (quotation.itinerary.length <= 1) {
      alert('Quotation must contain at least 1 itinerary day.');
      return;
    }
    const filtered = quotation.itinerary.filter((_, i) => i !== idx).map((day, i) => ({
      ...day,
      day: i + 1
    }));
    updateAndRecalculate({ itinerary: filtered });
  };

  const handleMoveDay = (idx, direction) => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= quotation.itinerary.length) return;
    const list = [...quotation.itinerary];
    const [moved] = list.splice(idx, 1);
    list.splice(targetIdx, 0, moved);
    const reindexed = list.map((day, i) => ({ ...day, day: i + 1 }));
    updateAndRecalculate({ itinerary: reindexed });
  };

  const handleDuplicateDay = (idx) => {
    const source = quotation.itinerary[idx];
    const dup = { ...source, title: `${source.title} (Copy)` };
    const list = [...quotation.itinerary];
    list.splice(idx + 1, 0, dup);
    const reindexed = list.map((day, i) => ({ ...day, day: i + 1 }));
    updateAndRecalculate({ itinerary: reindexed });
  };

  const handleDayFieldChange = (idx, field, val) => {
    const list = [...quotation.itinerary];
    list[idx] = { ...list[idx], [field]: val };
    setIsDirty(true);
    setQuotation(prev => ({ ...prev, itinerary: list }));
  };

  // Day Media Auto-Resolver for Single Day
  const handleAutoResolveDayMedia = async (idx) => {
    const day = quotation.itinerary?.[idx];
    if (!day) return;

    try {
      setResolvingDayIdx(idx);
      const destination = quotation.tripRequirements?.destination || 'Destination';
      const locationName = day.locationName || day.title;
      const activities = [day.morning, day.afternoon, day.evening].filter(Boolean);

      const excludeAssetIds = (quotation.itinerary || [])
        .map(d => d.coverMediaAssetId)
        .filter(Boolean);

      const resolved = await resolveItineraryMediaApi({
        locationName,
        destination,
        dayTitle: day.title,
        dayActivities: activities,
        dayNumber: day.day || idx + 1,
        excludeAssetIds,
        tripType: quotation.tripRequirements?.travelStyle || 'Adventure'
      });

      if (resolved?.coverMedia) {
        const updated = [...quotation.itinerary];
        updated[idx] = {
          ...updated[idx],
          locationName: day.locationName || locationName,
          coverMedia: resolved.coverMedia,
          coverMediaAssetId: resolved.mediaAssetId,
          mediaSelectionMode: 'AUTO'
        };
        setIsDirty(true);
        setQuotation(prev => ({ ...prev, itinerary: updated }));
      }
    } catch (err) {
      console.warn('Auto resolve day media failed:', err.message);
    } finally {
      setResolvingDayIdx(null);
    }
  };

  // Auto-Resolve All Days
  const handleAutoResolveAllDays = async () => {
    if (!quotation.itinerary?.length || isResolvingAllDays) return;
    try {
      setIsResolvingAllDays(true);
      const destination = quotation.tripRequirements?.destination || 'Destination';
      const updated = [...quotation.itinerary];
      const usedAssetIds = [];

      for (let i = 0; i < updated.length; i++) {
        const day = updated[i];
        if (day.mediaSelectionMode === 'MANUAL' && day.coverMedia?.url) {
          if (day.coverMediaAssetId) usedAssetIds.push(day.coverMediaAssetId);
          continue;
        }

        const locationName = day.locationName || day.title;
        const activities = [day.morning, day.afternoon, day.evening].filter(Boolean);

        try {
          const resolved = await resolveItineraryMediaApi({
            locationName,
            destination,
            dayTitle: day.title,
            dayActivities: activities,
            dayNumber: day.day || i + 1,
            excludeAssetIds: usedAssetIds,
            tripType: quotation.tripRequirements?.travelStyle || 'Adventure'
          });

          if (resolved?.coverMedia) {
            updated[i] = {
              ...updated[i],
              locationName: day.locationName || locationName,
              coverMedia: resolved.coverMedia,
              coverMediaAssetId: resolved.mediaAssetId,
              mediaSelectionMode: 'AUTO'
            };
            if (resolved.mediaAssetId) usedAssetIds.push(resolved.mediaAssetId);
          }
        } catch (e) {}
      }

      setIsDirty(true);
      setQuotation(prev => ({ ...prev, itinerary: updated }));
    } catch (err) {
      console.warn('Auto resolve all days failed:', err.message);
    } finally {
      setIsResolvingAllDays(false);
    }
  };

  // Select Media from Modal
  const handleSelectDayMedia = (selectedMedia) => {
    if (activeMediaPickerDayIdx === null) return;
    const updated = [...quotation.itinerary];
    updated[activeMediaPickerDayIdx] = {
      ...updated[activeMediaPickerDayIdx],
      coverMedia: {
        id: selectedMedia.assetId,
        url: selectedMedia.url,
        altText: selectedMedia.altText,
        caption: selectedMedia.caption,
        width: selectedMedia.width || 1600,
        height: selectedMedia.height || 900
      },
      coverMediaAssetId: selectedMedia.assetId,
      mediaSelectionMode: 'MANUAL',
      locationName: updated[activeMediaPickerDayIdx].locationName || selectedMedia.locationName || ''
    };
    setIsDirty(true);
    setQuotation(prev => ({ ...prev, itinerary: updated }));
    setActiveMediaPickerDayIdx(null);
  };

  // Clear Media for a Day
  const handleClearDayMedia = (idx) => {
    const updated = [...quotation.itinerary];
    updated[idx] = {
      ...updated[idx],
      coverMedia: { id: '', url: '', altText: '', caption: '', width: 1600, height: 900 },
      coverMediaAssetId: null,
      mediaSelectionMode: 'AUTO'
    };
    setIsDirty(true);
    setQuotation(prev => ({ ...prev, itinerary: updated }));
  };

  // Step 3 Stay Segments & Hotel Alternatives Actions
  const handleAddStaySegment = () => {
    const segments = getUniqueStaySegments(quotation.hotelOptions);
    const newSegNum = segments.length + 1;
    const newSegId = `seg_${Date.now()}`;
    const newSegName = `Stay Segment ${newSegNum} (City)`;

    const defaultHotelInNewSeg = getEmptyHotelOption(1, newSegId, newSegName);
    defaultHotelInNewSeg.selected = true; // Auto select first option in new segment
    defaultHotelInNewSeg.nights = 2;

    const updated = [...(quotation.hotelOptions || []), defaultHotelInNewSeg];
    updateAndRecalculate({ hotelOptions: updated });
  };

  const handleAddHotelOptionToSegment = (segId, segName) => {
    const segHotels = (quotation.hotelOptions || []).filter(h => (h.segmentId || 'seg_1') === segId);
    const nextOpt = getEmptyHotelOption(segHotels.length + 1, segId, segName);
    nextOpt.nights = segHotels[0]?.nights || quotation.tripRequirements?.nights || 2;
    nextOpt.city = segHotels[0]?.city || '';
    
    // If no option in this segment is selected yet, select this new one
    if (!segHotels.some(h => h.selected)) {
      nextOpt.selected = true;
    }

    const updated = [...(quotation.hotelOptions || []), nextOpt];
    updateAndRecalculate({ hotelOptions: updated });
  };

  const handleHotelSelect = (optionId, segId) => {
    const updated = (quotation.hotelOptions || []).map(h => {
      if ((h.segmentId || 'seg_1') === segId) {
        return { ...h, selected: h.optionId === optionId };
      }
      return h;
    });
    updateAndRecalculate({ hotelOptions: updated });
  };

  const handleHotelFieldChange = (idx, field, val) => {
    const list = [...(quotation.hotelOptions || [])];
    list[idx] = { ...list[idx], [field]: val };
    updateAndRecalculate({ hotelOptions: list });
  };

  const handleDuplicateHotel = (idx) => {
    const source = quotation.hotelOptions[idx];
    const dup = {
      ...source,
      optionId: `hotel_opt_${Date.now()}`,
      label: `${source.label || 'Hotel Option'} (Copy)`,
      selected: false
    };
    const list = [...quotation.hotelOptions];
    list.splice(idx + 1, 0, dup);
    updateAndRecalculate({ hotelOptions: list });
  };

  const handleDeleteHotel = (idx) => {
    if (quotation.hotelOptions.length <= 1) {
      alert('Quotation must contain at least 1 hotel option.');
      return;
    }
    const target = quotation.hotelOptions[idx];
    const filtered = quotation.hotelOptions.filter((_, i) => i !== idx);

    // If the deleted option was selected, auto-select the next one in the same segment
    const remainingInSeg = filtered.filter(h => (h.segmentId || 'seg_1') === (target.segmentId || 'seg_1'));
    if (target.selected && remainingInSeg.length > 0) {
      remainingInSeg[0].selected = true;
    }

    updateAndRecalculate({ hotelOptions: filtered });
  };

  // Step 4 Transport Options Actions
  const handleAddTransportOption = () => {
    const nextOpt = getEmptyTransportOption((quotation.transportOptions?.length || 0) + 1);
    const updated = [...(quotation.transportOptions || []), nextOpt];
    updateAndRecalculate({ transportOptions: updated });
  };

  const handleTransportFieldChange = (idx, field, val) => {
    const list = [...(quotation.transportOptions || [])];
    list[idx] = { ...list[idx], [field]: val };
    updateAndRecalculate({ transportOptions: list });
  };

  const handleDuplicateTransport = (idx) => {
    const source = quotation.transportOptions[idx];
    const dup = {
      ...source,
      optionId: `trans_opt_${Date.now()}`,
      vehicle: `${source.vehicle} (Copy)`,
      selected: false
    };
    const list = [...quotation.transportOptions];
    list.splice(idx + 1, 0, dup);
    updateAndRecalculate({ transportOptions: list });
  };

  const handleDeleteTransport = (idx) => {
    if (quotation.transportOptions.length <= 1) {
      alert('Quotation must contain at least 1 transport option.');
      return;
    }
    const filtered = quotation.transportOptions.filter((_, i) => i !== idx);
    updateAndRecalculate({ transportOptions: filtered });
  };

  // Step 5 Activities & Add-ons Actions
  const handleAddActivity = () => {
    const nextOpt = getEmptyActivity((quotation.activities?.length || 0) + 1);
    const updated = [...(quotation.activities || []), nextOpt];
    updateAndRecalculate({ activities: updated });
  };

  const handleActivityFieldChange = (idx, field, val) => {
    const list = [...(quotation.activities || [])];
    list[idx] = { ...list[idx], [field]: val };
    updateAndRecalculate({ activities: list });
  };

  const handleDeleteActivity = (idx) => {
    const filtered = quotation.activities.filter((_, i) => i !== idx);
    updateAndRecalculate({ activities: filtered });
  };

  const handleAddAddOn = () => {
    const nextOpt = getEmptyAddOn((quotation.addOns?.length || 0) + 1);
    const updated = [...(quotation.addOns || []), nextOpt];
    updateAndRecalculate({ addOns: updated });
  };

  const handleQuickAddPreset = (preset) => {
    const newAddon = {
      addonId: `addon_${Date.now()}_preset`,
      category: preset.category || 'General',
      name: preset.name,
      description: preset.description,
      pricingType: preset.pricingType,
      quantity: 1,
      unitCost: preset.unitCost,
      unitPrice: preset.unitPrice,
      totalCost: preset.unitCost,
      totalPrice: preset.unitPrice,
      selected: true
    };
    const updated = [...(quotation.addOns || []), newAddon];
    updateAndRecalculate({ addOns: updated });
  };

  const handleAddOnFieldChange = (idx, field, val) => {
    const list = [...(quotation.addOns || [])];
    list[idx] = { ...list[idx], [field]: val };
    updateAndRecalculate({ addOns: list });
  };

  const handleDeleteAddOn = (idx) => {
    const filtered = quotation.addOns.filter((_, i) => i !== idx);
    updateAndRecalculate({ addOns: filtered });
  };

  // Step 6 Commercial Pricing Adjustments
  const handlePricingFieldChange = (field, val) => {
    const updated = {
      ...quotation.pricing,
      [field]: val
    };
    updateAndRecalculate({ pricing: updated });
  };

  // Save Draft (Explicit Save Workflow)
  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      setSaveStatusMsg('Saving draft...');

      let res;
      if (quotation._id || quotationId) {
        res = await updateQuotationApi(quotation._id || quotationId, quotation);
      } else {
        res = await createQuotationApi(quotation);
      }

      if (res.quotation) {
        setQuotation(res.quotation);
        setIsDirty(false);
        setSaveStatusMsg('Saved successfully!');
        setTimeout(() => setSaveStatusMsg(''), 3500);
        onQuotationSaved(res.quotation);
      }
    } catch (err) {
      alert('Error saving quotation: ' + err.message);
      setSaveStatusMsg('Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  // Send to Customer
  const handleSendToCustomer = async () => {
    const qId = quotation._id || quotationId;
    if (!qId) {
      alert('Please save the draft quotation before dispatching.');
      return;
    }

    if (!window.confirm(`Are you sure you want to dispatch quotation proposal ${quotation.quotationNumber} to ${quotation.customerSnapshot?.email}? This will lock an immutable price snapshot.`)) {
      return;
    }

    try {
      setIsSaving(true);
      const res = await sendQuotationApi(qId);
      if (res.quotation) {
        setQuotation(res.quotation);
        setIsDirty(false);
        alert(`Quotation ${res.quotation.quotationNumber} dispatched successfully! Price snapshot v${res.quotation.version} locked.`);
        onQuotationSaved(res.quotation);
      }
    } catch (err) {
      alert('Failed to send quotation: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Unlock & Create Revision
  const handleExecuteRevision = async () => {
    const qId = quotation._id || quotationId;
    if (!qId) return;

    try {
      setIsSaving(true);
      const res = await createQuotationRevisionApi(qId, { reason: revisionReason });
      if (res.quotation) {
        setQuotation(res.quotation);
        setIsDirty(true);
        setShowRevisionModal(false);
        setRevisionReason('');
        alert(`Quotation unlocked for Revision v${res.quotation.version}. Historical snapshot archived.`);
        onQuotationSaved(res.quotation);
      }
    } catch (err) {
      alert('Failed to create revision: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Conversion Actions
  const handleCreateBooking = async () => {
    const qId = quotation._id || quotationId;
    if (!qId) return;
    try {
      setIsSaving(true);
      const res = await createBookingFromQuotationApi(qId);
      if (res.booking) {
        alert(`Booking order ${res.booking.bookingId} generated with 10% advance deposit terms.`);
        onQuotationSaved();
        onClose();
      }
    } catch (err) {
      alert('Failed to convert quotation to booking: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvertToTrip = async () => {
    const qId = quotation._id || quotationId;
    if (!qId) return;
    try {
      setIsSaving(true);
      const res = await convertQuotationToTripApi(qId);
      if (res.trip) {
        alert(`Trip draft package created from quotation itinerary.`);
        onQuotationSaved();
      }
    } catch (err) {
      alert('Failed to convert quotation to trip: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Export PDF & Print
  const handleExportPdf = async () => {
    if (!proposalPrintRef.current) return;
    try {
      await exportElementToPdf(
        proposalPrintRef.current,
        `${quotation.quotationNumber || 'WanderLuxe-Proposal'}.pdf`
      );
    } catch (e) {
      alert('Error generating PDF proposal.');
    }
  };

  const handlePrint = () => {
    if (!proposalPrintRef.current) return;
    printElementDirectly(proposalPrintRef.current);
  };

  // Step Validation Guard
  const validateCurrentStep = (stepNumber) => {
    if (stepNumber === 1) {
      if (!quotation.customerSnapshot?.name?.trim()) {
        alert('Please provide customer full name.');
        return false;
      }
      if (!quotation.customerSnapshot?.email?.trim()) {
        alert('Please provide customer email address.');
        return false;
      }
      if (!quotation.customerSnapshot?.phone?.trim()) {
        alert('Please provide customer contact phone number.');
        return false;
      }
      if (!quotation.tripRequirements?.title?.trim()) {
        alert('Please provide a title for the trip proposal.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep(currentStep)) {
      setCurrentStep(prev => Math.min(WIZARD_STEPS.length, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleCopyPublicLink = () => {
    if (!quotation.publicShare?.token) {
      alert('Please save/send the quotation first to generate a public share token.');
      return;
    }
    const url = `${window.location.origin}/quotation/${quotation.publicShare.token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSafeClose = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  // Grouped Stay Segments computation
  const staySegments = getUniqueStaySegments(quotation.hotelOptions);
  const selectedHotels = (quotation.hotelOptions || []).filter(h => h.selected);
  const selectedTransport = (quotation.transportOptions || []).find(t => t.selected) || quotation.transportOptions?.[0];
  const isSentOrViewed = ['SENT', 'VIEWED'].includes(quotation.status);

  // Sales Role Concession Guard Warning Check
  const discountType = quotation.pricing?.discountType || 'none';
  const discountVal = Number(quotation.pricing?.discountValue || 0);
  const isSalesRole = (user?.role || 'sales') === 'sales' && !isSuperOrAdmin;
  const isSalesDiscountExcess = isSalesRole && (
    (discountType === 'percentage' && discountVal > 10) ||
    (discountType === 'flat' && discountVal > 10000)
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl w-full max-w-7xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative"
      >
        {/* ========================================================================= */}
        {/* TOP MODAL HEADER */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {quotation.quotationNumber || 'NEW DRAFT PROPOSAL'} (v{quotation.version || 1})
                </span>
                {quotation.status && (
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    quotation.status === 'APPROVED' ? 'bg-emerald-500 text-slate-950' :
                    quotation.status === 'SENT' ? 'bg-blue-500 text-white' :
                    quotation.status === 'VIEWED' ? 'bg-indigo-500 text-white' :
                    quotation.status === 'CONVERTED' ? 'bg-purple-500 text-white' :
                    quotation.status === 'REJECTED' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-slate-950'
                  }`}>
                    {quotation.status}
                  </span>
                )}
                {isDirty && (
                  <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                    <AlertCircle size={10} /> Unsaved changes
                  </span>
                )}
              </div>
              <h2 className="text-base font-black text-white truncate max-w-md">
                {quotation.tripRequirements?.title || 'Quotation Builder'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveStatusMsg && (
              <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800/60 flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 size={13} /> {saveStatusMsg}
              </span>
            )}

            {/* If quotation is SENT/VIEWED, show Revision prompt button */}
            {isSentOrViewed && (
              <button
                type="button"
                onClick={() => setShowRevisionModal(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                title="Create a new version to modify sent proposal"
              >
                <History size={14} /> Unlock Revision (v{(quotation.version || 1) + 1})
              </button>
            )}

            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              <Save size={14} /> {isSaving ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              onClick={handleSafeClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Locked Snapshot Notice Bar (When Sent) */}
        {isSentOrViewed && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-2.5 flex items-center justify-between text-xs text-blue-900 font-medium">
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-blue-700 shrink-0" />
              <span>
                <strong>Immutable Price Snapshot Locked (v{quotation.version || 1}):</strong> This quotation was dispatched to traveler. Live catalog changes will not mutate the approved proposal. To modify prices or stay tiers, create a revision.
              </span>
            </div>
            <button
              onClick={() => setShowRevisionModal(true)}
              className="font-black text-blue-700 hover:text-blue-900 underline ml-3 shrink-0"
            >
              Create Revision
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WIZARD STEP SELECTOR BAR */}
        {/* ========================================================================= */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          {WIZARD_STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = currentStep === s.id;
            const isCompleted = currentStep > s.id;

            return (
              <button
                key={s.id}
                onClick={() => {
                  if (validateCurrentStep(currentStep)) {
                    setCurrentStep(s.id);
                  }
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-100/70 text-emerald-900 hover:bg-emerald-200/60'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-emerald-400' : isCompleted ? 'text-emerald-700' : 'text-slate-400'} />
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* MAIN BODY: EDITOR + STICKY SUMMARY CARD */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-100/60">
          
          {/* LEFT 8/12: CURRENT STEP CONTENT */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* ------------------------------------------------------------- */}
            {/* STEP 1: CUSTOMER & REQUIREMENTS */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 1 && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <User size={18} className="text-emerald-600" /> Customer Information & Journey Scope
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Specify traveler contact, destination, departure dates, party size, and age categories.
                    </p>
                  </div>
                  {quotation.leadId && (
                    <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full border border-indigo-200">
                      CRM Lead Linked
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1">Customer Full Name *</label>
                    <input
                      type="text"
                      required
                      value={quotation.customerSnapshot?.name || ''}
                      onChange={(e) => handleCustomerChange('name', e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={quotation.customerSnapshot?.email || ''}
                      onChange={(e) => handleCustomerChange('email', e.target.value)}
                      placeholder="e.g. rahul@wanderluxe.in"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={quotation.customerSnapshot?.phone || ''}
                      onChange={(e) => handleCustomerChange('phone', e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1">Trip Proposal Title *</label>
                    <input
                      type="text"
                      required
                      value={quotation.tripRequirements?.title || ''}
                      onChange={(e) => handleTripReqChange('title', e.target.value)}
                      placeholder="e.g. Spiti Valley High Altitude Roadtrip & Monastery Circuit"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1">Destination *</label>
                    <input
                      type="text"
                      required
                      value={quotation.tripRequirements?.destination || ''}
                      onChange={(e) => handleTripReqChange('destination', e.target.value)}
                      placeholder="e.g. Spiti Valley, Himachal Pradesh"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={quotation.tripRequirements?.startDate ? new Date(quotation.tripRequirements.startDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleDateChange('startDate', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={quotation.tripRequirements?.endDate ? new Date(quotation.tripRequirements.endDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleDateChange('endDate', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1">Auto Duration</label>
                    <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-black text-emerald-800 font-mono">
                      {quotation.tripRequirements?.duration || `${quotation.tripRequirements?.days || 5}D/${quotation.tripRequirements?.nights || 4}N`}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1">Travel Style</label>
                    <select
                      value={quotation.tripRequirements?.travelStyle || 'Adventure'}
                      onChange={(e) => handleTripReqChange('travelStyle', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none cursor-pointer"
                    >
                      <option value="Adventure">Adventure</option>
                      <option value="Luxury">Luxury</option>
                      <option value="Budget">Budget</option>
                      <option value="Backpacking">Backpacking</option>
                      <option value="Family">Family</option>
                      <option value="Honeymoon">Honeymoon</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                </div>

                {/* Age-Based Traveler Breakdown (PART 8) */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                      <Users size={14} className="text-emerald-600" /> Traveler Age Categories & Party Distribution
                    </span>
                    <span className="text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      Total: {quotation.tripRequirements?.totalTravelers || 2} Pax
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="font-black text-slate-800 uppercase text-[11px]">Adults (12+ yrs)</label>
                        <span className="text-[10px] text-emerald-700 font-bold">100% Rate</span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={quotation.tripRequirements?.adults || 2}
                        onChange={(e) => handleTripReqChange('adults', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-black text-slate-900 outline-none"
                      />
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="font-black text-slate-800 uppercase text-[11px]">Children (5-11 yrs)</label>
                        <span className="text-[10px] text-indigo-700 font-bold">70% Multiplier</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={quotation.tripRequirements?.children || 0}
                        onChange={(e) => handleTripReqChange('children', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-black text-slate-900 outline-none"
                      />
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="font-black text-slate-800 uppercase text-[11px]">Infants (&lt;5 yrs)</label>
                        <span className="text-[10px] text-slate-500 font-bold">0% Free</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={quotation.tripRequirements?.infants || 0}
                        onChange={(e) => handleTripReqChange('infants', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-black text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">Special Traveler Requests & Notes</label>
                  <textarea
                    rows={3}
                    value={quotation.tripRequirements?.specialRequests || quotation.customerSnapshot?.notes || ''}
                    onChange={(e) => {
                      handleTripReqChange('specialRequests', e.target.value);
                      handleCustomerChange('notes', e.target.value);
                    }}
                    placeholder="e.g. Vegetarian meals only, ground floor rooms preferred for senior travelers, early morning airport pickup."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 2: ITINERARY BUILDER */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Calendar size={18} className="text-emerald-600" /> Day-by-Day Itinerary ({quotation.itinerary?.length || 0} Days)
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Configure day titles, real location photography, detailed activities, stay recommendations, and meal inclusions.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoResolveAllDays}
                      disabled={isResolvingAllDays || !quotation.itinerary?.length}
                      className="px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Automatically match and resolve real verified location images for all days from the canonical media database"
                    >
                      <Sparkles size={13} className={isResolvingAllDays ? 'animate-spin' : ''} />
                      {isResolvingAllDays ? 'Resolving Media...' : 'Auto-Resolve All Images'}
                    </button>
                    <button
                      type="button"
                      onClick={handleAddDay}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-emerald-600 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} /> Add Day
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {(quotation.itinerary || []).map((day, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 relative">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                            D{day.day}
                          </span>
                          <input
                            type="text"
                            value={day.title || ''}
                            onChange={(e) => handleDayFieldChange(idx, 'title', e.target.value)}
                            placeholder={`Day ${day.day} Title (e.g. Arrival & Scenic Acclimatization)`}
                            className="text-xs font-black text-slate-900 bg-transparent outline-none w-72 sm:w-96 border-b border-dashed border-slate-300 focus:border-emerald-500"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveDay(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100 cursor-pointer"
                            title="Move Day Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDay(idx, 'down')}
                            disabled={idx === quotation.itinerary.length - 1}
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100 cursor-pointer"
                            title="Move Day Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateDay(idx)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 cursor-pointer"
                            title="Duplicate Day"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDay(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                            title="Delete Day"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Location & POI Specification */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-700 mb-0.5 flex items-center gap-1">
                            <MapPin size={11} className="text-emerald-600" /> Day Location / POI / Halt
                          </label>
                          <input
                            type="text"
                            value={day.locationName || ''}
                            onChange={(e) => handleDayFieldChange(idx, 'locationName', e.target.value)}
                            placeholder="e.g. Solang Valley, Manali or Double Decker Root Bridge"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-emerald-500"
                          />
                        </div>

                        {/* Location Alignment Indicator */}
                        <div className="flex items-end pb-1 text-[11px] text-slate-500">
                          {day.locationName && quotation.tripRequirements?.destination && 
                           !day.locationName.toLowerCase().includes(quotation.tripRequirements.destination.toLowerCase().split(' ')[0]) && 
                           !quotation.tripRequirements.destination.toLowerCase().includes(day.locationName.toLowerCase().split(' ')[0]) ? (
                            <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg flex items-center gap-1">
                              <AlertCircle size={12} /> Local attraction or transit hub in itinerary
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium">
                              ✓ Geographic alignment with {quotation.tripRequirements?.destination || 'trip'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Day Cover Image & Media Resolution Card */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          {day.coverMedia?.url ? (
                            <div className="relative w-24 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 group bg-slate-900 shadow-xs">
                              <img
                                src={day.coverMedia.url}
                                alt={day.coverMedia.altText || day.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-16 rounded-xl bg-slate-200/70 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
                              <Camera size={18} />
                              <span className="text-[9px] font-bold mt-0.5">No Photo</span>
                            </div>
                          )}

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-slate-800 text-xs">
                                {day.coverMedia?.url ? (day.coverMedia.caption || day.locationName || 'Location Cover Image') : 'No Day Image Selected'}
                              </span>
                              {day.coverMedia?.url && (
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  day.mediaSelectionMode === 'MANUAL'
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}>
                                  {day.mediaSelectionMode === 'MANUAL' ? 'Manually Selected' : 'Auto Selected'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {day.coverMedia?.url
                                ? `Real database asset • ${day.coverMedia.altText || day.locationName || 'Verified POI'}`
                                : 'Select from verified media archive or let Smart Resolver auto-match.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMediaPickerDayIdx(idx);
                              setIsMediaPickerOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <ImageIcon size={12} className="text-indigo-600" /> Choose Library
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAutoResolveDayMedia(idx)}
                            disabled={resolvingDayIdx === idx}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Auto-match best real photo from database based on POI and activities"
                          >
                            <Sparkles size={12} className={resolvingDayIdx === idx ? 'animate-spin' : 'text-emerald-600'} />
                            {resolvingDayIdx === idx ? 'Resolving...' : 'Auto Match'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMediaPickerDayIdx(idx);
                              setIsUploadMediaModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                            title="Upload and index a new photo for this location"
                          >
                            <Upload size={12} className="text-slate-600" /> Upload
                          </button>

                          {day.coverMedia?.url && (
                            <button
                              type="button"
                              onClick={() => handleClearDayMedia(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                              title="Remove Image"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {(() => {
                        const dayLoc = (day.locationName || day.title || '').toLowerCase().trim();
                        const mediaLabel = (day.coverMedia?.caption || day.coverMedia?.altText || '').toLowerCase().trim();
                        const isMismatched = day.coverMedia?.url && dayLoc && mediaLabel && 
                          !mediaLabel.includes(dayLoc) && !dayLoc.includes(mediaLabel) &&
                          !dayLoc.split(/[\s,/-]+/).some(w => w.length > 3 && mediaLabel.includes(w)) &&
                          !mediaLabel.split(/[\s,/-]+/).some(w => w.length > 3 && dayLoc.includes(w));
                        if (!isMismatched) return null;
                        return (
                          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 gap-2">
                            <div className="flex items-center gap-1.5 font-medium">
                              <AlertCircle size={14} className="text-amber-600 shrink-0" />
                              <span>
                                <strong>Location Mismatch:</strong> Photo is for <em>"{day.coverMedia.caption || day.coverMedia.altText}"</em>, but day location is <em>"{day.locationName || day.title}"</em>.
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAutoResolveDayMedia(idx)}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] shrink-0 cursor-pointer"
                            >
                              Auto-align Photo
                            </button>
                          </div>
                        );
                      })()}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-amber-700 mb-0.5">🌅 Morning Activity</label>
                          <textarea
                            rows={2}
                            value={day.morning || ''}
                            onChange={(e) => handleDayFieldChange(idx, 'morning', e.target.value)}
                            placeholder="e.g. Scenic drive to high altitude pass"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-blue-700 mb-0.5">☀️ Afternoon Activity</label>
                          <textarea
                            rows={2}
                            value={day.afternoon || ''}
                            onChange={(e) => handleDayFieldChange(idx, 'afternoon', e.target.value)}
                            placeholder="e.g. Monastery visit and local village lunch"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-indigo-700 mb-0.5">🌙 Evening Activity</label>
                          <textarea
                            rows={2}
                            value={day.evening || ''}
                            onChange={(e) => handleDayFieldChange(idx, 'evening', e.target.value)}
                            placeholder="e.g. Stargazing session and warm dinner"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-600 mb-0.5">🏨 Stay / Accommodation</label>
                          <input
                            type="text"
                            value={day.stay || ''}
                            onChange={(e) => handleDayFieldChange(idx, 'stay', e.target.value)}
                            placeholder="e.g. Deluxe Riverside Boutique Camp"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-600 mb-0.5">🚗 Transfer Details</label>
                          <input
                            type="text"
                            value={day.transferDetails || ''}
                            onChange={(e) => handleDayFieldChange(idx, 'transferDetails', e.target.value)}
                            placeholder="e.g. 4x4 Private SUV (Approx 4 Hours)"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 3: STAY SEGMENTS & HOTEL ALTERNATIVES (PART 1, 2, 3) */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Hotel size={18} className="text-emerald-600" /> Stay Segments & Multi-Tier Hotel Alternatives
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Group hotel options by Stay Segment / City (e.g. Manali 2 Nights + Kasol 2 Nights). Radio toggle selects active tier per segment.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddStaySegment}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-emerald-600 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} /> + Add Stay Segment (City)
                  </button>
                </div>

                {/* Render Each Stay Segment Group */}
                {staySegments.map((segment, segIdx) => {
                  const segHotels = (quotation.hotelOptions || []).filter(h => (h.segmentId || 'seg_1') === segment.segmentId);

                  return (
                    <div key={segment.segmentId} className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center">
                            {segIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={segment.segmentName || `Stay Segment ${segIdx + 1}`}
                            onChange={(e) => {
                              const updated = (quotation.hotelOptions || []).map(h => {
                                if ((h.segmentId || 'seg_1') === segment.segmentId) {
                                  return { ...h, segmentName: e.target.value };
                                }
                                return h;
                              });
                              updateAndRecalculate({ hotelOptions: updated });
                            }}
                            className="text-sm font-black text-slate-900 bg-transparent outline-none border-b border-dashed border-slate-300 focus:border-emerald-500"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddHotelOptionToSegment(segment.segmentId, segment.segmentName)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={12} /> Add Alternative Option
                        </button>
                      </div>

                      {/* Options in this Segment */}
                      <div className="space-y-3">
                        {segHotels.map((hotel) => {
                          const originalIdx = (quotation.hotelOptions || []).findIndex(h => h.optionId === hotel.optionId);

                          return (
                            <div
                              key={hotel.optionId}
                              className={`p-4 rounded-2xl border transition-all space-y-3 ${
                                hotel.selected
                                  ? 'bg-emerald-50/50 border-emerald-500 shadow-xs ring-1 ring-emerald-500/20'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="radio"
                                    name={`selectedHotel_${segment.segmentId}`}
                                    checked={Boolean(hotel.selected)}
                                    onChange={() => handleHotelSelect(hotel.optionId, segment.segmentId)}
                                    className="w-4 h-4 text-emerald-600 cursor-pointer"
                                  />
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    hotel.selected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {hotel.tier || 'Deluxe'}
                                  </span>
                                  <input
                                    type="text"
                                    value={hotel.label || ''}
                                    onChange={(e) => handleHotelFieldChange(originalIdx, 'label', e.target.value)}
                                    placeholder="Option Label (e.g. Option A: Premium Mountain Resort)"
                                    className="text-xs font-bold text-slate-900 bg-transparent outline-none w-64 sm:w-80 border-b border-dashed border-slate-300"
                                  />
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-emerald-700">
                                    ₹{(hotel.totalPrice || 0).toLocaleString()}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateHotel(originalIdx)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                                    title="Duplicate Option"
                                  >
                                    <Copy size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteHotel(originalIdx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                    title="Delete Option"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-0.5">Hotel Property Name *</label>
                                  <input
                                    type="text"
                                    required
                                    value={hotel.hotelName || ''}
                                    onChange={(e) => handleHotelFieldChange(originalIdx, 'hotelName', e.target.value)}
                                    placeholder="e.g. The Himalayan Retreat"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-0.5">City / Location</label>
                                  <input
                                    type="text"
                                    value={hotel.city || hotel.location || ''}
                                    onChange={(e) => {
                                      handleHotelFieldChange(originalIdx, 'city', e.target.value);
                                      handleHotelFieldChange(originalIdx, 'location', e.target.value);
                                    }}
                                    placeholder="e.g. Old Manali"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-0.5">Room Category</label>
                                  <input
                                    type="text"
                                    value={hotel.roomType || ''}
                                    onChange={(e) => handleHotelFieldChange(originalIdx, 'roomType', e.target.value)}
                                    placeholder="e.g. Deluxe Balcony Room"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-0.5">Meal Plan</label>
                                  <select
                                    value={hotel.mealPlan || 'MAP (Breakfast + Dinner)'}
                                    onChange={(e) => handleHotelFieldChange(originalIdx, 'mealPlan', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer"
                                  >
                                    <option value="EP (Room Only)">EP (Room Only)</option>
                                    <option value="CP (Breakfast)">CP (Breakfast)</option>
                                    <option value="MAP (Breakfast + Dinner)">MAP (Breakfast + Dinner)</option>
                                    <option value="AP (All Meals)">AP (All Meals)</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-0.5">Rooms Count</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={hotel.rooms || 1}
                                    onChange={(e) => handleHotelFieldChange(originalIdx, 'rooms', Math.max(1, parseInt(e.target.value, 10) || 1))}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-0.5">Nights in Segment</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={hotel.nights || 1}
                                    onChange={(e) => handleHotelFieldChange(originalIdx, 'nights', Math.max(1, parseInt(e.target.value, 10) || 1))}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-0.5">Customer Price / Night *</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={hotel.pricePerNight || ''}
                                    onChange={(e) => handleHotelFieldChange(originalIdx, 'pricePerNight', Number(e.target.value) || 0)}
                                    placeholder="e.g. 5000"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-emerald-700 outline-none"
                                  />
                                </div>
                                {isSuperOrAdmin && (
                                  <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5 flex items-center gap-1">
                                      <Lock size={10} /> Supplier Cost / Night
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={hotel.costPerNight || ''}
                                      onChange={(e) => handleHotelFieldChange(originalIdx, 'costPerNight', Number(e.target.value) || 0)}
                                      placeholder="e.g. 3500"
                                      className="w-full bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-900 outline-none"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 4: TRANSPORT & FLEET (PART 4) */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Car size={18} className="text-emerald-600" /> Transport & Fleet Operations
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Configure multi-modal journeys (Flight, Train, Bus, Cab), vehicle photos, and travel tickets & vouchers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTransportOption}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-emerald-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus size={14} /> Add Transport Segment
                  </button>
                </div>

                <div className="space-y-4">
                  {(quotation.transportOptions || []).map((trans, idx) => (
                    <TransportSegmentCard
                      key={trans.optionId || idx}
                      segment={trans}
                      index={idx}
                      totalSegments={quotation.transportOptions?.length || 1}
                      effectiveTravelers={Number(quotation.tripRequirements?.totalTravelers || 2)}
                      isSuperOrAdmin={isSuperOrAdmin}
                      onChange={(updatedSegment) => {
                        const list = [...(quotation.transportOptions || [])];
                        list[idx] = updatedSegment;
                        updateAndRecalculate({ transportOptions: list });
                      }}
                      onDuplicate={() => handleDuplicateTransport(idx)}
                      onDelete={() => handleDeleteTransport(idx)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 5: EXPERIENCES & ADD-ONS (PART 5 & 6) */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 5 && (
              <div className="space-y-6">
                {/* Activities Sub-section */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <Compass size={18} className="text-emerald-600" /> Experiences & Guided Sightseeing
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Add included or optional experiences with flexible per person, per vehicle, or fixed pricing.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddActivity}
                      className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-emerald-600 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Add Experience
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(quotation.activities || []).map((act, idx) => (
                      <div key={act.activityId || idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                          <input
                            type="checkbox"
                            checked={act.selected !== false}
                            onChange={(e) => handleActivityFieldChange(idx, 'selected', e.target.checked)}
                            className="w-4 h-4 text-emerald-600 cursor-pointer rounded"
                          />
                          <select
                            value={act.dayNumber || 1}
                            onChange={(e) => handleActivityFieldChange(idx, 'dayNumber', Number(e.target.value))}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-black text-slate-700 outline-none cursor-pointer"
                          >
                            {(quotation.itinerary || [1]).map((_, dIdx) => (
                              <option key={dIdx} value={dIdx + 1}>Day {dIdx + 1}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={act.name || ''}
                            onChange={(e) => handleActivityFieldChange(idx, 'name', e.target.value)}
                            placeholder="Activity Name (e.g. Gondola Cable Car Ride)"
                            className="font-bold text-slate-900 bg-transparent outline-none flex-1 border-b border-dashed border-slate-300"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={act.pricingType || 'PER_PERSON'}
                            onChange={(e) => handleActivityFieldChange(idx, 'pricingType', e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold outline-none cursor-pointer"
                          >
                            <option value="PER_PERSON">Per Person</option>
                            <option value="PER_VEHICLE">Per Vehicle</option>
                            <option value="FIXED">Fixed Total</option>
                          </select>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-bold">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={act.unitPrice || ''}
                              onChange={(e) => handleActivityFieldChange(idx, 'unitPrice', Number(e.target.value) || 0)}
                              placeholder="Price"
                              className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-black text-emerald-700 outline-none"
                            />
                          </div>

                          <span className="text-xs font-black text-slate-800 min-w-[70px] text-right font-mono">
                            = ₹{(act.totalPrice || 0).toLocaleString()}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optional Add-ons Sub-section */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <Tag size={18} className="text-indigo-600" /> Optional Add-ons & Travel Extras
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Quick-add popular extras from the library or create custom add-ons.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddAddOn}
                      className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-indigo-600 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> + Custom Extra
                    </button>
                  </div>

                  {/* Preset Library Quick Adder */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Popular Add-on Presets (Click to Add):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ADDON_PRESETS.map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => handleQuickAddPreset(preset)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={10} /> {preset.name} (₹{preset.unitPrice.toLocaleString()})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Add-ons List */}
                  <div className="space-y-3 pt-2">
                    {(quotation.addOns || []).map((addon, idx) => (
                      <div key={addon.addonId || idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                          <input
                            type="checkbox"
                            checked={Boolean(addon.selected)}
                            onChange={(e) => handleAddOnFieldChange(idx, 'selected', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 cursor-pointer rounded"
                          />
                          <span className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                            {addon.category || 'Extra'}
                          </span>
                          <input
                            type="text"
                            value={addon.name || ''}
                            onChange={(e) => handleAddOnFieldChange(idx, 'name', e.target.value)}
                            placeholder="Add-on Name"
                            className="font-bold text-slate-900 bg-transparent outline-none flex-1 border-b border-dashed border-slate-300"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={addon.pricingType || 'FIXED'}
                            onChange={(e) => handleAddOnFieldChange(idx, 'pricingType', e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold outline-none cursor-pointer"
                          >
                            <option value="PER_PERSON">Per Person</option>
                            <option value="PER_NIGHT">Per Night</option>
                            <option value="PER_VEHICLE">Per Vehicle</option>
                            <option value="FIXED">Fixed Total</option>
                          </select>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-bold">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={addon.unitPrice || ''}
                              onChange={(e) => handleAddOnFieldChange(idx, 'unitPrice', Number(e.target.value) || 0)}
                              placeholder="Price"
                              className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-black text-indigo-700 outline-none"
                            />
                          </div>

                          <span className="text-xs font-black text-slate-800 min-w-[70px] text-right font-mono">
                            = ₹{(addon.totalPrice || 0).toLocaleString()}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleDeleteAddOn(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 6: PRICING, MARGIN & DISCOUNTS (PART 7, 8, 9, 10, 11) */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 6 && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <DollarSign size={18} className="text-emerald-600" /> Commercial Pricing & Profitability Engine
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Review line-item totals, configure commercial discounts, GST rate, and inspect internal margin.
                  </p>
                </div>

                {/* Sales Concession Warning Banner */}
                {isSalesDiscountExcess && (
                  <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-900">
                    <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Sales Concession Limit Exceeded:</strong> As a sales specialist, you are limited to a maximum 10% discount concession. Submitting higher discounts will be rejected by server RBAC rules.
                    </div>
                  </div>
                )}

                {/* Live Breakdown Table */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 text-xs font-bold">
                  {staySegments.map((seg, sIdx) => {
                    const sel = (quotation.hotelOptions || []).find(h => (h.segmentId || 'seg_1') === seg.segmentId && h.selected);
                    return (
                      <div key={seg.segmentId} className="flex justify-between text-slate-600">
                        <span>Stay Segment {sIdx + 1}: {seg.segmentName} ({sel?.hotelName || 'No hotel selected'})</span>
                        <span className="text-slate-900 font-mono font-black">₹{(sel?.totalPrice || 0).toLocaleString()}</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between text-slate-600">
                    <span>Transportation Fleet ({selectedTransport?.vehicle || 'None'})</span>
                    <span className="text-slate-900 font-mono font-black">₹{(quotation.pricing?.customerTransportPrice || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Activities & Experiences</span>
                    <span className="text-slate-900 font-mono font-black">₹{(quotation.pricing?.customerActivityPrice || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Active Optional Add-ons</span>
                    <span className="text-slate-900 font-mono font-black">₹{(quotation.pricing?.customerAddOnPrice || 0).toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-900 text-sm font-black">
                    <span>Gross Subtotal</span>
                    <span className="text-emerald-700 font-mono">₹{(quotation.pricing?.subtotal || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Commercial Adjustment Controls (Discount & Markup) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1">Discount Type</label>
                    <select
                      value={quotation.pricing?.discountType || 'none'}
                      onChange={(e) => handlePricingFieldChange('discountType', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="none">No Discount</option>
                      <option value="flat">Flat Amount (₹)</option>
                      <option value="percentage">Percentage (%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1">Discount Value</label>
                    <input
                      type="number"
                      min="0"
                      value={quotation.pricing?.discountValue || ''}
                      onChange={(e) => handlePricingFieldChange('discountValue', Number(e.target.value) || 0)}
                      placeholder={quotation.pricing?.discountType === 'percentage' ? 'e.g. 10 for 10%' : 'e.g. 2000'}
                      disabled={quotation.pricing?.discountType === 'none'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1">Tour Operator GST</label>
                    <select
                      value={quotation.pricing?.gstPercent !== undefined ? quotation.pricing.gstPercent : 5}
                      onChange={(e) => handlePricingFieldChange('gstPercent', Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value={5}>5% GST (Standard Tour Operator Package)</option>
                      <option value={18}>18% GST (Standalone Transport/Services)</option>
                      <option value={0}>0% GST (Tax Exempt / SEZ)</option>
                    </select>
                  </div>
                </div>

                {/* Final Net Summary & Age Tier Per-Person Breakdown */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Taxable Base</span>
                    <span className="font-mono font-bold">₹{(quotation.pricing?.taxableAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>GST ({quotation.pricing?.gstPercent || 5}%)</span>
                    <span className="font-mono font-bold">+ ₹{(quotation.pricing?.gstAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="text-xs text-emerald-400 font-bold uppercase">Final Customer Total</div>
                      <div className="text-2xl font-black text-white font-mono">
                        ₹{(quotation.pricing?.finalTotal || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase">Per Traveler ({quotation.tripRequirements?.totalTravelers || 2} Pax)</div>
                      <div className="text-sm font-black text-emerald-400 font-mono">
                        ₹{(quotation.pricing?.perPersonPrice || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Age Category Pricing Breakdown */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 font-mono">
                    <div>
                      Adult Rate: <strong className="text-white">₹{(quotation.pricing?.adultPrice || 0).toLocaleString()}</strong>
                    </div>
                    <div>
                      Child Rate: <strong className="text-white">₹{(quotation.pricing?.childPrice || 0).toLocaleString()}</strong>
                    </div>
                    <div>
                      Infant Rate: <strong className="text-white">Free</strong>
                    </div>
                  </div>
                </div>

                {/* Internal Profitability Analysis (Restricted to Super Admin / Operations / Admin) */}
                {isSuperOrAdmin && (
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 text-xs font-black uppercase">
                      <Lock size={13} /> Internal Profit Margin Audit (Staff Only - Hidden from Customer)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold pt-1">
                      <div>
                        <div className="text-[10px] text-amber-700 uppercase">Total Supplier Cost</div>
                        <div className="font-mono text-slate-900">₹{(quotation.pricing?.totalInternalCost || 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-amber-700 uppercase">Gross Taxable Base</div>
                        <div className="font-mono text-slate-900">₹{(quotation.pricing?.taxableAmount || 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-amber-700 uppercase">Net Profit Margin</div>
                        <div className="font-mono text-emerald-700 font-black">₹{(quotation.pricing?.projectedMargin || 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-amber-700 uppercase">Margin %</div>
                        <div className="font-mono text-emerald-700 font-black">{quotation.pricing?.projectedMarginPercent || 0}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 7: PAYMENT TERMS & POLICIES */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 7 && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-600" /> Payment Schedule & Trip Inclusions/Exclusions
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Define deposit ratio (10% standard), balance due window, and legal terms.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-black uppercase text-slate-700 mb-1">Advance Deposit %</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={quotation.paymentTerms?.depositPercent || 10}
                      onChange={(e) => updateAndRecalculate({
                        paymentTerms: { ...quotation.paymentTerms, depositPercent: Math.max(5, Math.min(100, Number(e.target.value) || 10)) }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Default: 10% on booking</span>
                  </div>

                  <div>
                    <label className="block font-black uppercase text-slate-700 mb-1">Balance Due Days</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={quotation.paymentTerms?.balanceDueDays || 6}
                      onChange={(e) => updateAndRecalculate({
                        paymentTerms: { ...quotation.paymentTerms, balanceDueDays: Math.max(1, parseInt(e.target.value, 10) || 6) }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Default: 6 days prior to trip</span>
                  </div>

                  <div>
                    <label className="block font-black uppercase text-slate-700 mb-1">Deposit Amount Due Now</label>
                    <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-black text-emerald-800 font-mono">
                      ₹{(quotation.pricing?.depositRequired || 0).toLocaleString()} (10%)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-black uppercase text-emerald-800 mb-1">Included in Package (Line separated)</label>
                    <textarea
                      rows={4}
                      value={(quotation.inclusions || []).join('\n')}
                      onChange={(e) => setIsDirty(true) || setQuotation(prev => ({ ...prev, inclusions: e.target.value.split('\n').filter(Boolean) }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-black uppercase text-rose-800 mb-1">Excluded from Package (Line separated)</label>
                    <textarea
                      rows={4}
                      value={(quotation.exclusions || []).join('\n')}
                      onChange={(e) => setIsDirty(true) || setQuotation(prev => ({ ...prev, exclusions: e.target.value.split('\n').filter(Boolean) }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 8: PREVIEW, ACTIONS & SEND */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 8 && (
              <div className="space-y-6">
                {/* Action Bar */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Eye size={18} className="text-emerald-600" /> Interactive Proposal Review & Actions
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Review customer proposal layout, download PDF, share link, or dispatch via email/WhatsApp.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowShareModal(true)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Share2 size={13} /> Share Link & WhatsApp
                    </button>

                    <button
                      type="button"
                      onClick={handleExportPdf}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download size={13} /> Export PDF
                    </button>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Printer size={13} /> Print
                    </button>

                    <button
                      type="button"
                      onClick={handleSendToCustomer}
                      disabled={isSaving}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      <Send size={14} /> Send to Customer
                    </button>
                  </div>
                </div>

                {/* Conversion Actions Bar (For Approved Quotations) */}
                <div className="bg-slate-900 text-white p-5 rounded-3xl flex flex-wrap items-center justify-between gap-4 border border-slate-800">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                      Commercial Conversion Engine
                    </span>
                    <h4 className="text-sm font-black text-white">Convert to Live Booking Order or Public Catalog Trip</h4>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCreateBooking}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <CreditCard size={14} /> Convert to Booking (Payable)
                    </button>

                    {isSuperOrAdmin && (
                      <button
                        type="button"
                        onClick={handleConvertToTrip}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-black rounded-xl transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Compass size={14} /> Convert to Catalog Trip
                      </button>
                    )}
                  </div>
                </div>

                {/* High-Definition Proposal Document (Captured by PDF Generator) */}
                <div className="flex justify-center bg-slate-200/70 p-4 sm:p-6 rounded-3xl overflow-x-auto">
                  <QuotationDocument
                    ref={proposalPrintRef}
                    quotation={quotation}
                    isCustomerView={true}
                  />
                </div>

                {/* Multi-Channel Share Modal */}
                <ShareQuotationModal
                  isOpen={showShareModal}
                  onClose={() => setShowShareModal(false)}
                  quotation={quotation}
                  onExportPdf={handleExportPdf}
                  onPrint={handlePrint}
                />
              </div>
            )}

            {/* Navigation Footer Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-black hover:bg-slate-50 disabled:opacity-30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <div className="text-xs font-bold text-slate-400">
                Step {currentStep} of {WIZARD_STEPS.length}
              </div>

              <button
                type="button"
                onClick={currentStep === WIZARD_STEPS.length ? handleSaveDraft : handleNextStep}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                {currentStep === WIZARD_STEPS.length ? (
                  <>
                    <Save size={14} /> Save Quotation
                  </>
                ) : (
                  <>
                    Continue <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT 4/12: STICKY LIVE SUMMARY CARD (DESKTOP) (PART 12) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 sticky top-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <DollarSign size={14} className="text-emerald-600" /> Live Quotation Summary
                </h4>
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Real-time Recalc
                </span>
              </div>

              {/* Line Items Breakdown */}
              <div className="space-y-2.5 text-xs">
                {staySegments.map((seg, sIdx) => {
                  const sel = (quotation.hotelOptions || []).find(h => (h.segmentId || 'seg_1') === seg.segmentId && h.selected);
                  return (
                    <div key={seg.segmentId} className="flex justify-between items-center text-slate-600">
                      <span className="truncate max-w-[170px]" title={sel?.hotelName}>
                        🏨 {seg.segmentName || `Stay ${sIdx + 1}`}
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{(sel?.totalPrice || 0).toLocaleString()}
                      </span>
                    </div>
                  );
                })}

                <div className="flex justify-between items-center text-slate-600">
                  <span className="truncate max-w-[170px]" title={selectedTransport?.vehicle}>
                    🚗 Fleet ({selectedTransport?.type ? selectedTransport.type.split(' ')[0] : 'None'})
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{(quotation.pricing?.customerTransportPrice || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>🧭 Experiences</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{(quotation.pricing?.customerActivityPrice || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>🏷️ Add-ons</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{(quotation.pricing?.customerAddOnPrice || 0).toLocaleString()}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-slate-900 font-bold">
                  <span>Subtotal</span>
                  <span className="font-mono font-black">₹{(quotation.pricing?.subtotal || 0).toLocaleString()}</span>
                </div>

                {(quotation.pricing?.discountAmount || 0) > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-bold">
                    <span>Discount</span>
                    <span className="font-mono">- ₹{(quotation.pricing?.discountAmount || 0).toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-slate-500">
                  <span>GST ({quotation.pricing?.gstPercent || 5}%)</span>
                  <span className="font-mono">+ ₹{(quotation.pricing?.gstAmount || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Total & Deposit Box */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-emerald-400">Final Quotation</span>
                  <span className="text-lg font-black font-mono">₹{(quotation.pricing?.finalTotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-300 border-t border-slate-800 pt-2">
                  <span className="text-[10px] uppercase">10% Deposit:</span>
                  <span className="font-mono font-bold text-emerald-400">₹{(quotation.pricing?.depositRequired || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="text-[10px] uppercase">Per Pax ({quotation.tripRequirements?.totalTravelers || 2}):</span>
                  <span className="font-mono">₹{(quotation.pricing?.perPersonPrice || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Quick Actions in Sidebar */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save size={13} /> {isSaving ? 'Saving...' : 'Save Draft'}
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(8)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye size={13} /> Preview Proposal & PDF
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Exit Confirmation Modal */}
        <AnimatePresence>
          {showExitConfirm && (
            <div className="fixed inset-0 z-60 bg-slate-950/70 flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 text-center">
                <AlertTriangle size={36} className="mx-auto text-amber-500" />
                <h4 className="text-base font-black text-slate-900">Unsaved Changes Detected</h4>
                <p className="text-xs text-slate-500">
                  You have unsaved changes in this quotation. Are you sure you want to exit without saving?
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowExitConfirm(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Stay
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black cursor-pointer"
                  >
                    Discard & Exit
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Revision Unlock Dialog Modal (PART 15) */}
        <AnimatePresence>
          {showRevisionModal && (
            <div className="fixed inset-0 z-60 bg-slate-950/70 flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl border border-slate-200 text-left">
                <div className="flex items-center gap-2 text-indigo-700 font-black text-sm uppercase">
                  <History size={18} /> Create Quotation Revision (v{(quotation.version || 1) + 1})
                </div>
                <p className="text-xs text-slate-600">
                  This proposal was dispatched to the customer. Creating a revision will archive the current frozen proposal (v{quotation.version || 1}) and unlock a newly editable v{(quotation.version || 1) + 1} draft.
                </p>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">Reason for Revision *</label>
                  <textarea
                    rows={3}
                    value={revisionReason}
                    onChange={(e) => setRevisionReason(e.target.value)}
                    placeholder="e.g. Customer requested upgrade to 5-star luxury camp and private driver."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowRevisionModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteRevision}
                    disabled={!revisionReason.trim() || isSaving}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                  >
                    {isSaving ? 'Creating Revision...' : `Unlock v${(quotation.version || 1) + 1}`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Day Location Media Picker Modal */}
        <MediaLibraryModal
          isOpen={isMediaPickerOpen}
          onClose={() => {
            setIsMediaPickerOpen(false);
            setActiveMediaPickerDayIdx(null);
          }}
          onSelectMedia={handleSelectDayMedia}
          initialDestination={quotation.tripRequirements?.destination || ''}
          initialLocation={activeMediaPickerDayIdx !== null ? quotation.itinerary?.[activeMediaPickerDayIdx]?.locationName : ''}
          currentSelectedAssetId={activeMediaPickerDayIdx !== null ? quotation.itinerary?.[activeMediaPickerDayIdx]?.coverMediaAssetId : null}
          onOpenUpload={() => setIsUploadMediaModalOpen(true)}
        />

        {/* Upload & Index Location Image Modal */}
        <UploadLocationImageModal
          isOpen={isUploadMediaModalOpen}
          onClose={() => {
            setIsUploadMediaModalOpen(false);
            setActiveMediaPickerDayIdx(null);
          }}
          initialDestination={quotation.tripRequirements?.destination || ''}
          initialLocationName={activeMediaPickerDayIdx !== null ? quotation.itinerary?.[activeMediaPickerDayIdx]?.locationName : ''}
          onAssetCreated={(newAsset) => {
            if (activeMediaPickerDayIdx !== null && newAsset) {
              handleSelectDayMedia({
                assetId: newAsset._id,
                url: newAsset.storage?.secureUrl || newAsset.url,
                altText: newAsset.altText,
                caption: newAsset.caption,
                width: newAsset.storage?.width,
                height: newAsset.storage?.height,
                locationName: newAsset.location?.poi || newAsset.location?.locality || newAsset.title
              });
            }
          }}
        />

      </motion.div>
    </div>
  );
}
