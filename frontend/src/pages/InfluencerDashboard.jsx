import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TrendingUp, DollarSign, Tag, Users, Ticket, Plus, Copy, Check, 
  ArrowUpRight, CreditCard, Sparkles, AlertCircle, LogOut, Share2, Layers, RefreshCw, X, ShieldCheck,
  Compass, Eye, Percent, CheckCircle2, MessageCircle, FileText, ArrowRight, Wallet, History, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SEOHead from '../components/SEOHead';

const InfluencerDashboard = () => {
  const { user, logout, eligiblePlans, generatePlanCoupon, requestPayoutWithdrawal } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('home');
  const [copiedCode, setCopiedCode] = useState('');
  const [generatedSuccess, setGeneratedSuccess] = useState('');

  // Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [paymentMethodDetails, setPaymentMethodDetails] = useState('8542036499@upi');
  const [payoutError, setPayoutError] = useState('');
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');

  const coupons = user?.influencerCoupons || [
    { id: 'ic1', code: 'GOA-KR7X9P', planId: 3, planTitle: 'Goa Sun Beach and Party Getaway', discountType: 'percentage', discountValue: 15, commissionRate: 10, totalRedemptions: 14, revenueGenerated: 485000, commissionEarned: 37000, expiryDate: '2026-12-31', active: true },
    { id: 'ic2', code: 'MEGH-X82P9A', planId: 1, planTitle: 'Meghalaya Backpacking Living Root Bridges', discountType: 'percentage', discountValue: 10, commissionRate: 10, totalRedemptions: 6, revenueGenerated: 180000, commissionEarned: 11500, expiryDate: '2026-12-31', active: true }
  ];

  const ledgerTransactions = user?.ledgerTransactions || [
    { id: 'tx1', bookingId: 'WL-849201', type: 'Commission Pending', amount: 3700, date: '2026-08-05', status: 'Pending Settlement', reference: 'Booking WL-849201 (Meghalaya)' },
    { id: 'tx2', bookingId: 'WL-729104', type: 'Commission Cleared', amount: 2200, date: '2026-08-07', status: 'Available for Payout', reference: 'Cleared Settlement WL-729104 (Spiti)' },
    { id: 'tx3', bookingId: 'PO-910293', type: 'Payout Transfer', amount: 18000, date: '2026-08-01', status: 'Paid Out', reference: 'Bank Transfer UPI (8542036499@upi)' }
  ];

  const payoutHistory = user?.payoutHistory || [
    { id: 'po1', amount: 18000, date: '2026-08-01', method: 'UPI Instant (8542036499@upi)', status: 'Approved & Paid', reference: 'TXN-918239012' }
  ];

  // Calculated Financial Balances
  const pendingBalance = user?.pendingBalance || 18500;
  const availableBalance = user?.availableBalance || 12000;
  const totalWithdrawn = user?.totalWithdrawn || 18000;
  const totalEarnings = user?.totalEarnings || 48500;
  const minThreshold = user?.minPayoutThreshold || 1000;

  const totalBookingsCount = coupons.reduce((sum, c) => sum + (c.totalRedemptions || 0), 0);
  const totalGrossRevenue = coupons.reduce((sum, c) => sum + (c.revenueGenerated || 0), 0);
  const totalCustomerSavings = Math.round(totalGrossRevenue * 0.12);
  const conversionRate = '8.4%';

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(''), 3000);
  };

  const handleGeneratePlanCoupon = (plan) => {
    const coupon = generatePlanCoupon(plan);
    setGeneratedSuccess(`Unique coupon code ${coupon.code} generated successfully for ${plan.planTitle}!`);
    setActiveTab('coupons');
    setTimeout(() => setGeneratedSuccess(''), 6000);
  };

  const handleRequestPayout = (e) => {
    e.preventDefault();
    setPayoutError('');
    setPayoutSuccessMsg('');

    try {
      const record = requestPayoutWithdrawal(payoutAmount, paymentMethodDetails);
      setPayoutSuccessMsg(`Payout request of ₹${record.amount.toLocaleString()} submitted for admin approval!`);
      setPayoutAmount('');
      setShowPayoutModal(false);
      setTimeout(() => setPayoutSuccessMsg(''), 6000);
    } catch (err) {
      setPayoutError(err.message || 'Payout request failed.');
    }
  };

  const handleInfluencerLogout = () => {
    logout();
    navigate('/influencer/login');
  };

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-24">
      <SEOHead
        title="Influencer Coupon & Wallet Control Panel | WanderLuxe"
        description="Performance-based creator dashboard for discovering travel plans, generating unique promo codes, tracking wallet ledgers, and requesting payouts."
        noindex={true}
      />

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
                <Wallet size={20} className="text-brand-emerald" /> Request Commission Payout
              </h2>

              {payoutError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-2xl">
                  {payoutError}
                </div>
              )}

              <form onSubmit={handleRequestPayout} className="space-y-4">
                <div className="bg-brand-light p-4 rounded-2xl border border-gray-200 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Cleared Available Balance</span>
                    <span className="text-2xl font-extrabold text-brand-emerald">₹{availableBalance.toLocaleString()}</span>
                  </div>
                  <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    Min ₹{minThreshold.toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Withdrawal Amount (₹)</label>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder={`e.g. ₹${availableBalance}`}
                    max={availableBalance}
                    min={minThreshold}
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
                    placeholder="e.g. 8542036499@upi or HDFC0001234 A/C 91823901"
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
        {generatedSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-extrabold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{generatedSuccess}</span>
            </div>
            <button onClick={() => setGeneratedSuccess('')} className="text-emerald-700 hover:text-emerald-950"><X size={16} /></button>
          </div>
        )}

        {payoutSuccessMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-extrabold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
              <span>{payoutSuccessMsg}</span>
            </div>
            <button onClick={() => setPayoutSuccessMsg('')} className="text-emerald-700 hover:text-emerald-950"><X size={16} /></button>
          </div>
        )}

        {/* Header Banner */}
        <div className="bg-brand-navy text-white rounded-3xl p-6 md:p-8 shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/30 text-xs font-extrabold px-3 py-1 rounded-full inline-block">
                Creator-Powered Travel Commerce System
              </span>
              <span className="text-xs text-white/60 font-mono">
                {user?.email || 'influencer@wanderluxe.in'}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold">Influencer Coupon & Wallet Engine</h1>
            <p className="text-white/70 text-xs md:text-sm font-medium mt-1">
              Select admin-approved travel plans, generate unique codes, track immutable wallet ledgers, and request cleared payouts.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <Link
              to="/creator/gaurav"
              className="px-4 py-3 bg-white/10 text-white text-xs font-extrabold rounded-2xl hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2"
            >
              <ExternalLink size={16} /> My Creator Storefront
            </Link>
            <button
              onClick={handleInfluencerLogout}
              className="px-4 py-3 bg-white/10 text-white hover:bg-red-600 border border-white/20 transition-all text-xs font-extrabold rounded-2xl flex items-center gap-1.5"
            >
              <LogOut size={16} /> Exit
            </button>
          </div>
        </div>

        {/* 6 Section Navigation Tabs (PDF Section 20 Specification) */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 border-b border-gray-200">
          {[
            { id: 'home', label: 'Dashboard Home', icon: <Compass size={16} /> },
            { id: 'discover', label: 'Discover Eligible Plans', icon: <Sparkles size={16} /> },
            { id: 'coupons', label: 'My Coupons', icon: <Tag size={16} /> },
            { id: 'wallet', label: 'Wallet & Ledger', icon: <Wallet size={16} /> },
            { id: 'payouts', label: 'Payout System', icon: <DollarSign size={16} /> },
            { id: 'analytics', label: 'Performance Analytics', icon: <TrendingUp size={16} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-brand-navy text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: DASHBOARD HOME (8 KPI CARDS) */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
                <span className="text-xs font-bold text-gray-400 uppercase">Total Bookings</span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-brand-navy mt-1">{totalBookingsCount}</h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block">
                  Successful Conversions
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
                <span className="text-xs font-bold text-gray-400 uppercase">Attributed Revenue</span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-brand-navy mt-1">₹{totalGrossRevenue.toLocaleString()}</h3>
                <span className="text-xs font-bold text-brand-emerald bg-brand-emerald/10 px-2 py-0.5 rounded mt-2 inline-block">
                  Gross Sales
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
                <span className="text-xs font-bold text-gray-400 uppercase">Active Coupons</span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-brand-navy mt-1">{coupons.length}</h3>
                <span className="text-xs font-bold text-brand-emerald bg-brand-emerald/10 px-2 py-0.5 rounded mt-2 inline-block">
                  Live Promo Codes
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
                <span className="text-xs font-bold text-gray-400 uppercase">Customer Savings</span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-brand-navy mt-1">₹{totalCustomerSavings.toLocaleString()}</h3>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-2 inline-block">
                  Discounts Issued
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
                <span className="text-xs font-bold text-gray-400 uppercase">Pending Commission</span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-amber-600 mt-1">₹{pendingBalance.toLocaleString()}</h3>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-2 inline-block">
                  Settlement Window
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-gray-400 uppercase">Available Wallet</span>
                  <button onClick={() => setShowPayoutModal(true)} className="text-[10px] font-bold text-white bg-brand-emerald px-2 py-0.5 rounded-full hover:bg-brand-teal">
                    Withdraw
                  </button>
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-brand-emerald mt-1">₹{availableBalance.toLocaleString()}</h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block">
                  Cleared for Payout
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
                <span className="text-xs font-bold text-gray-400 uppercase">Total Withdrawn</span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-brand-navy mt-1">₹{totalWithdrawn.toLocaleString()}</h3>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-2 inline-block">
                  Paid to Bank/UPI
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
                <span className="text-xs font-bold text-gray-400 uppercase">Conversion Rate</span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-brand-navy mt-1">{conversionRate}</h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block">
                  Bookings / Clicks
                </span>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-brand-navy">Promote Eligible Travel Plans</h3>
                <p className="text-xs text-gray-500">Discover admin-approved plans and generate unique promo codes.</p>
              </div>
              <button
                onClick={() => setActiveTab('discover')}
                className="px-6 py-3 bg-brand-emerald text-white text-xs font-extrabold rounded-2xl hover:bg-brand-teal transition-all shadow-md flex items-center gap-2"
              >
                <Sparkles size={16} /> Discover Eligible Plans &rarr;
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: DISCOVER ELIGIBLE PLANS (ADMIN APPROVED) */}
        {activeTab === 'discover' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-brand-navy">Admin-Approved Eligible Travel Plans ({eligiblePlans.length})</h2>
              <p className="text-xs text-gray-500 font-medium">Select a plan to generate your unique, trackable promotion coupon.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {eligiblePlans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/80 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase bg-brand-emerald/10 text-brand-emerald px-3 py-1 rounded-full">
                        {plan.destination} • {plan.duration}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {plan.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-brand-navy leading-snug">{plan.planTitle}</h3>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold py-2 bg-brand-light rounded-2xl border border-gray-200">
                      <div>
                        <span className="text-gray-400 text-[10px] block">Base Price</span>
                        <span className="text-brand-navy font-extrabold">₹{plan.basePrice.toLocaleString()}</span>
                      </div>
                      <div className="border-x border-gray-200">
                        <span className="text-gray-400 text-[10px] block">Customer Discount</span>
                        <span className="text-emerald-600 font-extrabold">{plan.customerDiscountPct}% OFF</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] block">Creator Share</span>
                        <span className="text-brand-emerald font-extrabold">{plan.influencerCommissionPct}% Commission</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-500 font-medium">{plan.terms}</p>
                  </div>

                  <button
                    onClick={() => handleGeneratePlanCoupon(plan)}
                    className="w-full py-3 bg-brand-navy text-white text-xs font-extrabold rounded-2xl hover:bg-brand-emerald transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} /> Generate Unique Coupon Code
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MY COUPONS (WITH SHARING TOOLS) */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-brand-navy">My Active Promo Coupons ({coupons.length})</h2>
                <p className="text-xs text-gray-500 font-medium">Share these codes or referral links with your audience.</p>
              </div>
              <button
                onClick={() => setActiveTab('discover')}
                className="px-4 py-2.5 bg-brand-emerald text-white rounded-2xl text-xs font-bold hover:bg-brand-teal transition-all shadow-md flex items-center gap-2"
              >
                <Plus size={16} /> Generate New Code
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {coupons.map((coupon) => {
                const referralUrl = `https://wanderluxe.in/checkout?ref=${coupon.code}`;
                const promoMessage = `Hey friends! Use my exclusive code *${coupon.code}* on WanderLuxe to get ${coupon.discountValue}% OFF on your next trip! Book here: ${referralUrl}`;
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(promoMessage)}`;
                
                const isCopiedLink = copiedCode === referralUrl;
                const isCopiedText = copiedCode === promoMessage;

                return (
                  <div key={coupon.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/80 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider block">Generated Unique Code</span>
                        <h3 className="text-2xl font-mono font-extrabold text-brand-navy">{coupon.code}</h3>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-extrabold">
                        {coupon.discountValue}% OFF • {coupon.commissionRate}% Commission
                      </span>
                    </div>

                    <p className="text-xs font-bold text-brand-navy">{coupon.planTitle}</p>

                    <div className="grid grid-cols-3 gap-2 text-xs font-medium text-center bg-brand-light p-3 rounded-2xl border border-gray-200">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Redemptions</span>
                        <span className="font-extrabold text-brand-navy">{coupon.totalRedemptions || 0}</span>
                      </div>
                      <div className="border-x border-gray-200">
                        <span className="text-gray-400 block text-[10px]">Gross Sales</span>
                        <span className="font-extrabold text-brand-emerald">₹{(coupon.revenueGenerated || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Your Earnings</span>
                        <span className="font-extrabold text-emerald-600">₹{(coupon.commissionEarned || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Sharing Actions */}
                    <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                      <label className="block text-[10px] font-extrabold uppercase text-gray-400">Referral Link & Sharing Tools</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={referralUrl}
                          className="w-full px-3 py-2 bg-brand-light border border-gray-200 rounded-xl text-[11px] font-mono text-gray-600"
                        />
                        <button
                          onClick={() => handleCopy(referralUrl, referralUrl)}
                          className="px-3 py-2 bg-brand-navy text-white rounded-xl text-xs font-bold hover:bg-brand-emerald transition-colors shrink-0 flex items-center gap-1"
                        >
                          {isCopiedLink ? <Check size={14} /> : <Copy size={14} />} {isCopiedLink ? 'Copied' : 'Copy Link'}
                        </button>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-extrabold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle size={14} /> Share WhatsApp
                        </a>
                        <button
                          onClick={() => handleCopy(promoMessage, promoMessage)}
                          className="flex-1 py-2 bg-brand-light border border-gray-200 text-brand-navy rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <FileText size={14} /> {isCopiedText ? 'Text Copied!' : 'Copy Post Text'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: WALLET & IMMUTABLE FINANCIAL LEDGER */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-brand-navy">Immutable Wallet & Financial Ledger</h2>
              <p className="text-xs text-gray-500 font-medium">Ledger-derived balances: Pending, Cleared Available, Withdrawn, and Reversals.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-[10px] font-extrabold uppercase text-gray-400">Pending Commission</span>
                <h3 className="text-2xl font-extrabold text-amber-600 mt-1">₹{pendingBalance.toLocaleString()}</h3>
                <span className="text-[10px] text-gray-500">Awaiting settlement window</span>
              </div>
              <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-[10px] font-extrabold uppercase text-gray-400">Available Balance</span>
                <h3 className="text-2xl font-extrabold text-brand-emerald mt-1">₹{availableBalance.toLocaleString()}</h3>
                <span className="text-[10px] text-emerald-600 font-bold">Cleared for payout</span>
              </div>
              <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-[10px] font-extrabold uppercase text-gray-400">Total Paid Out</span>
                <h3 className="text-2xl font-extrabold text-brand-navy mt-1">₹{totalWithdrawn.toLocaleString()}</h3>
                <span className="text-[10px] text-gray-500">Transferred to bank/UPI</span>
              </div>
              <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-[10px] font-extrabold uppercase text-gray-400">Payout Threshold</span>
                <h3 className="text-2xl font-extrabold text-gray-700 mt-1">₹{minThreshold.toLocaleString()}</h3>
                <span className="text-[10px] text-gray-500">Minimum withdrawal</span>
              </div>
            </div>

            {/* Ledger Transactions Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-brand-navy flex items-center gap-2">
                  <History size={16} className="text-brand-emerald" /> Ledger Transaction Logs
                </h3>
                <span className="text-xs text-gray-400 font-mono">Immutable Audit Trail</span>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-navy text-white uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-4">Txn ID / Ref</th>
                    <th className="p-4">Transaction Type</th>
                    <th className="p-4">Reference</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4 text-right">Ledger Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {ledgerTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono font-bold text-brand-navy">{tx.id}</td>
                      <td className="p-4 font-bold text-gray-700">{tx.type}</td>
                      <td className="p-4 text-gray-600">{tx.reference}</td>
                      <td className="p-4 text-gray-500">{tx.date}</td>
                      <td className={`p-4 font-extrabold text-sm ${tx.type.includes('Transfer') ? 'text-gray-700' : 'text-brand-emerald'}`}>
                        {tx.type.includes('Transfer') ? `-₹${tx.amount.toLocaleString()}` : `+₹${tx.amount.toLocaleString()}`}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          tx.status.includes('Available') || tx.status.includes('Paid') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PAYOUT SYSTEM */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-brand-navy">Payout System & Requests</h2>
                <p className="text-xs text-gray-500 font-medium">Minimum payout threshold: ₹{minThreshold.toLocaleString()}. Bank or UPI destinations supported.</p>
              </div>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="px-4 py-2.5 bg-brand-emerald text-white rounded-2xl text-xs font-bold hover:bg-brand-teal transition-all shadow-md flex items-center gap-2"
              >
                <DollarSign size={16} /> Request Payout
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-navy text-white uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-4">Payout ID</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Method / Destination</th>
                    <th className="p-4">Reference</th>
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
                      <td className="p-4 font-mono text-gray-500">{po.reference || 'REF-81920'}</td>
                      <td className="p-4 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          po.status.includes('Approved') || po.status.includes('Paid') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
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

        {/* TAB 6: PERFORMANCE ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-brand-navy">Influencer Performance Analytics</h2>
              <p className="text-xs text-gray-500 font-medium">Detailed conversion breakdown, average order value, and acquisition cost economics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-200 space-y-2">
                <span className="text-xs text-gray-400 font-bold uppercase">Audience Clicks / Visits</span>
                <h3 className="text-3xl font-extrabold text-brand-navy">248 Clicks</h3>
                <span className="text-xs text-emerald-600 font-bold">High engagement quality</span>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-200 space-y-2">
                <span className="text-xs text-gray-400 font-bold uppercase">Average Order Value (AOV)</span>
                <h3 className="text-3xl font-extrabold text-brand-emerald">₹33,250</h3>
                <span className="text-xs text-gray-500 font-medium">Per completed booking</span>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-200 space-y-2">
                <span className="text-xs text-gray-400 font-bold uppercase">Creator ROI</span>
                <h3 className="text-3xl font-extrabold text-emerald-600">10x Yield</h3>
                <span className="text-xs text-emerald-600 font-bold">10% commission vs gross sales</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfluencerDashboard;
