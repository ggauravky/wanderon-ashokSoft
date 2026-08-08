import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('kumar.gaurav.yadav2007@gmail.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { isAuthenticated, login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/profile';

  // Redirect authenticated user away from login page
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      setLoading(false);
      if (res.success) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    await demoLogin();
    setLoading(false);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-brand-light px-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Branding Banner */}
        <div className="relative hidden md:flex flex-col justify-between p-10 bg-brand-navy text-white overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.pexels.com/photos/6239996/pexels-photo-6239996.jpeg"
              alt="Mountain scenery"
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/60 to-transparent" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-brand-emerald mb-6">
              <Sparkles size={14} />
              Welcome Gaurav Kumar Yadav
            </div>
            <h2 className="text-3xl font-extrabold leading-tight mb-4">
              Your Next Unforgettable Journey Awaits.
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">
              Log in to access your booked itineraries, exclusive member discounts, and seamless group departures.
            </p>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-3 text-xs text-white/90">
              <CheckCircle2 size={16} className="text-brand-emerald" /> 100% Verified Stays & Certified Captains
            </div>
            <div className="flex items-center gap-3 text-xs text-white/90">
              <CheckCircle2 size={16} className="text-brand-emerald" /> Flexible Payment Options & Easy Cancellation
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-brand-navy mb-2">Welcome Back</h1>
            <p className="text-gray-500 text-sm">Enter details to access your WanderLuxe account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Quick Demo Login Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="mb-6 w-full py-3 px-4 bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald font-bold rounded-2xl hover:bg-brand-emerald hover:text-white transition-all flex items-center justify-center gap-2 group text-sm"
          >
            <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
            1-Click Demo Login as Gaurav
          </button>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">or sign in with email</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kumar.gaurav.yadav2007@gmail.com"
                  className="w-full pl-11 pr-4 py-3 bg-brand-light border border-gray-200 rounded-2xl focus:outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 text-brand-navy text-sm font-medium transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-brand-light border border-gray-200 rounded-2xl focus:outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 text-brand-navy text-sm font-medium transition-all"
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

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600 font-medium">
                <input type="checkbox" className="rounded text-brand-emerald focus:ring-brand-emerald" defaultChecked />
                Remember me
              </label>
              <a href="#forgot" className="text-brand-emerald font-semibold hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-navy text-white rounded-2xl font-bold hover:bg-brand-emerald transition-all shadow-xl shadow-brand-navy/10 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-500 font-medium">
            Don't have an account yet?{' '}
            <Link to="/signup" className="text-brand-emerald font-bold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
