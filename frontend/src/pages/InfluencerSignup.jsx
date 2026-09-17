import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, Mail, Lock, User, Phone, Send, CheckCircle2, 
  ArrowRight, ShieldCheck, Clock, AlertCircle, LogIn
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';

const InfluencerSignup = () => {
  const { user, isAuthenticated, applyInfluencer, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [socialHandle, setSocialHandle] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [followerCount, setFollowerCount] = useState('');
  const [niche, setNiche] = useState('');
  const [sampleContent, setSampleContent] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Prepopulate form from current authenticated user session
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      if (user.influencerApplication?.socialHandle) {
        setSocialHandle(user.influencerApplication.socialHandle);
      }
      if (user.influencerApplication?.platform) {
        setPlatform(user.influencerApplication.platform);
      }
      if (user.influencerApplication?.niche) {
        setNiche(user.influencerApplication.niche);
      }
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !socialHandle) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      // Submits application tied to current authenticated user's ID
      await applyInfluencer({
        name,
        email: user.email,
        phone,
        socialHandle,
        platform,
        followerCount,
        niche,
        sampleContent
      });

      setSubmitting(false);
      setSubmittedSuccess(true);
    } catch (err) {
      setSubmitting(false);
      setError(err.message || 'Failed to submit influencer application.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0b132b] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b132b] text-white pt-24 pb-24 px-4 md:px-8">
      <SEOHead
        title="Apply for Creator & Influencer Partner Program | WanderLuxe"
        description="Submit your application to become an official WanderLuxe creator partner. Review process by Admin ensures verified access."
        canonical="/influencer/signup"
      />

      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { name: 'Creators', path: '/influencer/program' },
              { name: 'Apply as Creator', path: '/influencer/signup' }
            ]}
          />
        </div>

        {/* CASE 1: USER IS NOT LOGGED IN -> REQUIRE LOGIN FIRST */}
        {!isAuthenticated ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-3xl mx-auto flex items-center justify-center border border-emerald-500/20">
              <LogIn size={36} />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider inline-block mb-1">
                Account Required
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-white">Please Sign In to Apply</h1>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                To apply for the Creator & Influencer Program, you must be signed in with your WanderLuxe traveler account. Your application will be linked directly to your verified profile.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/login"
                state={{ from: location }}
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                Sign In to Continue <ArrowRight size={16} />
              </Link>
              <Link
                to="/signup"
                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-extrabold border border-slate-700 transition-colors"
              >
                Create an Account
              </Link>
            </div>
          </div>
        ) : (
          /* USER IS LOGGED IN */
          user?.influencerStatus === 'approved' ? (
            /* CASE 2: ALREADY APPROVED INFLUENCER */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-3xl mx-auto flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 size={40} />
              </div>

              <div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider inline-block mb-3">
                  Approved Partner ✓
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-white">You Are an Approved Creator!</h1>
                <p className="text-slate-400 text-xs md:text-sm mt-2 max-w-md mx-auto">
                  Your creator status is active. You can generate custom discount promo codes, track real-time bookings, and withdraw commissions from your dashboard.
                </p>
              </div>

              <div className="pt-2 flex justify-center">
                <Link
                  to="/influencer"
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-xl shadow-emerald-500/25"
                >
                  Enter Influencer Dashboard <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : user?.influencerStatus === 'pending' || submittedSuccess ? (
            /* CASE 3: APPLICATION IS CURRENTLY PENDING REVIEW */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-6">
              <div className="w-20 h-20 bg-amber-500/10 text-amber-400 rounded-3xl mx-auto flex items-center justify-center border border-amber-500/20">
                <Clock size={40} />
              </div>

              <div>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider inline-block mb-3">
                  Under Admin Review ⏳
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-white">Application Received</h1>
                <p className="text-slate-400 text-xs md:text-sm mt-2 max-w-md mx-auto">
                  Your creator verification request is currently <strong className="text-amber-400">PENDING REVIEW</strong>. Our partnerships team verifies applications within 24 hours.
                </p>
              </div>

              <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700 text-left space-y-3 text-xs font-medium max-w-md mx-auto">
                <div className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="text-slate-400">Applicant:</span>
                  <span className="font-bold text-white">{name || user.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="text-slate-400">Account Email:</span>
                  <span className="font-bold text-slate-300">{user.email}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="text-slate-400">Creator Handle:</span>
                  <span className="font-bold text-emerald-400">{socialHandle || user.influencerApplication?.socialHandle || '@creator'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <span className="font-extrabold text-amber-400 uppercase">Pending Admin Approval</span>
                </div>
              </div>

              <div className="pt-2 flex justify-center">
                <Link
                  to="/"
                  className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-extrabold border border-slate-700 transition-colors"
                >
                  Return to Homepage
                </Link>
              </div>
            </div>
          ) : (
            /* CASE 4: APPLICATION FORM (Name Editable, Email LOCKED) */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-black text-emerald-400 uppercase tracking-wider mb-2">
                  <Sparkles size={14} /> Partner Application
                </div>
                <h1 className="text-2xl md:text-4xl font-black text-white">Apply to Become an Influencer</h1>
                <p className="text-slate-400 text-xs md:text-sm mt-1">
                  Your application will be linked directly to your logged-in account: <strong className="text-white">{user.email}</strong>.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 text-xs font-bold text-slate-300">
                {/* Account Identity Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name: EDITABLE */}
                  <div>
                    <label className="block uppercase text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>Full Name (Editable) *</span>
                      <span className="text-[10px] text-emerald-400 lowercase font-normal">can edit</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Gaurav Kumar Yadav"
                        className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Email: LOCKED / READ-ONLY */}
                  <div>
                    <label className="block uppercase text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>Account Email (Locked) *</span>
                      <span className="text-[10px] text-amber-400 lowercase font-normal flex items-center gap-1">
                        <Lock size={10} /> read-only
                      </span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="email"
                        disabled
                        readOnly
                        value={user.email}
                        className="w-full bg-slate-800/40 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-slate-400 text-xs font-mono cursor-not-allowed select-none"
                      />
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-normal">
                      Your account email is linked to your existing session and cannot be changed here.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase text-slate-400 mb-1.5">WhatsApp / Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 8542036499"
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block uppercase text-slate-400 mb-1.5">Primary Platform *</label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-3 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="YouTube">YouTube</option>
                      <option value="X / Twitter">X / Twitter</option>
                      <option value="Travel Blog / Website">Travel Blog / Website</option>
                    </select>
                  </div>
                </div>

                {/* Creator Metrics */}
                <div className="pt-2 border-t border-slate-800 space-y-4">
                  <span className="text-emerald-400 text-xs font-black uppercase tracking-wider block">
                    Social Channels & Audience
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block uppercase text-slate-400 mb-1.5">Social Handle / Profile URL *</label>
                      <input
                        type="text"
                        required
                        value={socialHandle}
                        onChange={(e) => setSocialHandle(e.target.value)}
                        placeholder="@wanderer_gaurav"
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block uppercase text-slate-400 mb-1.5">Follower / Audience Size</label>
                      <input
                        type="text"
                        value={followerCount}
                        onChange={(e) => setFollowerCount(e.target.value)}
                        placeholder="e.g. 50,000+"
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block uppercase text-slate-400 mb-1.5">Content Focus / Niche</label>
                      <input
                        type="text"
                        value={niche}
                        onChange={(e) => setNiche(e.target.value)}
                        placeholder="Backpacking, Trekking, Solo Travel"
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block uppercase text-slate-400 mb-1.5">Sample Post or Video Link</label>
                      <input
                        type="url"
                        value={sampleContent}
                        onChange={(e) => setSampleContent(e.target.value)}
                        placeholder="https://instagram.com/p/..."
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-extrabold text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={16} /> Submit Creator Application for Admin Review
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default InfluencerSignup;
