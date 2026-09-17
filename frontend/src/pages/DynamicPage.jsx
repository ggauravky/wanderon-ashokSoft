import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Compass, MapPin, Calendar, Clock, ArrowRight, Share2, 
  CheckCircle2, ChevronRight, Sparkles, BookOpen, User, ShieldCheck, AlertCircle, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import * as apiService from '../services/api.js';

const getPageBySlugApi = async (...args) => (apiService.getPageBySlugApi || apiService.default?.getPageBySlugApi)?.(...args);

const DynamicPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPageBySlugApi(slug);
        setPage(data);
        
        // Update document title and meta tags
        if (data.seo?.metaTitle || data.title) {
          document.title = `${data.seo?.metaTitle || data.title} | WanderLuxe`;
        }
      } catch (err) {
        console.warn('Page fetch notice:', err.message);
        setError(err.message || 'Page not found');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500">Loading travel story & guide...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 shadow-md">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Page Not Found</h1>
        <p className="text-sm text-slate-500 max-w-md mb-8">
          The requested page <code>/page/{slug}</code> is either in draft mode or has been relocated.
        </p>
        <div className="flex gap-3">
          <Link
            to="/destinations"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs transition-all shadow-md"
          >
            Explore Trips
          </Link>
          <Link
            to="/"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs transition-all"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-100 py-3">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Link to="/" className="hover:text-slate-800 transition-colors">Home</Link>
          <ChevronRight size={13} />
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
            {page.category || 'Travel Guide'}
          </span>
          <ChevronRight size={13} />
          <span className="text-slate-700 truncate max-w-[200px]">{page.title}</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-b from-white to-slate-50 py-12 md:py-16 border-b border-slate-100">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-extrabold">
            <Sparkles size={13} /> {page.category || 'Editorial Expedition'}
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {page.title}
          </h1>

          {page.heroSubtitle && (
            <p className="text-base md:text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              {page.heroSubtitle}
            </p>
          )}

          <div className="flex items-center justify-center gap-4 pt-2 text-xs text-slate-400 font-bold">
            <span className="flex items-center gap-1.5">
              <User size={13} className="text-slate-500" /> {page.author || 'WanderLuxe Editorial'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} /> Updated {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '2026'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="container mx-auto px-4 md:px-8 max-w-4xl py-12 space-y-12">
        {/* Intro Content */}
        {page.content && (
          <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200/80 shadow-xs">
            <p className="text-base text-slate-700 leading-relaxed font-medium whitespace-pre-line">
              {page.content}
            </p>
          </div>
        )}

        {/* Dynamic Sections */}
        {Array.isArray(page.sections) && page.sections.length > 0 && (
          <div className="space-y-8">
            {page.sections.map((sec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200/80 shadow-xs space-y-6 overflow-hidden"
              >
                {sec.heading && (
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">
                      {sec.heading}
                    </h2>
                    {sec.subheading && (
                      <p className="text-sm font-bold text-emerald-600 mt-1">
                        {sec.subheading}
                      </p>
                    )}
                  </div>
                )}

                {sec.imageUrl && (
                  <div className="rounded-2xl overflow-hidden max-h-96 shadow-xs border border-slate-100">
                    <img 
                      src={sec.imageUrl} 
                      alt={sec.imageAlt || sec.heading || page.title} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}

                {sec.body && (
                  <p className="text-sm md:text-base text-slate-600 leading-relaxed whitespace-pre-line font-medium">
                    {sec.body}
                  </p>
                )}

                {sec.ctaLabel && sec.ctaUrl && (
                  <div className="pt-2">
                    <Link
                      to={sec.ctaUrl}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs transition-all shadow-md group"
                    >
                      <span>{sec.ctaLabel}</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Global CTA Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-8 md:p-12 shadow-xl text-center space-y-4">
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider">
            Plan Your Next Getaway
          </span>
          <h3 className="text-2xl md:text-4xl font-black tracking-tight">
            Ready to Experience This Expedition Live?
          </h3>
          <p className="text-xs md:text-sm text-slate-300 max-w-xl mx-auto font-medium leading-relaxed">
            Browse our verified 2026 group departures with certified captains, handpicked boutique stays, and 0% no-cost EMI.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              to="/destinations"
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs transition-all shadow-lg flex items-center gap-2"
            >
              <Compass size={16} /> Explore All 50+ Expeditions
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-black text-xs transition-all"
            >
              Request Custom Route
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicPage;
