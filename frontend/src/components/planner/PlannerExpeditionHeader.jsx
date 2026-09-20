import React from 'react';
import { Mountain, User } from 'lucide-react';
import { getExpeditionProfile } from '../../utils/expeditionPlannerData';

const PlannerExpeditionHeader = ({ activeTab = 'Overview', destination = 'Spiti Valley', onTabClick }) => {
  const profile = getExpeditionProfile(destination);
  const tabs = [
    { id: 'Overview', label: '1. Overview' },
    { id: 'Vibe', label: '2. Vibe' },
    { id: 'Stays', label: '3. Stays' },
    { id: 'Story', label: '4. Story' },
    { id: 'Book', label: '5. Book' }
  ];

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand / Expedition Identifier */}
        <div 
          onClick={() => onTabClick?.('Overview')} 
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs shrink-0">
            <Mountain size={17} className="stroke-[2.2]" />
          </div>
          <div>
            <span className="font-black text-sm sm:text-base text-slate-900 tracking-tight leading-none block">
              Nomad {destination.replace(/^Nomad\s*/i, '').trim() || 'Expedition'}
            </span>
            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase block mt-0.5 truncate max-w-[200px]">
              {profile.region ? profile.region.split('·')[0].toUpperCase().trim() : `${(destination || 'CURATED').toUpperCase()} CIRCUIT`}
            </span>
          </div>
        </div>

        {/* Center: Navigation Tabs (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/60 text-xs font-bold">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabClick?.(tab.id)}
                className={`px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300 mr-1.5 animate-pulse" />}
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Live Pass Status & Profile */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-black text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span className="uppercase tracking-wider">{profile.passStatus || 'All Passes: Open'}</span>
          </div>

          <button
            type="button"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Explorer"
          >
            <User size={16} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-slate-100 bg-slate-50/90 no-scrollbar text-xs font-bold">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabClick?.(tab.id)}
              className={`px-3 py-1 rounded-full whitespace-nowrap shrink-0 transition-all ${
                isActive
                  ? 'bg-emerald-700 text-white font-black'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};

export default PlannerExpeditionHeader;
