import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Headphones } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'gaurav999@gmail.com').toLowerCase();

/**
 * Reusable role-based protected route guard.
 * Strictly checks user.role against allowedRoles.
 * Prevents privilege escalation and cross-portal leakage.
 */
const RoleProtectedRoute = ({ allowedRoles = ['admin', 'super_admin'], children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Verifying Staff Authorization...</p>
        </div>
      </div>
    );
  }

  // 1. Not logged in -> Redirect to Staff Login
  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const userRole = (user.role || 'user').toLowerCase();
  const isSuperAdminEmail = user.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL;
  const isAllowed = isSuperAdminEmail || userRole === 'super_admin' || allowedRoles.map(r => r.toLowerCase()).includes(userRole);

  // 2. Role is Allowed -> Render Protected Screen
  if (isAllowed) {
    return children;
  }

  // 3. Role is NOT Allowed -> Direct Role-Appropriate Handling
  // If Sales employee tries to access full /admin, redirect immediately to their dedicated portal /staff/sales
  if (userRole === 'sales') {
    return <Navigate to="/staff/sales" replace />;
  }

  // If normal customer or creator tries to access staff portals, show clean Access Denied page
  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-slate-950 px-4 text-white">
      <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-8 text-center shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert size={32} />
        </div>
        
        <div>
          <h2 className="text-xl font-black text-white">Access Restricted</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Your current account role (<span className="text-amber-400 font-bold uppercase">{userRole}</span>) does not have authorization to view this staff portal.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <Link
            to="/admin/login"
            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Switch to Staff Login
          </Link>
          <Link
            to="/"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-emerald-600/20"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RoleProtectedRoute;
