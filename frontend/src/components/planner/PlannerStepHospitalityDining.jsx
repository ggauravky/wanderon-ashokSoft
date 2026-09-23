import React from 'react';
import { Check, Plus } from 'lucide-react';
import { OPTION_MEDIA } from '../../utils/expeditionPlannerData';

const PlannerStepHospitalityDining = ({ formData, updateFormData, destination = 'Spiti' }) => {
  const selectedStay = formData.stayPreference || 'Homestay 🏡';
  const selectedRoom = formData.roomStyle || 'Double Bed';
  const selectedDining = formData.dietaryPreference || 'Vegetarian';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div className="border-b border-slate-100 pb-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-black uppercase tracking-wider text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Stays & Hospitality · Step 4 of 5
          </span>
          <button
            type="button"
            className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors hidden sm:block"
          >
            Skip for now →
          </button>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Where do you want to rest and dine?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Handpick your high-altitude accommodations, room privacy formats, and regional dietary traditions.
        </p>
      </div>

      {/* 1. Where do you want to stay? */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            <span className="text-slate-400">1.</span> Where do you want to stay?
          </span>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
            Hospitality Format
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {Object.values(OPTION_MEDIA.stays).map((item) => {
            const currentStay = (formData.stayPreference || selectedStay || '').toLowerCase();
            const isSelected = currentStay.includes(item.id.toLowerCase()) || currentStay === item.title.toLowerCase() || formData.stayStyle === item.id;
            return (
              <div
                key={item.id}
                onClick={() => updateFormData({ stayPreference: item.title, stayStyle: item.id })}
                className={`group relative rounded-3xl overflow-hidden border-2 transition-all duration-200 cursor-pointer bg-white shadow-2xs hover:shadow-md ${
                  isSelected
                    ? 'border-emerald-600 ring-2 ring-emerald-600/10'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Badge */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-xs ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white/90 text-slate-700 backdrop-blur-md'
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>

                {/* Visual Image */}
                <div className="relative h-32 w-full overflow-hidden bg-slate-900">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                  {/* Top Right Checkbox */}
                  <div className="absolute top-2.5 right-2.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-white/80 backdrop-blur-md text-slate-700'
                      }`}
                    >
                      {isSelected ? <Check size={12} className="stroke-[3]" /> : <Plus size={12} />}
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <div className="absolute bottom-2.5 left-3 right-3">
                    <h4 className="text-base font-black text-white drop-shadow-sm">{item.title}</h4>
                    <p className="text-[10px] text-slate-200 font-medium truncate mt-0.5">{item.desc}</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="p-2.5 bg-slate-50/70 border-t border-slate-100 flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Room Style */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            <span className="text-slate-400">2.</span> What's your room style?
          </span>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
            Sleeping Arrangement
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {Object.values(OPTION_MEDIA.rooms).map((item) => {
            const isSelected = selectedRoom.toLowerCase().includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => updateFormData({ roomStyle: item.title })}
                className={`group relative rounded-3xl overflow-hidden border-2 transition-all duration-200 cursor-pointer bg-white shadow-2xs hover:shadow-md ${
                  isSelected
                    ? 'border-emerald-600 ring-2 ring-emerald-600/10'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Popular Badge */}
                {item.badge && (
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="text-[9px] font-black uppercase bg-emerald-700 text-white px-2 py-0.5 rounded shadow-xs">
                      {item.badge}
                    </span>
                  </div>
                )}

                {/* Visual Image */}
                <div className="relative h-28 w-full overflow-hidden bg-slate-900">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                  {/* Top Right Checkbox */}
                  <div className="absolute top-2.5 right-2.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-white/80 backdrop-blur-md text-slate-700'
                      }`}
                    >
                      {isSelected ? <Check size={12} className="stroke-[3]" /> : <Plus size={12} />}
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <div className="absolute bottom-2.5 left-3 right-3">
                    <h4 className="text-sm font-black text-white drop-shadow-sm">{item.title}</h4>
                    <p className="text-[10px] text-slate-200 font-medium truncate mt-0.5">{item.desc}</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="p-2.5 bg-slate-50/70 border-t border-slate-100 flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Himalayan / Regional Kitchen */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            <span className="text-slate-400">3.</span> What's on your plate?
          </span>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
            Himalayan Kitchen
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Object.values(OPTION_MEDIA.dining).map((item) => {
            const currentDiet = (formData.dietaryPreference || selectedDining || '').toLowerCase();
            const isSelected = 
              currentDiet === item.title.toLowerCase() ||
              currentDiet === item.id.toLowerCase() ||
              (item.id === 'non_veg' && currentDiet.includes('non')) ||
              (item.id === 'all' && (currentDiet.includes('all') || currentDiet.includes('no pref') || currentDiet.includes('none'))) ||
              (item.id === 'veg' && currentDiet.includes('veg') && !currentDiet.includes('non')) ||
              (item.id === 'jain' && currentDiet.includes('jain'));
            const isNonVeg = item.id === 'non_veg';
            // Color scheme: red for non-veg, emerald for everything else
            const accentBorder = isNonVeg ? 'border-red-600 ring-2 ring-red-600/10' : 'border-emerald-600 ring-2 ring-emerald-600/10';
            const badgeBg = isNonVeg ? 'text-red-300 bg-red-950/80' : 'text-emerald-300 bg-emerald-950/80';
            const checkBg = isNonVeg ? 'bg-red-600 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md';
            const tagSelected = isNonVeg ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200';
            return (
              <div
                key={item.id}
                onClick={() => updateFormData({ dietaryPreference: item.title, dietaryStyle: item.id })}
                className={`group relative rounded-3xl overflow-hidden border-2 transition-all duration-200 cursor-pointer bg-white shadow-2xs hover:shadow-md ${
                  isSelected
                    ? accentBorder
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Visual Image */}
                <div className="relative h-28 w-full overflow-hidden bg-slate-900">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                  {/* Top Right Checkbox */}
                  <div className="absolute top-2.5 right-2.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? checkBg
                          : 'bg-white/80 backdrop-blur-md text-slate-700'
                      }`}
                    >
                      {isSelected ? <Check size={12} className="stroke-[3]" /> : <Plus size={12} />}
                    </div>
                  </div>

                  {/* Badge & Title */}
                  <div className="absolute bottom-2.5 left-3 right-3">
                    <span className={`text-[9px] font-black uppercase ${badgeBg} px-1.5 py-0.5 rounded backdrop-blur-xs mb-1 inline-block`}>
                      {item.badge}
                    </span>
                    <h4 className="text-sm font-black text-white drop-shadow-sm leading-tight">{item.title}</h4>
                  </div>
                </div>

                {/* Tag */}
                <div className="p-2.5 bg-slate-50/70 border-t border-slate-100">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded block text-center truncate ${
                      isSelected
                        ? tagSelected
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {item.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlannerStepHospitalityDining;
