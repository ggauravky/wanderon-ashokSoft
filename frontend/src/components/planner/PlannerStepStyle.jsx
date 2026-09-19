import React, { useState, useEffect } from 'react';
import { Compass, Flame, Coffee, Camera, Mountain, Trees, UtensilsCrossed, Sparkles, HeartHandshake, User, Users } from 'lucide-react';

const UNIVERSAL_INTERESTS = [
  { id: 'Nature', label: 'Nature & Scenery', icon: Trees },
  { id: 'Adventure', label: 'Adventure & Hikes', icon: Mountain },
  { id: 'Culture', label: 'Culture & Heritage', icon: Compass },
  { id: 'Food', label: 'Local Food & Cafes', icon: UtensilsCrossed },
  { id: 'Photography', label: 'Photography Spots', icon: Camera },
  { id: 'Relaxation', label: 'Peace & Relaxation', icon: Coffee },
  { id: 'Local Experiences', label: 'Artisan & Village Life', icon: HeartHandshake },
  { id: 'Nightlife', label: 'Nightlife & Social', icon: Sparkles }
];

const PACING_OPTIONS = [
  {
    id: 'Relaxed',
    title: 'Relaxed Pace',
    desc: '1–2 key highlights per day, generous cafe breaks, and gentle starts.',
    tag: 'Slow Travel'
  },
  {
    id: 'Balanced',
    title: 'Balanced Pace',
    desc: '2–3 daily sights, comfortable travel times, and enjoyable evenings.',
    tag: 'Recommended'
  },
  {
    id: 'Packed',
    title: 'Action-Packed',
    desc: 'Full-day itineraries maximizing scenic sights, viewpoints, and trails.',
    tag: 'Active Explorer'
  }
];

const BUDGET_TIERS = [
  { id: 'Budget', label: 'Budget', approxPerPerson: 25000, desc: 'Clean guesthouses, local cafes, shared transfers' },
  { id: 'Comfortable', label: 'Comfortable', approxPerPerson: 45000, desc: 'Quality 3-4★ stays, private cabs, authentic dining' },
  { id: 'Premium', label: 'Premium', approxPerPerson: 75000, desc: 'Boutique eco-resorts, dedicated chauffeur, curated experiences' }
];

const PlannerStepStyle = ({ formData, updateFormData }) => {
  const [budgetMode, setBudgetMode] = useState(formData.budgetAmount ? 'custom' : 'tier');

  const selectedInterests = formData.interests || ['Nature', 'Photography'];
  const currentPace = formData.pace || 'Balanced';
  const currentBudgetTier = formData.budgetTier || 'Comfortable';

  // Automatically infer trip type from composition if not manually set
  useEffect(() => {
    if (!formData.tripType) {
      const travelers = formData.travelers || {};
      const adults = travelers.adults || 2;
      const children = travelers.children || 0;
      let inferred = 'Couple';
      if (adults === 1 && children === 0) inferred = 'Solo';
      else if (children > 0 || (travelers.seniors || 0) > 0) inferred = 'Family';
      else if (adults > 2) inferred = 'Friends';
      updateFormData({ tripType: inferred });
    }
  }, []);

  const toggleInterest = (interestId) => {
    let updated;
    if (selectedInterests.includes(interestId)) {
      if (selectedInterests.length <= 1) return; // Keep at least 1
      updated = selectedInterests.filter((id) => id !== interestId);
    } else {
      if (selectedInterests.length >= 5) return; // Limit to 5
      updated = [...selectedInterests, interestId];
    }
    updateFormData({ interests: updated });
  };

  const handleTierSelect = (tierId, approxCost) => {
    updateFormData({
      budgetTier: tierId,
      budgetAmount: approxCost,
      budgetLevel: tierId === 'Premium' ? 'Luxury' : tierId === 'Budget' ? 'Budget' : 'Moderate'
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 block mb-1">
          Step 2 of 3
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          How do you want this journey to feel?
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Travel pace, universal interests, and estimated budget guidance.
        </p>
      </div>

      {/* 1. Travel Pace */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
          Travel Pace *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PACING_OPTIONS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => updateFormData({ pace: p.id })}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                currentPace === p.id
                  ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/15 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">{p.title}</span>
                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                  currentPace === p.id ? 'bg-emerald-200/80 text-emerald-900' : 'bg-slate-100 text-slate-500'
                }`}>
                  {p.tag}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interests (Max 5) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
            Primary Interests
          </label>
          <span className="text-[10px] text-slate-400 font-bold">
            Select 1 to 5 ({selectedInterests.length}/5)
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {UNIVERSAL_INTERESTS.map((interest) => {
            const IconComp = interest.icon;
            const isSelected = selectedInterests.includes(interest.id);
            return (
              <button
                key={interest.id}
                type="button"
                onClick={() => toggleInterest(interest.id)}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <IconComp size={15} className={isSelected ? 'text-emerald-400' : 'text-slate-400'} />
                <span className="text-xs font-bold truncate">{interest.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Trip Type (Inferred or Clicked) */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
          Trip Dynamic
        </label>
        <div className="grid grid-cols-4 gap-2">
          {['Solo', 'Couple', 'Family', 'Friends'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => updateFormData({ tripType: type })}
              className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all ${
                formData.tripType === type
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Budget Preference */}
      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
              Estimated Budget Preference
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Used to guide stay tiers, transfers, and activities
            </span>
          </div>
          <div className="inline-flex p-0.5 bg-slate-200/80 rounded-xl text-[11px] font-black">
            <button
              type="button"
              onClick={() => setBudgetMode('tier')}
              className={`px-3 py-1 rounded-lg transition-all ${
                budgetMode === 'tier' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Comfort Tier
            </button>
            <button
              type="button"
              onClick={() => setBudgetMode('custom')}
              className={`px-3 py-1 rounded-lg transition-all ${
                budgetMode === 'custom' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Exact Target
            </button>
          </div>
        </div>

        {budgetMode === 'tier' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {BUDGET_TIERS.map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => handleTierSelect(tier.id, tier.approxPerPerson)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  currentBudgetTier === tier.id
                    ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/15 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">{tier.label}</span>
                  <span className="text-[10px] font-bold text-emerald-700">~₹{tier.approxPerPerson.toLocaleString()}/pax</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">{tier.desc}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="pt-1">
            <label htmlFor="planner-budget-input" className="block text-[10px] font-black uppercase text-slate-400 mb-1">
              Target Budget (₹ per person)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input
                id="planner-budget-input"
                type="number"
                step="1000"
                min="10000"
                max="300000"
                value={formData.budgetAmount || 45000}
                onChange={(e) => updateFormData({
                  budgetAmount: Number(e.target.value),
                  budgetTier: Number(e.target.value) > 60000 ? 'Premium' : Number(e.target.value) < 30000 ? 'Budget' : 'Comfortable',
                  budgetLevel: Number(e.target.value) > 60000 ? 'Luxury' : Number(e.target.value) < 30000 ? 'Budget' : 'Moderate'
                })}
                placeholder="45000"
                className="w-full pl-8 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Total group estimate: ₹{((formData.budgetAmount || 45000) * ((formData.travelers?.adults || 2) + (formData.travelers?.children || 0))).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlannerStepStyle;
