import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'gaurav999@gmail.com';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, adminLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already logged in as Admin, redirect immediately to /admin
  useEffect(() => {
    if (isAuthenticated && (user?.role === 'admin' || user?.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase())) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both admin email and password.');
      return;
    }

    setLoading(true);
    try {
      await adminLogin(email, password);
      setLoading(false);
      navigate('/admin', { replace: true });
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Invalid Admin Credentials.');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-brand-navy px-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-emerald opacity-10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-teal opacity-10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 grid grid-cols-1 md:grid-cols-2 relative z-10">
        {/* Left Side: Dark Admin Branding */}
        <div className="relative hidden md:flex flex-col justify-between p-10 bg-gradient-to-b from-brand-navy to-gray-900 text-white border-r border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-emerald/20 border border-brand-emerald/40 text-xs font-extrabold text-brand-emerald mb-6">
              <ShieldCheck size={16} /> Restricted Admin Portal
            </div>
            <h2 className="text-3xl font-extrabold leading-tight mb-4 text-white">
              WanderLuxe Master Administration
            </h2>
            <p className="text-white/70 text-sm leading-relaxed font-medium">
              Authorized access only. Monitor system analytics, manage trip catalog, configure discount coupons, and verify influencer partners.
            </p>
          </div>

          <div className="pt-8 border-t border-white/10 space-y-3">
            <div className="text-xs text-white/60 font-mono">
              <span className="text-brand-emerald font-bold">Authorized Admin:</span> {DEFAULT_ADMIN_EMAIL}
            </div>
            <div className="text-[11px] text-white/40">
              System Security Engine • End-to-End Encrypted Access
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center text-brand-navy">
          <div className="mb-6">
            <span className="text-xs font-extrabold text-brand-emerald uppercase tracking-wider block mb-1">
              Security Access
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-brand-navy">Admin Portal Sign In</h1>
            <p className="text-gray-500 text-xs mt-1">Enter your admin credentials to unlock control panel</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-brand-navy mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@wanderluxe.in"
                  className="w-full pl-11 pr-4 py-3 bg-brand-light border border-gray-200 rounded-2xl focus:outline-none focus:border-brand-emerald text-brand-navy text-xs font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-brand-navy mb-1.5">
                Admin Security Password
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-navy"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-emerald text-white rounded-2xl font-extrabold text-sm hover:bg-brand-teal transition-all shadow-xl shadow-brand-emerald/30 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Authenticate & Unlock Dashboard <ArrowRight size={18} />
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
