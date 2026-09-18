import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, User, MapPin, Calendar, CheckCircle2, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { createLeadApi } from '../services/api.js';

const CallbackForm = ({ 
  defaultDestination = '',
  title = "Plan Your Custom Journey with a Travel Specialist",
  subtitle = "Tell us where you want to go. Our mountain captains and trip concierges will curate a bespoke itinerary within 2 hours.",
  className = ""
}) => {
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    destination: defaultDestination || 'Spiti Valley',
    preferredMonth: 'Next 30 Days',
    travelers: 2,
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || ''
      }));
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (defaultDestination) {
      setFormData(prev => ({ ...prev, destination: defaultDestination }));
    }
  }, [defaultDestination]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim()) {
      setError('Please provide your name, email, and phone number.');
      return;
    }

    try {
      setLoading(true);
      await createLeadApi({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        leadType: 'trip_enquiry',
        destination: formData.destination,
        travelMonth: formData.preferredMonth,
        travelersCount: Number(formData.travelers) || 2,
        message: formData.message.trim() || `Interested in custom travel to ${formData.destination} for ${formData.travelers} travelers.`,
        source: 'website_lead_form'
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to submit callback request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-slate-900 to-[#0c1f38] text-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-800 shadow-2xl relative overflow-hidden ${className}`}>
      {/* Background Decorative Rings */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-black uppercase tracking-wider mb-3 border border-emerald-500/30">
            <Sparkles size={13} /> Dedicated Travel Concierge
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
            {title}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm font-medium mt-2 leading-relaxed">
            {subtitle}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto"
            >
              <div className="w-14 h-14 bg-emerald-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <CheckCircle2 size={30} />
              </div>
              <h3 className="text-xl font-black text-white">Callback Request Confirmed!</h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Thank you, <strong className="text-emerald-400">{formData.name}</strong>. Our senior itinerary planner will call you at <strong className="text-emerald-400">{formData.phone}</strong> shortly with verified route options and stay availability.
              </p>
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Submit Another Request
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl mx-auto">
              {error && (
                <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold text-center">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Phone Number (WhatsApp) *
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Destination */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Destination
                  </label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <select
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer appearance-none"
                    >
                      <option value="Spiti Valley">Spiti Valley</option>
                      <option value="Meghalaya">Meghalaya</option>
                      <option value="Ladakh">Ladakh</option>
                      <option value="Kashmir">Kashmir</option>
                      <option value="Bali">Bali (International)</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Himachal Pradesh">Himachal Pradesh</option>
                      <option value="Uttarakhand">Uttarakhand</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Goa">Goa</option>
                      <option value="Custom Other">Custom Other</option>
                    </select>
                  </div>
                </div>

                {/* Preferred Departure Window */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Departure Window
                  </label>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <select
                      value={formData.preferredMonth}
                      onChange={(e) => setFormData({ ...formData, preferredMonth: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer appearance-none"
                    >
                      <option value="Next 30 Days">Next 30 Days</option>
                      <option value="September 2026">September 2026</option>
                      <option value="October 2026">October 2026</option>
                      <option value="November 2026">November 2026</option>
                      <option value="December 2026 / New Year">December 2026 / New Year</option>
                      <option value="Flexible Dates">Flexible Dates</option>
                    </select>
                  </div>
                </div>

                {/* Travelers Count */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Travelers Count
                  </label>
                  <select
                    value={formData.travelers}
                    onChange={(e) => setFormData({ ...formData, travelers: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    <option value={1}>Solo Explorer (1 Person)</option>
                    <option value={2}>Couple / Duo (2 Persons)</option>
                    <option value={4}>Small Group (3–5 Persons)</option>
                    <option value={8}>Large Group (6–15 Persons)</option>
                    <option value={20}>Corporate / Community (15+)</option>
                  </select>
                </div>
              </div>

              {/* Submit CTA Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                  <span>100% Privacy • No Spam Guarantee</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Submitting Request...</span>
                  ) : (
                    <>
                      <Send size={14} /> Request Callback from Specialist
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CallbackForm;
