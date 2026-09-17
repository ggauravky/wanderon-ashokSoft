import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { 
  BarChart3, TrendingUp, Users, Ticket, Tag, Plus, Trash2, 
  Edit3, ShieldCheck, CheckCircle2, XCircle, Search, RefreshCw, 
  DollarSign, MapPin, Calendar, Lock, AlertTriangle, Layers, Eye, 
  Power, Check, X, LogOut, Sparkles, Wallet, UserCheck, UserX, 
  Globe, Save, Upload, FileText, ArrowUpRight, MessageSquare, 
  Phone, Mail, CheckSquare, Clock, Filter, AlertCircle, Loader2, ChevronRight, HelpCircle,
  Share2, Copy, Send, CreditCard, ExternalLink, Compass, Hotel, Car, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/api.js';

const getAdminStatsApi = async (...args) => (apiService.getAdminStatsApi || apiService.default?.getAdminStatsApi)?.(...args);
const getCouponsApi = async (...args) => (apiService.getCouponsApi || apiService.default?.getCouponsApi)?.(...args);
const createCouponApi = async (...args) => (apiService.createCouponApi || apiService.default?.createCouponApi)?.(...args);
const toggleCouponApi = async (...args) => (apiService.toggleCouponApi || apiService.default?.toggleCouponApi)?.(...args);
const deleteCouponApi = async (...args) => (apiService.deleteCouponApi || apiService.default?.deleteCouponApi)?.(...args);
const getAdminUsersApi = async (...args) => (apiService.getAdminUsersApi || apiService.default?.getAdminUsersApi)?.(...args);
const updateUserRoleApi = async (...args) => (apiService.updateUserRoleApi || apiService.default?.updateUserRoleApi)?.(...args);
const getAdminBookingsApi = async (...args) => (apiService.getAdminBookingsApi || apiService.default?.getAdminBookingsApi)?.(...args);
const getAdminTripsApi = async (...args) => (apiService.getAdminTripsApi || apiService.default?.getAdminTripsApi)?.(...args);
const createTripApi = async (...args) => (apiService.createTripApi || apiService.default?.createTripApi)?.(...args);
const updateTripApi = async (...args) => (apiService.updateTripApi || apiService.default?.updateTripApi)?.(...args);
const deleteTripApi = async (...args) => (apiService.deleteTripApi || apiService.default?.deleteTripApi)?.(...args);
const uploadImageApi = async (...args) => (apiService.uploadImageApi || apiService.default?.uploadImageApi)?.(...args);
const getAllAdminPagesApi = async (...args) => (apiService.getAllAdminPagesApi || apiService.default?.getAllAdminPagesApi)?.(...args);
const createPageApi = async (...args) => (apiService.createPageApi || apiService.default?.createPageApi)?.(...args);
const updatePageApi = async (...args) => (apiService.updatePageApi || apiService.default?.updatePageApi)?.(...args);
const deletePageApi = async (...args) => (apiService.deletePageApi || apiService.default?.deletePageApi)?.(...args);
const getAdminLeadsApi = async (...args) => (apiService.getAdminLeadsApi || apiService.default?.getAdminLeadsApi)?.(...args);
const updateLeadStatusApi = async (...args) => (apiService.updateLeadStatusApi || apiService.default?.updateLeadStatusApi)?.(...args);
const assignLeadApi = async (...args) => (apiService.assignLeadApi || apiService.default?.assignLeadApi)?.(...args);
const getQuotationsApi = async (...args) => (apiService.getQuotationsApi || apiService.default?.getQuotationsApi)?.(...args);
const deleteQuotationApi = async (...args) => (apiService.deleteQuotationApi || apiService.default?.deleteQuotationApi)?.(...args);
const sendQuotationApi = async (...args) => (apiService.sendQuotationApi || apiService.default?.sendQuotationApi)?.(...args);
const createBookingFromQuotationApi = async (...args) => (apiService.createBookingFromQuotationApi || apiService.default?.createBookingFromQuotationApi)?.(...args);
const convertQuotationToTripApi = async (...args) => (apiService.convertQuotationToTripApi || apiService.default?.convertQuotationToTripApi)?.(...args);
const listMediaAssetsApi = async (...args) => (apiService.listMediaAssetsApi || apiService.default?.listMediaAssetsApi)?.(...args);
const getMediaCoverageReportApi = async (...args) => (apiService.getMediaCoverageReportApi || apiService.default?.getMediaCoverageReportApi)?.(...args);
const deleteMediaAssetApi = async (...args) => (apiService.deleteMediaAssetApi || apiService.default?.deleteMediaAssetApi)?.(...args);
const resolveItineraryMediaApi = async (...args) => (apiService.resolveItineraryMediaApi || apiService.default?.resolveItineraryMediaApi)?.(...args);
import * as travelKnowledgeService from '../services/travelKnowledgeService.js';

const getDestinations = () => (travelKnowledgeService.getDestinations || travelKnowledgeService.default?.getDestinations)?.() || [];
import QuotationBuilderWizard from '../components/QuotationBuilderWizard';
import QuotationPreviewModal from '../components/QuotationPreviewModal';
import ShareQuotationModal from '../components/ShareQuotationModal';
import BookingDetailsModal from '../components/BookingDetailsModal';
import MediaLibraryModal from '../components/MediaLibraryModal';
import UploadLocationImageModal from '../components/UploadLocationImageModal';

const AdminDashboard = ({ defaultTab = 'analytics', initialAction = null }) => {
  const { 
    user, logout, eligiblePlans, allPayoutRequests, adminApprovePayout, adminTogglePlanEligibility,
    influencerApplications, fetchInfluencerApplications, approveInfluencerApplication, rejectInfluencerApplication
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { quoteId } = useParams();

  // Active Main Navigation Tab
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || defaultTab || 'analytics');

  // ==========================================
  // 1. REAL ANALYTICS STATE (ZERO MOCK DATA)
  // ==========================================
  const [analyticsRange, setAnalyticsRange] = useState('30d');
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    activeTrips: 0,
    totalUsers: 0,
    totalLeads: 0,
    convertedLeads: 0,
    conversionRate: '0%',
    monthlyRevenue: [],
    destinationBreakdown: [],
    topTrips: [],
    isRealData: true
  });

  // ==========================================
  // 2. TRIPS CMS STATE
  // ==========================================
  const [trips, setTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [tripSearch, setTripSearch] = useState('');
  const [tripStatusFilter, setTripStatusFilter] = useState('all');
  const [showTripModal, setShowTripModal] = useState(false);
  const [editingTripId, setEditingTripId] = useState(null);
  const [tripModalTab, setTripModalTab] = useState('basic');
  const [tripActionLoading, setTripActionLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [tripSuccessMsg, setTripSuccessMsg] = useState('');

  // Initial Empty Trip Form
  const initialTripForm = {
    title: '',
    slug: '',
    location: '',
    destination: 'Meghalaya',
    region: 'Northeast India',
    duration: '5D/4N',
    days: 5,
    nights: 4,
    price: '',
    originalPrice: '',
    discount: 0,
    currency: 'INR',
    image: '',
    heroImage: '',
    gallery: [],
    category: 'Backpacking',
    mood: 'Adventure',
    difficulty: 'Moderate',
    groupType: 'Mixed Group',
    bestMonths: ['October', 'November', 'December', 'March', 'April', 'May'],
    nextBatch: '15 Sep - 19 Sep',
    capacity: 20,
    batches: [
      { batchId: 'b_1', dates: '15 Sep - 20 Sep, 2026', capacity: 20, bookedSeats: 0, status: 'available' },
      { batchId: 'b_2', dates: '25 Sep - 30 Sep, 2026', capacity: 20, bookedSeats: 0, status: 'available' }
    ],
    sharingPricing: {
      doubleSharing: '',
      tripleSharing: '',
      singleSharing: ''
    },
    pickupPoints: ['Airport Arrival Terminal (10:00 AM)', 'Central Railway Station (11:30 AM)'],
    shortDescription: '',
    overview: '',
    itinerary: [
      { day: 1, title: 'Arrival & Welcome Dinner', description: 'Meet trip captains and check into mountain stay.', morning: 'Airport/Station pickup', afternoon: 'Check-in & scenic walk', evening: 'Local cafe & dinner', stay: 'Boutique Homestay' }
    ],
    inclusions: ['Trip Captain & Local Guide', 'All Stay Accommodations', 'Breakfast & Dinner', 'Internal Transfers'],
    exclusions: ['Flights/Train Tickets', 'Personal Expenses & Lunches'],
    faqs: [
      { question: 'What is the group size?', answer: 'Average group size is 12-16 travelers.' }
    ],
    status: 'published',
    seo: {
      seoTitle: '',
      metaDescription: '',
      canonicalUrl: '',
      indexingDirective: 'index, follow',
      ogTitle: '',
      ogDescription: '',
      ogImage: ''
    }
  };
  const [tripForm, setTripForm] = useState(initialTripForm);

  // ==========================================
  // 3. DYNAMIC PAGES CMS STATE
  // ==========================================
  const [pages, setPages] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [showPageModal, setShowPageModal] = useState(false);
  const [editingPageId, setEditingPageId] = useState(null);
  const [pageActionLoading, setPageActionLoading] = useState(false);
  const [pageSuccessMsg, setPageSuccessMsg] = useState('');

  const initialPageForm = {
    title: '',
    slug: '',
    heroSubtitle: '',
    category: 'Travel Guide',
    content: '',
    sections: [
      { heading: 'Overview', subheading: 'Key Highlights', body: '', imageUrl: '', imageAlt: '', ctaLabel: 'Explore Trips', ctaUrl: '/destinations' }
    ],
    status: 'published',
    author: 'WanderLuxe Editorial',
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: '',
      canonicalUrl: '',
      robots: 'index, follow',
      ogTitle: '',
      ogDescription: '',
      ogImage: ''
    }
  };
  const [pageForm, setPageForm] = useState(initialPageForm);

  // ==========================================
  // 4. BOOKINGS & LEADS STATE
  // ==========================================
  const [bookings, setBookings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [bookingSearch, setBookingSearch] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');
  const [leadTypeFilter, setLeadTypeFilter] = useState('all');

  // ==========================================
  // 5. COUPONS & USERS STATE
  // ==========================================
  const [coupons, setCoupons] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', type: 'percentage', value: '', expiry: '2026-12-31', maxUses: 500 });

  // ==========================================
  // 6. QUOTATIONS PIPELINE STATE (PHASE 2)
  // ==========================================
  const [quotations, setQuotations] = useState([]);
  const [quotationsLoading, setQuotationsLoading] = useState(false);
  const [quotationSearch, setQuotationSearch] = useState('');
  const [quotationStatusFilter, setQuotationStatusFilter] = useState('all');
  const [quotationDestinationFilter, setQuotationDestinationFilter] = useState('all');
  const [quotationSalesFilter, setQuotationSalesFilter] = useState('all');
  const [quotationSort, setQuotationSort] = useState('updated');
  const [showQuotationWizard, setShowQuotationWizard] = useState(false);
  const [activeQuotationId, setActiveQuotationId] = useState(quoteId || null);
  const [activeQuotationLead, setActiveQuotationLead] = useState(null);
  const [copiedQuoteToken, setCopiedQuoteToken] = useState(null);
  const [previewQuotation, setPreviewQuotation] = useState(null);
  const [shareModalQuotation, setShareModalQuotation] = useState(null);
  const [bookingModalCode, setBookingModalCode] = useState(null);
  const [bookingModalQuotation, setBookingModalQuotation] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Load All Real Admin Data
  const fetchAllAdminData = async () => {
    try {
      setStatsLoading(true);
      const statsRes = await getAdminStatsApi(analyticsRange);
      setStats(statsRes);
    } catch (err) {
      console.warn('Stats fetch warning:', err.message);
    } finally {
      setStatsLoading(false);
    }

    try {
      setTripsLoading(true);
      const tripsRes = await getAdminTripsApi();
      setTrips(tripsRes);
    } catch (err) {
      console.warn('Trips fetch warning:', err.message);
    } finally {
      setTripsLoading(false);
    }

    try {
      setPagesLoading(true);
      const pagesRes = await getAllAdminPagesApi();
      setPages(pagesRes);
    } catch (err) {
      console.warn('Pages fetch warning:', err.message);
    } finally {
      setPagesLoading(false);
    }

    try {
      setBookingsLoading?.(true);
    } catch (e) {}

    try {
      const bookingsRes = await getAdminBookingsApi();
      setBookings(Array.isArray(bookingsRes) ? bookingsRes : []);
    } catch (err) {
      console.warn('Bookings fetch warning:', err.message);
    }

    try {
      const leadsRes = await getAdminLeadsApi();
      setLeads(Array.isArray(leadsRes) ? leadsRes : []);
    } catch (err) {
      console.warn('Leads fetch warning:', err.message);
    }

    try {
      setQuotationsLoading(true);
      const quoteRes = await getQuotationsApi({ sortBy: quotationSort });
      setQuotations(Array.isArray(quoteRes.quotations) ? quoteRes.quotations : []);
    } catch (err) {
      console.warn('Quotations fetch warning:', err.message);
    } finally {
      setQuotationsLoading(false);
    }

    try {
      const couponsRes = await getCouponsApi();
      setCoupons(Array.isArray(couponsRes) ? couponsRes : []);
    } catch (err) {
      console.warn('Coupons fetch warning:', err.message);
    }

    try {
      const usersRes = await getAdminUsersApi();
      setUsersList(Array.isArray(usersRes) ? usersRes : []);
    } catch (err) {
      console.warn('Users fetch warning:', err.message);
    }

    if (typeof fetchInfluencerApplications === 'function') {
      try {
        await fetchInfluencerApplications();
      } catch (e) {}
    }
  };

  const fetchQuotationsList = async () => {
    try {
      setQuotationsLoading(true);
      const params = {};
      if (quotationStatusFilter !== 'all') params.status = quotationStatusFilter;
      if (quotationDestinationFilter !== 'all') params.destination = quotationDestinationFilter;
      if (quotationSalesFilter !== 'all') params.assignedTo = quotationSalesFilter;
      if (quotationSearch.trim()) params.search = quotationSearch.trim();
      params.sortBy = quotationSort;

      const res = await getQuotationsApi(params);
      setQuotations(Array.isArray(res.quotations) ? res.quotations : []);
    } catch (err) {
      console.warn('Filter quotations warning:', err.message);
    } finally {
      setQuotationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'quotations') {
      fetchQuotationsList();
    }
  }, [activeTab, quotationStatusFilter, quotationDestinationFilter, quotationSalesFilter, quotationSort]);

  // Debounced search for quotations (300ms)
  useEffect(() => {
    if (activeTab !== 'quotations') return;
    const timer = setTimeout(() => {
      fetchQuotationsList();
    }, 300);
    return () => clearTimeout(timer);
  }, [quotationSearch]);

  // ==========================================
  // LOCATION MEDIA LIBRARY STATE & CONTROLS
  // ==========================================
  const [mediaAssets, setMediaAssets] = useState([]);
  const [mediaAssetsLoading, setMediaAssetsLoading] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaDestFilter, setMediaDestFilter] = useState('');
  const [mediaCoverageReport, setMediaCoverageReport] = useState(null);
  const [mediaReportLoading, setMediaReportLoading] = useState(false);
  const [showMediaLibraryModal, setShowMediaLibraryModal] = useState(false);
  const [showUploadLocationModal, setShowUploadLocationModal] = useState(false);
  const [uploadInitialDestination, setUploadInitialDestination] = useState('');
  const [uploadInitialLocation, setUploadInitialLocation] = useState('');
  const [adminMediaPreview, setAdminMediaPreview] = useState(null);
  const [tripItineraryMediaDayIdx, setTripItineraryMediaDayIdx] = useState(null);

  const fetchMediaAssetsList = async () => {
    try {
      setMediaAssetsLoading(true);
      const params = { limit: 100 };
      if (mediaSearch.trim()) params.search = mediaSearch.trim();
      if (mediaDestFilter) params.destination = mediaDestFilter;
      const res = await listMediaAssetsApi(params);
      setMediaAssets(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.warn('Load media assets error:', err.message);
    } finally {
      setMediaAssetsLoading(false);
    }
  };

  const fetchCoverageReport = async () => {
    try {
      setMediaReportLoading(true);
      const res = await getMediaCoverageReportApi();
      if (res) {
        setMediaCoverageReport(res);
      }
    } catch (err) {
      console.warn('Load media coverage report error:', err.message);
    } finally {
      setMediaReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'media_library') {
      fetchMediaAssetsList();
      fetchCoverageReport();
    }
  }, [activeTab, mediaDestFilter]);

  useEffect(() => {
    if (activeTab !== 'media_library') return;
    const timer = setTimeout(() => {
      fetchMediaAssetsList();
    }, 300);
    return () => clearTimeout(timer);
  }, [mediaSearch]);

  const handleDeleteMediaAssetAction = async (id, title) => {
    if (!window.confirm(`Are you sure you want to remove media asset "${title}"?`)) return;
    try {
      await deleteMediaAssetApi(id);
      setMediaAssets(mediaAssets.filter(a => String(a._id) !== String(id)));
      fetchCoverageReport();
    } catch (err) {
      alert('Failed to delete media asset: ' + err.message);
    }
  };

  useEffect(() => {
    if (quoteId) {
      setActiveTab('quotations');
      setActiveQuotationId(quoteId);
      setActiveQuotationLead(null);
      setShowQuotationWizard(true);
    } else if (initialAction === 'new') {
      setActiveTab('quotations');
      setActiveQuotationId(null);
      setActiveQuotationLead(null);
      setShowQuotationWizard(true);
    }
  }, [quoteId, initialAction]);

  const handleCreateNewQuotation = () => {
    setActiveQuotationId(null);
    setActiveQuotationLead(null);
    setShowQuotationWizard(true);
  };

  const handleCreateQuotationFromLead = (lead) => {
    setActiveQuotationId(null);
    setActiveQuotationLead(lead);
    setShowQuotationWizard(true);
  };

  const handleEditQuotation = (id) => {
    setActiveQuotationId(id);
    setActiveQuotationLead(null);
    setShowQuotationWizard(true);
  };

  const handleDeleteQuotation = async (id, quoteNum) => {
    if (!window.confirm(`Permanently delete quotation ${quoteNum || ''}? This action cannot be undone.`)) return;
    try {
      await deleteQuotationApi(id);
      setQuotations(prev => prev.filter(q => String(q._id || q.id) !== String(id)));
    } catch (err) {
      alert(err.message || 'Failed to delete quotation');
    }
  };

  const handleSendQuotationAction = async (id, quoteNum, custEmail) => {
    if (!window.confirm(`Send quotation ${quoteNum} to ${custEmail}?`)) return;
    try {
      const res = await sendQuotationApi(id);
      if (res.quotation) {
        setQuotations(prev => prev.map(q => (String(q._id || q.id) === String(id) ? res.quotation : q)));
        alert(`Quotation ${quoteNum} sent successfully!`);
      }
    } catch (err) {
      alert('Failed to send: ' + err.message);
    }
  };

  const handleConvertQuotationToBookingAction = async (id, quoteNum) => {
    if (!window.confirm(`Convert quotation ${quoteNum} into a live private booking order?`)) return;
    try {
      const res = await createBookingFromQuotationApi(id);
      if (res.booking) {
        alert(res.message || `Booking order ${res.booking.bookingId} created successfully!`);
        fetchQuotationsList();
        fetchAllAdminData();
      }
    } catch (err) {
      alert('Failed to convert to booking: ' + err.message);
    }
  };

  const handleConvertQuotationToTripAction = async (id, quoteNum) => {
    if (!window.confirm(`Convert quotation ${quoteNum} into a Draft Catalog Trip package?`)) return;
    try {
      const res = await convertQuotationToTripApi(id);
      if (res.trip) {
        alert(res.message || `Draft Catalog Trip "${res.trip.title}" created successfully! Complete SEO & availability in Trip CMS.`);
        fetchQuotationsList();
        fetchAllAdminData();
      }
    } catch (err) {
      alert('Failed to convert to trip: ' + err.message);
    }
  };

  const handleAssignLeadAction = async (leadId, currentAssignee) => {
    const newAssignee = window.prompt(`Assign lead to Sales Specialist:`, currentAssignee || 'Sales Concierge Specialist');
    if (!newAssignee) return;
    try {
      const res = await assignLeadApi(leadId, { assignedTo: newAssignee });
      if (res.lead) {
        setLeads(prev => prev.map(l => (String(l._id || l.id) === String(leadId) ? res.lead : l)));
        alert(`Lead successfully assigned to ${newAssignee}!`);
      }
    } catch (err) {
      alert('Failed to assign lead: ' + err.message);
    }
  };

  const handleCopyProposalLink = (token) => {
    if (!token) return;
    const url = `${window.location.origin}/quotation/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedQuoteToken(token);
    setTimeout(() => setCopiedQuoteToken(null), 3000);
  };

  useEffect(() => {
    fetchAllAdminData();
  }, [analyticsRange]);

  const handleAdminLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // ==========================================
  // TRIP CMS ACTIONS
  // ==========================================
  const handleOpenAddTrip = () => {
    setEditingTripId(null);
    setTripForm(initialTripForm);
    setTripModalTab('basic');
    setShowTripModal(true);
  };

  const handleOpenEditTrip = (trip) => {
    setEditingTripId(trip._id || trip.id);
    setTripForm({
      title: trip.title || '',
      slug: trip.slug || '',
      location: trip.location || '',
      destination: trip.destination || 'Meghalaya',
      region: trip.region || 'North India',
      duration: trip.duration || '5D/4N',
      days: trip.days || 5,
      nights: trip.nights || 4,
      price: trip.price || '',
      originalPrice: trip.originalPrice || '',
      discount: trip.discount || 0,
      currency: trip.currency || 'INR',
      image: trip.image || '',
      heroImage: trip.heroImage || trip.image || '',
      gallery: trip.gallery || [],
      category: trip.category || 'Backpacking',
      mood: trip.mood || 'Adventure',
      difficulty: trip.difficulty || 'Moderate',
      groupType: trip.groupType || 'Mixed Group',
      bestMonths: trip.bestMonths || ['October', 'November', 'December'],
      nextBatch: trip.nextBatch || '15 Sep - 19 Sep',
      capacity: trip.capacity || 20,
      batches: Array.isArray(trip.batches) && trip.batches.length > 0
        ? trip.batches
        : (Array.isArray(trip.availableBatches) && trip.availableBatches.length > 0 ? trip.availableBatches : [
            { batchId: 'b_1', dates: trip.nextBatch || '15 Sep - 20 Sep, 2026', capacity: 20, bookedSeats: 0, status: 'available' }
          ]),
      sharingPricing: trip.sharingPricing || {
        doubleSharing: trip.price || '',
        tripleSharing: trip.price ? Math.max(1000, Number(trip.price) - 1500) : '',
        singleSharing: trip.price ? Number(trip.price) + 3500 : ''
      },
      pickupPoints: Array.isArray(trip.pickupPoints) && trip.pickupPoints.length > 0
        ? trip.pickupPoints
        : ['Airport Arrival Terminal (10:00 AM)', 'Central Railway Station (11:30 AM)'],
      shortDescription: trip.shortDescription || trip.overview || '',
      overview: trip.overview || trip.shortDescription || '',
      itinerary: Array.isArray(trip.itinerary) && trip.itinerary.length > 0 ? trip.itinerary : [
        { day: 1, title: 'Arrival & Welcome', description: 'Meet the trip captains.', morning: '', afternoon: '', evening: '', stay: 'Mountain Hotel' }
      ],
      inclusions: trip.inclusions || ['Trip Captain', 'Stays', 'Breakfast & Dinner'],
      exclusions: trip.exclusions || ['Personal Expenses', 'Flights'],
      faqs: trip.faqs || [],
      status: trip.status || (trip.isActive !== false ? 'published' : 'inactive'),
      seo: {
        seoTitle: trip.seo?.seoTitle || `${trip.title} | WanderLuxe`,
        metaDescription: trip.seo?.metaDescription || trip.overview || '',
        canonicalUrl: trip.seo?.canonicalUrl || `https://wanderluxe.in/trip/${trip.slug || trip.id}`,
        indexingDirective: trip.seo?.indexingDirective || 'index, follow',
        ogTitle: trip.seo?.ogTitle || trip.title,
        ogDescription: trip.seo?.ogDescription || trip.overview || '',
        ogImage: trip.seo?.ogImage || trip.image || ''
      }
    });
    setTripModalTab('basic');
    setShowTripModal(true);
  };

  const handleSaveTrip = async (e) => {
    if (e) e.preventDefault();
    if (!tripForm.title || !tripForm.location || !tripForm.price || !tripForm.image) {
      alert('Please fill out all required fields: Title, Location, Price, and Main Image URL.');
      return;
    }

    try {
      setTripActionLoading(true);
      const detectedWeather = travelKnowledgeService.getDestinationWeather(tripForm.location || tripForm.destination);
      const payload = {
        ...tripForm,
        weather: tripForm.weather || detectedWeather
      };

      if (editingTripId) {
        const updated = await updateTripApi(editingTripId, payload);
        setTrips(trips.map(t => (String(t._id || t.id) === String(editingTripId) ? updated : t)));
        setTripSuccessMsg('Trip package updated successfully.');
      } else {
        const created = await createTripApi(payload);
        setTrips([created, ...trips]);
        setTripSuccessMsg('New trip package published to database.');
      }
      setTimeout(() => {
        setShowTripModal(false);
        setTripSuccessMsg('');
      }, 1200);
    } catch (err) {
      alert(err.message || 'Failed to save trip package');
    } finally {
      setTripActionLoading(false);
    }
  };

  const handleDeleteTrip = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete or deactivate "${title}"?`)) return;
    try {
      const res = await deleteTripApi(id);
      if (res.deactivated) {
        setTrips(trips.map(t => (String(t._id || t.id) === String(id) ? { ...t, status: 'inactive', isActive: false } : t)));
        alert(res.message);
      } else {
        setTrips(trips.filter(t => String(t._id || t.id) !== String(id)));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete trip');
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingImage(true);
      const uploaded = await uploadImageApi(file, 'wanderluxe/trips');
      const url = uploaded.secure_url || uploaded.url;
      setTripForm(prev => ({
        ...prev,
        image: url,
        heroImage: prev.heroImage || url
      }));
    } catch (err) {
      alert(err.message || 'Image upload failed. Using fallback URL input.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Batch Helpers
  const handleAddTripBatch = () => {
    const currentBatches = Array.isArray(tripForm.batches) ? tripForm.batches : [];
    setTripForm({
      ...tripForm,
      batches: [
        ...currentBatches,
        {
          batchId: `b_${Date.now()}`,
          dates: '01 Oct - 06 Oct, 2026',
          capacity: Number(tripForm.capacity) || 20,
          bookedSeats: 0,
          status: 'available',
          pricing: {
            doubleSharing: tripForm.price || '',
            tripleSharing: tripForm.price ? Math.max(1000, Number(tripForm.price) - 1500) : '',
            singleSharing: tripForm.price ? Number(tripForm.price) + 3500 : ''
          }
        }
      ]
    });
  };

  const handleRemoveTripBatch = (index) => {
    const currentBatches = Array.isArray(tripForm.batches) ? tripForm.batches : [];
    setTripForm({
      ...tripForm,
      batches: currentBatches.filter((_, idx) => idx !== index)
    });
  };

  // Itinerary Helper
  const handleAddItineraryDay = () => {
    const nextDay = tripForm.itinerary.length + 1;
    setTripForm({
      ...tripForm,
      itinerary: [
        ...tripForm.itinerary,
        { day: nextDay, title: `Day ${nextDay} Exploration`, description: 'Scenic route and cultural sightseeing.', morning: '', afternoon: '', evening: '', stay: 'Boutique Stay' }
      ]
    });
  };

  const handleRemoveItineraryDay = (index) => {
    const updated = tripForm.itinerary.filter((_, idx) => idx !== index).map((d, idx) => ({ ...d, day: idx + 1 }));
    setTripForm({ ...tripForm, itinerary: updated });
  };

  const handleAutoSelectTripDayMedia = async (idx) => {
    const dayItem = tripForm.itinerary[idx];
    try {
      const dest = tripForm.destination || tripForm.location || '';
      const locName = dayItem.locationName || dayItem.title || '';
      const resolved = await resolveItineraryMediaApi({
        destination: dest,
        locationName: locName,
        dayNumber: dayItem.day || idx + 1,
        tripTitle: tripForm.title,
        dayTitle: dayItem.title,
        description: dayItem.description
      });
      if (resolved?.data) {
        const asset = resolved.data;
        const updated = [...tripForm.itinerary];
        updated[idx] = {
          ...updated[idx],
          coverMedia: {
            id: asset._id,
            url: asset.storage?.secureUrl || asset.url,
            altText: asset.title || locName,
            caption: asset.caption || locName,
            width: asset.storage?.dimensions?.width,
            height: asset.storage?.dimensions?.height
          },
          coverMediaAssetId: asset._id,
          image: asset.storage?.secureUrl || asset.url
        };
        setTripForm({ ...tripForm, itinerary: updated });
      } else {
        alert('No matching media asset found in database for this location.');
      }
    } catch (err) {
      alert('Auto-resolve failed: ' + err.message);
    }
  };

  const handleAutoResolveAllTripDaysMedia = async () => {
    try {
      const dest = tripForm.destination || tripForm.location || '';
      const usedIds = [];
      const updated = [...tripForm.itinerary];
      for (let i = 0; i < updated.length; i++) {
        const dayItem = updated[i];
        const res = await resolveItineraryMediaApi({
          destination: dest,
          locationName: dayItem.locationName || dayItem.title || '',
          dayNumber: dayItem.day || i + 1,
          tripTitle: tripForm.title,
          dayTitle: dayItem.title,
          description: dayItem.description,
          excludeAssetIds: usedIds
        });
        if (res?.data) {
          const asset = res.data;
          usedIds.push(String(asset._id));
          updated[i] = {
            ...dayItem,
            coverMedia: {
              id: asset._id,
              url: asset.storage?.secureUrl || asset.url,
              altText: asset.title,
              caption: asset.caption,
              width: asset.storage?.dimensions?.width,
              height: asset.storage?.dimensions?.height
            },
            coverMediaAssetId: asset._id,
            image: asset.storage?.secureUrl || asset.url
          };
        }
      }
      setTripForm({ ...tripForm, itinerary: updated });
    } catch (err) {
      alert('Batch auto-resolve failed: ' + err.message);
    }
  };

  const handleSelectMediaForTripDay = (asset) => {
    if (tripItineraryMediaDayIdx !== null) {
      const updated = [...tripForm.itinerary];
      updated[tripItineraryMediaDayIdx] = {
        ...updated[tripItineraryMediaDayIdx],
        coverMedia: {
          id: asset._id,
          url: asset.storage?.secureUrl || asset.url,
          altText: asset.title,
          caption: asset.caption,
          width: asset.storage?.dimensions?.width,
          height: asset.storage?.dimensions?.height
        },
        coverMediaAssetId: asset._id,
        image: asset.storage?.secureUrl || asset.url
      };
      setTripForm({ ...tripForm, itinerary: updated });
      setTripItineraryMediaDayIdx(null);
    }
    setShowMediaLibraryModal(false);
  };

  const handleMediaUploaded = (newAsset) => {
    fetchMediaAssetsList();
    fetchCoverageReport();
    if (tripItineraryMediaDayIdx !== null) {
      const updated = [...tripForm.itinerary];
      updated[tripItineraryMediaDayIdx] = {
        ...updated[tripItineraryMediaDayIdx],
        coverMedia: {
          id: newAsset._id,
          url: newAsset.storage?.secureUrl || newAsset.url,
          altText: newAsset.title,
          caption: newAsset.caption,
          width: newAsset.storage?.dimensions?.width,
          height: newAsset.storage?.dimensions?.height
        },
        coverMediaAssetId: newAsset._id,
        image: newAsset.storage?.secureUrl || newAsset.url
      };
      setTripForm({ ...tripForm, itinerary: updated });
      setTripItineraryMediaDayIdx(null);
    }
    setShowUploadLocationModal(false);
  };

  // ==========================================
  // PAGE CMS ACTIONS
  // ==========================================
  const handleOpenAddPage = () => {
    setEditingPageId(null);
    setPageForm(initialPageForm);
    setShowPageModal(true);
  };

  const handleOpenEditPage = (p) => {
    setEditingPageId(p._id || p.id);
    setPageForm({
      title: p.title || '',
      slug: p.slug || '',
      heroSubtitle: p.heroSubtitle || '',
      category: p.category || 'Travel Guide',
      content: p.content || '',
      sections: p.sections || [],
      status: p.status || 'published',
      author: p.author || 'WanderLuxe Editorial',
      seo: {
        metaTitle: p.seo?.metaTitle || `${p.title} | WanderLuxe`,
        metaDescription: p.seo?.metaDescription || '',
        keywords: p.seo?.keywords || '',
        canonicalUrl: p.seo?.canonicalUrl || `https://wanderluxe.in/page/${p.slug}`,
        robots: p.seo?.robots || 'index, follow',
        ogTitle: p.seo?.ogTitle || p.title,
        ogDescription: p.seo?.ogDescription || '',
        ogImage: p.seo?.ogImage || ''
      }
    });
    setShowPageModal(true);
  };

  const handleSavePage = async (e) => {
    if (e) e.preventDefault();
    if (!pageForm.title || !pageForm.slug) {
      alert('Page title and slug are required.');
      return;
    }

    try {
      setPageActionLoading(true);
      if (editingPageId) {
        const res = await updatePageApi(editingPageId, pageForm);
        setPages(pages.map(p => (String(p._id || p.id) === String(editingPageId) ? res.page || res : p)));
        setPageSuccessMsg('Page updated successfully.');
      } else {
        const res = await createPageApi(pageForm);
        setPages([res.page || res, ...pages]);
        setPageSuccessMsg('New public page published to database.');
      }
      setTimeout(() => {
        setShowPageModal(false);
        setPageSuccessMsg('');
      }, 1200);
    } catch (err) {
      alert(err.message || 'Failed to save page');
    } finally {
      setPageActionLoading(false);
    }
  };

  const handleDeletePage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this content page?')) return;
    try {
      await deletePageApi(id);
      setPages(pages.filter(p => String(p._id || p.id) !== String(id)));
    } catch (err) {
      alert(err.message || 'Failed to delete page');
    }
  };

  // ==========================================
  // COUPON & CRM ACTIONS
  // ==========================================
  const handleAddCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.value) return;
    try {
      const added = await createCouponApi(newCoupon);
      setCoupons([added, ...coupons]);
      setNewCoupon({ code: '', type: 'percentage', value: '', expiry: '2026-12-31', maxUses: 500 });
      setShowCouponModal(false);
    } catch (err) {
      alert(err.message || 'Failed to create coupon');
    }
  };

  const handleToggleCoupon = async (id) => {
    try {
      const res = await toggleCouponApi(id);
      setCoupons(coupons.map(c => (c.id === id ? { ...c, active: res.active !== undefined ? res.active : !c.active } : c)));
    } catch (err) {
      console.warn('Coupon toggle warning:', err.message);
    }
  };

  const handleDeleteCoupon = async (id) => {
    try {
      await deleteCouponApi(id);
      setCoupons(coupons.filter(c => c.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete coupon');
    }
  };

  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      await updateLeadStatusApi(leadId, newStatus);
      setLeads(leads.map(l => (String(l._id || l.id) === String(leadId) ? { ...l, status: newStatus } : l)));
    } catch (err) {
      alert(err.message || 'Failed to update lead');
    }
  };

  const handleUserRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change role to ${newRole.toUpperCase()}?`)) return;
    try {
      await updateUserRoleApi(userId, newRole);
      setUsersList(usersList.map(u => (String(u._id || u.id) === String(userId) ? { ...u, role: newRole } : u)));
    } catch (err) {
      alert(err.message || 'Failed to update user role');
    }
  };

  // Filtered Lists
  const filteredTrips = trips.filter(t => {
    const matchSearch = (t.title || '').toLowerCase().includes(tripSearch.toLowerCase()) ||
                        (t.location || '').toLowerCase().includes(tripSearch.toLowerCase()) ||
                        (t.destination || '').toLowerCase().includes(tripSearch.toLowerCase());
    const matchStatus = tripStatusFilter === 'all' || t.status === tripStatusFilter;
    return matchSearch && matchStatus;
  });

  const filteredLeads = leads.filter(l => {
    const q = (leadSearch || '').toLowerCase().trim();
    const matchSearch = !q || 
      (l.name || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.phone || '').toLowerCase().includes(q) ||
      (l.destination || '').toLowerCase().includes(q) ||
      (l.tripTitle || '').toLowerCase().includes(q);

    const matchStatus = leadStatusFilter === 'all' || l.status === leadStatusFilter;
    const matchType = leadTypeFilter === 'all' || (l.leadType || 'trip_enquiry') === leadTypeFilter;

    return matchSearch && matchStatus && matchType;
  });

  const popularDestinationsList = getDestinations().map(d => d.name);

  return (
    <div className="min-h-screen bg-slate-100/70 pb-24 pt-28 md:pt-32 text-slate-800 font-sans">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        
        {/* Header Admin Control Panel Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden border border-slate-800">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Enterprise Admin Control Center
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Admin: {user?.email || 'admin@wanderluxe.in'}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              WanderLuxe Master Administration
            </h1>
            <p className="text-slate-300 text-xs md:text-sm font-medium max-w-2xl">
              Real-time sales analytics, Trip CMS with 10-step configuration, dynamic Public Page CMS, live CRM leads, and creator partner approvals.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <button
              onClick={handleOpenAddTrip}
              className="px-5 py-3 bg-emerald-600 text-white text-xs font-black rounded-2xl hover:bg-emerald-500 transition-all shadow-lg flex items-center gap-2"
            >
              <Plus size={16} /> Add New Trip
            </button>
            <button
              onClick={handleAdminLogout}
              className="px-4 py-3 bg-white/10 text-white hover:bg-rose-600 border border-white/20 transition-all text-xs font-bold rounded-2xl flex items-center gap-1.5"
            >
              <LogOut size={16} /> Exit Admin
            </button>
          </div>
        </div>

        {/* Role-Adaptive Master Tab Selector */}
        {(() => {
          const userRole = (user?.role || 'admin').toLowerCase();
          const isSuperOrAdmin = ['admin', 'super_admin'].includes(userRole) || user?.email?.toLowerCase() === 'gaurav999@gmail.com';

          const allTabDefs = [
            { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={15} />, roles: ['super_admin', 'admin', 'operations', 'sales', 'marketing'] },
            { id: 'quotations', label: 'Quotations', icon: <FileText size={15} />, roles: ['super_admin', 'admin', 'operations', 'sales', 'marketing'] },
            { id: 'trips', label: 'Trip CMS', icon: <Layers size={15} />, roles: ['super_admin', 'admin', 'operations', 'marketing'] },
            { id: 'media_library', label: 'Media Library', icon: <Camera size={15} />, roles: ['super_admin', 'admin', 'operations', 'marketing'] },
            { id: 'pages', label: 'Pages CMS', icon: <Globe size={15} />, roles: ['super_admin', 'admin', 'marketing'] },
            { id: 'bookings_crm', label: 'Bookings & CRM', icon: <Ticket size={15} />, roles: ['super_admin', 'admin', 'operations', 'sales'] },
            { id: 'influencer_verification', label: 'Creator Approvals', icon: <UserCheck size={15} />, roles: ['super_admin', 'admin'] },
            { id: 'payouts', label: 'Payouts', icon: <Wallet size={15} />, roles: ['super_admin', 'admin'] },
            { id: 'coupons', label: 'Discounts', icon: <Tag size={15} />, roles: ['super_admin', 'admin'] },
            { id: 'users', label: 'Users & Roles', icon: <Users size={15} />, roles: ['super_admin', 'admin'] }
          ];

          const visibleTabs = allTabDefs.filter(t => isSuperOrAdmin || t.roles.includes(userRole));

          return (
            <div className="flex flex-wrap gap-2 mb-8">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-xs ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-md border-b-2 border-emerald-500'
                      : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* TAB 1: REAL ANALYTICS ENGINE (ZERO MOCK / ZERO RANDOM NUMBERS) */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Range & Filter Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <BarChart3 size={20} className="text-emerald-600" /> Real-Time Platform Analytics
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Authoritative metrics aggregated directly from verified MongoDB bookings, payments, and users.
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                {[
                  { label: '7 Days', val: '7d' },
                  { label: '30 Days', val: '30d' },
                  { label: '90 Days', val: '90d' },
                  { label: 'This Year', val: 'year' },
                  { label: 'All Time', val: 'all' }
                ].map(r => (
                  <button
                    key={r.val}
                    onClick={() => setAnalyticsRange(r.val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      analyticsRange === r.val
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Gross Verified Revenue */}
              <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Revenue</span>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 mt-1.5">
                  ₹{Number(stats.totalRevenue || 0).toLocaleString()}
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md mt-2 inline-flex items-center gap-1">
                  <ShieldCheck size={12} /> Real Paid Bookings
                </span>
              </div>

              {/* Total Bookings */}
              <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bookings</span>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 mt-1.5">
                  {stats.totalBookings || 0}
                </h3>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md mt-2 inline-block">
                  {stats.confirmedBookings || 0} Confirmed • {stats.pendingBookings || 0} Pending
                </span>
              </div>

              {/* Active Published Departures */}
              <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Departures</span>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 mt-1.5">
                  {stats.activeTrips || trips.filter(t => t.status === 'published').length || 0}
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-2 inline-block">
                  Live in Public Catalog
                </span>
              </div>

              {/* CRM Leads & Conversion */}
              <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">CRM Inquiries & Conversion</span>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 mt-1.5">
                  {stats.totalLeads || 0} Leads
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-2 inline-block">
                  {stats.conversionRate || '0%'} Conversion
                </span>
              </div>
            </div>

            {/* Quotation Pipeline Conversion KPIs (Phase 5) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-emerald-600" />
                  <h3 className="font-black text-slate-900 text-sm uppercase">Quotation Conversion Pipeline</h3>
                </div>
                <span className="text-[11px] font-bold text-slate-400 font-mono">Live Proposal Lifecycle</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Quotes Drafted</div>
                  <div className="text-xl font-black text-slate-900 mt-1">{stats.totalQuotations || quotations.length || 0}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Commercial Proposals</div>
                </div>
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                  <div className="text-[10px] font-bold text-blue-600 uppercase">Quotes Sent / Viewed</div>
                  <div className="text-xl font-black text-blue-900 mt-1">{stats.sentQuotations || quotations.filter(q => ['SENT', 'VIEWED', 'APPROVED', 'CONVERTED'].includes(q.status)).length || 0}</div>
                  <div className="text-[10px] text-blue-600 mt-0.5">Delivered to Clients</div>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase">Quotes Approved</div>
                  <div className="text-xl font-black text-emerald-900 mt-1">{stats.approvedQuotations || quotations.filter(q => ['APPROVED', 'CONVERTED'].includes(q.status)).length || 0}</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">Client Verified</div>
                </div>
                <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100/50">
                  <div className="text-[10px] font-bold text-purple-600 uppercase">Quote ➔ Booking Conv.</div>
                  <div className="text-xl font-black text-purple-900 mt-1">{stats.quotationConversionRate || (quotations.length > 0 ? `${((quotations.filter(q => q.status === 'CONVERTED').length / quotations.length) * 100).toFixed(1)}%` : '0.0%')}</div>
                  <div className="text-[10px] text-purple-600 mt-0.5">{stats.convertedQuotations || quotations.filter(q => q.status === 'CONVERTED').length || 0} Converted Orders</div>
                </div>
              </div>
            </div>

            {/* Monthly Trend & Destination Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Revenue Chart / List */}
              <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900 text-sm uppercase">Monthly Revenue & Bookings Trend</h3>
                  <span className="text-xs text-slate-400 font-bold font-mono">Aggregation Period: {analyticsRange.toUpperCase()}</span>
                </div>

                {Array.isArray(stats.monthlyRevenue) && stats.monthlyRevenue.length > 0 ? (
                  <div className="space-y-3 pt-2">
                    {stats.monthlyRevenue.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-bold">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-black text-slate-900 text-sm">{item.month}</div>
                            <div className="text-slate-400 text-[11px]">{item.bookings} confirmed bookings</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-emerald-600 text-sm">₹{Number(item.revenue).toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">Gross Total</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <p className="text-xs font-bold">No booking transactions recorded for this period.</p>
                    <p className="text-[11px] text-slate-400">Real analytics will populate automatically as users complete test or live bookings.</p>
                  </div>
                )}
              </div>

              {/* Destination Breakdown */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-black text-slate-900 text-sm uppercase">Top Booked Destinations</h3>
                {Array.isArray(stats.destinationBreakdown) && stats.destinationBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    {stats.destinationBreakdown.map((dest, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-black text-slate-800">
                          <span>{dest.name}</span>
                          <span className="text-emerald-600 font-mono">{dest.percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${dest.percentage}%` }} />
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {dest.count} bookings • ₹{Number(dest.revenue || 0).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs font-bold">
                    No destination bookings recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: QUOTATIONS CMS & PIPELINE (PHASE 2) */}
        {/* ========================================================================= */}
        {activeTab === 'quotations' && (
          <div className="space-y-6">
            {/* Header & Quick Action */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileText size={22} className="text-emerald-600" /> Quotation Proposals & Custom Journeys ({quotations.length})
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Authoritative multi-tier quotation engine. Build custom itineraries, alternative hotel/fleet tiers, and convert to bookings.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <button
                  onClick={fetchQuotationsList}
                  disabled={quotationsLoading}
                  className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Refresh Quotations"
                >
                  <RefreshCw size={15} className={quotationsLoading ? 'animate-spin' : ''} />
                </button>

                <button
                  onClick={handleCreateNewQuotation}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Plus size={16} /> Create New Quotation
                </button>
              </div>
            </div>

            {/* Comprehensive Filters Bar */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {/* Search */}
                <div className="relative md:col-span-2">
                  <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={quotationSearch}
                    onChange={(e) => setQuotationSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchQuotationsList()}
                    placeholder="Search Quotation #, customer, destination..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={quotationStatusFilter}
                    onChange={(e) => setQuotationStatusFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="VIEWED">Viewed</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="CONVERTED">Converted</option>
                  </select>
                </div>

                {/* Destination Filter */}
                <div>
                  <select
                    value={quotationDestinationFilter}
                    onChange={(e) => setQuotationDestinationFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="all">All Destinations</option>
                    {getDestinations().map((d) => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <select
                    value={quotationSort}
                    onChange={(e) => setQuotationSort(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="updated">Recently Updated</option>
                    <option value="newest">Newest Created</option>
                    <option value="value">Highest Value</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[1050px]">
                  <thead className="bg-slate-900 text-white uppercase font-black text-[10px]">
                    <tr>
                      <th className="p-4">Quotation #</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Destination & Dates</th>
                      <th className="p-4">Amount & Deposit</th>
                      <th className="p-4">Assigned Sales</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Updated</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {quotations.length > 0 ? (
                      quotations.map((q) => {
                        const cust = q.customerSnapshot || {};
                        const reqs = q.tripRequirements || {};
                        const pricing = q.pricing || {};
                        const isConverted = q.status === 'CONVERTED';
                        const isApproved = q.status === 'APPROVED';
                        const cleanPhone = String(cust.phone || '').replace(/\D/g, '');
                        const waLink = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(`Hi ${cust.name || 'Traveler'}, this is regarding your WanderLuxe journey quotation ${q.quotationNumber}. Let us know if you need any adjustments!`)}`;

                        return (
                          <tr key={q._id || q.id} className="hover:bg-slate-50 transition-colors">
                            {/* Quotation Number & Lead badge */}
                            <td className="p-4">
                              <div className="space-y-1">
                                <div className="font-mono font-black text-slate-900 text-xs flex items-center gap-1.5">
                                  <Link
                                    to={`/admin/quotations/${q._id || q.id}`}
                                    className="text-slate-900 hover:text-indigo-600 hover:underline flex items-center gap-1 font-mono"
                                    title="View authoritative Quotation Detail page"
                                  >
                                    <span>{q.quotationNumber || 'WL-Q-2026-DRAFT'}</span>
                                  </Link>
                                </div>
                                {q.leadId && (
                                  <span className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200 inline-block">
                                    CRM Lead
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Customer Contact */}
                            <td className="p-4">
                              <div className="space-y-1">
                                <div className="font-bold text-slate-900">{cust.name || 'Anonymous Traveler'}</div>
                                <div className="text-[11px] text-slate-400 font-mono">{cust.email}</div>
                                {cust.phone && (
                                  <div className="flex items-center gap-1.5 pt-0.5">
                                    <a
                                      href={`tel:${cust.phone}`}
                                      className="text-[10px] font-bold text-slate-700 hover:text-emerald-600 flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded"
                                    >
                                      <Phone size={9} /> {cust.phone}
                                    </a>
                                    <a
                                      href={waLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded"
                                    >
                                      <MessageSquare size={9} /> WA
                                    </a>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Destination & Dates */}
                            <td className="p-4">
                              <div className="space-y-0.5 max-w-[220px]">
                                <div className="font-black text-slate-800 truncate" title={reqs.title || reqs.destination}>
                                  {reqs.destination || 'Custom Destination'}
                                </div>
                                <div className="text-[10px] text-indigo-700 font-bold flex items-center gap-1">
                                  <Clock size={10} /> {reqs.duration || '5D/4N'} • {reqs.totalTravelers || 2} Pax
                                </div>
                                {reqs.startDate && (
                                  <div className="text-[10px] text-slate-400">
                                    Depart: {new Date(reqs.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Amount & Deposit */}
                            <td className="p-4">
                              <div className="space-y-0.5">
                                <div className="font-mono font-black text-slate-900 text-sm">
                                  ₹{(pricing.finalTotal || 0).toLocaleString()}
                                </div>
                                <div className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block font-mono">
                                  Dep: ₹{(pricing.depositRequired || 0).toLocaleString()} (10%)
                                </div>
                              </div>
                            </td>

                            {/* Assigned Sales */}
                            <td className="p-4">
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-800">
                                  {q.assignedToSnapshot?.name || (q.assignedTo?.name || 'Sales Team')}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {q.assignedToSnapshot?.email || q.assignedTo?.email || 'sales@wanderluxe.in'}
                                </div>
                              </div>
                            </td>

                            {/* Status Badge */}
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap ${
                                q.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                q.status === 'SENT' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                                q.status === 'VIEWED' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' :
                                q.status === 'CONVERTED' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                                q.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                q.status === 'EXPIRED' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}>
                                {q.status || 'DRAFT'}
                              </span>
                            </td>

                            {/* Updated Date */}
                            <td className="p-4 font-mono text-[11px] text-slate-400">
                              {q.updatedAt ? new Date(q.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Recent'}
                            </td>

                            {/* Action Buttons */}
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* View Quotation Details Page */}
                                <Link
                                  to={`/admin/quotations/${q._id || q.id}`}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors inline-flex items-center"
                                  title="View Full Authoritative Quotation Details"
                                >
                                  <FileText size={13} />
                                </Link>

                                {/* Edit / Open Builder */}
                                <button
                                  onClick={() => handleEditQuotation(q._id || q.id)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                                  title="Edit in Builder"
                                >
                                  <Edit3 size={13} />
                                </button>

                                {/* Preview Proposal Document Modal */}
                                <button
                                  onClick={() => setPreviewQuotation(q)}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors cursor-pointer"
                                  title="Preview Official Proposal Document"
                                >
                                  <Eye size={13} />
                                </button>

                                {/* Share Link & WhatsApp Modal */}
                                <button
                                  onClick={() => setShareModalQuotation(q)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                                  title="Share Proposal via WhatsApp / Copy Link / PDF"
                                >
                                  <Share2 size={13} />
                                </button>

                                {/* Open Public Link in New Tab */}
                                {q.publicShare?.token && (
                                  <a
                                    href={`/quotation/${q.publicShare.token}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors"
                                    title="Open Public Customer Proposal"
                                  >
                                    <ExternalLink size={13} />
                                  </a>
                                )}

                                {/* Send */}
                                {q.status === 'DRAFT' && (
                                  <button
                                    onClick={() => handleSendQuotationAction(q._id || q.id, q.quotationNumber, cust.email)}
                                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors cursor-pointer"
                                    title="Send to Customer"
                                  >
                                    <Send size={13} />
                                  </button>
                                )}

                                {/* Conversion Actions (Path A & Path B) */}
                                {!isConverted && (
                                  <>
                                    {/* Convert to Private Booking (Path B) */}
                                    <button
                                      onClick={() => handleConvertQuotationToBookingAction(q._id || q.id, q.quotationNumber)}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                                      title="Convert to Live Private Booking Order (Path B)"
                                    >
                                      <CreditCard size={11} /> Booking
                                    </button>

                                    {/* Convert to Catalog Trip (Path A) */}
                                    <button
                                      onClick={() => handleConvertQuotationToTripAction(q._id || q.id, q.quotationNumber)}
                                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                                      title="Convert to Draft Catalog Trip Package (Path A)"
                                    >
                                      <Compass size={11} /> Trip
                                    </button>
                                  </>
                                )}

                                {/* Converted Traceability Badges (Clicking WLX opens confirmed booking order) */}
                                {isConverted && (
                                  <div className="flex items-center gap-1">
                                    {q.bookingCode && (
                                      <button
                                        onClick={() => {
                                          setBookingModalCode(q.bookingCode);
                                          setBookingModalQuotation(q);
                                          setShowBookingModal(true);
                                        }}
                                        className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-lg text-[10px] font-black flex items-center gap-1.5 transition-all shadow-2xs hover:scale-105 cursor-pointer"
                                        title={`Click to view Confirmed Booking Order (${q.bookingCode})`}
                                      >
                                        <CreditCard size={11} className="text-emerald-700" /> {q.bookingCode}
                                      </button>
                                    )}
                                    {q.convertedTripId && (
                                      <button
                                        onClick={() => {
                                          setActiveTab('trips');
                                        }}
                                        className="px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all shadow-2xs hover:scale-105 cursor-pointer"
                                        title="View Converted Draft Trip in CMS"
                                      >
                                        <Compass size={11} className="text-indigo-700" /> Draft Trip
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* Delete */}
                                <button
                                  onClick={() => handleDeleteQuotation(q._id || q.id, q.quotationNumber)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                                  title="Delete Quotation"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-400 space-y-3">
                          <FileText size={32} className="mx-auto text-slate-300" />
                          <div className="text-xs font-bold">No quotations found matching active filter criteria.</div>
                          <button
                            onClick={handleCreateNewQuotation}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black cursor-pointer"
                          >
                            + Create First Quotation
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TRIP CMS (FULL 10-SECTION CREATOR / EDITOR WIZARD) */}
        {/* ========================================================================= */}
        {activeTab === 'trips' && (
          <div className="space-y-6">
            {/* Search & Actions Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search trips, locations..."
                    value={tripSearch}
                    onChange={(e) => setTripSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>

                <select
                  value={tripStatusFilter}
                  onChange={(e) => setTripStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                >
                  <option value="all">All Statuses ({trips.length})</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <button
                onClick={handleOpenAddTrip}
                className="w-full md:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Create Trip Package
              </button>
            </div>

            {/* Trip Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrips.map((trip) => (
                <div key={trip._id || trip.id} className="bg-white rounded-3xl overflow-hidden shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="h-44 overflow-hidden relative">
                    <img 
                      src={trip.image || trip.heroImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'} 
                      alt={trip.title} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="bg-slate-900/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-xs">
                        {trip.duration}
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                        trip.status === 'draft' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        trip.status === 'inactive' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                        'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {trip.status || 'published'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <h3 className="font-black text-slate-900 text-base leading-snug line-clamp-1">{trip.title}</h3>
                    <p className="text-xs text-slate-500 font-bold flex items-center gap-1">
                      <MapPin size={13} className="text-emerald-600" /> {trip.location} • {trip.destination}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-base font-black text-emerald-600">₹{Number(trip.price).toLocaleString()}</span>
                      <span className="text-[11px] text-slate-400 font-bold">{trip.itinerary?.length || 5} Days Itinerary</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <a
                      href={`/trip/${trip.slug || trip.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Eye size={13} /> View Live
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditTrip(trip)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTrip(trip._id || trip.id, trip.title)}
                        className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: CANONICAL LOCATION MEDIA LIBRARY & COVERAGE CENTER */}
        {/* ========================================================================= */}
        {activeTab === 'media_library' && (
          <div className="space-y-6">
            {/* Header Toolbar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Location Media Library
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {mediaAssets.length} Indexed Assets
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Camera size={22} className="text-emerald-600" /> Canonical Location Photography Repository
                </h2>
                <p className="text-xs text-slate-500 font-medium max-w-2xl">
                  Real database-driven photography mapped to exact destinations, localities, and POIs. Used by Smart Image Resolver across Quotations, Trips, AI Itineraries, and PDF exports.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setUploadInitialDestination('');
                    setUploadInitialLocation('');
                    setShowUploadLocationModal(true);
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus size={14} /> Index New Photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    fetchMediaAssetsList();
                    fetchCoverageReport();
                  }}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Refresh Media and Coverage Report"
                >
                  <RefreshCw size={14} className={mediaAssetsLoading || mediaReportLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Media Coverage Intelligence Widget */}
            {mediaCoverageReport && (
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      Coverage Intelligence
                    </span>
                    <h3 className="text-lg font-black text-white mt-1">
                      Itinerary Media Coverage & Gap Analysis
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Overall Coverage Rate</span>
                      <span className="text-2xl font-black text-emerald-400">
                        {mediaCoverageReport.stats?.coverageRate || '100%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Active Assets</span>
                    <span className="text-xl font-black text-white">{mediaCoverageReport.stats?.totalActiveAssets || mediaAssets.length}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Covered Destinations</span>
                    <span className="text-xl font-black text-emerald-400">{mediaCoverageReport.stats?.coveredDestinationsCount || 0}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Unique POIs Indexed</span>
                    <span className="text-xl font-black text-blue-400">{mediaCoverageReport.stats?.uniquePoisCount || 0}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Missing Locations Queue</span>
                    <span className="text-xl font-black text-amber-400">{mediaCoverageReport.missingQueue?.length || 0}</span>
                  </div>
                </div>

                {/* Missing Location Action Queue */}
                {mediaCoverageReport.missingQueue?.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <AlertCircle size={14} /> Attention Needed: Unindexed Itinerary Locations ({mediaCoverageReport.missingQueue.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {mediaCoverageReport.missingQueue.map((item, qIdx) => (
                        <div key={qIdx} className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between gap-2">
                          <div className="overflow-hidden">
                            <span className="font-bold text-xs text-white block truncate">{item.location}</span>
                            <span className="text-[10px] text-slate-400 block truncate">📍 {item.destination}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadInitialDestination(item.destination || '');
                              setUploadInitialLocation(item.location || '');
                              setShowUploadLocationModal(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] rounded-lg shrink-0 transition-colors cursor-pointer"
                          >
                            Upload Photo
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Filter Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={mediaSearch}
                    onChange={(e) => setMediaSearch(e.target.value)}
                    placeholder="Search by POI, destination, city or tags..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={mediaDestFilter}
                  onChange={(e) => setMediaDestFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="">All Destinations</option>
                  {popularDestinationsList.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Media Asset Cards Grid */}
            {mediaAssetsLoading ? (
              <div className="py-20 text-center text-slate-400 space-y-2">
                <RefreshCw size={24} className="animate-spin text-emerald-600 mx-auto" />
                <p className="text-xs font-bold">Scanning canonical media assets...</p>
              </div>
            ) : mediaAssets.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Camera size={24} />
                </div>
                <h4 className="font-black text-slate-900 text-base">No Media Assets Found</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No location photos match your current filters. Click "Index New Photo" to add images to the database.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setUploadInitialDestination('');
                    setUploadInitialLocation('');
                    setShowUploadLocationModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Upload First Photo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mediaAssets.map((asset) => {
                  const imgUrl = asset.storage?.secureUrl || asset.url;
                  const poi = asset.location?.poi || asset.title;
                  const destination = asset.location?.destination;

                  return (
                    <div
                      key={asset._id}
                      className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                      <div className="relative aspect-16/10 bg-slate-900 overflow-hidden">
                        <img
                          src={imgUrl}
                          alt={asset.altText || poi}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 inset-x-2 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-slate-900 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md shadow-xs">
                            {destination}
                          </span>
                          {asset.featured && (
                            <span className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                              <Sparkles size={10} /> Featured
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setAdminMediaPreview(asset)}
                          className="absolute bottom-2 right-2 p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Preview Full Image"
                        >
                          <Eye size={13} />
                        </button>
                      </div>

                      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-black text-slate-900 text-xs truncate" title={asset.title}>
                            {asset.title}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium block truncate">
                            📍 {poi || asset.location?.locality || destination}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{asset.storage?.width}x{asset.storage?.height}px</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteMediaAssetAction(asset._id, asset.title)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                            title="Delete Asset"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DYNAMIC PUBLIC PAGES CMS */}
        {/* ========================================================================= */}
        {activeTab === 'pages' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileText size={20} className="text-emerald-600" /> Dynamic Public Content Pages CMS
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Create rich landing pages, destination guides, and travel blogs accessible on <code>/page/:slug</code>.
                </p>
              </div>

              <button
                onClick={handleOpenAddPage}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black transition-all shadow-md flex items-center gap-2"
              >
                <Plus size={16} /> Create Content Page
              </button>
            </div>

            {/* Pages Table */}
            <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white uppercase font-black text-[10px]">
                  <tr>
                    <th className="p-4">Page Title & Slug</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Sections</th>
                    <th className="p-4">SEO Health</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {pages.map((p) => (
                    <tr key={p._id || p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-black text-slate-900 text-sm">{p.title}</div>
                        <div className="text-[11px] text-emerald-600 font-mono font-bold">/page/{p.slug}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-[11px]">
                          {p.category || 'General'}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-600">
                        {p.sections?.length || 1} Sections
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-black rounded-full text-[10px] border border-emerald-200">
                          {p.seoHealthScore || 85}% Optimized
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          p.status === 'published' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <a
                          href={`/page/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye size={13} /> View
                        </a>
                        <button
                          onClick={() => handleOpenEditPage(p)}
                          className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all inline-flex items-center gap-1"
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeletePage(p._id || p.id)}
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: BOOKINGS & CRM LEADS */}
        {/* ========================================================================= */}
        {activeTab === 'bookings_crm' && (
          <div className="space-y-8">
            {/* Live Master Bookings Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Ticket size={20} className="text-emerald-600" /> Master Bookings Log ({bookings.length})
                </h3>
                <span className="text-xs text-slate-400 font-bold">Authoritative MongoDB Records</span>
              </div>

              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white uppercase font-black text-[10px]">
                    <tr>
                      <th className="p-4">Booking ID</th>
                      <th className="p-4">Traveler / Customer</th>
                      <th className="p-4">Trip Package</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Booking Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {bookings.map((b) => (
                      <tr key={b._id || b.bookingId} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono font-bold text-emerald-700">
                          <button
                            onClick={() => {
                              setBookingModalCode(b.bookingId || b._id);
                              setBookingModalQuotation(null);
                              setShowBookingModal(true);
                            }}
                            className="hover:underline hover:text-emerald-900 cursor-pointer flex items-center gap-1 font-bold"
                            title="Click to view full Booking Order details"
                          >
                            <CreditCard size={11} /> {b.bookingId || b._id}
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{b.customer?.name || 'Traveler'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{b.customer?.email}</div>
                        </td>
                        <td className="p-4 font-bold text-slate-800">{b.tripSnapshot?.title || 'Expedition'}</td>
                        <td className="p-4 font-black text-slate-900">₹{Number(b.pricing?.finalAmount || b.paidAmount || 18500).toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            b.payment?.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {b.payment?.status || 'PAID'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            b.bookingStatus === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {b.bookingStatus || 'CONFIRMED'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setBookingModalCode(b.bookingId || b._id);
                              setBookingModalQuotation(null);
                              setShowBookingModal(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye size={12} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CRM Leads Table */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <MessageSquare size={20} className="text-emerald-600" /> CRM Customer Inquiries & Callback Requests ({leads.length})
                  </h3>
                  <p className="text-xs text-slate-400 font-bold">
                    Real-time MongoDB inquiries, trip consultations, and scheduled callback requests
                  </p>
                </div>

                {/* Filter Controls Bar */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                      placeholder="Search name, phone, trip..."
                      className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none w-44 sm:w-56 focus:border-emerald-500"
                    />
                  </div>

                  <select
                    value={leadTypeFilter}
                    onChange={(e) => setLeadTypeFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="all">All Lead Types</option>
                    <option value="callback_request">📞 Callback Requests</option>
                    <option value="trip_enquiry">✉️ Trip Enquiries</option>
                    <option value="general">💬 General Contact</option>
                  </select>

                  <select
                    value={leadStatusFilter}
                    onChange={(e) => setLeadStatusFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="CONVERTED">CONVERTED</option>
                    <option value="LOST">LOST</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[900px]">
                    <thead className="bg-slate-900 text-white uppercase font-black text-[10px]">
                      <tr>
                        <th className="p-4">Type & Rec'd</th>
                        <th className="p-4">Traveler & Quick Contact</th>
                        <th className="p-4">Trip Package</th>
                        <th className="p-4">Preferred Call Window</th>
                        <th className="p-4">Travelers / Message</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions & Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredLeads.length > 0 ? (
                        filteredLeads.map((l) => {
                          const cleanPhone = String(l.phone || '').replace(/\D/g, '');
                          const waLink = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(`Hi ${l.name || 'Traveler'}, this is regarding your inquiry for ${l.tripTitle || l.destination || 'WanderLuxe'}. How can we assist you today?`)}`;

                          return (
                            <tr key={l._id || l.id} className="hover:bg-slate-50 transition-colors">
                              {/* Lead Type */}
                              <td className="p-4">
                                <div className="space-y-1">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                                    l.leadType === 'callback_request' ? 'bg-indigo-100 text-indigo-800' :
                                    l.leadType === 'trip_enquiry' ? 'bg-emerald-100 text-emerald-800' :
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    {l.leadType === 'callback_request' ? '📞 Callback' :
                                     l.leadType === 'trip_enquiry' ? '✉️ Trip Inquiry' : '💬 General'}
                                  </span>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Recent'}
                                  </div>
                                </div>
                              </td>

                              {/* Traveler Contact */}
                              <td className="p-4">
                                <div className="space-y-1">
                                  <div className="font-bold text-slate-900">{l.name}</div>
                                  <div className="text-[11px] text-slate-400 font-mono">{l.email}</div>
                                  <div className="flex items-center gap-2 pt-0.5">
                                    <a
                                      href={`tel:${l.phone}`}
                                      className="text-[10px] font-bold text-slate-700 hover:text-emerald-600 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg transition-colors"
                                      title="Call Traveler"
                                    >
                                      <Phone size={10} /> {l.phone}
                                    </a>
                                    <a
                                      href={waLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg transition-colors"
                                      title="Open WhatsApp Chat"
                                    >
                                      <MessageSquare size={10} /> WhatsApp
                                    </a>
                                  </div>
                                </div>
                              </td>

                              {/* Trip Reference */}
                              <td className="p-4">
                                <div className="space-y-0.5 max-w-[200px]">
                                  <div className="font-bold text-slate-800 truncate" title={l.tripTitle || l.destination}>
                                    {l.tripTitle || l.destination || 'Custom Expedition'}
                                  </div>
                                  {l.travelDate && (
                                    <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                                      <Calendar size={10} /> {l.travelDate}
                                    </div>
                                  )}
                                  <div className="text-[10px] text-slate-400 font-medium">
                                    Source: <span className="font-mono text-slate-600">{l.source || 'trip_page'}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Scheduled Call Window */}
                              <td className="p-4">
                                {l.preferredCallDate || l.preferredCallWindow ? (
                                  <div className="space-y-0.5">
                                    <div className="font-black text-slate-900 flex items-center gap-1">
                                      <Clock size={11} className="text-indigo-600" />
                                      <span>{l.preferredCallWindow || 'Anytime'}</span>
                                    </div>
                                    <div className="text-[10px] text-indigo-700 font-bold">
                                      {l.preferredCallDate || 'Today'}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">As soon as available</span>
                                )}
                              </td>

                              {/* Travelers & Message */}
                              <td className="p-4">
                                <div className="space-y-1 max-w-xs">
                                  <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                    {l.travelersCount || 1} Pax {l.budgetPerPerson ? `• ${l.budgetPerPerson}` : ''}
                                  </span>
                                  {l.message ? (
                                    <p className="text-[11px] text-slate-600 line-clamp-2" title={l.message}>
                                      {l.message}
                                    </p>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">No special message</span>
                                  )}
                                </div>
                              </td>

                              {/* Status Badge */}
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

                              {/* Status Dropdown & Action Buttons */}
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {/* Lead Assignee Button (Admin/Super Admin) */}
                                  <button
                                    onClick={() => handleAssignLeadAction(l._id || l.id, l.assignedTo)}
                                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                                    title="Assign Lead to Sales Concierge"
                                  >
                                    <UserCheck size={12} /> {l.assignedTo && l.assignedTo !== 'Sales Concierge Team' ? l.assignedTo : 'Assign'}
                                  </button>

                                  <button
                                    onClick={() => handleCreateQuotationFromLead(l)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                                    title="Create tailored quotation for this lead"
                                  >
                                    <FileText size={12} /> Create Quote
                                  </button>
                                  <select
                                    value={l.status}
                                    onChange={(e) => handleUpdateLeadStatus(l._id || l.id, e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 outline-none cursor-pointer hover:border-slate-300"
                                  >
                                    <option value="NEW">NEW</option>
                                    <option value="CONTACTED">CONTACTED</option>
                                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                                    <option value="QUALIFIED">QUALIFIED</option>
                                    <option value="CONVERTED">CONVERTED</option>
                                    <option value="LOST">LOST</option>
                                  </select>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 text-xs font-bold">
                            No inquiries match the active search or filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: PROTECTED INFLUENCER APPROVALS TAB (STRICTLY UNTOUCHED LOGIC) */}
        {/* ========================================================================= */}
        {activeTab === 'influencer_verification' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-brand-navy flex items-center gap-2">
                  <UserCheck size={22} className="text-emerald-600" /> Influencer Verification & Approval Engine
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  Review applicant profile, social metrics, and approve/reject creator accounts. Approved creators gain full Influencer Portal access.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
                  {influencerApplications?.filter(a => a.status === 'pending').length || 0} Pending Requests
                </span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                  {influencerApplications?.filter(a => a.status === 'approved').length || 1} Active Creators
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-4">Applicant</th>
                    <th className="p-4">Social Handle / Platform</th>
                    <th className="p-4">Followers</th>
                    <th className="p-4">Niche</th>
                    <th className="p-4">Applied Date</th>
                    <th className="p-4">Verification Status</th>
                    <th className="p-4 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {influencerApplications?.map((app) => (
                    <tr key={app.id || app._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-brand-navy text-sm">{app.name}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{app.email}</div>
                      </td>
                      <td className="p-4 font-mono font-bold text-emerald-600">
                        {app.socialHandle} <span className="text-gray-400 font-normal">({app.platform})</span>
                      </td>
                      <td className="p-4 font-extrabold text-brand-navy">{app.followerCount}</td>
                      <td className="p-4 text-gray-600">{app.niche}</td>
                      <td className="p-4 text-gray-500">{app.appliedAt || '12 Aug 2026'}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          app.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          app.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {app.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => approveInfluencerApplication(app.userId || app._id || app.id)}
                              className="px-3.5 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all shadow-md inline-flex items-center gap-1"
                            >
                              <UserCheck size={14} /> Approve & Activate
                            </button>
                            <button
                              onClick={() => rejectInfluencerApplication(app.userId || app._id || app.id, 'Criteria not met')}
                              className="px-3.5 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors inline-flex items-center gap-1"
                            >
                              <UserX size={14} /> Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-gray-400">Decision Finalized</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: PAYOUT APPROVALS (PROTECTED) */}
        {/* ========================================================================= */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Wallet size={22} className="text-emerald-600" /> Creator Payout Requests
            </h2>
            <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white uppercase font-black text-[10px]">
                  <tr>
                    <th className="p-4">Creator</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Destination / Account</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {allPayoutRequests?.map((payout) => (
                    <tr key={payout.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{payout.influencerName || 'Creator'}</td>
                      <td className="p-4 font-black text-emerald-600">₹{payout.amount?.toLocaleString()}</td>
                      <td className="p-4 font-mono text-slate-500">{payout.destination}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          payout.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {payout.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {payout.status === 'pending' && (
                          <button
                            onClick={() => adminApprovePayout(payout.id)}
                            className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: DISCOUNT ENGINE (COUPONS) */}
        {/* ========================================================================= */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">Discount Engine ({coupons.length})</h2>
              <button
                onClick={() => setShowCouponModal(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black transition-all shadow-md flex items-center gap-2"
              >
                <Plus size={16} /> Create Coupon
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                      {coupon.code}
                    </span>
                    <button
                      onClick={() => handleToggleCoupon(coupon.id)}
                      className={`p-1.5 rounded-xl text-xs font-black transition-colors ${
                        coupon.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {coupon.active ? <Power size={15} /> : <Power size={15} />}
                    </button>
                  </div>
                  <div className="text-lg font-black text-emerald-600">
                    {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} FLAT`}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    Valid till {coupon.expiry} • {coupon.usesCount || 0} / {coupon.maxUses} used
                  </div>
                  <button
                    onClick={() => handleDeleteCoupon(coupon.id)}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: USERS & ROLES */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900">User Account Management ({usersList.length})</h2>
            <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white uppercase font-black text-[10px]">
                  <tr>
                    <th className="p-4">User Name & Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4 text-right">Role Switching</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {usersList.map((u) => (
                    <tr key={u._id || u.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'influencer' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-500">{u.phone || 'N/A'}</td>
                      <td className="p-4 text-slate-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '2026'}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleUserRoleChange(u._id || u.id, u.role)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                        >
                          Switch to {u.role === 'admin' ? 'USER' : 'ADMIN'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* TRIP CREATION & EDITING WIZARD MODAL (10-STEP STRUCTURED SECTIONS) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showTripModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl relative border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {editingTripId ? 'Edit Trip Package' : 'Create New Trip Package'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Configure complete details, pricing, day-by-day itinerary, online media, and SEO.
                  </p>
                </div>
                <button
                  onClick={() => setShowTripModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {tripSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-black mb-4 flex items-center gap-2">
                  <CheckCircle2 size={16} /> {tripSuccessMsg}
                </div>
              )}

              {/* Wizard Navigation Sub-tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 border-b border-slate-100 text-xs font-black">
                {[
                  { id: 'basic', label: '1. Basic Info' },
                  { id: 'media', label: '2. Media & Images' },
                  { id: 'pricing', label: '3. Pricing & Batches' },
                  { id: 'itinerary', label: '4. Itinerary Builder' },
                  { id: 'details', label: '5. Inclusions & FAQs' },
                  { id: 'seo', label: '6. SEO & Publishing' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTripModalTab(t.id)}
                    className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                      tripModalTab === t.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSaveTrip} className="space-y-6 text-xs font-bold text-slate-700">
                {/* 1. BASIC INFO */}
                {tripModalTab === 'basic' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block uppercase mb-1">Trip Package Title *</label>
                      <input
                        type="text"
                        required
                        value={tripForm.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTripForm(prev => ({
                            ...prev,
                            title: val,
                            slug: prev.slug || val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                          }));
                        }}
                        placeholder="e.g. Meghalaya Backpacking Living Root Bridges"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block uppercase mb-1">URL Slug *</label>
                        <input
                          type="text"
                          required
                          value={tripForm.slug}
                          onChange={(e) => setTripForm({ ...tripForm, slug: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono text-xs text-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block uppercase mb-1">Destination State / Region *</label>
                        <select
                          value={tripForm.destination}
                          onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none"
                        >
                          {popularDestinationsList.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block uppercase mb-1">Exact Location *</label>
                        <input
                          type="text"
                          required
                          value={tripForm.location}
                          onChange={(e) => {
                            const loc = e.target.value;
                            const detectedWeather = travelKnowledgeService.getDestinationWeather(loc || tripForm.destination);
                            setTripForm(prev => ({
                              ...prev,
                              location: loc,
                              weather: detectedWeather
                            }));
                          }}
                          placeholder="e.g. Cherrapunji, Meghalaya"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 font-semibold"
                        />
                        {tripForm.location && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl">
                            <Sparkles size={12} className="text-emerald-600 shrink-0" />
                            <span>Auto-Detected Climate: <strong>{travelKnowledgeService.getDestinationWeather(tripForm.location)?.temp || '18°C'}</strong> ({travelKnowledgeService.getDestinationWeather(tripForm.location)?.condition || 'Clear'})</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block uppercase mb-1">Category</label>
                        <select
                          value={tripForm.category}
                          onChange={(e) => setTripForm({ ...tripForm, category: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none"
                        >
                          <option value="Backpacking">Backpacking</option>
                          <option value="Weekend Trips">Weekend Trips</option>
                          <option value="Roadtrips">Roadtrips</option>
                          <option value="Trekking">Trekking</option>
                          <option value="Luxury Escape">Luxury Escape</option>
                        </select>
                      </div>
                      <div>
                        <label className="block uppercase mb-1">Travel Mood</label>
                        <select
                          value={tripForm.mood}
                          onChange={(e) => setTripForm({ ...tripForm, mood: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none"
                        >
                          <option value="Adventure">Adventure</option>
                          <option value="Relaxed">Relaxed</option>
                          <option value="Romantic">Romantic</option>
                          <option value="Cultural">Cultural</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block uppercase mb-1">Overview / Summary</label>
                      <textarea
                        rows={3}
                        value={tripForm.overview}
                        onChange={(e) => setTripForm({ ...tripForm, overview: e.target.value })}
                        placeholder="Comprehensive trip description for travelers..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 2. MEDIA & IMAGES */}
                {tripModalTab === 'media' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block uppercase mb-1">Main Cover Image URL *</label>
                      <input
                        type="url"
                        required
                        value={tripForm.image}
                        onChange={(e) => setTripForm({ ...tripForm, image: e.target.value, heroImage: tripForm.heroImage || e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 outline-none"
                      />
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                      <Upload size={24} className="mx-auto text-emerald-600" />
                      <p className="text-xs font-bold text-slate-700">Or Upload Image via Cloudinary</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files[0])}
                        disabled={uploadingImage}
                        className="text-xs text-slate-500"
                      />
                      {uploadingImage && <p className="text-xs text-emerald-600 font-black animate-pulse">Uploading asset to cloud...</p>}
                    </div>

                    {tripForm.image && (
                      <div className="h-44 rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                        <img src={tripForm.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}

                {/* 3. PRICING & BATCHES */}
                {tripModalTab === 'pricing' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block uppercase mb-1">Base Price (₹) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={tripForm.price}
                          onChange={(e) => setTripForm({ ...tripForm, price: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block uppercase mb-1">Original Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={tripForm.originalPrice}
                          onChange={(e) => setTripForm({ ...tripForm, originalPrice: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block uppercase mb-1">Duration Text *</label>
                        <input
                          type="text"
                          required
                          value={tripForm.duration}
                          onChange={(e) => setTripForm({ ...tripForm, duration: e.target.value })}
                          placeholder="e.g. 5D/4N"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                        />
                      </div>
                    </div>

                    {/* Room Sharing Rates */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <span className="text-xs font-black uppercase text-slate-700 block">
                        Authoritative Room Sharing Rates (₹ per person)
                      </span>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Triple Sharing</label>
                          <input
                            type="number"
                            value={tripForm.sharingPricing?.tripleSharing || ''}
                            onChange={(e) => setTripForm({
                              ...tripForm,
                              sharingPricing: { ...tripForm.sharingPricing, tripleSharing: e.target.value }
                            })}
                            placeholder={tripForm.price ? `${Math.max(1000, Number(tripForm.price) - 1500)}` : 'e.g. 17000'}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Double Sharing (Base)</label>
                          <input
                            type="number"
                            value={tripForm.sharingPricing?.doubleSharing || ''}
                            onChange={(e) => setTripForm({
                              ...tripForm,
                              sharingPricing: { ...tripForm.sharingPricing, doubleSharing: e.target.value }
                            })}
                            placeholder={tripForm.price ? `${tripForm.price}` : 'e.g. 18500'}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Single Sharing</label>
                          <input
                            type="number"
                            value={tripForm.sharingPricing?.singleSharing || ''}
                            onChange={(e) => setTripForm({
                              ...tripForm,
                              sharingPricing: { ...tripForm.sharingPricing, singleSharing: e.target.value }
                            })}
                            placeholder={tripForm.price ? `${Number(tripForm.price) + 3500}` : 'e.g. 22000'}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Departure Batches Management */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-slate-700">
                          Departure Batches ({(tripForm.batches || []).length})
                        </span>
                        <button
                          type="button"
                          onClick={handleAddTripBatch}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={13} /> Add Batch
                        </button>
                      </div>

                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {(tripForm.batches || []).map((batch, bIdx) => (
                          <div key={bIdx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1">
                              <div className="sm:col-span-2">
                                <label className="block text-[9px] font-bold text-slate-500 uppercase">Dates Text</label>
                                <input
                                  type="text"
                                  value={batch.dates || ''}
                                  onChange={(e) => {
                                    const updated = [...tripForm.batches];
                                    updated[bIdx].dates = e.target.value;
                                    setTripForm({ ...tripForm, batches: updated });
                                  }}
                                  placeholder="e.g. 15 Sep - 20 Sep, 2026"
                                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase">Capacity</label>
                                <input
                                  type="number"
                                  value={batch.capacity || ''}
                                  onChange={(e) => {
                                    const updated = [...tripForm.batches];
                                    updated[bIdx].capacity = Number(e.target.value);
                                    setTripForm({ ...tripForm, batches: updated });
                                  }}
                                  placeholder="20"
                                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase">Booked</label>
                                <input
                                  type="number"
                                  value={batch.bookedSeats || 0}
                                  onChange={(e) => {
                                    const updated = [...tripForm.batches];
                                    updated[bIdx].bookedSeats = Number(e.target.value);
                                    setTripForm({ ...tripForm, batches: updated });
                                  }}
                                  placeholder="0"
                                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none"
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveTripBatch(bIdx)}
                              className="text-rose-600 hover:text-rose-700 text-xs font-bold px-2 py-1 shrink-0 self-end sm:self-center"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* 4. ITINERARY BUILDER */}
                {tripModalTab === 'itinerary' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-100 p-3 rounded-2xl border border-slate-200">
                      <div>
                        <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
                          Day-by-Day Route Schedule ({tripForm.itinerary.length} Days)
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Assign location names and attach real location photography from database.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleAutoResolveAllTripDaysMedia}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Sparkles size={13} className="text-emerald-600" /> Auto-Resolve All Photos
                        </button>
                        <button
                          type="button"
                          onClick={handleAddItineraryDay}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-colors"
                        >
                          <Plus size={13} /> Add Day
                        </button>
                      </div>
                    </div>

                    {tripForm.itinerary.map((dayItem, idx) => {
                      const coverImg = dayItem.coverMedia?.url || dayItem.image;
                      return (
                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900">Day {dayItem.day || idx + 1}</span>
                              {coverImg ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <Camera size={10} /> Photo Attached
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                  No Image
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItineraryDay(idx)}
                              className="text-rose-600 hover:text-rose-700 text-xs font-bold"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={dayItem.title || ''}
                              onChange={(e) => {
                                const updated = [...tripForm.itinerary];
                                updated[idx].title = e.target.value;
                                setTripForm({ ...tripForm, itinerary: updated });
                              }}
                              placeholder="Day Title (e.g. Double Decker Living Root Bridge Trek)"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-slate-400"
                            />
                            <div className="relative">
                              <input
                                type="text"
                                value={dayItem.locationName || ''}
                                onChange={(e) => {
                                  const updated = [...tripForm.itinerary];
                                  updated[idx].locationName = e.target.value;
                                  setTripForm({ ...tripForm, itinerary: updated });
                                }}
                                placeholder="Location / POI (e.g. Cherrapunji, Nohkalikai Falls)"
                                className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-slate-400"
                              />
                              <MapPin size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                          </div>

                          <textarea
                            rows={2}
                            value={dayItem.description || ''}
                            onChange={(e) => {
                              const updated = [...tripForm.itinerary];
                              updated[idx].description = e.target.value;
                              setTripForm({ ...tripForm, itinerary: updated });
                            }}
                            placeholder="Day activities overview..."
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-400"
                          />

                          {/* Day Cover Media Control Bar */}
                          <div className="pt-1 border-t border-slate-200">
                            {coverImg ? (
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={coverImg}
                                    alt={dayItem.title || `Day ${idx + 1}`}
                                    className="w-16 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                  <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-900 truncate max-w-xs">
                                      {dayItem.coverMedia?.altText || dayItem.locationName || 'Attached Photo'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 truncate max-w-xs font-mono">
                                      {coverImg}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTripItineraryMediaDayIdx(idx);
                                      setShowMediaLibraryModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                                  >
                                    Change
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAutoSelectTripDayMedia(idx)}
                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                    title="Auto-match using destination & location name"
                                  >
                                    <Sparkles size={11} /> Auto
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTripItineraryMediaDayIdx(idx);
                                      setUploadInitialDestination(tripForm.destination || tripForm.location || '');
                                      setUploadInitialLocation(dayItem.locationName || '');
                                      setShowUploadLocationModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                  >
                                    <Upload size={11} /> Upload
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...tripForm.itinerary];
                                      delete updated[idx].coverMedia;
                                      delete updated[idx].coverMediaAssetId;
                                      delete updated[idx].image;
                                      setTripForm({ ...tripForm, itinerary: updated });
                                    }}
                                    className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 bg-slate-100/70 border border-dashed border-slate-300 rounded-xl">
                                <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                  <Camera size={13} className="text-slate-400" /> No location photo attached for this day
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTripItineraryMediaDayIdx(idx);
                                      setShowMediaLibraryModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                                  >
                                    Choose Library
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAutoSelectTripDayMedia(idx)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                                  >
                                    <Sparkles size={11} /> Auto Match
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTripItineraryMediaDayIdx(idx);
                                      setUploadInitialDestination(tripForm.destination || tripForm.location || '');
                                      setUploadInitialLocation(dayItem.locationName || '');
                                      setShowUploadLocationModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                  >
                                    <Upload size={11} /> Upload
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 5. DETAILS & FAQS */}
                {tripModalTab === 'details' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block uppercase mb-1">Inclusions (Comma separated)</label>
                      <textarea
                        rows={3}
                        value={Array.isArray(tripForm.inclusions) ? tripForm.inclusions.join(', ') : tripForm.inclusions}
                        onChange={(e) => setTripForm({ ...tripForm, inclusions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="Trip Captain, Stays, Breakfast & Dinner, Transfers"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block uppercase mb-1">Exclusions (Comma separated)</label>
                      <textarea
                        rows={3}
                        value={Array.isArray(tripForm.exclusions) ? tripForm.exclusions.join(', ') : tripForm.exclusions}
                        onChange={(e) => setTripForm({ ...tripForm, exclusions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="Flight tickets, Personal shopping, Lunch"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 6. SEO & PUBLISHING */}
                {tripModalTab === 'seo' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block uppercase mb-1">SEO Title Tag</label>
                      <input
                        type="text"
                        value={tripForm.seo.seoTitle}
                        onChange={(e) => setTripForm({ ...tripForm, seo: { ...tripForm.seo, seoTitle: e.target.value } })}
                        placeholder={`${tripForm.title || 'Trip Package'} | WanderLuxe Expeditions`}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block uppercase mb-1">Meta Description</label>
                      <textarea
                        rows={3}
                        value={tripForm.seo.metaDescription}
                        onChange={(e) => setTripForm({ ...tripForm, seo: { ...tripForm.seo, metaDescription: e.target.value } })}
                        placeholder="Book verified group departures with WanderLuxe..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block uppercase mb-1">Indexing Directive</label>
                        <select
                          value={tripForm.seo.indexingDirective}
                          onChange={(e) => setTripForm({ ...tripForm, seo: { ...tripForm.seo, indexingDirective: e.target.value } })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                        >
                          <option value="index, follow">index, follow (Public Search)</option>
                          <option value="noindex, nofollow">noindex, nofollow (Private)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block uppercase mb-1">Publishing Status *</label>
                        <select
                          value={tripForm.status}
                          onChange={(e) => setTripForm({ ...tripForm, status: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 outline-none"
                        >
                          <option value="published">Published (Live on Public Storefront)</option>
                          <option value="draft">Draft (Admin Only)</option>
                          <option value="inactive">Inactive (Archived)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Submit Button */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowTripModal(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={tripActionLoading}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs transition-all shadow-md flex items-center gap-2"
                  >
                    {tripActionLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>{editingTripId ? 'Save Changes' : 'Publish Trip to Database'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PAGE CREATION & EDITING MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showPageModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl relative border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {editingPageId ? 'Edit Content Page' : 'Create Public Content Page'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Published pages appear at <code>/page/:slug</code>.
                  </p>
                </div>
                <button
                  onClick={() => setShowPageModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {pageSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-black mb-4 flex items-center gap-2">
                  <CheckCircle2 size={16} /> {pageSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSavePage} className="space-y-4 text-xs font-bold text-slate-700">
                <div>
                  <label className="block uppercase mb-1">Page Title *</label>
                  <input
                    type="text"
                    required
                    value={pageForm.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPageForm(prev => ({
                        ...prev,
                        title: val,
                        slug: prev.slug || val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                      }));
                    }}
                    placeholder="e.g. Ultimate Meghalaya Travel Guide 2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase mb-1">URL Slug (/page/...) *</label>
                    <input
                      type="text"
                      required
                      value={pageForm.slug}
                      onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block uppercase mb-1">Category</label>
                    <input
                      type="text"
                      value={pageForm.category}
                      onChange={(e) => setPageForm({ ...pageForm, category: e.target.value })}
                      placeholder="Travel Guide / Expedition / Stories"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block uppercase mb-1">Hero Subtitle</label>
                  <input
                    type="text"
                    value={pageForm.heroSubtitle}
                    onChange={(e) => setPageForm({ ...pageForm, heroSubtitle: e.target.value })}
                    placeholder="Brief subtitle beneath header..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase mb-1">Main Content Body</label>
                  <textarea
                    rows={4}
                    value={pageForm.content}
                    onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                    placeholder="Detailed page paragraphs..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase mb-1">Author Name</label>
                    <input
                      type="text"
                      value={pageForm.author}
                      onChange={(e) => setPageForm({ ...pageForm, author: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block uppercase mb-1">Status</label>
                    <select
                      value={pageForm.status}
                      onChange={(e) => setPageForm({ ...pageForm, status: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black text-slate-900 outline-none"
                    >
                      <option value="published">Published (Public)</option>
                      <option value="draft">Draft (Admin Only)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPageModal(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={pageActionLoading}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs transition-all shadow-md flex items-center gap-2"
                  >
                    {pageActionLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>{editingPageId ? 'Save Page' : 'Publish Page'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* CREATE COUPON MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showCouponModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-200"
            >
              <h3 className="text-lg font-black text-slate-900 mb-4">Create Discount Coupon</h3>
              <form onSubmit={handleAddCoupon} className="space-y-3 text-xs font-bold text-slate-700">
                <div>
                  <label className="block uppercase mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. MONSOON2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-black text-slate-900 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block uppercase mb-1">Type</label>
                    <select
                      value={newCoupon.type}
                      onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 outline-none"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Cash (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block uppercase mb-1">Value *</label>
                    <input
                      type="number"
                      required
                      value={newCoupon.value}
                      onChange={(e) => setNewCoupon({ ...newCoupon, value: e.target.value })}
                      placeholder="10 or 500"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCouponModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-black shadow-md"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* QUOTATION BUILDER & MULTI-TIER PROPOSAL WIZARD (PHASE 2) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showQuotationWizard && (
          <QuotationBuilderWizard
            quotationId={activeQuotationId}
            initialLead={activeQuotationLead}
            onClose={() => {
              setShowQuotationWizard(false);
              setActiveQuotationId(null);
              setActiveQuotationLead(null);
            }}
            onQuotationSaved={() => {
              fetchQuotationsList();
              fetchAllAdminData();
            }}
          />
        )}
      </AnimatePresence>

      {/* Quotation Preview Modal */}
      {previewQuotation && (
        <QuotationPreviewModal
          isOpen={Boolean(previewQuotation)}
          onClose={() => setPreviewQuotation(null)}
          quotation={previewQuotation}
          onSendQuotation={(targetQ) => {
            handleSendQuotationAction(targetQ._id || targetQ.id, targetQ.quotationNumber, targetQ.customerSnapshot?.email);
            setPreviewQuotation(null);
          }}
        />
      )}

      {/* Quotation Multi-Channel Share Modal */}
      {shareModalQuotation && (
        <ShareQuotationModal
          isOpen={Boolean(shareModalQuotation)}
          onClose={() => setShareModalQuotation(null)}
          quotation={shareModalQuotation}
          onExportPdf={() => {
            setPreviewQuotation(shareModalQuotation);
            setShareModalQuotation(null);
          }}
        />
      )}

      {/* Booking Order Details Modal */}
      {showBookingModal && (
        <BookingDetailsModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setBookingModalCode(null);
            setBookingModalQuotation(null);
          }}
          bookingCode={bookingModalCode}
          quotationData={bookingModalQuotation}
        />
      )}

      {/* Media Library Modal for Day Image Selection */}
      <MediaLibraryModal
        isOpen={showMediaLibraryModal}
        onClose={() => {
          setShowMediaLibraryModal(false);
          setTripItineraryMediaDayIdx(null);
        }}
        destinationFilter={tripForm.destination || tripForm.location || ''}
        onSelectAsset={handleSelectMediaForTripDay}
      />

      {/* Upload Location Image Modal */}
      <UploadLocationImageModal
        isOpen={showUploadLocationModal}
        onClose={() => {
          setShowUploadLocationModal(false);
          setTripItineraryMediaDayIdx(null);
        }}
        initialDestination={uploadInitialDestination || tripForm.destination || tripForm.location || ''}
        initialLocation={uploadInitialLocation || ''}
        onAssetUploaded={handleMediaUploaded}
      />

      {/* Admin Media Full Inspection Modal */}
      {adminMediaPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="relative bg-slate-900 aspect-video flex items-center justify-center">
              <img
                src={adminMediaPreview.storage?.secureUrl || adminMediaPreview.url}
                alt={adminMediaPreview.title}
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={() => setAdminMediaPreview(null)}
                className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/75 text-white rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{adminMediaPreview.title}</h3>
                  <p className="text-xs text-slate-500">{adminMediaPreview.caption || 'No caption'}</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold shrink-0">
                  {adminMediaPreview.orientation || 'Landscape'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Destination</span>
                  <span className="font-bold text-slate-800">{adminMediaPreview.destination || '—'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Locality / POI</span>
                  <span className="font-bold text-slate-800">{adminMediaPreview.poi || adminMediaPreview.locality || '—'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Resolution</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {adminMediaPreview.storage?.dimensions?.width || '—'} × {adminMediaPreview.storage?.dimensions?.height || '—'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Usage Count</span>
                  <span className="font-bold text-slate-800 font-mono">{adminMediaPreview.usage?.count || 0} times</span>
                </div>
              </div>
              {adminMediaPreview.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {adminMediaPreview.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
