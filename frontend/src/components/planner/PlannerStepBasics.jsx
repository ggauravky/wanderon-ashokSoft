import React, { useState } from 'react';
import { MapPin, Calendar, Users, Compass, Plus, Minus, Info } from 'lucide-react';

const COMMON_ORIGINS = ['Delhi NCR', 'Mumbai', 'Bengaluru', 'Kolkata', 'Lucknow', 'Hyderabad', 'Chennai', 'Pune', 'Chandigarh'];

const MONTHS = [
  'Flexible', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PlannerStepBasics = ({ formData, updateFormData }) => {
  const [dateMode, setDateMode] = useState(formData.datesFlexible ? 'flexible' : 'exact');
  const [showSeniorPrompt, setShowSeniorPrompt] = useState((formData.travelers?.seniors || 0) > 0);

  const travelers = formData.travelers || { adults: 2, children: 0, infants: 0, seniors: 0 };

  const handleTravelerChange = (field, delta) => {
    const current = travelers[field] || 0;
    const min = field === 'adults' ? 1 : 0;
    const max = field === 'adults' ? 12 : 6;
    const updated = Math.max(min, Math.min(max, current + delta));
    updateFormData({
      travelers: {
        ...travelers,
        [field]: updated
      }
    });
  };

  const handleDateModeChange = (mode) => {
    setDateMode(mode);
    updateFormData({
      datesFlexible: mode === 'flexible'
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 block mb-1">
          Step 1 of 3
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Trip Basics & Route Foundation
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Essential details that directly determine routing, arrival times, and day feasibility.
        </p>
      </div>

      {/* 1. Destination */}
      <div>
        <label htmlFor="planner-dest-input" className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
          Where are you traveling to? *
        </label>
        <div className="relative">
          <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
          <input
            id="planner-dest-input"
            type="text"
            value={formData.destination || ''}
            onChange={(e) => updateFormData({ destination: e.target.value })}
            placeholder="e.g. Spiti Valley, Ladakh, Meghalaya, Kashmir, Bali, Kerala..."
            className="w-full pl-10 pr-4 py-3.5 bg-white rounded-2xl border border-slate-200 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {['Spiti Valley', 'Ladakh', 'Meghalaya', 'Kashmir', 'Bali', 'Kerala', 'Rajasthan', 'Goa'].map((dest) => (
            <button
              key={dest}
              type="button"
              onClick={() => updateFormData({ destination: dest })}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                formData.destination.toLowerCase().includes(dest.toLowerCase())
                  ? 'bg-emerald-700 text-white shadow-2xs font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
              }`}
            >
              {dest}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Origin / Starting City */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="planner-origin-input" className="block text-xs font-black uppercase tracking-wider text-slate-600">
            Starting from / Origin City
          </label>
          <span className="text-[10px] text-slate-400 font-medium">Affects Day 1 arrival buffer</span>
        </div>
        <div className="relative">
          <Compass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="planner-origin-input"
            type="text"
            value={formData.origin || ''}
            onChange={(e) => updateFormData({ origin: e.target.value })}
            placeholder="e.g. Lucknow, Delhi, Mumbai..."
            className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-slate-200 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {COMMON_ORIGINS.slice(0, 6).map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => updateFormData({ origin: city })}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                formData.origin === city
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Dates vs Duration */}
      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Calendar size={14} className="text-emerald-600" />
            When do you want to travel?
          </span>
          <div className="inline-flex p-0.5 bg-slate-200/80 rounded-xl text-[11px] font-black">
            <button
              type="button"
              onClick={() => handleDateModeChange('exact')}
              className={`px-3 py-1 rounded-lg transition-all ${
                dateMode === 'exact' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Exact Dates
            </button>
            <button
              type="button"
              onClick={() => handleDateModeChange('flexible')}
              className={`px-3 py-1 rounded-lg transition-all ${
                dateMode === 'flexible' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              I'm Flexible
            </button>
          </div>
        </div>

        {dateMode === 'exact' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label htmlFor="planner-start-date" className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Start Date
              </label>
              <input
                id="planner-start-date"
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => updateFormData({ startDate: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="planner-end-date" className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                End Date
              </label>
              <input
                id="planner-end-date"
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => updateFormData({ endDate: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label htmlFor="planner-month-select" className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Preferred Month
              </label>
              <select
                id="planner-month-select"
                value={formData.flexibleMonth || 'October'}
                onChange={(e) => updateFormData({ flexibleMonth: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="planner-duration-range" className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Trip Duration: <span className="font-extrabold text-emerald-700">{formData.duration || 5} Days ({Math.max(1, (formData.duration || 5) - 1)} Nights)</span>
              </label>
              <input
                id="planner-duration-range"
                type="range"
                min="3"
                max="10"
                value={formData.duration || 5}
                onChange={(e) => updateFormData({ duration: Number(e.target.value) })}
                className="w-full accent-emerald-600 mt-2"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Compact Traveler Composition */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Users size={14} className="text-emerald-600" />
            Travelers Composition
          </label>
          <span className="text-[10px] text-slate-400 font-medium">
            Total: {(travelers.adults || 0) + (travelers.children || 0) + (travelers.infants || 0) + (travelers.seniors || 0)} Pax
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Adults */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-xs font-black text-slate-900 block">Adults</span>
              <span className="text-[10px] text-slate-400 block">Age 18+</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTravelerChange('adults', -1)}
                disabled={travelers.adults <= 1}
                className="w-6 h-6 rounded-lg bg-slate-100 disabled:opacity-30 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black text-xs"
              >
                <Minus size={12} />
              </button>
              <span className="text-xs font-black w-4 text-center">{travelers.adults || 2}</span>
              <button
                type="button"
                onClick={() => handleTravelerChange('adults', 1)}
                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black text-xs"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* Children */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-xs font-black text-slate-900 block">Children</span>
              <span className="text-[10px] text-slate-400 block">Age 2–17</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTravelerChange('children', -1)}
                disabled={!travelers.children}
                className="w-6 h-6 rounded-lg bg-slate-100 disabled:opacity-30 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black text-xs"
              >
                <Minus size={12} />
              </button>
              <span className="text-xs font-black w-4 text-center">{travelers.children || 0}</span>
              <button
                type="button"
                onClick={() => handleTravelerChange('children', 1)}
                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black text-xs"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* Infants */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-xs font-black text-slate-900 block">Infants</span>
              <span className="text-[10px] text-slate-400 block">Under 2</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTravelerChange('infants', -1)}
                disabled={!travelers.infants}
                className="w-6 h-6 rounded-lg bg-slate-100 disabled:opacity-30 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black text-xs"
              >
                <Minus size={12} />
              </button>
              <span className="text-xs font-black w-4 text-center">{travelers.infants || 0}</span>
              <button
                type="button"
                onClick={() => handleTravelerChange('infants', 1)}
                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black text-xs"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* Senior Citizens (Optional high-signal modifier) */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-xs font-black text-slate-900 block">Seniors</span>
              <span className="text-[10px] text-slate-400 block">Age 60+</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTravelerChange('seniors', -1)}
                disabled={!travelers.seniors}
                className="w-6 h-6 rounded-lg bg-slate-100 disabled:opacity-30 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black text-xs"
              >
                <Minus size={12} />
              </button>
              <span className="text-xs font-black w-4 text-center">{travelers.seniors || 0}</span>
              <button
                type="button"
                onClick={() => handleTravelerChange('seniors', 1)}
                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black text-xs"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlannerStepBasics;
