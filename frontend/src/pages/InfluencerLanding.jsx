import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, ShieldCheck, DollarSign, TrendingUp, Users, ArrowRight, 
  CheckCircle2, Tag, Wallet, Compass, Globe, Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';

const InfluencerLanding = () => {
  const steps = [
    {
      step: '01',
      title: 'Submit Application',
      description: 'Fill out the creator signup form with your social handle, platform, and audience details.',
      icon: <Users className="text-emerald-400" size={24} />
    },
    {
      step: '02',
      title: 'Admin Verification',
      description: 'Our team reviews your creator profile to ensure quality and authentic community alignment.',
      icon: <ShieldCheck className="text-emerald-400" size={24} />
    },
    {
      step: '03',
      title: 'Generate Custom Promo Codes',
      description: 'Create unique discount codes for eligible group departures and share custom referral URLs.',
      icon: <Tag className="text-emerald-400" size={24} />
    },
    {
      step: '04',
      title: 'Earn & Withdraw Commission',
      description: 'Earn up to 10% commission on every verified traveler booking. Withdraw via instant UPI or Bank Transfer.',
      icon: <Wallet className="text-emerald-400" size={24} />
    }
  ];

  const benefits = [
    'Exclusive 10–15% discounts for your followers and travel community',
    'Up to 10% cash commission per confirmed trip booking',
    'Real-time analytics dashboard tracking code redemptions and gross sales',
    'Immutable financial ledger tracking pending & cleared earnings',
    'Low minimum payout threshold (₹1,000) via instant UPI transfer',
    'Dedicated creator landing page URL (wanderluxe.in/creator/:username)'
  ];

  return (
    <div className="min-h-screen bg-[#0b132b] text-white pt-24 pb-24">
      <SEOHead
        title="WanderLuxe Travel Creator & Influencer Partner Program"
        description="Monetize your travel audience. Apply to become a WanderLuxe Creator Partner, earn up to 10% commission per booking with custom promo codes."
        canonical="/influencer/program"
      />

      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { name: 'Creators', path: '/creator' },
              { name: 'Partner Program', path: '/influencer/program' }
            ]}
          />
        </div>

        {/* Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-[#0b132b] border border-slate-800 p-8 md:p-16 shadow-2xl overflow-hidden mb-16">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-black text-emerald-400 uppercase tracking-wider">
              <Sparkles size={16} /> Official Creator & Influencer Program
            </div>

            <h1 className="text-3xl md:text-6xl font-black text-white leading-tight">
              Turn Your Travel Content Into <span className="text-emerald-400">Consistent Revenue</span>
            </h1>

            <p className="text-slate-300 text-sm md:text-lg leading-relaxed font-medium">
              Join the WanderLuxe Creator Network. Offer your followers verified group departure discounts while earning transparent commissions on every booked traveler.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                to="/influencer/signup"
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-extrabold text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 group"
              >
                Apply as Creator <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/influencer/login"
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-2xl font-extrabold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Lock size={16} className="text-emerald-400" /> Existing Partner Login
              </Link>
            </div>
          </div>
        </div>

        {/* 4-Step How It Works Section */}
        <div className="mb-20">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-emerald-400 text-xs font-black uppercase tracking-wider block mb-2">Step-by-Step Flow</span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white">How the Creator Program Works</h2>
            <p className="text-slate-400 text-xs md:text-sm mt-1">Admin verification ensures a secure and premium travel ecosystem.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 relative hover:border-slate-700 transition-all group">
                <div className="text-xs font-black font-mono text-emerald-400/60 mb-4">{s.step}</div>
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-700 group-hover:scale-110 transition-transform">
                  {s.icon}
                </div>
                <h3 className="text-base font-extrabold text-white mb-2">{s.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">{s.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Partner Benefits Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 mb-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-emerald-400 text-xs font-black uppercase tracking-wider block">Commercial Advantages</span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
              Why Top Travel Creators Partner with WanderLuxe
            </h2>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
              We handle end-to-end travel logistics, certified captain guidance, and customer support. You focus on authentic storytelling.
            </p>

            <div className="pt-2">
              <Link
                to="/influencer/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-emerald-500/20"
              >
                Submit Verification Application <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-slate-200">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfluencerLanding;
