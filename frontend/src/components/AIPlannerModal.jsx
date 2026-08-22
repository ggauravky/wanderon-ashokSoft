import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, X, MapPin, Calendar, Users, DollarSign, Clock, 
  CheckCircle2, Compass, ArrowRight, Bookmark, Printer, Sun, 
  CloudSun, ShieldCheck, Tag, RefreshCw, Luggage, ChevronDown, ChevronUp,
  Download, Share2, AlertCircle, Sunrise, Moon, Utensils, BedDouble,
  Eye, FileText, Check, Edit3, Wand2, LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportElementToPdf, printElementDirectly } from '../utils/pdfGenerator';
import { generateAIItinerary } from '../utils/aiPlannerEngine';
import { saveAIItinerary } from '../utils/userHistory';
import { 
  saveAIItineraryApi, 
  updateAIItineraryApi, 
  regenerateDayApi 
} from '../services/api';
import { getDestinations, getTravelStyles } from '../services/travelKnowledgeService';
import { useAuth } from '../contexts/AuthContext';
import AIItineraryDocument from './AIItineraryDocument';
import ShareItineraryModal from './ShareItineraryModal';

const AIPlannerModal = ({ 
  isOpen, 
  onClose, 
  initialDestination = 'Meghalaya', 
  initialDays = 5,
  initialMood = 'Adventure',
  initialPlan = null,
  onItinerarySaved = null
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(initialPlan ? 2 : 1); // 1: Config, 2: Result
  const [destination, setDestination] = useState(initialPlan?.destination || initialDestination);
  const [days, setDays] = useState(initialPlan?.duration || initialPlan?.daysCount || initialDays);
  const [travelers, setTravelers] = useState(initialPlan?.travelers || 2);
  const [mood, setMood] = useState(initialPlan?.travelStyle || initialPlan?.mood || initialMood);
  const [pace, setPace] = useState(initialPlan?.pace || 'Balanced');
  const [budgetLevel, setBudgetLevel] = useState(initialPlan?.budgetLevel || 'Moderate');
  const [customPreferences, setCustomPreferences] = useState('');

  // Generation & Stage States
  const [generating, setGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState('Analyzing regional geography & weather...');
  const [generatedPlan, setGeneratedPlan] = useState(initialPlan || null);
  const [genError, setGenError] = useState(null);

  // Edit / Dirty Tracking
  const [isDirty, setIsDirty] = useState(false);
  const [regeneratingDayIdx, setRegeneratingDayIdx] = useState(null);

  // Template, Save, Share & PDF States
  const [viewMode, setViewMode] = useState('interactive'); // 'interactive' | 'preview'
  const [pdfTemplate, setPdfTemplate] = useState('classic');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [savingState, setSavingState] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [openDay, setOpenDay] = useState(1);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const docRef = useRef(null);

  // Synchronize when initialPlan or isOpen changes
  useEffect(() => {
    if (isOpen) {
      if (initialPlan) {
        setGeneratedPlan(initialPlan);
        setStep(2);
        setIsDirty(false);
        setSavingState('saved');
      } else if (!generatedPlan) {
        setStep(1);
        setSavingState('idle');
      }
    }
  }, [isOpen, initialPlan]);

  if (!isOpen) return null;

  const popularDestinations = getDestinations().map(d => d.name);
  const moodOptions = getTravelStyles().map(s => ({
    label: s.label,
    value: s.query || s.label
  }));

  const paceOptions = ['Relaxed', 'Balanced', 'Packed'];
  const budgetOptions = ['Budget', 'Moderate', 'Luxury'];

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    setGenerating(true);
    setGenError(null);
    setSavingState('idle');

    setGenerationStage('Connecting to WanderLuxe Travel Intelligence...');
    const stageTimer1 = setTimeout(() => {
      setGenerationStage('Structuring daily transit & high-priority attractions...');
    }, 1200);

    const stageTimer2 = setTimeout(() => {
      setGenerationStage('Calculating cost breakdown & packing requirements...');
    }, 2400);

    try {
      const plan = await generateAIItinerary({
        destination,
        days: Number(days),
        travelers: Number(travelers),
        mood,
        pace,
        budgetLevel,
        customPreferences
      });

      setGeneratedPlan(plan);
      setStep(2);
      setIsDirty(false);
    } catch (err) {
      console.error('AI Generation Error:', err);
      setGenError('We encountered an issue synthesizing your itinerary. Please try again.');
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setGenerating(false);
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan) return;

    if (!user) {
      setAuthPromptOpen(true);
      return;
    }

    try {
      setSavingState('saving');
      
      // Persist to MongoDB backend (updates if _id exists, else inserts new)
      const res = await saveAIItineraryApi(generatedPlan);
      
      const savedDoc = res.data || res;
      if (savedDoc && (savedDoc._id || savedDoc.id)) {
        setGeneratedPlan({
          ...generatedPlan,
          _id: savedDoc._id || savedDoc.id,
          id: savedDoc._id || savedDoc.id,
          shareToken: savedDoc.shareToken || generatedPlan.shareToken
        });
      }

      // Sync local copy for offline cache
      saveAIItinerary(savedDoc);

      setSavingState('saved');
      setIsDirty(false);

      if (onItinerarySaved) {
        onItinerarySaved(savedDoc);
      }

      setTimeout(() => {
        if (!isDirty) setSavingState('saved');
      }, 2000);
    } catch (err) {
      console.warn('Save failed:', err);
      setSavingState('idle');
      alert('Could not save itinerary to your account. Please check your network connection.');
    }
  };

  // Day Level Regeneration
  const handleRegenerateDay = async (dayNum, e) => {
    if (e) e.stopPropagation();
    try {
      setRegeneratingDayIdx(dayNum);
      const res = await regenerateDayApi({
        destination: generatedPlan.destination || destination,
        dayNumber: dayNum,
        mood: generatedPlan.travelStyle || mood,
        pace: generatedPlan.pace || pace
      });

      if (res && res.title) {
        const updatedDays = [...(generatedPlan.days || [])];
        const targetIdx = updatedDays.findIndex(d => d.day === dayNum);
        if (targetIdx !== -1) {
          updatedDays[targetIdx] = res;
        } else {
          updatedDays[dayNum - 1] = res;
        }

        const updatedPlan = { ...generatedPlan, days: updatedDays };
        setGeneratedPlan(updatedPlan);
        setIsDirty(true);
        setSavingState('idle');
      }
    } catch (err) {
      console.warn('Regenerate day fallback:', err.message);
    } finally {
      setRegeneratingDayIdx(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!docRef.current || downloadingPdf) return;
    try {
      setDownloadingPdf(true);
      const cleanName = (generatedPlan?.destination || destination || 'Trip').replace(/[^a-zA-Z0-9]/g, '-');
      const filename = `WanderLuxe-${cleanName}-${days}-Days-${pdfTemplate}-Itinerary.pdf`;
      await exportElementToPdf(docRef.current, {
        filename,
        scale: 3,
        orientation: 'portrait'
      });
    } catch (e) {
      console.error('PDF export error:', e);
      alert('Failed to generate PDF document. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!docRef.current) return;
    printElementDirectly(docRef.current, generatedPlan?.title || 'WanderLuxe Travel Itinerary');
  };

  const daysList = generatedPlan?.days || generatedPlan?.itineraryDays || [];

  return (
    <>
      {/* Hidden Offscreen Printable High-Fidelity A4 Document */}
      {generatedPlan && (
        <div style={{ position: 'fixed', top: 0, left: 0, opacity: 0, pointerEvents: 'none', zIndex: -100, width: '794px', background: '#ffffff' }}>
          <AIItineraryDocument ref={docRef} itinerary={generatedPlan} template={pdfTemplate} />
        </div>
      )}

      {/* Share Modal */}
      {isShareOpen && generatedPlan && (
        <ShareItineraryModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          itinerary={generatedPlan}
          onDownloadPdf={handleDownloadPdf}
          onItineraryUpdated={(updated) => setGeneratedPlan(updated)}
        />
      )}

      {/* Auth Prompt Modal if user is not signed in when clicking Save */}
      {authPromptOpen && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <LogIn size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900">Sign in to Save Plan</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Your itinerary for <strong>{destination}</strong> is ready. Sign in to save it to your profile and access it from any device.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setAuthPromptOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Keep Exploring
              </button>
              <Link
                to="/login"
                onClick={() => setAuthPromptOpen(false)}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                Log In <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl max-w-3xl w-full my-8 p-6 sm:p-8 shadow-2xl relative border border-slate-100 max-h-[90vh] flex flex-col"
          >
            {/* Header & Tabs */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Sparkles size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">
                    WanderLuxe AI Architect
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    {step === 1 ? 'Design Your Custom Journey' : `${destination} Expedition`}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {step === 2 && (
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setViewMode('interactive')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                        viewMode === 'interactive' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles size={12} /> Interactive
                    </button>
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                        viewMode === 'preview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Eye size={12} /> PDF Preview
                    </button>
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 pr-1 pt-4 pb-2 space-y-6">
              {/* STEP 1: CONFIGURATION FORM */}
              {step === 1 && !generating && (
                <form onSubmit={handleGenerate} className="space-y-5">
                  {/* Destination */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Destination
                    </label>
                    <input
                      type="text"
                      required
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. Meghalaya, Spiti Valley, Bali, Ladakh..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {popularDestinations.slice(0, 8).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDestination(d)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            destination.toLowerCase() === d.toLowerCase()
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration & Travelers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Duration (Days)
                      </label>
                      <div className="grid grid-cols-6 gap-1.5">
                        {[3, 4, 5, 6, 7, 8].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDays(d)}
                            className={`py-2 rounded-xl text-xs font-black transition-all ${
                              Number(days) === d
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {d}D
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Travelers Count
                      </label>
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => setTravelers(Math.max(1, travelers - 1))}
                          className="w-10 h-8 rounded-lg bg-white shadow-2xs text-slate-700 font-black text-sm flex items-center justify-center hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center text-xs font-black text-slate-900">
                          {travelers} Travelers
                        </span>
                        <button
                          type="button"
                          onClick={() => setTravelers(Math.min(12, travelers + 1))}
                          className="w-10 h-8 rounded-lg bg-white shadow-2xs text-slate-700 font-black text-sm flex items-center justify-center hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Travel Style */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Travel Style & Mood
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {moodOptions.slice(0, 8).map((m) => (
                        <button
                          key={m.label}
                          type="button"
                          onClick={() => setMood(m.value)}
                          className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all truncate ${
                            mood === m.value
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pace & Budget */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Travel Pace
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {paceOptions.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPace(p)}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                              pace === p
                                ? 'bg-slate-900 border-slate-900 text-white'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Budget Tier
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {budgetOptions.map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setBudgetLevel(b)}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                              budgetLevel === b
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Special Preferences */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Special Preferences (Optional)
                    </label>
                    <input
                      type="text"
                      value={customPreferences}
                      onChange={(e) => setCustomPreferences(e.target.value)}
                      placeholder="e.g. Vegetarian meals, river treks, slow mornings..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 transition-all text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} /> Generate Day-by-Day Itinerary
                  </button>
                </form>
              )}

              {/* LOADING STATE */}
              {generating && (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto animate-spin">
                    <Compass size={36} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    Crafting Your {destination} Itinerary...
                  </h3>
                  <p className="text-xs text-emerald-700 font-bold max-w-sm mx-auto animate-pulse">
                    {generationStage}
                  </p>
                </div>
              )}

              {/* STEP 2: STRUCTURED ITINERARY RESULT VIEW */}
              {generatedPlan && !generating && viewMode === 'interactive' && (
                <div className="space-y-6">
                  {/* Plan Header */}
                  <div className="border-b border-slate-100 pb-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                      <span className="bg-emerald-500/10 text-emerald-700 text-xs font-black px-3 py-1 rounded-full uppercase border border-emerald-200">
                        {generatedPlan.duration || generatedPlan.daysCount} Days • {generatedPlan.travelStyle || generatedPlan.mood}
                      </span>
                      {generatedPlan.weather && (
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <Sun size={14} className="text-amber-500" /> {generatedPlan.weather.temp} ({generatedPlan.weather.condition})
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                      {generatedPlan.title}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {generatedPlan.tagline}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimated Budget</span>
                        <span className="text-sm font-black text-slate-900">
                          ₹{Number(generatedPlan.totalEstimatedCost || 24000).toLocaleString()} ({generatedPlan.travelers} Travelers)
                        </span>
                      </div>
                      <div className="border-l border-slate-200 pl-4">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Best Time to Visit</span>
                        <span className="text-xs font-extrabold text-emerald-700">{generatedPlan.bestTimeToVisit || 'Oct to May'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Day-by-Day Schedule Accordion with Day-Level Regeneration */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Day-by-Day Route Itinerary
                    </h3>

                    {daysList.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden">
                        <div
                          onClick={() => setOpenDay(openDay === item.day ? null : item.day)}
                          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/80 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0">
                              D{item.day || idx + 1}
                            </span>
                            <span className="text-sm font-black text-slate-900">
                              {item.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleRegenerateDay(item.day || idx + 1, e)}
                              disabled={regeneratingDayIdx === (item.day || idx + 1)}
                              className="px-2 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-600 flex items-center gap-1"
                              title="Regenerate Day Plan"
                            >
                              <RefreshCw size={11} className={regeneratingDayIdx === (item.day || idx + 1) ? 'animate-spin' : ''} />
                              <span>{regeneratingDayIdx === (item.day || idx + 1) ? 'Refreshing...' : 'Regen'}</span>
                            </button>
                            {openDay === item.day ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                          </div>
                        </div>

                        {openDay === item.day && (
                          <div className="p-4 pt-0 border-t border-slate-200/60 space-y-3 mt-1">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
                              {/* Morning */}
                              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/60 space-y-1">
                                <span className="text-[10px] font-black uppercase text-amber-800 flex items-center gap-1">
                                  <Sunrise size={12} /> Morning
                                </span>
                                {Array.isArray(item.morning) ? (
                                  item.morning.map((m, i) => (
                                    <div key={i} className="text-xs text-slate-800">
                                      <strong className="block text-slate-950 font-bold">{m.activity || m}</strong>
                                      {m.description && <span className="text-[11px] text-slate-600 block">{m.description}</span>}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-slate-700">{item.morning}</p>
                                )}
                              </div>

                              {/* Afternoon */}
                              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/60 space-y-1">
                                <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1">
                                  <Sun size={12} /> Afternoon
                                </span>
                                {Array.isArray(item.afternoon) ? (
                                  item.afternoon.map((m, i) => (
                                    <div key={i} className="text-xs text-slate-800">
                                      <strong className="block text-slate-950 font-bold">{m.activity || m}</strong>
                                      {m.description && <span className="text-[11px] text-slate-600 block">{m.description}</span>}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-slate-700">{item.afternoon}</p>
                                )}
                              </div>

                              {/* Evening */}
                              <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200/60 space-y-1">
                                <span className="text-[10px] font-black uppercase text-indigo-800 flex items-center gap-1">
                                  <Moon size={12} /> Evening
                                </span>
                                {Array.isArray(item.evening) ? (
                                  item.evening.map((m, i) => (
                                    <div key={i} className="text-xs text-slate-800">
                                      <strong className="block text-slate-950 font-bold">{m.activity || m}</strong>
                                      {m.description && <span className="text-[11px] text-slate-600 block">{m.description}</span>}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-slate-700">{item.evening}</p>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                              <span><strong>Stay:</strong> {item.stay || 'Verified Heritage Stay'}</span>
                              {Array.isArray(item.tips) && item.tips[0] && (
                                <span className="italic text-slate-500">💡 {item.tips[0]}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Matching Real Departure Callout */}
                  {generatedPlan.matchedCatalogTrip && (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Official Bookable Departure
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-1">
                          {generatedPlan.matchedCatalogTrip.title}
                        </h4>
                        <span className="text-xs text-slate-600">
                          From ₹{Number(generatedPlan.matchedCatalogTrip.price).toLocaleString()} • {generatedPlan.matchedCatalogTrip.duration}
                        </span>
                      </div>
                      <Link
                        to={`/trip/${generatedPlan.matchedCatalogTrip.id}`}
                        onClick={onClose}
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 shadow-md"
                      >
                        View Official Tour <ArrowRight size={14} />
                      </Link>
                    </div>
                  )}

                  {/* Template Selector & Action Toolbar */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase text-slate-400">
                        PDF Document Style
                      </span>
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                        {[
                          { id: 'classic', label: 'Classic' },
                          { id: 'visual', label: 'Visual' },
                          { id: 'compact', label: 'Compact' }
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setPdfTemplate(t.id)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                              pdfTemplate === t.id
                                ? 'bg-slate-900 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => {
                          setStep(1);
                          setGeneratedPlan(null);
                        }}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white flex items-center gap-1.5"
                      >
                        <RefreshCw size={13} /> Re-plan
                      </button>

                      <div className="flex items-center gap-2">
                        {/* Save / Update Button */}
                        <button
                          onClick={handleSavePlan}
                          disabled={savingState === 'saving'}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                            savingState === 'saved' && !isDirty
                              ? 'bg-emerald-600 text-white'
                              : isDirty
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          <Bookmark size={13} />
                          <span>
                            {savingState === 'saving'
                              ? 'Saving...'
                              : isDirty
                              ? 'Save Changes'
                              : savingState === 'saved'
                              ? 'Saved to Profile'
                              : 'Save Plan'}
                          </span>
                        </button>

                        {/* Share Button */}
                        <button
                          onClick={() => setIsShareOpen(true)}
                          className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
                        >
                          <Share2 size={13} /> Share
                        </button>

                        {/* Print Button */}
                        <button
                          onClick={handlePrint}
                          className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          <Printer size={13} />
                        </button>

                        {/* Download PDF Button */}
                        <button
                          onClick={handleDownloadPdf}
                          disabled={downloadingPdf}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md"
                        >
                          <Download size={13} />
                          <span>{downloadingPdf ? 'Exporting HD...' : `Download ${pdfTemplate.toUpperCase()} PDF`}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PDF LIVE PREVIEW TAB */}
              {generatedPlan && !generating && viewMode === 'preview' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-100 p-3 rounded-2xl text-xs">
                    <span className="font-bold text-slate-700">
                      Live A4 PDF Preview ({pdfTemplate.toUpperCase()} Style)
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl">
                        {['classic', 'visual', 'compact'].map((t) => (
                          <button
                            key={t}
                            onClick={() => setPdfTemplate(t)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                              pdfTemplate === t ? 'bg-slate-900 text-white' : 'text-slate-600'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleDownloadPdf}
                        disabled={downloadingPdf}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-md"
                      >
                        <Download size={13} /> Download PDF
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-200 p-4 rounded-3xl overflow-x-auto flex justify-center border border-slate-300">
                    <div className="transform scale-[0.85] origin-top bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-300">
                      <AIItineraryDocument itinerary={generatedPlan} template={pdfTemplate} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    </>
  );
};

export default AIPlannerModal;
