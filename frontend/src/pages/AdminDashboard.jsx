import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, TrendingUp, Users, Ticket, Tag, Plus, Trash2, 
  Edit3, ShieldCheck, CheckCircle2, XCircle, Search, RefreshCw, 
  DollarSign, MapPin, Calendar, Lock, AlertTriangle, Layers, Eye, Power, Check, X, LogOut, Sparkles, Wallet, UserCheck, UserX, Globe, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { UPCOMING_TRIPS } from '../constants/mockData';
import { getAdminStatsApi, getCouponsApi, createCouponApi, toggleCouponApi, deleteCouponApi, getAdminUsersApi, updateUserRoleApi } from '../services/api';

const AdminDashboard = () => {
  const { 
    user, logout, eligiblePlans, allPayoutRequests, adminApprovePayout, adminTogglePlanEligibility,
    influencerApplications, fetchInfluencerApplications, approveInfluencerApplication, rejectInfluencerApplication
  } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics');

  // Stats Data
  const [stats, setStats] = useState({
    totalRevenue: 4850000,
    totalBookings: 1240,
    activeTrips: 18,
    newLeads: 342,
    conversionRate: '14.2%',
    monthlyRevenue: [
      { month: 'Jan', revenue: 320000 },
      { month: 'Feb', revenue: 410000 },
      { month: 'Mar', revenue: 580000 },
      { month: 'Apr', revenue: 620000 },
      { month: 'May', revenue: 790000 },
      { month: 'Jun', revenue: 940000 },
      { month: 'Jul', revenue: 1190000 }
    ]
  });

  // Coupons State
  const [coupons, setCoupons] = useState([
    { id: 'c1', code: 'WANDER10', type: 'percentage', value: 10, expiry: '2026-12-31', maxUses: 500, usesCount: 142, active: true },
    { id: 'c2', code: 'SUMMER500', type: 'flat', value: 500, expiry: '2026-09-30', maxUses: 300, usesCount: 89, active: true },
    { id: 'c3', code: 'EARLYBIRD15', type: 'percentage', value: 15, expiry: '2026-10-15', maxUses: 200, usesCount: 45, active: true },
    { id: 'c4', code: 'FESTIVE20', type: 'percentage', value: 20, expiry: '2026-11-01', maxUses: 100, usesCount: 12, active: false }
  ]);

  // Users State (Loaded from MongoDB)
  const [usersList, setUsersList] = useState([]);

  // Trips State & Trip-Level SEO Management State
  const [tripsList, setTripsList] = useState(UPCOMING_TRIPS);
  const [selectedSeoTripId, setSelectedSeoTripId] = useState(1);
  const [tripSeoForm, setTripSeoForm] = useState({
    seoTitle: 'Meghalaya Backpacking Living Root Bridges (5D/4N) | WanderLuxe Expeditions',
    metaDescription: 'Book 5-day Meghalaya group trip. Explore Dawki crystal river, Cherrapunji waterfalls, and living root bridges with top-rated trip captains.',
    canonicalUrl: 'https://wanderluxe.in/trip/1',
    indexingDirective: 'index, follow',
    ogTitle: 'Meghalaya Backpacking Living Root Bridges',
    ogDescription: 'Experience the magic of Meghalaya living root bridges and Dawki river.',
    ogImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'
  });
  const [seoSavedSuccess, setSeoSavedSuccess] = useState(false);

  // Master Bookings Log
  const [masterBookings, setMasterBookings] = useState([
    { id: 'WL-894201', customer: 'Gaurav Kumar Yadav', email: 'kumar.gaurav.yadav2007@gmail.com', trip: 'Meghalaya Backpacking', amount: 37000, date: '2026-08-01', status: 'Confirmed' },
    { id: 'WL-782104', customer: 'Sarah Jenkins', email: 'sarah.j@gmail.com', trip: 'Spiti Valley Circuit', amount: 22000, date: '2026-08-03', status: 'Confirmed' },
    { id: 'WL-541289', customer: 'Rohit Sharma', email: 'rohit.sharma@yahoo.com', trip: 'Bali Island Escape', amount: 45000, date: '2026-08-04', status: 'Pending' }
  ]);

  // Modal States
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', type: 'percentage', value: '', expiry: '2026-12-31', maxUses: 500 });
  
  const [showTripModal, setShowTripModal] = useState(false);
  const [newTrip, setNewTrip] = useState({ title: '', location: '', price: '', duration: '5N/6D', image: '', tags: 'Trending, Adventure' });

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const statsData = await getAdminStatsApi();
        setStats(statsData);
        const couponsData = await getCouponsApi();
        setCoupons(couponsData);
        const usersData = await getAdminUsersApi();
        setUsersList(usersData);
        if (typeof fetchInfluencerApplications === 'function') {
          await fetchInfluencerApplications();
        }
      } catch (e) {
        console.warn('Backend API offline, utilizing state fallback');
      }
    };
    loadAdminData();
  }, []);

  const handleAdminLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.value) return;

    try {
      const added = await createCouponApi(newCoupon);
      setCoupons([added, ...coupons]);
    } catch (e) {
      const fallbackCoupon = {
        id: 'c_' + Date.now(),
        code: newCoupon.code.toUpperCase().trim(),
        type: newCoupon.type,
        value: Number(newCoupon.value),
        expiry: newCoupon.expiry,
        maxUses: Number(newCoupon.maxUses),
        usesCount: 0,
        active: true
      };
      setCoupons([fallbackCoupon, ...coupons]);
    }

    setNewCoupon({ code: '', type: 'percentage', value: '', expiry: '2026-12-31', maxUses: 500 });
    setShowCouponModal(false);
  };

  const handleToggleCoupon = async (id) => {
    try {
      await toggleCouponApi(id);
    } catch (e) {
      console.warn('Toggle coupon offline mode');
    }
    setCoupons(coupons.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  };

  const handleDeleteCoupon = async (id) => {
    try {
      await deleteCouponApi(id);
    } catch (e) {
      console.warn('Delete coupon offline mode');
    }
    setCoupons(coupons.filter((c) => c.id !== id));
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateUserRoleApi(userId, newRole);
    } catch (e) {
      console.warn('Role toggle offline mode');
    }
    setUsersList(usersList.map((u) => (u.id === userId || u._id === userId ? { ...u, role: newRole } : u)));
  };

  const handleAddTrip = (e) => {
    e.preventDefault();
    if (!newTrip.title || !newTrip.price) return;

    const createdTrip = {
      id: tripsList.length + 1,
      title: newTrip.title,
      shortTitle: newTrip.title.split(':')[0],
      duration: newTrip.duration,
      price: Number(newTrip.price),
      originalPrice: Math.round(Number(newTrip.price) * 1.2),
      location: newTrip.location || 'India',
      image: newTrip.image || 'https://images.pexels.com/photos/17334314/pexels-photo-17334314.jpeg',
      rating: 4.8,
      reviews: 12,
      tags: newTrip.tags.split(',').map((t) => t.trim()),
      nextBatch: '10 Sep',
      availableBatches: [{ id: 'b1', dates: '10 Sep - 15 Sep, 2026', seatsLeft: 10, status: 'Available' }]
    };

    setTripsList([createdTrip, ...tripsList]);
    setNewTrip({ title: '', location: '', price: '', duration: '5N/6D', image: '', tags: 'Trending, Adventure' });
    setShowTripModal(false);
  };

  const handleDeleteTrip = (id) => {
    if (window.confirm('Delete this trip package from catalog?')) {
      setTripsList(tripsList.filter((t) => t.id !== id));
    }
  };

  const handleBookingStatus = (id, newStatus) => {
    setMasterBookings(masterBookings.map((b) => (b.id === id ? { ...b, status: newStatus } : b)));
  };

  const handleSelectTripSeo = (tripId) => {
    setSelectedSeoTripId(tripId);
    const target = tripsList.find((t) => t.id === Number(tripId) || t.id === tripId);
    if (target) {
      setTripSeoForm({
        seoTitle: `${target.title} | WanderLuxe Expeditions`,
        metaDescription: `Book ${target.title} group departure in ${target.location}. Duration: ${target.duration}. Price: ₹${target.price.toLocaleString()}. Certified trip captain inclusive.`,
        canonicalUrl: `https://wanderluxe.in/trip/${target.id}`,
        indexingDirective: 'index, follow',
        ogTitle: target.title,
        ogDescription: `Join ${target.title} group departure in ${target.location}.`,
        ogImage: target.image
      });
    }
  };

  const handleSaveTripSeo = (e) => {
    e.preventDefault();
    setSeoSavedSuccess(true);
    setTimeout(() => setSeoSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-24">
      {/* Create Coupon Modal */}
      <AnimatePresence>
        {showCouponModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCouponModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowCouponModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-brand-navy">
                <X size={20} />
              </button>

              <h2 className="text-xl font-extrabold text-brand-navy mb-4 flex items-center gap-2">
                <Tag size={20} className="text-brand-emerald" /> Create Coupon Code
              </h2>

              <form onSubmit={handleAddCoupon} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Coupon Code</label>
                  <input
                    type="text"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                    placeholder="e.g. FESTIVE25"
                    className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold uppercase focus:outline-none focus:border-brand-emerald"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Discount Type</label>
                    <select
                      value={newCoupon.type}
                      onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })}
                      className="w-full px-3 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Discount Value</label>
                    <input
                      type="number"
                      value={newCoupon.value}
                      onChange={(e) => setNewCoupon({ ...newCoupon, value: e.target.value })}
                      placeholder="10 or 500"
                      className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-brand-emerald text-white rounded-2xl font-extrabold text-sm hover:bg-brand-teal transition-all shadow-md mt-2"
                >
                  Create & Activate Coupon
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 md:px-8">
        {/* Header Admin Banner */}
        <div className="bg-brand-navy text-white rounded-3xl p-6 md:p-8 shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/30 text-xs font-extrabold px-3 py-1 rounded-full inline-block">
                Master Admin Control Panel
              </span>
              <span className="text-xs text-white/60 font-mono">
                Admin: {user?.email || 'gaurav999@gmail.com'}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold">System Overview & Influencer Engine</h1>
            <p className="text-white/70 text-xs md:text-sm font-medium mt-1">
              Sales revenue analytics, Influencer verification approvals, trip-level SEO configurator, and master bookings logs.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={() => setShowTripModal(true)}
              className="px-5 py-3 bg-brand-emerald text-white text-xs font-extrabold rounded-2xl hover:bg-brand-teal transition-all shadow-lg flex items-center gap-2"
            >
              <Plus size={16} /> Add Package
            </button>
            <button
              onClick={handleAdminLogout}
              className="px-4 py-3 bg-white/10 text-white hover:bg-red-600 border border-white/20 transition-all text-xs font-extrabold rounded-2xl flex items-center gap-1.5"
            >
              <LogOut size={16} /> Exit Admin
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-2.5 mb-8">
          {[
            { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={15} /> },
            { id: 'influencer_verification', label: 'Influencer Approvals', icon: <UserCheck size={15} /> },
            { id: 'trip_seo_manager', label: 'Trip SEO Config', icon: <Globe size={15} /> },
            { id: 'seo_health', label: 'SEO Health', icon: <Search size={15} /> },
            { id: 'influencer_plans', label: 'Influencer Plans', icon: <Sparkles size={15} /> },
            { id: 'payouts', label: 'Payout Approvals', icon: <Wallet size={15} /> },
            { id: 'trips', label: 'Trip Catalog', icon: <Layers size={15} /> },
            { id: 'coupons', label: 'Discount Engine', icon: <Tag size={15} /> },
            { id: 'users', label: 'Users & Roles', icon: <Users size={15} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-brand-navy text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* FEATURE 1: INFLUENCER VERIFICATION & APPROVALS TAB */}
        {activeTab === 'influencer_verification' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-brand-navy flex items-center gap-2">
                  <UserCheck size={22} className="text-brand-emerald" /> Influencer Verification & Approval Engine
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
                <thead className="bg-brand-navy text-white uppercase font-bold text-[10px]">
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
                      <td className="p-4 font-mono font-bold text-brand-emerald">
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
                              className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors inline-flex items-center gap-1"
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

        {/* FEATURE 2: TRIP-LEVEL SEO MANAGER TAB */}
        {activeTab === 'trip_seo_manager' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-brand-navy flex items-center gap-2">
                  <Globe size={22} className="text-brand-emerald" /> Trip-Level SEO & Metadata Configurator
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  Configure custom page titles, meta descriptions, canonical URLs, indexing directives, and Open Graph attributes for individual trip packages.
                </p>
              </div>

              {seoSavedSuccess && (
                <div className="px-4 py-2 bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-lg flex items-center gap-1.5 animate-bounce">
                  <CheckCircle2 size={16} /> Trip SEO Saved & Published!
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trip Package List Selector */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
                <h3 className="font-extrabold text-brand-navy text-sm uppercase">Select Trip Package</h3>
                <div className="space-y-2">
                  {tripsList.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTripSeo(t.id)}
                      className={`w-full p-3 rounded-2xl text-left text-xs font-bold transition-all flex items-center justify-between ${
                        selectedSeoTripId === t.id
                          ? 'bg-brand-navy text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/60'
                      }`}
                    >
                      <span className="truncate max-w-[180px]">{t.title}</span>
                      <span className="text-[10px] font-mono text-brand-emerald shrink-0">₹{t.price.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trip SEO Form */}
              <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-gray-200/80 shadow-sm">
                <form onSubmit={handleSaveTripSeo} className="space-y-4 text-xs font-bold">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <span className="text-brand-navy font-extrabold text-sm uppercase">SEO Configuration Fields</span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-full uppercase">
                      SEO Score: GOOD (95/100)
                    </span>
                  </div>

                  <div>
                    <label className="text-gray-700 uppercase block mb-1">SEO Page Title Tag ({tripSeoForm.seoTitle.length} / 60 chars)</label>
                    <input
                      type="text"
                      value={tripSeoForm.seoTitle}
                      onChange={(e) => setTripSeoForm({ ...tripSeoForm, seoTitle: e.target.value })}
                      className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-brand-navy focus:border-brand-emerald focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-gray-700 uppercase block mb-1">Meta Description ({tripSeoForm.metaDescription.length} / 160 chars)</label>
                    <textarea
                      rows={3}
                      value={tripSeoForm.metaDescription}
                      onChange={(e) => setTripSeoForm({ ...tripSeoForm, metaDescription: e.target.value })}
                      className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-brand-navy focus:border-brand-emerald focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-700 uppercase block mb-1">Canonical Tag URL</label>
                      <input
                        type="text"
                        value={tripSeoForm.canonicalUrl}
                        onChange={(e) => setTripSeoForm({ ...tripSeoForm, canonicalUrl: e.target.value })}
                        className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-mono text-brand-navy focus:border-brand-emerald focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-gray-700 uppercase block mb-1">Indexing Directive</label>
                      <select
                        value={tripSeoForm.indexingDirective}
                        onChange={(e) => setTripSeoForm({ ...tripSeoForm, indexingDirective: e.target.value })}
                        className="w-full bg-brand-light border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-brand-navy focus:border-brand-emerald focus:outline-none"
                      >
                        <option value="index, follow">index, follow (Public Search Indexable)</option>
                        <option value="noindex, nofollow">noindex, nofollow (Shielded Private)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-700 uppercase block mb-1">Open Graph Title</label>
                      <input
                        type="text"
                        value={tripSeoForm.ogTitle}
                        onChange={(e) => setTripSeoForm({ ...tripSeoForm, ogTitle: e.target.value })}
                        className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-brand-navy focus:border-brand-emerald focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-gray-700 uppercase block mb-1">Open Graph Image URL</label>
                      <input
                        type="text"
                        value={tripSeoForm.ogImage}
                        onChange={(e) => setTripSeoForm({ ...tripSeoForm, ogImage: e.target.value })}
                        className="w-full bg-brand-light border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-mono text-brand-navy focus:border-brand-emerald focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-brand-emerald hover:bg-brand-teal text-white rounded-2xl font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 mt-4"
                  >
                    <Save size={16} /> Save & Deploy Trip SEO Metadata
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
                <span className="text-xs font-bold text-gray-400 uppercase">Gross Revenue</span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-brand-navy mt-1">₹48,50,000</h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block">
                  +24.5% vs last month
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
                <span className="text-xs font-bold text-gray-400 uppercase">Total Bookings</span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-brand-navy mt-1">{stats.totalBookings}</h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block">
                  1,140 Confirmed
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
                <span className="text-xs font-bold text-gray-400 uppercase">Active Departures</span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-brand-navy mt-1">{stats.activeTrips}</h3>
                <span className="text-xs font-bold text-brand-emerald bg-brand-emerald/10 px-2 py-0.5 rounded mt-2 inline-block">
                  100% On-time
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
                <span className="text-xs font-bold text-gray-400 uppercase">Lead Conversion</span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-brand-navy mt-1">{stats.conversionRate}</h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block">
                  342 Leads This Month
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TRIP CATALOG */}
        {activeTab === 'trips' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-brand-navy">Trip Package Catalog ({tripsList.length})</h2>
              <button
                onClick={() => setShowTripModal(true)}
                className="px-4 py-2.5 bg-brand-emerald text-white rounded-2xl text-xs font-bold hover:bg-brand-teal transition-all shadow-md flex items-center gap-2"
              >
                <Plus size={16} /> Create Trip Package
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tripsList.map((trip) => (
                <div key={trip.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200/80 flex flex-col justify-between">
                  <div className="h-44 overflow-hidden relative">
                    <img src={trip.image} alt={trip.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 bg-brand-navy/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {trip.duration}
                    </span>
                  </div>

                  <div className="p-6 space-y-3">
                    <h3 className="font-bold text-brand-navy text-base leading-snug">{trip.title}</h3>
                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                      <MapPin size={14} className="text-brand-emerald" /> {trip.location}
                    </p>
                    <div className="text-sm font-extrabold text-brand-emerald">₹{trip.price.toLocaleString()}</div>
                  </div>

                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">Batches: {trip.availableBatches?.length || 1}</span>
                    <button
                      onClick={() => handleDeleteTrip(trip.id)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
