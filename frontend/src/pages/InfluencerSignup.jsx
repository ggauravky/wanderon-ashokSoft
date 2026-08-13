import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, Mail, Lock, User, Phone, Globe, Send, CheckCircle2, 
  ArrowRight, ShieldCheck, Clock, Eye, EyeOff 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';

const InfluencerSignup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [socialHandle, setSocialHandle] = useState('@');
  const [platform, setPlatform] = useState('Instagram');
  const [followerCount, setFollowerCount] = useState('25,000+');
  const [niche, setNiche] = useState('Travel & Backpacking');
  const [sampleContent, setSampleContent] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const { signup, applyInfluencer } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !socialHandle) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      // Register creator application record in database
      await applyInfluencer({
        name,
        email,
        phone,
        password,
        socialHandle,
        platform,
        followerCount,
        niche,
        sampleContent
      });

      setLoading(false);
      setSubmittedSuccess(true);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to submit influencer application.');
    }
  };

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

        {submittedSuccess ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-3xl mx-auto flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 size={40} />
            </div>

            <div>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider inline-block mb-3">
                Application Received ✓
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-white">Application Submitted Successfully</h1>
              <p className="text-slate-400 text-sm md:text-base mt-2 max-w-md mx-auto">
                Your verification request is currently <strong className="text-amber-400">PENDING ADMIN REVIEW</strong>. Our partnerships team will review your channels within 24 hours.
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700 text-left space-y-3 text-xs font-medium max-w-md mx-auto">
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Applicant:</span>
                <span className="font-bold text-white">{name} ({email})</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Creator Handle:</span>
                <span className="font-bold text-emerald-400">{socialHandle} ({platform})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-extrabold text-amber-400 uppercase">Pending Review</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/influencer/login"
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                Go to Partner Login <ArrowRight size={16} />
              </Link>
              <Link
                to="/"
                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-extrabold border border-slate-700 transition-colors"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="mb-8 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-black text-emerald-400 uppercase tracking-wider mb-2">
                <Sparkles size={14} /> Partner Application
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white">Apply to Become an Influencer</h1>
              <p className="text-slate-400 text-xs md:text-sm mt-1">
                Provide your creator profile details for Admin review and verification.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-xs font-bold text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase text-slate-400 mb-1.5">Full Legal Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Gaurav Kumar Yadav"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block uppercase text-slate-400 mb-1.5">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="creator@yourdomain.com"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
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
                  <label className="block uppercase text-slate-400 mb-1.5">Account Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Creator Metrics */}
              <div className="pt-2 border-t border-slate-800 space-y-4">
                <span className="text-emerald-400 text-xs font-black uppercase tracking-wider block">
                  Social Channels & Audience
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block uppercase text-slate-400 mb-1.5">Primary Platform</label>
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

                  <div>
                    <label className="block uppercase text-slate-400 mb-1.5">Social Handle / Profile *</label>
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
                  disabled={loading}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-extrabold text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={16} /> Submit Creator Application for Admin Review
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2 text-slate-400 text-xs">
                Already registered as an approved partner?{' '}
                <Link to="/influencer/login" className="text-emerald-400 font-bold hover:underline">
                  Influencer Login &rarr;
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfluencerSignup;
