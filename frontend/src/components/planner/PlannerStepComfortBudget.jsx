import React from 'react';
import { Check, Star, ShieldCheck, Lock } from 'lucide-react';
import { OPTION_MEDIA } from '../../utils/expeditionPlannerData';

const PlannerStepComfortBudget = ({ formData, updateFormData, destination = 'Spiti' }) => {
  const selectedRating = formData.hotelRating || 4;
  const selectedBudgetTier = formData.budgetTier || 'Comfort';

  const ratings = [
    { stars: 3, label: '3★ Good' },
    { stars: 4, label: '4★ Very Good', certified: true },
    { stars: 5, label: '5★ Luxury' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div className="border-b border-slate-100 pb-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-black uppercase tracking-wider text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Lodging Standards & Comfort · Step 5 of 5
          </span>
          <button
            type="button"
            className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors hidden sm:block"
          >
            Skip for now →
          </button>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          What standard of comfort suits you?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Choose your minimum stay rating and expedition budget tier for the high-altitude {destination} circuit.
        </p>
      </div>

      {/* 1. Minimum Hotel Rating */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            <span className="text-slate-400">Quality Benchmark /</span> 1. Minimum hotel rating
          </span>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            Trans-Himalayan Certified
          </span>
        </div>

        {/* Stars Display */}
        <div className="flex items-center gap-1 text-amber-400">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={22}
              className={`transition-colors ${
                s <= selectedRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
              }`}
            />
          ))}
          <span className="ml-2 text-xs font-black text-slate-800">
            {selectedRating} Stars • {selectedRating >= 4 ? 'Very Good Heritage Homestays & Alpine Retreats' : 'Standard Mountain Stays'}
          </span>
        </div>

        {/* Star Selection Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {ratings.map((r) => {
            const isSelected = selectedRating === r.stars;
            return (
              <button
                key={r.stars}
                type="button"
                onClick={() => updateFormData({ hotelRating: r.stars })}
                className={`py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer border-2 ${
                  isSelected
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {isSelected && <Check size={14} className="stroke-[3]" />}
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Guaranteed High-Altitude Comfort Standard */}
        <div className="p-4 rounded-3xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Check size={14} className="stroke-[3]" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-emerald-900 tracking-wider">
                Guaranteed High-Altitude Comfort Standard
              </h4>
              <p className="text-[11px] text-emerald-800 font-medium leading-relaxed mt-0.5">
                Every stay on your itinerary is vetted for pressurized hot running water, electric thermal bed warmers or traditional bukhari wood stoves, and triple-sanitized alpine duvet bedding.
              </p>
            </div>
          </div>

          {/* 3 Comfort Thumbnails */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="relative rounded-2xl overflow-hidden h-20 bg-slate-900 border border-emerald-300/60">
              <img
                src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500&auto=format&fit=crop&q=80"
                alt="Heated Rooms"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                <span className="text-[10px] font-black text-white">🔥 Heated Rooms</span>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden h-20 bg-slate-900 border border-emerald-300/60">
              <img
                src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80"
                alt="Ensuite + Hot Water"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                <span className="text-[10px] font-black text-white">🚿 Ensuite + Hot Water</span>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden h-20 bg-slate-900 border border-emerald-300/60">
              <img
                src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80"
                alt="Locally Sourced Meals"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                <span className="text-[10px] font-black text-white">🍲 Locally Sourced Meals</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Spending Zone */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            <span className="text-slate-400">Spending Zone /</span> 2. What's your budget comfort?
          </span>
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
            <Lock size={10} /> Private — never shown on public passes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.values(OPTION_MEDIA.budget).map((item) => {
            const isSelected = selectedBudgetTier.toLowerCase() === item.title.toLowerCase();
            return (
              <div
                key={item.id}
                onClick={() => updateFormData({ budgetTier: item.title, budgetLevel: item.id === 'backpacker' ? 'Budget' : item.id === 'premium' ? 'Luxury' : 'Moderate' })}
                className={`relative rounded-3xl p-5 border-2 transition-all duration-200 cursor-pointer bg-white shadow-2xs hover:shadow-md flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-600 ring-2 ring-emerald-600/10'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Recommended Badge */}
                {item.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="text-[9px] font-black uppercase bg-emerald-700 text-white px-3 py-0.5 rounded-full shadow-xs">
                      {item.badge}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{item.icon}</span>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isSelected ? <Check size={12} className="stroke-[3]" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                    </div>
                  </div>

                  <h4 className="text-base font-black text-slate-900">{item.title}</h4>
                  <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">{item.desc}</span>

                  <div className="mt-3 mb-2">
                    <span className="text-lg font-black text-slate-900">{item.price}</span>
                    <span className="text-[10px] text-slate-400 font-bold block">{item.period}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 font-medium leading-relaxed border-t border-slate-100 pt-2.5 mt-2">
                  {item.notes}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlannerStepComfortBudget;
