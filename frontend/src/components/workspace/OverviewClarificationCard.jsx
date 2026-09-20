import React, { useState } from 'react';
import { Sparkles, CheckCircle2, HelpCircle, Users, DollarSign, Home, Calendar, ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const OverviewClarificationCard = ({
  formData = {},
  updateFormData,
  missingFields = [],
  destination = 'Spiti Valley'
}) => {
  const [answeredMap, setAnsweredMap] = useState({});

  // Questions to ask if missing or for quick in-place personalization
  const questions = [
    {
      id: 'travelers',
      key: 'tripType',
      icon: Users,
      label: 'Group Composition',
      question: `Who are you traveling to ${destination} with?`,
      options: [
        { label: 'Solo 🎒', value: 'Solo', patch: { tripType: 'Solo', travelers: { adults: 1, children: 0, infants: 0, seniors: 0 } } },
        { label: 'Couple 💑', value: 'Couple', patch: { tripType: 'Couple', travelers: { adults: 2, children: 0, infants: 0, seniors: 0 } } },
        { label: 'Friends Squad 👥 (4)', value: 'Friends', patch: { tripType: 'Friends', travelers: { adults: 4, children: 0, infants: 0, seniors: 0 } } },
        { label: 'Family 👨‍👩‍👧', value: 'Family', patch: { tripType: 'Family', travelers: { adults: 2, children: 1, infants: 0, seniors: 0 } } }
      ]
    },
    {
      id: 'budget',
      key: 'budgetTier',
      icon: DollarSign,
      label: 'Budget Range',
      question: 'Select your preferred per-person budget tier:',
      options: [
        { label: 'Backpacker (₹18k–₹25k)', value: 'Backpacker', patch: { budgetTier: 'Backpacker', budgetLevel: 'Budget', budgetAmount: 22000 } },
        { label: 'Comfort (₹35k–₹50k)', value: 'Comfort', patch: { budgetTier: 'Comfort', budgetLevel: 'Moderate', budgetAmount: 45000 } },
        { label: 'Luxury (₹70k+)', value: 'Luxury', patch: { budgetTier: 'Luxury', budgetLevel: 'Luxury', budgetAmount: 75000 } }
      ]
    },
    {
      id: 'stayPreference',
      key: 'stayPreference',
      icon: Home,
      label: 'Stay Experience',
      question: 'What type of stays do you prefer on this circuit?',
      options: [
        { label: 'Homestay 🏡', value: 'Homestay 🏡', patch: { stayPreference: 'Homestay 🏡' } },
        { label: 'Boutique Hotel 🏨', value: 'Boutique Hotel 🏨', patch: { stayPreference: 'Boutique Hotel 🏨' } },
        { label: 'Glamping / Tents ⛺', value: 'Glamping / Campsite ⛺', patch: { stayPreference: 'Glamping / Campsite ⛺' } }
      ]
    },
    {
      id: 'month',
      key: 'flexibleMonth',
      icon: Calendar,
      label: 'Departure Window',
      question: 'Which month are you planning to travel?',
      options: [
        { label: 'June 2026', value: 'June 2026', patch: { flexibleMonth: 'June 2026' } },
        { label: 'July 2026', value: 'July 2026', patch: { flexibleMonth: 'July 2026' } },
        { label: 'August 2026', value: 'August 2026', patch: { flexibleMonth: 'August 2026' } },
        { label: 'September 2026', value: 'September 2026', patch: { flexibleMonth: 'September 2026' } },
        { label: 'October 2026', value: 'October 2026', patch: { flexibleMonth: 'October 2026' } }
      ]
    }
  ];

  const handleSelectOption = (qId, patch, val) => {
    updateFormData?.(patch);
    setAnsweredMap((prev) => ({ ...prev, [qId]: val }));
  };

  const totalAnswered = Object.keys(answeredMap).length;

  return (
    <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 rounded-3xl p-5 sm:p-6 border border-emerald-500/30 shadow-xl text-white space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                Personalize & Complete Your {destination} Route
              </h3>
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                AI Smart Tuning
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Refine your parameters below — changes sync across the schedule, stays & map instantly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-time recalibration</span>
        </div>
      </div>

      {/* Interactive Question Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questions.map((q) => {
          const Icon = q.icon;
          const currentValue = formData[q.key] || answeredMap[q.id];

          return (
            <div
              key={q.id}
              className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Icon size={12} />
                  <span>{q.label}</span>
                </span>

                {currentValue && (
                  <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md">
                    <Check size={10} className="text-emerald-400" />
                    <span>Selected</span>
                  </span>
                )}
              </div>

              <p className="text-xs font-bold text-white">
                {q.question}
              </p>

              {/* Options Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {q.options.map((opt) => {
                  const isSelected = currentValue === opt.value || (q.key === 'tripType' && formData.tripType === opt.value) || (q.key === 'budgetTier' && formData.budgetTier === opt.value) || (q.key === 'stayPreference' && formData.stayPreference === opt.value) || (q.key === 'flexibleMonth' && formData.flexibleMonth === opt.value);

                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleSelectOption(q.id, opt.patch, opt.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-400 ring-1 ring-emerald-400/40 font-black'
                          : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                      }`}
                    >
                      {isSelected && <Check size={11} className="stroke-[3]" />}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OverviewClarificationCard;
