import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, X, MapPin, Calendar, Users, DollarSign, Clock, 
  CheckCircle2, Compass, ArrowRight, Bookmark, Printer, Sun, 
  CloudSun, ShieldCheck, Tag, RefreshCw, Luggage, ChevronDown, ChevronUp,
  Download, Share2, AlertCircle, Sunrise, Moon, Utensils, BedDouble
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { generateAIItinerary } from '../utils/aiPlannerEngine';
import { saveAIItinerary } from '../utils/userHistory';
import { saveAIItineraryApi } from '../services/api';
import { getDestinations, getTravelStyles } from '../services/travelKnowledgeService';
import AIItineraryDocument from './AIItineraryDocument';
import ShareItineraryModal from './ShareItineraryModal';

const AIPlannerModal = ({ 
  isOpen, 
  onClose, 
  initialDestination = 'Meghalaya', 
  initialDays = 5,
  initialMood = 'Adventure'
}) => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Config, 2: Result
  const [destination, setDestination] = useState(initialDestination);
  const [days, setDays] = useState(initialDays);
  const [travelers, setTravelers] = useState(2);
  const [mood, setMood] = useState(initialMood);
  const [pace, setPace] = useState('Balanced');
  const [budgetLevel, setBudgetLevel] = useState('Moderate');
  const [customPreferences, setCustomPreferences] = useState('');

  // Generation & Stage States
  const [generating, setGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState('Analyzing regional geography & weather...');
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [genError, setGenError] = useState(null);

  // Template, Save, Share & PDF States
  const [pdfTemplate, setPdfTemplate] = useState('classic');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [openDay, setOpenDay] = useState(1);

  const docRef = useRef(null);

  if (!isOpen) return null;

  const popularDestinations = getDestinations().map(d => d.name);

  const moodOptions = getTravelStyles().map(s => ({
    label: s.label,
    value: s.query || s.label
  }));

  const paceOptions = ['Relaxed', 'Balanced', 'Packed'];
  const budgetOptions = ['Budget', 'Moderate', 'Luxury'];

  const handleGenerate = async (e) => {
    e?.preventDefault();
    setGenerating(true);
    setGenError(null);
    setGeneratedPlan(null);
    setSavedSuccess(false);

    // Staged progress milestones
    setGenerationStage('Analyzing regional geography & climate conditions...');
    const stageTimer1 = setTimeout(() => {
      setGenerationStage('Synthesizing scenic transit routes & mountain passes...');
    }, 400);
    const stageTimer2 = setTimeout(() => {
      setGenerationStage('Structuring morning, afternoon & evening activities...');
    }, 900);

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
    try {
      // 1. Sync to local storage
      saveAIItinerary(generatedPlan);

      // 2. Persist to MongoDB backend if logged in
      try {
        await saveAIItineraryApi(generatedPlan);
      } catch (apiErr) {
        console.warn('Backend save sync note:', apiErr.message);
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.warn('Save failed:', err);
    }
  };

  const handleDownloadPdf = async () => {
    if (!docRef.current || downloadingPdf) return;
    try {
      setDownloadingPdf(true);
      const canvas = await html2canvas(docRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const cleanName = (generatedPlan?.destination || destination || 'Trip').replace(/[^a-zA-Z0-9]/g, '-');
      pdf.save(`WanderLuxe-${cleanName}-${days}-Days-Itinerary.pdf`);
    } catch (e) {
      console.error('PDF export error:', e);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!docRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${generatedPlan?.title || 'Travel Itinerary'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="p-8">
          ${docRef.current.innerHTML}
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const daysList = generatedPlan?.days || generatedPlan?.itineraryDays || [];

  return (
    <>
      {/* Hidden Offscreen Printable A4 Document */}
      {generatedPlan && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <AIItineraryDocument ref={docRef} itinerary={generatedPlan} template={pdfTemplate} />
        </div>
      )}

      {/* Share Modal */}
      <ShareItineraryModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        itinerary={generatedPlan}
        onDownloadPdf={handleDownloadPdf}
      />

      <AnimatePresence>
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 border border-slate-100 max-h-[92vh] overflow-y-auto text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors z-10"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {/* ERROR NOTIFICATION */}
            {genError && (
              <div className="p-4 mb-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>{genError}</span>
              </div>
            )}

            {/* STEP 1: GUIDED PLANNING WIZARD */}
            {!generating && !generatedPlan && (
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-200">
                    <Sparkles size={14} className="text-emerald-500" /> WanderLuxe AI Travel Architect
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                    Design Your Custom Journey
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    Powered by Google Gemini and real-time regional climate intelligence. We build a geographically balanced day-by-day route with budget estimates and packing essentials.
                  </p>
                </div>

                <form onSubmit={handleGenerate} className="space-y-5">
                  {/* Destination Input & Quick Pills */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                      Destination
                    </label>
                    <div className="relative mb-2.5">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="e.g. Meghalaya, Spiti Valley, Bali, Ladakh..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {popularDestinations.map((d) => (
                        <button
                          type="button"
                          key={d}
                          onClick={() => setDestination(d)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                            destination === d
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration & Travelers */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                        Duration (Days)
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[3, 4, 5, 6, 7, 8].map((num) => (
                          <button
                            type="button"
                            key={num}
                            onClick={() => setDays(num)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                              Number(days) === num
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {num}D
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                        Travelers Count
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTravelers(Math.max(1, travelers - 1))}
                          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-slate-700 text-base"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900">
                          {travelers} {travelers === 1 ? 'Solo Traveler' : 'Travelers'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setTravelers(travelers + 1)}
                          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-slate-700 text-base"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Travel Mood & Style */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                      Travel Style & Mood
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {moodOptions.map((opt) => (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => setMood(opt.value)}
                          className={`p-2.5 rounded-2xl text-xs font-bold border transition-all text-left ${
                            mood === opt.value
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pace & Budget Level */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                        Travel Pace
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {paceOptions.map((p) => (
                          <button
                            type="button"
                            key={p}
                            onClick={() => setPace(p)}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                              pace === p
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                        Budget Tier
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {budgetOptions.map((b) => (
                          <button
                            type="button"
                            key={b}
                            onClick={() => setBudgetLevel(b)}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                              budgetLevel === b
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Special Requests / Notes (Optional) */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Special Preferences (Optional)
                    </label>
                    <input
                      type="text"
                      value={customPreferences}
                      onChange={(e) => setCustomPreferences(e.target.value)}
                      placeholder="e.g. Vegetarian food, focus on waterfall treks, relaxed mornings..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Generate CTA */}
                  <button
                    type="submit"
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 transition-all text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} /> Generate Day-by-Day Itinerary
                  </button>
                </form>
              </div>
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
            {generatedPlan && !generating && (
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

                {/* Day-by-Day Schedule Accordion */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Day-by-Day Route Itinerary
                  </h3>

                  {daysList.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden">
                      <button
                        onClick={() => setOpenDay(openDay === item.day ? null : item.day)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0">
                            D{item.day || idx + 1}
                          </span>
                          <span className="text-xs sm:text-sm font-black text-slate-900">
                            {item.title}
                          </span>
                        </div>
                        {openDay === item.day ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </button>

                      {openDay === item.day && (
                        <div className="p-4 pt-0 text-xs text-slate-600 font-medium space-y-3 border-t border-slate-200/60 mt-1">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                            {/* Morning */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase text-amber-600 flex items-center gap-1">
                                <Sunrise size={12} /> Morning
                              </span>
                              <p className="text-slate-800">{typeof item.morning === 'string' ? item.morning : item.morning?.[0]?.activity || 'Morning Sightseeing'}</p>
                            </div>

                            {/* Afternoon */}
                            <div className="space-y-1 border-l-0 md:border-l border-slate-200 md:pl-3">
                              <span className="text-[10px] font-black uppercase text-emerald-600 flex items-center gap-1">
                                <Sun size={12} /> Afternoon
                              </span>
                              <p className="text-slate-800">{typeof item.afternoon === 'string' ? item.afternoon : item.afternoon?.[0]?.activity || 'Afternoon Tour'}</p>
                            </div>

                            {/* Evening */}
                            <div className="space-y-1 border-l-0 md:border-l border-slate-200 md:pl-3">
                              <span className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1">
                                <Moon size={12} /> Evening
                              </span>
                              <p className="text-slate-800">{typeof item.evening === 'string' ? item.evening : item.evening?.[0]?.activity || 'Evening Leisure'}</p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <span className="text-slate-700"><strong>Stay:</strong> {item.stay}</span>
                            {item.dailyCost && <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Daily Est: {item.dailyCost}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Packing Essentials Checklist */}
                {generatedPlan.packingList && generatedPlan.packingList.length > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                    <span className="text-[11px] font-black uppercase text-emerald-800 flex items-center gap-1.5">
                      <Luggage size={14} /> Packing Essentials for this Route
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {generatedPlan.packingList.map((p, i) => (
                        <span key={i} className="text-[11px] font-bold bg-white text-slate-700 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                          ✓ {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matched Official Catalog Package CTA */}
                {generatedPlan.matchedCatalogTrip && (
                  <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">Available Verified Departure</span>
                      <h4 className="text-sm font-black text-white">{generatedPlan.matchedCatalogTrip.title}</h4>
                      <span className="text-xs text-slate-400">Starting from ₹{generatedPlan.matchedCatalogTrip.price?.toLocaleString()} / person</span>
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
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400">
                      PDF Document Style
                    </span>
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                      {['classic', 'visual', 'compact'].map((tpl) => (
                        <button
                          key={tpl}
                          onClick={() => setPdfTemplate(tpl)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                            pdfTemplate === tpl
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {tpl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => setGeneratedPlan(null)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white flex items-center gap-1.5"
                    >
                      <RefreshCw size={13} /> Re-plan
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Save Plan Button */}
                      <button
                        onClick={handleSavePlan}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          savedSuccess
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        <Bookmark size={13} /> {savedSuccess ? 'Saved to Profile!' : 'Save Plan'}
                      </button>

                      {/* Share Button */}
                      <button
                        onClick={() => setIsShareOpen(true)}
                        className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <Share2 size={13} /> Share
                      </button>

                      {/* Download PDF Button */}
                      <button
                        onClick={handleDownloadPdf}
                        disabled={downloadingPdf}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                      >
                        <Download size={13} /> {downloadingPdf ? 'Exporting...' : 'PDF'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </AnimatePresence>
    </>
  );
};

export default AIPlannerModal;
