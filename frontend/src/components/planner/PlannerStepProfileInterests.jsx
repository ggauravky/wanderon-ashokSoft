import React from 'react';
import { Check, Plus } from 'lucide-react';
import { OPTION_MEDIA, getContextualExperiences } from '../../utils/expeditionPlannerData';

const PlannerStepProfileInterests = ({ formData, updateFormData, destination = 'Spiti Valley' }) => {
  const partyType = formData.tripType || 'Couple';
  const experiencesList = getContextualExperiences(destination);
  const selectedInterests = formData.interests || [experiencesList[0]?.id, experiencesList[1]?.id, experiencesList[2]?.id].filter(Boolean);

  const handlePartySelect = (type) => {
    updateFormData({
      tripType: type,
      travelers: {
        ...formData.travelers,
        adults: type === 'Solo' ? 1 : type === 'Couple' ? 2 : type === 'Family' ? 4 : 4
      }
    });
  };

  const toggleInterest = (id) => {
    let updated;
    if (selectedInterests.includes(id)) {
      updated = selectedInterests.filter((i) => i !== id);
    } else {
      updated = [...selectedInterests, id];
    }
    updateFormData({ interests: updated });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div className="border-b border-slate-100 pb-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-black uppercase tracking-wider text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Expedition Profile & Interests · Step 2 of 5
          </span>
          <button
            type="button"
            onClick={() => {}}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors hidden sm:block"
          >
            Skip for now →
          </button>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Who's traveling and what excites you?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Choose your travel party and select the experiences that matter most across your {destination} journey.
        </p>
      </div>

      {/* 1. Party Logistics (Single-select) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            <span className="text-slate-400">Party Logistics /</span> 1. Who's joining the trip?
          </span>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
            Single-select
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(OPTION_MEDIA.party).map(([key, item]) => {
            const isSelected = partyType.toLowerCase() === item.title.toLowerCase();
            return (
              <div
                key={key}
                onClick={() => handlePartySelect(item.title)}
                className={`group relative rounded-3xl overflow-hidden border-2 transition-all duration-200 cursor-pointer bg-white shadow-2xs hover:shadow-md ${
                  isSelected
                    ? 'border-emerald-600 ring-2 ring-emerald-600/10'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Visual Image Header */}
                <div className="relative h-36 w-full overflow-hidden bg-slate-900">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Right Action Indicator */}
                  <div className="absolute top-3 right-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-white/80 backdrop-blur-md text-slate-700 hover:bg-white'
                      }`}
                    >
                      {isSelected ? <Check size={14} className="stroke-[3]" /> : <Plus size={14} />}
                    </div>
                  </div>

                  {/* Bottom Text Over Image */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white leading-none drop-shadow-sm">{item.title}</h3>
                      <p className="text-[11px] font-medium text-slate-200 mt-1">{item.subtitle}</p>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-black uppercase bg-emerald-500/90 text-white px-2 py-0.5 rounded shadow-xs">
                        Selected
                      </span>
                    )}
                  </div>
                </div>

                {/* Tag Pills */}
                <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
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

      {/* 2. Experience Curation (Multi-select) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            <span className="text-slate-400">Experience Curation /</span> 2. What excites you? Pick all that apply.
          </span>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
            Multi-select
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {experiencesList.map((exp) => {
            const isSelected = selectedInterests.includes(exp.id) || selectedInterests.includes(exp.title);
            return (
              <div
                key={exp.id}
                onClick={() => toggleInterest(exp.id)}
                className={`group relative rounded-3xl overflow-hidden border-2 transition-all duration-200 cursor-pointer bg-white shadow-2xs hover:shadow-md ${
                  isSelected
                    ? 'border-emerald-600 ring-2 ring-emerald-600/10'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Visual Thumbnail */}
                <div className="relative h-28 w-full overflow-hidden bg-slate-900">
                  <img
                    src={exp.image}
                    alt={exp.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Checkbox Trigger */}
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
                    <h4 className="text-sm font-black text-white drop-shadow-sm leading-tight">{exp.title}</h4>
                    <p className="text-[10px] text-slate-200 font-medium truncate mt-0.5">{exp.desc}</p>
                  </div>
                </div>

                {/* Badge Tag */}
                <div className="p-2.5 bg-slate-50/70 border-t border-slate-100">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded block text-center truncate ${
                      isSelected
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {exp.badge}
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

export default PlannerStepProfileInterests;
