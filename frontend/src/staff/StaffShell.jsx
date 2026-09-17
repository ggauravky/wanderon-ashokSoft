import React, { Suspense, useCallback, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getActiveStaffModule, getStaffRoleLabel, getVisibleStaffModules } from './staffAccess';
import StaffMobileNav from './components/StaffMobileNav';
import StaffSidebar from './components/StaffSidebar';
import StaffTopbar from './components/StaffTopbar';
import RouteLoader from '../components/RouteLoader';

const StaffShell = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const menuButtonRef = useRef(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const roleLabel = getStaffRoleLabel(user?.role);
  const visibleModules = getVisibleStaffModules(user?.role);
  const activeModule = getActiveStaffModule(visibleModules, location.pathname);

  const closeMobileNav = useCallback(() => setIsMobileNavOpen(false), []);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/staff/login', { replace: true });
  }, [logout, navigate]);

  const sidebarProps = {
    modules: visibleModules,
    user,
    roleLabel,
    onLogout: handleLogout
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 lg:block">
        <StaffSidebar {...sidebarProps} />
      </aside>

      <StaffMobileNav
        {...sidebarProps}
        isOpen={isMobileNavOpen}
        onClose={closeMobileNav}
        openerRef={menuButtonRef}
      />

      <div className="min-h-[100dvh] lg:pl-72" aria-hidden={isMobileNavOpen || undefined}>
        <StaffTopbar
          title={activeModule?.label || 'Staff workspace'}
          user={user}
          roleLabel={roleLabel}
          menuButtonRef={menuButtonRef}
          isMenuOpen={isMobileNavOpen}
          onOpenMenu={() => setIsMobileNavOpen(true)}
        />
        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8" id="staff-main-content">
          <div className={`mx-auto w-full ${activeModule?.id === 'overview' ? 'max-w-6xl' : 'max-w-[1440px]'}`}>
            <Suspense fallback={<RouteLoader compact />}>
              <Outlet context={{ user, roleLabel, visibleModules }} />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffShell;
