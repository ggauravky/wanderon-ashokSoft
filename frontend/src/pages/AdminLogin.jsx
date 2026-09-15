import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Headphones, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'gaurav999@gmail.com').toLowerCase();

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectStatus, setRedirectStatus] = useState('');

  const { user, staffLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already authenticated as Staff, redirect immediately to role-appropriate workspace
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = (user.role || '').toLowerCase();
      const isAdminEmail = user.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL;
      
      if (role === 'sales') {
        navigate('/staff/sales', { replace: true });
      } else if (isAdminEmail || role === 'admin' || role === 'super_admin') {
        navigate('/admin', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRedirectStatus('');

    if (!email || !password) {
      setError('Please enter both staff email address and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await staffLogin(email, password);
      const role = (res.role || res.user?.role || '').toLowerCase();

      if (role === 'sales') {
        setRedirectStatus('Opening Sales Desk...');
        setTimeout(() => {
          setLoading(false);
          navigate('/staff/sales', { replace: true });
        }, 300);
      } else {
        setRedirectStatus('Opening Admin Dashboard...');
        setTimeout(() => {
          setLoading(false);
          navigate('/admin', { replace: true });
        }, 300);
      }
    } catch (err) {
      setLoading(false);
      setRedirectStatus('');
      setError(err.message || 'Invalid Staff Credentials. Please verify your email and password.');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-brand-navy px-4 relative overflow-hidden">
      {/* Background Ambient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-emerald opacity-10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-teal opacity-10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 grid grid-cols-1 md:grid-cols-2 relative z-10">
        {/* Left Side: Staff Branding */}
        <div className="relative hidden md:flex flex-col justify-between p-10 bg-gradient-to-b from-brand-navy to-slate-900 text-white border-r border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-emerald/20 border border-brand-emerald/40 text-xs font-extrabold text-brand-emerald mb-6">
              <ShieldCheck size={16} /> Authorized Staff Portal
            </div>
            <h2 className="text-3xl font-extrabold leading-tight mb-4 text-white">
              WanderLuxe Staff Portal
            </h2>
            <p className="text-white/70 text-sm leading-relaxed font-medium mb-6">
              Unified secure gateway for WanderLuxe Administrators and Travel Sales Specialists. Enter your credentials to automatically unlock your assigned workspace.
            </p>

            <div className="space-y-2.5 text-xs text-white/80 font-semibold">
              <div className="flex items-center gap-2 text-emerald-400">
                <Shield size={14} /> Master Administration Control
              </div>
              <div className="flex items-center gap-2 text-teal-300">
                <Headphones size={14} /> Travel Expert Sales Consultation Desk
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 space-y-2">
            <div className="text-[11px] text-emerald-400 font-mono font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Role-Based Access Control (RBAC) Active
            </div>
            <div className="text-[11px] text-white/40">
              End-to-End Encrypted Authentication • WanderLuxe Security Core
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center text-brand-navy">
          <div className="mb-6">
            <span className="text-xs font-extrabold text-brand-emerald uppercase tracking-wider block mb-1">
              Staff Authentication
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-brand-navy">Staff Sign In</h1>
            <p className="text-gray-500 text-xs mt-1">Admin & Sales specialists secure portal access</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold leading-relaxed">
              {error}
            </div>
          )}

          {redirectStatus && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              {redirectStatus}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-brand-navy mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@wanderluxe.in"
                  className="w-full pl-11 pr-4 py-3 bg-brand-light border border-gray-200 rounded-2xl focus:outline-none focus:border-brand-emerald text-brand-navy text-xs font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-brand-navy mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-brand-light border border-gray-200 rounded-2xl focus:outline-none focus:border-brand-emerald text-brand-navy text-xs font-bold"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-navy cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-emerald text-white rounded-2xl font-extrabold text-sm hover:bg-brand-teal transition-all shadow-xl shadow-brand-emerald/30 flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In to Staff Portal <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
