import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, X, MapPin, Calendar, Users, DollarSign, Clock, 
  CheckCircle2, Compass, ArrowRight, Bookmark, Printer, Sun, 
  CloudSun, ShieldCheck, Tag, RefreshCw, Luggage, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateAIItinerary } from '../utils/aiPlannerEngine';
import { saveAIItinerary } from '../utils/userHistory';

const AIPlannerModal = ({ isOpen, onClose, initialDestination = 'Meghalaya', initialDays = 5 }) => {
  const navigate = useNavigate();

  const [destination, setDestination] = useState(initialDestination);
  const [days, setDays] = useState(initialDays);
  const [travelers, setTravelers] = useState(2);
  const [mood, setMood] = useState('Adventure');
  const [budgetLevel, setBudgetLevel] = useState('Moderate');
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [openDay, setOpenDay] = useState(1);

  if (!isOpen) return null;

  const popularDestinations = [
    'Meghalaya', 'Spiti Valley', 'Bali', 'Kerala', 'Kashmir', 'Goa', 'Ladakh'
  ];

  const moodOptions = [
    { label: 'Adventure & Treks', value: 'Adventure' },
    { label: 'Backpacking & Culture', value: 'Backpacking' },
    { label: 'Nature & Waterfalls', value: 'Nature' },
    { label: 'Relaxation & Stays', value: 'Relaxation' }
  ];

  const handleGenerate = async (e) => {
    e?.preventDefault();
    setGenerating(true);
    setGeneratedPlan(null);
    setSavedSuccess(false);

    try {
      const plan = await generateAIItinerary({
        destination,
        days: Number(days),
        travelers: Number(travelers),
        mood,
        budgetLevel
      });
      setGeneratedPlan(plan);
    } catch (err) {
      console.error('AI Generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePlan = () => {
    if (generatedPlan) {
      saveAIItinerary(generatedPlan);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
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
          >
            <X size={20} />
          </button>

          {!generatedPlan && !generating && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-200">
                  <Sparkles size={14} className="text-emerald-500" /> AI Itinerary Architect
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  Design Your Perfect Custom Adventure
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Tell our travel intelligence where you want to go. We'll build a day-by-day timeline with budget estimates and packing essentials.
                </p>
              </div>

              {/* Form Controls */}
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
                      placeholder="e.g. Meghalaya, Spiti Valley, Bali"
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
                      {[3, 4, 5, 6, 7].map((num) => (
                        <button
                          type="button"
                          key={num}
                          onClick={() => setDays(num)}
                          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                            days === num
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
                      Group Size
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 6].map((num) => (
                        <button
                          type="button"
                          key={num}
                          onClick={() => setTravelers(num)}
                          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                            travelers === num
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {num === 1 ? 'Solo' : `${num}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mood & Travel Style */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    Travel Style & Mood
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {moodOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setMood(opt.value)}
                        className={`p-2.5 rounded-2xl text-xs font-bold text-center border transition-all ${
                          mood === opt.value
                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget Preference */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    Budget Tier
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Budget', 'Moderate', 'Luxury'].map((b) => (
                      <button
                        type="button"
                        key={b}
                        onClick={() => setBudgetLevel(b)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          budgetLevel === b
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 transition-all text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} /> Generate Day-by-Day Itinerary
                </button>
              </form>
            </div>
          )}

          {/* Loading Animation State */}
          {generating && (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto animate-spin">
                <Compass size={36} />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Crafting Your {destination} Itinerary...
              </h3>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                Analyzing mountain passes, waterfall pools, local stays, and climate conditions for optimal routing.
              </p>
            </div>
          )}

          {/* Generated Plan View */}
          {generatedPlan && !generating && (
            <div className="space-y-6">
              {/* Plan Header */}
              <div className="border-b border-slate-100 pb-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <span className="bg-emerald-500/10 text-emerald-700 text-xs font-black px-3 py-1 rounded-full uppercase border border-emerald-200">
                    {generatedPlan.daysCount} Days • {generatedPlan.mood}
                  </span>
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Sun size={14} className="text-amber-500" /> {generatedPlan.weather?.temp} ({generatedPlan.weather?.condition})
                  </span>
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
                      ₹{generatedPlan.totalEstimatedCost.toLocaleString()} ({generatedPlan.travelers} Travelers)
                    </span>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Best Time to Visit</span>
                    <span className="text-xs font-extrabold text-emerald-700">{generatedPlan.bestTimeToVisit}</span>
                  </div>
                </div>
              </div>

              {/* Day by Day Itinerary */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                  Day-by-Day Schedule
                </h3>

                <div className="space-y-3">
                  {generatedPlan.itineraryDays.map((item) => (
                    <div key={item.day} className="bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden">
                      <button
                        onClick={() => setOpenDay(openDay === item.day ? null : item.day)}
                        className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0">
                            D{item.day}
                          </span>
                          <span className="text-xs sm:text-sm font-black text-slate-900">
                            {item.title}
                          </span>
                        </div>
                        {openDay === item.day ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </button>

                      {openDay === item.day && (
                        <div className="p-4 pt-0 text-xs text-slate-600 font-medium space-y-2.5 border-t border-slate-200/60 mt-1">
                          <div className="space-y-1.5 pt-2">
                            <p><strong className="text-slate-900">Morning:</strong> {item.morning}</p>
                            <p><strong className="text-slate-900">Afternoon:</strong> {item.afternoon}</p>
                            <p><strong className="text-slate-900">Evening:</strong> {item.evening}</p>
                          </div>

                          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <span className="text-slate-700"><strong>Stay:</strong> {item.stay}</span>
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Daily Est: {item.dailyCost}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Packing Essentials Checklist */}
              {generatedPlan.packingList && (
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
                    <span className="text-xs text-slate-400">Starting from ₹{generatedPlan.matchedCatalogTrip.price.toLocaleString()} / person</span>
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

              {/* Disclaimer */}
              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                {generatedPlan.disclaimer}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setGeneratedPlan(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <RefreshCw size={14} /> Re-plan
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSavePlan}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      savedSuccess
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    <Bookmark size={14} /> {savedSuccess ? 'Saved to Profile!' : 'Save Plan'}
                  </button>

                  <button
                    onClick={handlePrint}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Printer size={14} /> Print Plan
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AIPlannerModal;
