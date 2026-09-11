import React, { useState } from 'react';
import { Sliders, ChevronDown, ChevronUp, AlertCircle, Plus, X, Heart, Shield, Car, Bed, Utensils, Accessibility, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STAY_PREFERENCES = ['Budget Stays', 'Comfortable Stays', 'Boutique Resorts', 'Luxury Escapes'];
const TRANSPORT_PREFERENCES = ['No preference', 'Private vehicle', 'Shared transport', 'Public / Local transport'];
const DIETARY_OPTIONS = ['No preference', 'Vegetarian', 'Vegan', 'Jain', 'Non-Vegetarian'];
const ACCESSIBILITY_OPTIONS = ['Avoid steep stairs', 'Limited walking only', 'Wheelchair consideration', 'Senior-friendly pace'];

const PlannerStepDetails = ({ formData, updateFormData }) => {
  const [fineTuneOpen, setFineTuneOpen] = useState(false);

  // Must-include & Avoid tag inputs
  const [mustInput, setMustInput] = useState('');
  const [avoidInput, setAvoidInput] = useState('');

  const mustIncludeList = formData.mustInclude || [];
  const avoidList = formData.avoid || [];

  const addMustInclude = () => {
    if (!mustInput.trim()) return;
    if (!mustIncludeList.includes(mustInput.trim())) {
      updateFormData({ mustInclude: [...mustIncludeList, mustInput.trim()] });
    }
    setMustInput('');
  };

  const removeMustInclude = (tag) => {
    updateFormData({ mustInclude: mustIncludeList.filter((t) => t !== tag) });
  };

  const addAvoid = () => {
    if (!avoidInput.trim()) return;
    if (!avoidList.includes(avoidInput.trim())) {
      updateFormData({ avoid: [...avoidList, avoidInput.trim()] });
    }
    setAvoidInput('');
  };

  const removeAvoid = (tag) => {
    updateFormData({ avoid: avoidList.filter((t) => t !== tag) });
  };

  const toggleAccessibility = (option) => {
    const current = formData.mobilityConstraints || [];
    const updated = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    updateFormData({ mobilityConstraints: updated });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 block mb-1">
          Step 3 of 3
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Specific Constraints & Fine-Tuning
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Describe any personal nuances in your own words. The AI understands natural constraints.
        </p>
      </div>

      {/* 1. Large Natural-Language Field (Primary Input) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="planner-free-text" className="block text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sparkles size={14} className="text-emerald-600" />
            Anything we should know?
          </label>
          <span className="text-[10px] text-slate-400 font-medium">Humans describe constraints best</span>
        </div>
        <textarea
          id="planner-free-text"
          rows={4}
          value={formData.customPreferences || ''}
          onChange={(e) => updateFormData({ customPreferences: e.target.value })}
          placeholder="e.g. Vegetarian meals preferred, avoid strenuous stair climbs, want peaceful sunrise viewpoints, traveling with elderly parents who prefer gentle scenic drives..."
          className="w-full p-4 bg-white rounded-2xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs resize-none"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[
            'Vegetarian food throughout',
            'Avoid early 6 AM starts',
            'Photography friendly spots',
            'Private vehicle for hills',
            'Scenic cafe stops'
          ].map((snippet) => (
            <button
              key={snippet}
              type="button"
              onClick={() => {
                const current = formData.customPreferences || '';
                const updated = current ? `${current}. ${snippet}` : snippet;
                updateFormData({ customPreferences: updated });
              }}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              + {snippet}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Collapsed "Fine-Tune My Trip" Drawer */}
      <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs">
        <button
          type="button"
          onClick={() => setFineTuneOpen(!fineTuneOpen)}
          className="w-full p-4 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <Sliders size={16} className="text-emerald-600" />
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                Fine-Tune My Trip
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">
                Optional advanced preferences (Stays, vehicle, diet, mobility, must-haves)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <span>{fineTuneOpen ? 'Hide' : 'Configure'}</span>
            {fineTuneOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </button>

        <AnimatePresence>
          {fineTuneOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 sm:p-6 border-t border-slate-200/80 space-y-5"
            >
              {/* Stay Preference */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-2 flex items-center gap-1.5">
                  <Bed size={13} className="text-emerald-600" /> Stay Style Preference
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STAY_PREFERENCES.map((stay) => (
                    <button
                      key={stay}
                      type="button"
                      onClick={() => updateFormData({ stayPreference: stay })}
                      className={`py-2 px-2.5 text-xs font-bold rounded-xl border text-center transition-all ${
                        formData.stayPreference === stay
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {stay}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transport Preference */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-2 flex items-center gap-1.5">
                  <Car size={13} className="text-emerald-600" /> Transport Preference
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TRANSPORT_PREFERENCES.map((trans) => (
                    <button
                      key={trans}
                      type="button"
                      onClick={() => updateFormData({ transportPreference: trans })}
                      className={`py-2 px-2.5 text-xs font-bold rounded-xl border text-center transition-all ${
                        (formData.transportPreference || 'Private vehicle') === trans
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {trans}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary Preferences */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-2 flex items-center gap-1.5">
                  <Utensils size={13} className="text-emerald-600" /> Meal & Dietary Needs
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map((diet) => (
                    <button
                      key={diet}
                      type="button"
                      onClick={() => updateFormData({ dietaryPreference: diet })}
                      className={`py-1.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                        (formData.dietaryPreference || 'No preference') === diet
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {diet}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobility & Accessibility Constraints */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-2 flex items-center gap-1.5">
                  <Accessibility size={13} className="text-emerald-600" /> Mobility & Physical Constraints
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ACCESSIBILITY_OPTIONS.map((opt) => {
                    const isChecked = (formData.mobilityConstraints || []).includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleAccessibility(opt)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                          isChecked
                            ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{opt}</span>
                        <span className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                          isChecked ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300'
                        }`}>
                          {isChecked && '✓'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Must Include & Avoid Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Must Include */}
                <div>
                  <label htmlFor="planner-must-input" className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1.5">
                    Must Include Specific Places / Activities
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      id="planner-must-input"
                      type="text"
                      value={mustInput}
                      onChange={(e) => setMustInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMustInclude(); } }}
                      placeholder="e.g. Dawki boating"
                      className="flex-grow px-3 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={addMustInclude}
                      className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl"
                    >
                      Add
                    </button>
                  </div>
                  {mustIncludeList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {mustIncludeList.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                          ✓ {tag}
                          <button type="button" onClick={() => removeMustInclude(tag)} className="hover:text-emerald-950">
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Avoid */}
                <div>
                  <label htmlFor="planner-avoid-input" className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1.5">
                    Avoid / Do Not Include
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      id="planner-avoid-input"
                      type="text"
                      value={avoidInput}
                      onChange={(e) => setAvoidInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAvoid(); } }}
                      placeholder="e.g. Long strenuous treks"
                      className="flex-grow px-3 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={addAvoid}
                      className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl"
                    >
                      Add
                    </button>
                  </div>
                  {avoidList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {avoidList.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold">
                          ✕ {tag}
                          <button type="button" onClick={() => removeAvoid(tag)} className="hover:text-rose-950">
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Existing Bookings / Reservations Note */}
              <div className="pt-2">
                <label htmlFor="planner-existing-bookings" className="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1">
                  Already Booked Anything? (Optional)
                </label>
                <input
                  id="planner-existing-bookings"
                  type="text"
                  value={formData.existingReservations || ''}
                  onChange={(e) => updateFormData({ existingReservations: e.target.value })}
                  placeholder="e.g. Flight lands at Guwahati 1:30 PM on Day 1; staying at Polo Towers Shillong"
                  className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PlannerStepDetails;
