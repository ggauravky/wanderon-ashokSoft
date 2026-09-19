import React from 'react';
import { Mountain, Compass, ShieldCheck, Wifi, Radio } from 'lucide-react';

const PlannerExpeditionFooter = ({ destination = 'Spiti Valley' }) => {
  return (
    <footer className="w-full bg-white border-t border-slate-200/90 py-4 px-4 sm:px-8 text-[11px] text-slate-500 font-bold mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand & Coordinates */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-900 font-black">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Nomad{destination.toLowerCase().includes('spiti') ? 'Spiti' : destination.replace(/\s+/g, '')}</span>
            <span className="text-slate-400 font-normal">· Overland Journeys</span>
          </div>

          <span className="text-slate-300 hidden sm:inline">|</span>

          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-slate-400 uppercase text-[10px]">Waypoint:</span>
            <span className="font-mono text-slate-700">32.2276° N, 78.0710° E</span>
          </div>

          <span className="text-slate-300 hidden sm:inline">|</span>

          <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <Mountain size={12} className="text-emerald-600" />
            <span>Base: 3,650m Alt</span>
          </div>
        </div>

        {/* Right: Technical Signals & Copyright */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <Radio size={12} className="text-emerald-500 animate-pulse" />
            <span>Satellite Sync: <strong className="font-mono text-emerald-800">Nominal</strong></span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <Wifi size={12} className="text-slate-400" />
            <span>Offline Nav Ready</span>
          </div>

          <div className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-black text-[10px] uppercase">
            Permit Active
          </div>

          <span className="text-slate-400 text-[10px]">
            © {new Date().getFullYear()} Nomad {destination} Expeditions.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default PlannerExpeditionFooter;
