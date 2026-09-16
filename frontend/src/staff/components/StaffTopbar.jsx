import React from 'react';
import { ExternalLink, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

const getInitials = (name, email) => {
  const source = String(name || email || 'Staff').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
};

const StaffTopbar = ({ title, user, roleLabel, menuButtonRef, isMenuOpen, onOpenMenu }) => (
  <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
    <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onOpenMenu}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 lg:hidden"
          aria-label="Open staff navigation"
          aria-controls="staff-mobile-navigation"
          aria-expanded={isMenuOpen}
        >
          <Menu size={20} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Staff Control Center
          </p>
          <h1 className="truncate text-base font-semibold tracking-tight text-slate-950 sm:text-lg">{title}</h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          to="/"
          className="hidden min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:flex"
        >
          <ExternalLink size={16} strokeWidth={1.8} aria-hidden="true" />
          Open website
        </Link>

        <div className="hidden text-right md:block">
          <p className="max-w-44 truncate text-sm font-semibold text-slate-900">{user?.name || 'Staff member'}</p>
          <p className="max-w-44 truncate text-xs text-slate-500">{roleLabel}</p>
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white ring-2 ring-slate-200"
          aria-label={`${user?.name || 'Staff member'}, ${roleLabel}`}
          title={user?.email || roleLabel}
        >
          {getInitials(user?.name, user?.email)}
        </div>
      </div>
    </div>
  </header>
);

export default StaffTopbar;
