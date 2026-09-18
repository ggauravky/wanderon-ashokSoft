import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  BookOpen,
  FileText,
  Headphones,
  LayoutDashboard,
  LogOut,
  Megaphone,
  PhoneCall,
  ShieldCheck,
  Image,
  Map,
  UserCheck,
  Users,
  WalletCards,
  Tags,
  BarChart3
} from 'lucide-react';
import { getStaffSectionLabel } from '../staffAccess';

const ICONS = {
  overview: LayoutDashboard,
  admin: ShieldCheck,
  admin_team_analytics: BarChart3,
  trips: Map,
  admin_bookings: BookOpen,
  admin_media: Image,
  admin_pages: FileText,
  admin_users: Users,
  admin_creators: UserCheck,
  admin_payouts: WalletCards,
  admin_discounts: Tags,
  sales: Headphones,
  expert_requests: PhoneCall,
  quotations: FileText,
  bookings: BookOpen,
  marketing: Megaphone,
  marketing_campaigns: Megaphone,
  marketing_banners: Image
};

const StaffSidebar = ({ modules, user, roleLabel, onLogout, onNavigate }) => {
  const sections = [...new Set(modules.map((module) => module.section))];

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950 text-slate-100">
      <div className="border-b border-white/10 px-5 py-5">
        <NavLink
          to="/staff"
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-lg focus-visible:ring-offset-slate-950"
          aria-label="WanderLuxe Staff Control Center home"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 transition-colors group-hover:bg-emerald-400/15">
            <Compass size={21} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold tracking-tight text-white">WanderLuxe</span>
            <span className="block truncate text-xs text-slate-400">Staff Control Center</span>
          </span>
        </NavLink>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5" aria-label="Staff workspace navigation">
        <div className="space-y-6">
          {sections.map((sectionId) => {
            const sectionModules = modules.filter((module) => module.section === sectionId);
            const sectionLabel = getStaffSectionLabel(sectionId);

            return (
              <div key={sectionId}>
                {sectionLabel && (
                  <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {sectionLabel}
                  </p>
                )}
                <div className="space-y-1">
                  {sectionModules.map((module) => {
                    const Icon = ICONS[module.icon] || LayoutDashboard;

                    return (
                      <NavLink
                        key={module.id}
                        to={module.path}
                        end={module.exact}
                        onClick={onNavigate}
                        className={({ isActive }) => [
                          'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          'focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
                          isActive
                            ? 'bg-white/10 text-white'
                            : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
                        ].join(' ')}
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              size={18}
                              strokeWidth={1.8}
                              className={isActive ? 'text-emerald-300' : 'text-slate-500'}
                              aria-hidden="true"
                            />
                            <span>{module.label}</span>
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-3">
          <p className="truncate text-sm font-semibold text-slate-100">{user?.name || 'Staff member'}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{roleLabel}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-400 transition-colors hover:bg-rose-400/10 hover:text-rose-200 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
};

export default StaffSidebar;
