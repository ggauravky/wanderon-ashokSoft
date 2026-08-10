import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, DollarSign, Tag, Users, Ticket, Plus, Copy, Check, 
  ArrowUpRight, CreditCard, Sparkles, AlertCircle, LogOut, Share2, Layers, RefreshCw, X, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const InfluencerDashboard = () => {
  const { user, logout, addInfluencerCoupon, requestPayoutWithdrawal } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [copiedCode, setCopiedCode] = useState('');

  // Coupon modal state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', discountType: 'percentage', discountValue: 15, commissionRate: 10 });

  // Withdrawal modal state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [paymentMethodDetails, setPaymentMethodDetails] = useState('8542036499@upi');
  const [payoutSuccess, setPayoutSuccess] = useState('');

  const coupons = user?.influencerCoupons || [
    { id: 'ic1', code: 'GAURAV15', discountType: 'percentage', discountValue: 15, commissionRate: 10, totalRedemptions: 14, revenueGenerated: 485000, active: true },
    { id: 'ic2', code: 'EXPLOREWITHGAURAV', discountType: 'flat', discountValue: 1000, commissionRate: 10, totalRedemptions: 6, revenueGenerated: 180000, active: true }
  ];

  const redemptions = user?.redemptionLogs || [
    { id: 'rl1', customerName: 'Rohan Verma', tripTitle: 'Meghalaya Backpacking', date: '2026-08-05', bookingAmount: 37000, commissionEarned: 3700, couponCode: 'GAURAV15' },
    { id: 'rl2', customerName: 'Priya Sharma', tripTitle: 'Spiti Valley Circuit', date: '2026-08-07', bookingAmount: 22000, commissionEarned: 2200, couponCode: 'GAURAV15' },
    { id: 'rl3', customerName: 'Vikramaditya', tripTitle: 'Bali Island Escape', date: '2026-08-08', bookingAmount: 45000, commissionEarned: 4500, couponCode: 'EXPLOREWITHGAURAV' }
  ];

  const payoutHistory = user?.payoutHistory || [
    { id: 'po1', amount: 30000, date: '2026-08-01', method: 'UPI Instant (8542036499@upi)', status: 'Approved & Paid' }
  ];

  const totalEarnings = user?.totalEarnings || 48500;
  const pendingPayout = user?.pendingPayout || 18500;
  const totalRedemptionsCount = coupons.reduce((sum, c) => sum + (c.totalRedemptions || 0), 0);
  const totalGrossRevenue = coupons.reduce((sum, c) => sum + (c.revenueGenerated || 0), 0);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(''), 3000);
  };

  const handleCreateCoupon = (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discountValue) return;

    addInfluencerCoupon(newCoupon);
    setNewCoupon({ code: '', discountType: 'percentage', discountValue: 15, commissionRate: 10 });
    setShowCouponModal(false);
  };

  const handleRequestPayout = (e) => {
    e.preventDefault();
    const amt = Number(payoutAmount);
    if (!amt || amt <= 0) return;
    if (amt > pendingPayout) {
      alert('Withdrawal amount cannot exceed your available pending payout balance.');
      return;
    }

    requestPayoutWithdrawal(amt, paymentMethodDetails);
    setPayoutSuccess(`Withdrawal request of ₹${amt.toLocaleString()} submitted for admin approval!`);
    setPayoutAmount('');
    setShowPayoutModal(false);
    setTimeout(() => setPayoutSuccess(''), 5000);
  };

  const handleInfluencerLogout = () => {
    logout();
    navigate('/influencer/login');
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
                <Sparkles size={20} className="text-brand-emerald" /> Generate Custom Promo Code
              </h2>

              <form onSubmit={handleCreateCoupon} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Coupon Code Name</label>
                  <input
                    type="text"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                    placeholder="e.g. GAURAV15 or TRAVELWITHGAURAV"
                    className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold uppercase focus:outline-none focus:border-brand-emerald"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Discount Type</label>
                    <select
                      value={newCoupon.discountType}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
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
                      value={newCoupon.discountValue}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
                      placeholder="15 or 1000"
                      className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-semibold text-emerald-900">
                  <span className="font-bold">Creator Revenue Share:</span> You earn <span className="font-extrabold text-emerald-700">10% commission</span> on gross sales generated using this coupon code!
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-brand-emerald text-white rounded-2xl font-extrabold text-sm hover:bg-brand-teal transition-all shadow-md mt-2"
                >
                  Generate & Publish Code
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payout Modal */}
      <AnimatePresence>
        {showPayoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowPayoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowPayoutModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-brand-navy">
                <X size={20} />
              </button>

              <h2 className="text-xl font-extrabold text-brand-navy mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-brand-emerald" /> Request Commission Payout
              </h2>

              <form onSubmit={handleRequestPayout} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Available Balance</label>
                  <div className="text-2xl font-extrabold text-brand-emerald">₹{pendingPayout.toLocaleString()}</div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Withdrawal Amount (₹)</label>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder={`Max ₹${pendingPayout}`}
                    max={pendingPayout}
                    className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-brand-emerald"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">UPI ID or Bank Account Details</label>
                  <input
                    type="text"
                    value={paymentMethodDetails}
                    onChange={(e) => setPaymentMethodDetails(e.target.value)}
                    placeholder="e.g. 8542036499@upi"
                    className="w-full px-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-brand-emerald"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-brand-navy text-white rounded-2xl font-extrabold text-sm hover:bg-brand-emerald transition-all shadow-md mt-2"
                >
                  Submit Payout Request
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 md:px-8">
        {payoutSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600" />
            <span>{payoutSuccess}</span>
          </div>
        )}

        {/* Header Admin Banner */}
        <div className="bg-brand-navy text-white rounded-3xl p-6 md:p-8 shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/30 text-xs font-extrabold px-3 py-1 rounded-full inline-block">
                Creator & Partner Dashboard
              </span>
              <span className="text-xs text-white/60 font-mono">
                {user?.email || 'influencer@wanderluxe.in'}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold">Influencer Revenue & Commission Control</h1>
            <p className="text-white/70 text-xs md:text-sm font-medium mt-1">
              Generate custom promo codes, track follower redemptions, and request payout withdrawals.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={() => setShowCouponModal(true)}
              className="px-5 py-3 bg-brand-emerald text-white text-xs font-extrabold rounded-2xl hover:bg-brand-teal transition-all shadow-lg flex items-center gap-2"
            >
              <Plus size={16} /> New Promo Code
            </button>
            <button
              onClick={handleInfluencerLogout}
              className="px-4 py-3 bg-white/10 text-white hover:bg-red-600 border border-white/20 transition-all text-xs font-extrabold rounded-2xl flex items-center gap-1.5"
              title="Sign Out"
            >
              <LogOut size={16} /> Exit Partner
            </button>
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
            <span className="text-xs font-bold text-gray-400 uppercase">Gross Revenue Generated</span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-brand-navy mt-1">₹{totalGrossRevenue.toLocaleString()}</h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block">
              Via your promo codes
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
            <span className="text-xs font-bold text-gray-400 uppercase">Total Earnings (10%)</span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-brand-emerald mt-1">₹{totalEarnings.toLocaleString()}</h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block">
              10% Commission Share
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
            <span className="text-xs font-bold text-gray-400 uppercase">Coupons Redeemed</span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-brand-navy mt-1">{totalRedemptionsCount}</h3>
            <span className="text-xs font-bold text-brand-emerald bg-brand-emerald/10 px-2 py-0.5 rounded mt-2 inline-block">
              Confirmed Bookings
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-gray-400 uppercase">Pending Payout</span>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="text-[11px] font-bold text-white bg-brand-emerald px-2.5 py-1 rounded-full hover:bg-brand-teal"
              >
                Withdraw
              </button>
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-amber-600 mt-1">₹{pendingPayout.toLocaleString()}</h3>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-2 inline-block">
              Ready for Payout
            </span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-3 mb-8">
          {[
            { id: 'overview', label: 'My Custom Coupons', icon: <Tag size={16} /> },
            { id: 'redemptions', label: 'Customer Redemptions Log', icon: <Ticket size={16} /> },
            { id: 'payouts', label: 'Payout History & Withdrawal', icon: <DollarSign size={16} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-3.5 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-brand-navy text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: CUSTOM COUPONS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-brand-navy">Active Creator Coupon Codes ({coupons.length})</h2>
                <p className="text-xs text-gray-500 font-medium">Share these codes with your social media followers.</p>
              </div>
              <button
                onClick={() => setShowCouponModal(true)}
                className="px-4 py-2.5 bg-brand-emerald text-white rounded-2xl text-xs font-bold hover:bg-brand-teal transition-all shadow-md flex items-center gap-2"
              >
                <Plus size={16} /> Generate Code
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {coupons.map((coupon) => {
                const affiliateLink = `https://wanderluxe.in?ref=${coupon.code}`;
                const isCopied = copiedCode === affiliateLink;
                return (
                  <div key={coupon.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/80 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Coupon Code</span>
                        <h3 className="text-2xl font-mono font-extrabold text-brand-navy">{coupon.code}</h3>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-extrabold">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                      <div className="bg-brand-light p-3 rounded-2xl border border-gray-200">
                        <span className="text-gray-400 block text-[10px] font-bold uppercase">Redemptions</span>
                        <span className="text-base font-extrabold text-brand-navy">{coupon.totalRedemptions || 0} Bookings</span>
                      </div>
                      <div className="bg-brand-light p-3 rounded-2xl border border-gray-200">
                        <span className="text-gray-400 block text-[10px] font-bold uppercase">Revenue Generated</span>
                        <span className="text-base font-extrabold text-brand-emerald">₹{(coupon.revenueGenerated || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Copyable Affiliate Link */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-extrabold uppercase text-gray-400">Shareable Affiliate Link</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={affiliateLink}
                          className="w-full px-3 py-2 bg-brand-light border border-gray-200 rounded-xl text-xs font-mono text-gray-600 focus:outline-none"
                        />
                        <button
                          onClick={() => handleCopy(affiliateLink)}
                          className="px-3 py-2 bg-brand-navy text-white rounded-xl text-xs font-bold hover:bg-brand-emerald transition-colors shrink-0 flex items-center gap-1"
                        >
                          {isCopied ? <Check size={14} /> : <Copy size={14} />} {isCopied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMER REDEMPTIONS LOG */}
        {activeTab === 'redemptions' && (
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-brand-navy">Follower Redemption History ({redemptions.length})</h2>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-navy text-white uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Trip Package</th>
                    <th className="p-4">Coupon Code</th>
                    <th className="p-4">Booking Amount</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Your Commission (10%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {redemptions.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-brand-navy">{log.customerName}</td>
                      <td className="p-4 text-gray-600">{log.tripTitle}</td>
                      <td className="p-4 font-mono font-bold text-brand-navy">{log.couponCode}</td>
                      <td className="p-4 font-bold text-gray-700">₹{log.bookingAmount.toLocaleString()}</td>
                      <td className="p-4 text-gray-500">{log.date}</td>
                      <td className="p-4 text-right font-extrabold text-brand-emerald text-sm">
                        +₹{log.commissionEarned.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PAYOUT HISTORY & WITHDRAWAL */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-brand-navy">Payout History & Withdrawals</h2>
                <p className="text-xs text-gray-500 font-medium">Request bank/UPI transfers for earned commissions.</p>
              </div>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="px-4 py-2.5 bg-brand-emerald text-white rounded-2xl text-xs font-bold hover:bg-brand-teal transition-all shadow-md flex items-center gap-2"
              >
                <DollarSign size={16} /> Request Withdrawal
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-navy text-white uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-4">Payout ID</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Payment Method / Account</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {payoutHistory.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono font-bold text-brand-navy">{po.id}</td>
                      <td className="p-4 font-extrabold text-brand-emerald text-sm">₹{po.amount.toLocaleString()}</td>
                      <td className="p-4 text-gray-500">{po.date}</td>
                      <td className="p-4 text-gray-700">{po.method}</td>
                      <td className="p-4 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          po.status.includes('Approved') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {po.status}
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

export default InfluencerDashboard;
