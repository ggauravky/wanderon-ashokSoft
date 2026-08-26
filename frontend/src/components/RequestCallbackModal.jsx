import React, { useState, useEffect } from 'react';
import { 
  X, PhoneCall, Calendar, Clock, User, Mail, Phone, 
  ShieldCheck, CheckCircle2, Sparkles, Loader2, MessageCircle, 
  HelpCircle, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { createLeadApi } from '../services/api.js';

const TIME_WINDOWS = [
  { id: 'Morning', label: 'Morning', time: '10:00 AM - 1:00 PM', icon: '🌅' },
  { id: 'Afternoon', label: 'Afternoon', time: '1:00 PM - 5:00 PM', icon: '☀️' },
  { id: 'Evening', label: 'Evening', time: '5:00 PM - 8:00 PM', icon: '🌆' },
  { id: 'Anytime', label: 'Anytime', time: 'Earliest Available', icon: '⚡' }
];

const QUICK_TOPICS = [
  'Customized Route',
  'Solo Traveler Queries',
  'Group Discount (4+ Pax)',
  '0% EMI / Partial Payment',
  'Stay & Hotel Upgrades'
];

export const generateWhatsAppWebLink = (phone, textMessage) => {
  let cleanPhone = String(phone || '').replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textMessage)}`;
};

const RequestCallbackModal = ({ isOpen, onClose, trip, selectedBatch }) => {
  const { user } = useAuth();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredDay, setPreferredDay] = useState('today'); // 'today' | 'tomorrow' | 'custom'
  const [customDate, setCustomDate] = useState('');
  const [callWindow, setCallWindow] = useState('Afternoon');
  const [travelersCount, setTravelersCount] = useState(1);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [customMessage, setCustomMessage] = useState('');

  // Status & Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedLead, setSubmittedLead] = useState(null);

  // Initialize dates
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  // Keyboard accessibility: Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Smart Prefill without mutating account
  useEffect(() => {
    if (isOpen) {
      if (user) {
        setName(user.name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
      } else {
        setName('');
        setEmail('');
        setPhone('');
      }
      setPreferredDay('today');
      setCustomDate('');
      setCallWindow('Afternoon');
      setSelectedTopics([]);
      setCustomMessage('');
      setErrorMsg('');
      setSubmittedLead(null);
    }
  }, [isOpen, user]);

  if (!isOpen || !trip) return null;

  const resolvedDate = preferredDay === 'today' 
    ? todayStr 
    : preferredDay === 'tomorrow' 
      ? tomorrowStr 
      : (customDate || tomorrowStr);

  const handleToggleTopic = (topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation
    if (!name || name.trim().length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number for the callback.');
      return;
    }

    if (preferredDay === 'custom' && !customDate) {
      setErrorMsg('Please select your preferred callback date.');
      return;
    }

    setIsSubmitting(true);

    try {
      const combinedMessage = [
        selectedTopics.length > 0 ? `Inquiry Topics: ${selectedTopics.join(', ')}` : '',
        customMessage.trim() ? `Note: ${customMessage.trim()}` : ''
      ].filter(Boolean).join('\n');

      const batchText = typeof selectedBatch === 'object' ? selectedBatch?.dates : (selectedBatch || trip.nextBatch || '');

      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanPhone.length === 10 ? `+91 ${cleanPhone}` : `+${cleanPhone}`,
        leadType: 'callback_request',
        tripId: String(trip.slug || trip.id || trip._id || ''),
        tripTitle: trip.title || 'Expedition',
        destination: trip.destination || trip.location || 'India',
        travelersCount: Number(travelersCount) || 1,
        travelMonth: trip.duration || '',
        travelDate: batchText,
        budgetPerPerson: trip.price ? `₹${trip.price.toLocaleString()}` : '',
        preferredCallDate: resolvedDate,
        preferredCallWindow: callWindow,
        message: combinedMessage,
        source: 'trip_page'
      };

      const res = await createLeadApi(payload);
      setSubmittedLead(res.lead || payload);
    } catch (err) {
      console.error('Callback request failed:', err);
      setErrorMsg(err.message || 'Unable to schedule callback. Please try again or chat via WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct WhatsApp concierge contact
  const conciergeWhatsAppNumber = '918542036499';
  const whatsappQueryText = `Hi WanderLuxe Team! 👋 I am interested in the "${trip.title}" tour (${selectedBatch?.dates || trip.nextBatch || 'Upcoming Departure'}). Could you please share the detailed itinerary PDF and cost breakup?`;
  const whatsappChatLink = generateWhatsAppWebLink(conciergeWhatsAppNumber, whatsappQueryText);

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="callback-modal-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
        />

        {/* Modal / Bottom-Sheet Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-slate-200/80 max-w-xl w-full overflow-hidden z-10 max-h-[92vh] sm:my-8 flex flex-col"
        >
          {/* Mobile Drag Indicator Handle */}
          <div className="sm:hidden w-full pt-2.5 pb-1 flex justify-center bg-slate-900">
            <div className="w-10 h-1 bg-white/30 rounded-full" />
          </div>

          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 sm:p-6 relative overflow-hidden shrink-0">
            <div className="absolute right-0 top-0 translate-x-10 -translate-y-6 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                  <PhoneCall size={10} /> Certified Destination Expert
                </span>
                <h3 id="callback-modal-title" className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Talk to a Travel Expert
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  Schedule a personalized consultation with zero booking obligation.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-colors shrink-0 ml-2 cursor-pointer"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Trip Thumbnail Card Snapshot (Read-Only) */}
            <div className="mt-3.5 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center gap-3">
              <img
                src={trip.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300'}
                alt={trip.title}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0 border border-white/20"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                  <MapPin size={11} /> {trip.location || trip.destination || 'India'} • {trip.duration || '5D/4N'}
                </div>
                <h4 className="text-xs font-black text-white truncate" title={trip.title}>
                  {trip.title}
                </h4>
                <div className="text-[10px] text-slate-300 font-semibold mt-0.5">
                  Starting at <span className="text-white font-extrabold">₹{Number(trip.price || 18500).toLocaleString()}</span>
                  {(selectedBatch?.dates || trip.nextBatch) && (
                    <span className="ml-2 text-emerald-200">
                      • Batch: {selectedBatch?.dates || trip.nextBatch}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-1">
            {submittedLead ? (
              /* Success Confirmation View */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 sm:py-6 space-y-4"
              >
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={36} />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Request Received
                  </span>
                  <h4 className="text-xl font-black text-slate-900">
                    We've Received Your Call Request!
                  </h4>
                  <p className="text-xs text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
                    Thank you, <span className="font-black text-slate-900">{name}</span>. Our certified travel specialist for <span className="font-bold text-emerald-700">{trip.title}</span> will follow up directly at <span className="font-mono font-bold text-slate-900">{phone}</span>.
                  </p>
                </div>

                {/* Scheduled Call Snapshot Details */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Target Date:</span>
                    <span className="font-black text-slate-900">{resolvedDate}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Preferred Window:</span>
                    <span className="font-black text-emerald-700">{callWindow} ({TIME_WINDOWS.find(w => w.id === callWindow)?.time})</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Expedition:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[220px]">{trip.title}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Reference ID:</span>
                    <span className="font-mono font-bold text-slate-500">{submittedLead._id || 'REQ-' + Math.floor(100000 + Math.random() * 900000)}</span>
                  </div>
                </div>

                <div className="pt-2 space-y-2.5">
                  <a
                    href={whatsappChatLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <MessageCircle size={16} /> Chat on WhatsApp Instantly Instead
                  </a>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
                  >
                    Done & Return to Itinerary
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Request Form View */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Auth status banner */}
                {user ? (
                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl px-3.5 py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                      <span>Logged in as {user.name}</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-black uppercase">Auto-filled</span>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-[11px] text-slate-600 font-medium flex items-center gap-2">
                    <HelpCircle size={14} className="text-slate-400 shrink-0" />
                    <span>No account required. Enter your details below to schedule a callback.</span>
                  </div>
                )}

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center gap-2">
                    <X size={14} className="shrink-0" /> {errorMsg}
                  </div>
                )}

                {/* Contact Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cb-fullname" className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                      Your Full Name *
                    </label>
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        id="cb-fullname"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cb-phone" className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                      Contact Phone (+91) *
                    </label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        id="cb-phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="cb-email" className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        id="cb-email"
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. rahul@example.com"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Day Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Preferred Callback Date *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreferredDay('today')}
                      className={`py-2 px-3 rounded-2xl text-xs font-black transition-all border cursor-pointer ${
                        preferredDay === 'today'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredDay('tomorrow')}
                      className={`py-2 px-3 rounded-2xl text-xs font-black transition-all border cursor-pointer ${
                        preferredDay === 'tomorrow'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredDay('custom')}
                      className={`py-2 px-3 rounded-2xl text-xs font-black transition-all border cursor-pointer ${
                        preferredDay === 'custom'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Pick Date
                    </button>
                  </div>

                  {preferredDay === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-1.5"
                    >
                      <input
                        type="date"
                        min={todayStr}
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Preferred Time Window Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Preferred Time Window *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_WINDOWS.map((win) => (
                      <button
                        type="button"
                        key={win.id}
                        onClick={() => setCallWindow(win.id)}
                        className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer text-left flex items-center justify-between ${
                          callWindow === win.id
                            ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-xs font-black text-slate-900">
                            <span>{win.icon}</span>
                            <span>{win.label}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold">
                            {win.time}
                          </div>
                        </div>

                        {callWindow === win.id && (
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0 ml-1" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Topics & Custom Note */}
                <div className="space-y-1.5">
                  <label htmlFor="cb-message" className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Anything you'd like us to know? (Optional)
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {QUICK_TOPICS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => handleToggleTopic(topic)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                          selectedTopics.includes(topic)
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>

                  <textarea
                    id="cb-message"
                    rows={2}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Specific questions about dates, pickups, dietary needs, or physical fitness..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:bg-white resize-none"
                  />
                </div>

                {/* Submission CTA */}
                <div className="pt-2 space-y-2.5">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 sm:py-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] disabled:bg-slate-400 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Scheduling Call Request...</span>
                      </>
                    ) : (
                      <>
                        <PhoneCall size={16} className="text-emerald-400" />
                        <span>Request a Call</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-slate-400 text-center font-medium">
                    🔒 Zero spam guarantee. Our specialist will only call during your selected window.
                  </p>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="flex-shrink mx-3 text-[10px] font-black uppercase tracking-wider text-slate-400">or</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                  </div>

                  <a
                    href={whatsappChatLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageCircle size={15} className="text-emerald-600" />
                    <span>Need instant answers? Chat on WhatsApp now</span>
                  </a>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RequestCallbackModal;
