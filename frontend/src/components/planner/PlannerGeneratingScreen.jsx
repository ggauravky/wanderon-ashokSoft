import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Compass, ShieldCheck, Clock, MapPin, Trees, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const PROCESS_STAGES = [
  { id: 1, label: 'Understanding your trip preferences & constraints' },
  { id: 2, label: 'Grouping nearby geographic experiences & attractions' },
  { id: 3, label: 'Balancing transit times & road feasibility' },
  { id: 4, label: 'Building realistic morning, afternoon & evening slots' },
  { id: 5, label: 'Matching verified boutique stays & dining hubs' },
  { id: 6, label: 'Finalizing database media & plan health checks' }
];

const PlannerGeneratingScreen = ({ destination = 'Meghalaya', formData = {} }) => {
  const [activeStageIdx, setActiveStageIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStageIdx((prev) => (prev < PROCESS_STAGES.length - 1 ? prev + 1 : prev));
    }, 950);
    return () => clearInterval(interval);
  }, []);

  // Compute 2-3 genuine preference-derived micro-copy cards
  const infoCards = [];

  if (formData.pace === 'Relaxed') {
    infoCards.push({
      icon: Clock,
      title: 'Pacing Optimization',
      text: 'Keeping daily road transit lighter with gentle starts because you selected a relaxed pace.'
    });
  } else if (formData.pace === 'Packed') {
    infoCards.push({
      icon: Compass,
      title: 'Active Explorer Mode',
      text: 'Maximizing scenic stops and viewpoints while keeping geographic backtracking to zero.'
    });
  }

  if (formData.origin) {
    infoCards.push({
      icon: MapPin,
      title: 'Arrival Logistics',
      text: `Factoring transit buffer from ${formData.origin} to ensure Day 1 is feasible without exhaustion.`
    });
  }

  if (formData.dietaryPreference && formData.dietaryPreference !== 'No preference') {
    infoCards.push({
      icon: Sparkles,
      title: 'Dining Alignment',
      text: `Focusing culinary recommendations on verified ${formData.dietaryPreference} meal spots.`
    });
  } else if (formData.interests && formData.interests.includes('Nature')) {
    infoCards.push({
      icon: Trees,
      title: 'Nature-First Curation',
      text: 'Prioritizing living waterfalls, forest canopies, and serene viewpoints from our verified database.'
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-8">
      {/* Animated Glowing Crest */}
      <div className="relative inline-flex items-center justify-center">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-pulse">
          <Sparkles size={36} className="animate-spin text-emerald-600 duration-3000" />
        </div>
      </div>

      <div>
        <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full">
          Travel Intelligence at Work
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
          Creating your {destination} journey...
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto mt-2">
          Synthesizing realistic day-by-day schedules, route constraints, and verified photography.
        </p>
      </div>

      {/* Process Stages List (Calm Progress) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md text-left space-y-3.5 max-w-lg mx-auto">
        {PROCESS_STAGES.map((stage, idx) => {
          const isDone = idx < activeStageIdx;
          const isCurrent = idx === activeStageIdx;

          return (
            <div
              key={stage.id}
              className={`flex items-center gap-3 transition-opacity duration-300 ${
                isDone ? 'opacity-100' : isCurrent ? 'opacity-100 font-bold' : 'opacity-35'
              }`}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                {isDone ? (
                  <CheckCircle2 size={18} className="text-emerald-600" />
                ) : isCurrent ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                )}
              </div>
              <span className={`text-xs ${isCurrent ? 'text-slate-900 font-black' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Genuine Preference-Derived Micro-Copy Cards */}
      {infoCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
          {infoCards.slice(0, 2).map((card, i) => {
            const IconC = card.icon;
            return (
              <div key={i} className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 flex items-start gap-2.5">
                <IconC size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-black text-emerald-950 block">{card.title}</span>
                  <p className="text-[10px] text-emerald-800 mt-0.5 leading-relaxed">{card.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlannerGeneratingScreen;
