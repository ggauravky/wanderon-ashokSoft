import React, { useState } from 'react';
import { 
  SlidersHorizontal, RotateCcw, MapPin, Calendar, 
  Clock, IndianRupee, Compass, Sparkles, Navigation, 
  ChevronDown, ChevronUp, Check, X
} from 'lucide-react';

const FILTER_SECTIONS = [
  { id: 'destination', title: 'Destination / Region', icon: MapPin },
  { id: 'month', title: 'Departure Month', icon: Calendar },
  { id: 'duration', title: 'Duration', icon: Clock },
  { id: 'budget', title: 'Budget Per Person', icon: IndianRupee },
  { id: 'tripType', title: 'Trip Style', icon: Compass },
  { id: 'mood', title: 'Travel Vibe / Climate', icon: Sparkles },
  { id: 'city', title: 'Starting Hub / City', icon: Navigation }
];

export const DESTINATION_OPTIONS = [
  { id: 'all', label: 'All Destinations' },
  { id: 'india', label: 'India (Domestic)' },
  { id: 'international', label: 'International (Bali)' },
  { id: 'himachal', label: 'Himachal Pradesh' },
  { id: 'uttarakhand', label: 'Uttarakhand' },
  { id: 'meghalaya', label: 'Meghalaya' },
  { id: 'kashmir', label: 'Kashmir' },
  { id: 'ladakh', label: 'Ladakh' },
  { id: 'goa', label: 'Goa' },
  { id: 'kerala', label: 'Kerala' },
  { id: 'rajasthan', label: 'Rajasthan' },
  { id: 'bali', label: 'Bali' }
];

export const MONTH_OPTIONS = [
  { id: 'all', label: 'All Months' },
  { id: 'aug', label: 'August' },
  { id: 'sep', label: 'September' },
  { id: 'oct', label: 'October' },
  { id: 'nov', label: 'November' },
  { id: 'dec', label: 'December' },
  { id: 'jan', label: 'January' }
];

export const DURATION_OPTIONS = [
  { id: 'all', label: 'All Durations' },
  { id: 'weekend', label: '2–3 Days (Weekend)' },
  { id: 'short', label: '4–5 Days (Short Break)' },
  { id: 'expedition', label: '6–8 Days (Expedition)' }
];

export const BUDGET_OPTIONS = [
  { id: 'all', label: 'All Budgets' },
  { id: 'under15k', label: 'Under ₹15,000' },
  { id: '15k_25k', label: '₹15,000 – ₹25,000' },
  { id: '25k_35k', label: '₹25,000 – ₹35,000' },
  { id: 'above35k', label: 'Above ₹35,000' }
];

export const TRIP_TYPE_OPTIONS = [
  { id: 'all', label: 'All Trip Styles' },
  { id: 'community', label: 'Community / Group Trips' },
  { id: 'backpacking', label: 'Backpacking Circuits' },
  { id: 'weekend', label: 'Weekend Getaways' },
  { id: 'adventure', label: 'Adventure & Treks' },
  { id: 'romantic', label: 'Romantic Escapes' },
  { id: 'culture', label: 'Culture & Heritage' }
];

export const MOOD_OPTIONS = [
  { id: 'all', label: 'All Vibes' },
  { id: 'cold', label: 'High Mountain Cold & Snow' },
  { id: 'tropical', label: 'Sunny Beach & Coastal' },
  { id: 'rainforest', label: 'Misty Rainforests & Falls' },
  { id: 'heritage', label: 'Palaces & Forts' }
];

export const STARTING_CITY_OPTIONS = [
  { id: 'all', label: 'All Starting Cities' },
  { id: 'delhi', label: 'Delhi / Chandigarh' },
  { id: 'rishikesh', label: 'Rishikesh / Dehradun' },
  { id: 'shimla', label: 'Shimla / Manali' },
  { id: 'guwahati', label: 'Guwahati (Northeast)' },
  { id: 'srinagar', label: 'Srinagar (Kashmir)' },
  { id: 'leh', label: 'Leh (Ladakh)' },
  { id: 'goa', label: 'Goa' },
  { id: 'cochin', label: 'Cochin (Kerala)' },
  { id: 'jaipur', label: 'Jaipur / Udaipur' },
  { id: 'bali', label: 'Bali / Denpasar' }
];

const FilterSidebar = ({
  filters,
  onChangeFilter,
  onResetFilters,
  totalMatchingTrips,
  countsByOption = {},
  isMobile = false,
  onCloseMobile
}) => {
  // Collapsible section open/closed state
  const [openSections, setOpenSections] = useState({
    destination: true,
    month: true,
    duration: true,
    budget: true,
    tripType: false,
    mood: false,
    city: false
  });

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => v && v !== 'all' && v !== 'All' && k !== 'sort' && k !== 'q'
  );

  const renderRadioList = (options, currentVal, filterKey) => {
    return (
      <div className="space-y-1.5 pt-1">
        {options.map((opt) => {
          const isSelected = (currentVal || 'all') === opt.id;
          const count = countsByOption[`${filterKey}_${opt.id}`];

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeFilter(filterKey, opt.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'bg-slate-50/70 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-white bg-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </div>
                <span className="truncate">{opt.label}</span>
              </div>

              {count !== undefined && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 ml-1 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col ${isMobile ? 'h-full' : 'p-5'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between pb-4 border-b border-slate-100 ${isMobile ? 'p-5' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <SlidersHorizontal size={15} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 leading-tight">Advanced Filters</h3>
            <span className="text-[11px] text-slate-400 font-bold">
              {totalMatchingTrips} Trips Match
            </span>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer"
            title="Reset to default preset"
          >
            <RotateCcw size={11} /> Clear
          </button>
        )}
      </div>

      {/* Filter Sections Accordion */}
      <div className={`space-y-4 overflow-y-auto ${isMobile ? 'p-5 flex-grow' : 'py-4 max-h-[calc(100vh-240px)] pr-1 custom-scrollbar'}`}>
        
        {/* Destination Section */}
        <div className="border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => toggleSection('destination')}
            className="w-full flex items-center justify-between text-xs font-black text-slate-900 py-1.5 cursor-pointer uppercase tracking-wider"
          >
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-emerald-600" />
              <span>Destination</span>
            </div>
            {openSections.destination ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {openSections.destination && renderRadioList(DESTINATION_OPTIONS, filters.destination, 'destination')}
        </div>

        {/* Departure Month Section */}
        <div className="border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => toggleSection('month')}
            className="w-full flex items-center justify-between text-xs font-black text-slate-900 py-1.5 cursor-pointer uppercase tracking-wider"
          >
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-emerald-600" />
              <span>Departure Month</span>
            </div>
            {openSections.month ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {openSections.month && renderRadioList(MONTH_OPTIONS, filters.month, 'month')}
        </div>

        {/* Duration Section */}
        <div className="border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => toggleSection('duration')}
            className="w-full flex items-center justify-between text-xs font-black text-slate-900 py-1.5 cursor-pointer uppercase tracking-wider"
          >
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-emerald-600" />
              <span>Duration</span>
            </div>
            {openSections.duration ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {openSections.duration && renderRadioList(DURATION_OPTIONS, filters.duration, 'duration')}
        </div>

        {/* Budget Section */}
        <div className="border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => toggleSection('budget')}
            className="w-full flex items-center justify-between text-xs font-black text-slate-900 py-1.5 cursor-pointer uppercase tracking-wider"
          >
            <div className="flex items-center gap-1.5">
              <IndianRupee size={13} className="text-emerald-600" />
              <span>Budget Per Person</span>
            </div>
            {openSections.budget ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {openSections.budget && renderRadioList(BUDGET_OPTIONS, filters.budget, 'budget')}
        </div>

        {/* Trip Style Section */}
        <div className="border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => toggleSection('tripType')}
            className="w-full flex items-center justify-between text-xs font-black text-slate-900 py-1.5 cursor-pointer uppercase tracking-wider"
          >
            <div className="flex items-center gap-1.5">
              <Compass size={13} className="text-emerald-600" />
              <span>Trip Style</span>
            </div>
            {openSections.tripType ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {openSections.tripType && renderRadioList(TRIP_TYPE_OPTIONS, filters.tripType, 'tripType')}
        </div>

        {/* Vibe / Climate Section */}
        <div className="border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => toggleSection('mood')}
            className="w-full flex items-center justify-between text-xs font-black text-slate-900 py-1.5 cursor-pointer uppercase tracking-wider"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-emerald-600" />
              <span>Vibe & Climate</span>
            </div>
            {openSections.mood ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {openSections.mood && renderRadioList(MOOD_OPTIONS, filters.mood, 'mood')}
        </div>

        {/* Starting City Section */}
        <div className="pb-1">
          <button
            type="button"
            onClick={() => toggleSection('city')}
            className="w-full flex items-center justify-between text-xs font-black text-slate-900 py-1.5 cursor-pointer uppercase tracking-wider"
          >
            <div className="flex items-center gap-1.5">
              <Navigation size={13} className="text-emerald-600" />
              <span>Starting City Hub</span>
            </div>
            {openSections.city ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {openSections.city && renderRadioList(STARTING_CITY_OPTIONS, filters.city, 'city')}
        </div>

      </div>

      {/* Mobile Drawer Footer CTA */}
      {isMobile && (
        <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
          <button
            type="button"
            onClick={onCloseMobile}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check size={14} /> Show {totalMatchingTrips} Trips
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterSidebar;
