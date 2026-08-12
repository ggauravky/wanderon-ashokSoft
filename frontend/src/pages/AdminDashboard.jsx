import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, TrendingUp, Users, Ticket, Tag, Plus, Trash2, 
  Edit3, ShieldCheck, CheckCircle2, XCircle, Search, RefreshCw, 
  DollarSign, MapPin, Calendar, Lock, AlertTriangle, Layers, Eye, Power, Check, X, LogOut, Sparkles, Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { UPCOMING_TRIPS } from '../constants/mockData';
import { getAdminStatsApi, getCouponsApi, createCouponApi, toggleCouponApi, deleteCouponApi, getAdminUsersApi, updateUserRoleApi } from '../services/api';

const AdminDashboard = () => {
  const { 
    user, logout, eligiblePlans, allPayoutRequests, adminApprovePayout, adminTogglePlanEligibility 
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

  // Users State
  const [usersList, setUsersList] = useState([
    { id: 'u1', name: 'Gaurav Kumar Yadav (Admin)', email: 'gaurav99@gmail.com', phone: '8542036499', role: 'admin', bookingsCount: 3, joined: '2026-08-01' },
    { id: 'u2', name: 'Gaurav Kumar Yadav (Influencer)', email: 'influencer@wanderluxe.in', phone: '8542036499', role: 'influencer', bookingsCount: 14, joined: '2026-08-02' },
    { id: 'u3', name: 'Rohit Sharma', email: 'rohit.sharma@yahoo.com', phone: '+91 8765432109', role: 'user', bookingsCount: 2, joined: '2026-08-04' }
  ]);

  // Trips State
  const [tripsList, setTripsList] = useState(UPCOMING_TRIPS);

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

  // System Settings
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const statsData = await getAdminStatsApi();
        setStats(statsData);
        const couponsData = await getCouponsApi();
        setCoupons(couponsData);
        const usersData = await getAdminUsersApi();
        setUsersList(usersData);
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={newCoupon.expiry}
                      onChange={(e) => setNewCoupon({ ...newCoupon, expiry: e.target.value })}
                      className="w-full px-3 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Max Uses Limit</label>
                    <input
                      type="number"
                      value={newCoupon.maxUses}
                      onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: e.target.value })}
                      className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold"
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

      {/* Create Trip Package Modal */}
      <AnimatePresence>
        {showTripModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowTripModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative border border-gray-100 my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowTripModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-brand-navy">
                <X size={20} />
              </button>

              <h2 className="text-xl font-extrabold text-brand-navy mb-4 flex items-center gap-2">
                <Plus size={20} className="text-brand-emerald" /> Add New Trip Package
              </h2>

              <form onSubmit={handleAddTrip} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Trip Title</label>
                  <input
                    type="text"
                    value={newTrip.title}
                    onChange={(e) => setNewTrip({ ...newTrip, title: e.target.value })}
                    placeholder="e.g. Kasol & Tosh Trek"
                    className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Location / State</label>
                    <input
                      type="text"
                      value={newTrip.location}
                      onChange={(e) => setNewTrip({ ...newTrip, location: e.target.value })}
                      placeholder="Himachal Pradesh"
                      className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={newTrip.price}
                      onChange={(e) => setNewTrip({ ...newTrip, price: e.target.value })}
                      placeholder="12500"
                      className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Duration</label>
                    <input
                      type="text"
                      value={newTrip.duration}
                      onChange={(e) => setNewTrip({ ...newTrip, duration: e.target.value })}
                      placeholder="4N/5D"
                      className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Tags (Comma Separated)</label>
                    <input
                      type="text"
                      value={newTrip.tags}
                      onChange={(e) => setNewTrip({ ...newTrip, tags: e.target.value })}
                      placeholder="Backpacking, Trekking"
                      className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Cover Image URL</label>
                  <input
                    type="text"
                    value={newTrip.image}
                    onChange={(e) => setNewTrip({ ...newTrip, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-brand-emerald text-white rounded-2xl font-extrabold text-sm hover:bg-brand-teal transition-all shadow-md mt-2"
                >
                  Publish Package to Catalog
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
                Admin: {user?.email || 'gaurav99@gmail.com'}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold">System Overview & Influencer Engine</h1>
            <p className="text-white/70 text-xs md:text-sm font-medium mt-1">
              Sales revenue analytics, Influencer plan configurator, payout approvals, and master bookings logs.
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
              title="Admin Sign Out"
            >
              <LogOut size={16} /> Exit Admin
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {[
            { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
            { id: 'seo_health', label: 'SEO Health', icon: <Search size={16} /> },
            { id: 'influencer_plans', label: 'Influencer Plans', icon: <Sparkles size={16} /> },
            { id: 'payouts', label: 'Payout Approvals', icon: <Wallet size={16} /> },
            { id: 'trips', label: 'Trip Catalog', icon: <Layers size={16} /> },
            { id: 'coupons', label: 'Discount Engine', icon: <Tag size={16} /> },
            { id: 'users', label: 'Users & Roles', icon: <Users size={16} /> },
            { id: 'bookings', label: 'Bookings Log', icon: <Ticket size={16} /> }
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

            {/* Monthly Revenue Chart */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200/80 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-brand-navy">Monthly Revenue Trend (2026)</h3>
                  <p className="text-xs text-gray-500 font-medium">Sales performance across active departures.</p>
                </div>
                <span className="text-xs font-bold text-brand-emerald bg-brand-emerald/10 px-3 py-1 rounded-full">
                  Live System Data
                </span>
              </div>

              <div className="h-64 flex items-end justify-between gap-3 pt-8 pb-4 border-b border-gray-100">
                {stats.monthlyRevenue.map((item, index) => {
                  const maxRev = 1200000;
                  const heightPct = Math.round((item.revenue / maxRev) * 100);
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <div className="text-[10px] font-bold text-brand-emerald opacity-0 group-hover:opacity-100 transition-opacity">
                        ₹{(item.revenue / 1000).toFixed(0)}k
                      </div>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-gradient-to-t from-brand-navy to-brand-emerald rounded-t-xl group-hover:from-brand-emerald group-hover:to-brand-teal transition-all duration-300"
                      />
                      <span className="text-xs font-bold text-gray-500">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INFLUENCER PLAN ELIGIBILITY CONFIGURATOR (PDF SECTION 11) */}
        {activeTab === 'influencer_plans' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-brand-navy">Influencer Plan Eligibility & Commercial Rules</h2>
              <p className="text-xs text-gray-500 font-medium">Admins control which travel plans creators can promote, along with discount % and commission rates.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-navy text-white uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-4">Plan Title</th>
                    <th className="p-4">Destination</th>
                    <th className="p-4">Base Price</th>
                    <th className="p-4">Customer Discount %</th>
                    <th className="p-4">Creator Commission %</th>
                    <th className="p-4">Eligibility Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {eligiblePlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-brand-navy">{plan.planTitle}</td>
                      <td className="p-4 text-gray-600">{plan.destination}</td>
                      <td className="p-4 font-extrabold text-brand-navy">₹{plan.basePrice.toLocaleString()}</td>
                      <td className="p-4 font-bold text-emerald-600">{plan.customerDiscountPct}% OFF</td>
                      <td className="p-4 font-bold text-brand-emerald">{plan.influencerCommissionPct}% Share</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          plan.status.includes('Active') ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {plan.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => adminTogglePlanEligibility(plan.id)}
                          className="px-3 py-1.5 bg-brand-light text-brand-navy rounded-xl text-xs font-bold hover:bg-gray-200"
                        >
                          {plan.status.includes('Active') ? 'Pause Eligibility' : 'Enable Plan'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PAYOUT APPROVALS MANAGER (PDF SECTION 10 & 11) */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-brand-navy">Influencer Payout Requests Manager</h2>
              <p className="text-xs text-gray-500 font-medium">Review and process influencer commission withdrawal requests.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-navy text-white uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-4">Request ID</th>
                    <th className="p-4">Influencer</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Destination Method</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Approval Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {allPayoutRequests.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono font-bold text-brand-navy">{po.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-brand-navy">{po.influencerName}</div>
                        <div className="text-[10px] text-gray-400">{po.influencerEmail}</div>
                      </td>
                      <td className="p-4 font-extrabold text-brand-emerald text-sm">₹{po.amount.toLocaleString()}</td>
                      <td className="p-4 text-gray-500">{po.date}</td>
                      <td className="p-4 font-mono text-gray-700">{po.method}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          po.status.includes('Paid') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {po.status !== 'Paid Out' ? (
                          <button
                            onClick={() => adminApprovePayout(po.id)}
                            className="px-3 py-1.5 bg-brand-emerald text-white rounded-xl text-xs font-extrabold hover:bg-brand-teal transition-all shadow-md"
                          >
                            Approve & Pay Out
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                            <CheckCircle2 size={14} /> Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

        {/* TAB 5: COUPONS ENGINE */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-brand-navy">Promotional Discount Engine</h2>
                <p className="text-xs text-gray-500 font-medium">Manage promotional codes active on checkout.</p>
              </div>
              <button
                onClick={() => setShowCouponModal(true)}
                className="px-4 py-2.5 bg-brand-emerald text-white rounded-2xl text-xs font-bold hover:bg-brand-teal transition-all shadow-md flex items-center gap-2"
              >
                <Plus size={16} /> Add Coupon Code
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-navy text-white uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-4">Coupon Code</th>
                    <th className="p-4">Discount</th>
                    <th className="p-4">Expiry Date</th>
                    <th className="p-4">Usage Stats</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono font-bold text-brand-navy text-sm">{coupon.code}</td>
                      <td className="p-4 font-extrabold text-brand-emerald">
                        {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                      </td>
                      <td className="p-4 text-gray-500">{coupon.expiry}</td>
                      <td className="p-4 text-gray-500">{coupon.usesCount} / {coupon.maxUses} Uses</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          coupon.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {coupon.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleCoupon(coupon.id)}
                          className="px-3 py-1 bg-brand-light text-brand-navy rounded-lg text-[11px] font-bold hover:bg-gray-200"
                        >
                          {coupon.active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: USERS & ROLES */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-brand-navy">Registered Users & Role Elevation</h2>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-navy text-white uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-4">User Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right">Role Elevation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {usersList.map((usr) => (
                    <tr key={usr.id || usr._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-brand-navy">{usr.name}</td>
                      <td className="p-4 text-gray-600">{usr.email}</td>
                      <td className="p-4 text-gray-500">{usr.phone}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          usr.role === 'admin' ? 'bg-amber-100 text-amber-800' : usr.role === 'influencer' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {usr.role || 'user'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleRole(usr.id || usr._id, usr.role)}
                          className="px-3 py-1.5 bg-brand-emerald text-white rounded-xl text-xs font-bold hover:bg-brand-teal transition-colors"
                        >
                          Toggle Role ({usr.role === 'admin' ? 'Demote' : 'Promote Admin'})
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: BOOKINGS LOG */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-brand-navy">Master System Bookings</h2>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-navy text-white uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-4">E-Ticket ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Trip Package</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Booking Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {masterBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono font-bold text-brand-navy">{b.id}</td>
                      <td className="p-4 font-bold text-gray-800">{b.customer}</td>
                      <td className="p-4 text-gray-600">{b.trip}</td>
                      <td className="p-4 font-bold text-brand-emerald">₹{b.amount.toLocaleString()}</td>
                      <td className="p-4 text-gray-500">{b.date}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          b.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                          b.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleBookingStatus(b.id, 'Confirmed')}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-bold hover:bg-emerald-100"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleBookingStatus(b.id, 'Cancelled')}
                          className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold hover:bg-red-100"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: SEO HEALTH MONITOR */}
        {activeTab === 'seo_health' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-brand-navy flex items-center gap-2">
                  <Search size={22} className="text-brand-emerald" /> SEO Health & Indexability Monitor
                </h2>
                <p className="text-xs text-gray-500 font-medium">Real-time audit of dynamic metadata, JSON-LD schemas, canonical tags, and search crawler indexability.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 size={14} /> 100% Valid JSON-LD
                </span>
                <span className="px-3 py-1 bg-brand-navy text-white text-xs font-bold rounded-full">
                  14 Public Pages Tracked
                </span>
              </div>
            </div>

            {/* SEO Summary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-xs font-bold text-gray-400 uppercase">Total Indexable Pages</div>
                <div className="text-2xl font-black text-brand-navy mt-1">14 Pages</div>
                <div className="text-[11px] text-emerald-600 font-bold mt-1">✓ Included in sitemap.xml</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-xs font-bold text-gray-400 uppercase">Healthy Pages</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">12 / 14</div>
                <div className="text-[11px] text-gray-500 font-medium mt-1">Grade: GOOD (85.7%)</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-xs font-bold text-gray-400 uppercase">Warnings / Re-Audit</div>
                <div className="text-2xl font-black text-amber-500 mt-1">2 Pages</div>
                <div className="text-[11px] text-amber-600 font-medium mt-1">Needs Alt Text / OG Image</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-xs font-bold text-gray-400 uppercase">Private Shield Status</div>
                <div className="text-2xl font-black text-brand-teal mt-1">Protected</div>
                <div className="text-[11px] text-brand-teal font-medium mt-1">/admin & /checkout noindex</div>
              </div>
            </div>

            {/* SEO Health Audit Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-navy text-white uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-4">Route / URL</th>
                    <th className="p-4">Page Title Tag</th>
                    <th className="p-4">Meta Description</th>
                    <th className="p-4">Canonical Tag</th>
                    <th className="p-4">Structured Data</th>
                    <th className="p-4">Indexability</th>
                    <th className="p-4 text-right">Health Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {[
                    { route: '/', title: 'WanderLuxe — Experiential Group Trips & Backpacking', desc: 'Book curated group trips, trekking adventures and holiday packages', canonical: 'https://wanderluxe.in/', schema: 'Organization, TravelAgency', index: 'index, follow', status: 'GOOD' },
                    { route: '/destinations', title: 'Explore Top Destinations — Backpacking & Departures', desc: 'Browse curated travel destinations across India, Asia & Europe', canonical: 'https://wanderluxe.in/destinations', schema: 'BreadcrumbList', index: 'index, follow', status: 'GOOD' },
                    { route: '/trip/1', title: 'Meghalaya Backpacking Living Root Bridges (5D/4N)', desc: 'Explore Cherrapunji, Dawki river & living root bridges', canonical: 'https://wanderluxe.in/trip/1', schema: 'Product, Offer, AggregateRating', index: 'index, follow', status: 'GOOD' },
                    { route: '/trip/2', title: 'Spiti Valley Circuit High Altitude Roadtrip (7D/6N)', desc: 'Circuit expedition through Kaza, Key Monastery & Chandratal', canonical: 'https://wanderluxe.in/trip/2', schema: 'Product, Offer, FAQPage', index: 'index, follow', status: 'GOOD' },
                    { route: '/blog', title: 'Travel Guides, Itineraries & Backpacking Tips', desc: 'Read expert travel guides, packing checklists and hidden gems', canonical: 'https://wanderluxe.in/blog', schema: 'Article', index: 'index, follow', status: 'GOOD' },
                    { route: '/creator/gaurav', title: 'Gaurav\'s Curated Trips & Exclusive Promo Discounts', desc: 'Book trips recommended by creator Gaurav with instant discount', canonical: 'https://wanderluxe.in/creator/gaurav', schema: 'ProfilePage', index: 'index, follow', status: 'GOOD' },
                    { route: '/admin', title: 'Admin Control Panel — WanderLuxe', desc: 'Internal administration dashboard', canonical: 'https://wanderluxe.in/admin', schema: 'None', index: 'noindex, nofollow', status: 'SHIELDED' },
                    { route: '/checkout', title: 'Secure Booking Checkout — WanderLuxe', desc: 'Complete trip booking and instant payment', canonical: 'https://wanderluxe.in/checkout', schema: 'None', index: 'noindex, nofollow', status: 'SHIELDED' }
                  ].map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono font-bold text-brand-navy">{item.route}</td>
                      <td className="p-4 text-gray-800 max-w-[200px] truncate" title={item.title}>{item.title}</td>
                      <td className="p-4 text-gray-600 max-w-[220px] truncate" title={item.desc}>{item.desc}</td>
                      <td className="p-4 text-gray-500 font-mono text-[11px] truncate max-w-[150px]" title={item.canonical}>{item.canonical}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">
                          {item.schema}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 font-mono text-[11px]">{item.index}</td>
                      <td className="p-4 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          item.status === 'GOOD' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'SHIELDED' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
