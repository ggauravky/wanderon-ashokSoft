import React, { useState } from 'react';
import { Clock, ShieldAlert, Sparkles, Send, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SEOHead from './SEOHead';

const InfluencerPending = () => {
  const { user, applyInfluencer, refreshUser } = useAuth();
  const [handle, setHandle] = useState(user?.influencerApplication?.socialHandle || '@traveler');
  const [platform, setPlatform] = useState(user?.influencerApplication?.platform || 'Instagram');
  const [followers, setFollowers] = useState(user?.influencerApplication?.followerCount || '10K+');
  const [niche, setNiche] = useState(user?.influencerApplication?.niche || 'Travel & Adventure');
  const [submitting, setSubmitting] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const navigate = useNavigate();

  const isPending = user?.influencerStatus === 'pending';
  const isRejected = user?.influencerStatus === 'rejected';

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await applyInfluencer({
        socialHandle: handle,
        platform,
        followerCount: followers,
        niche
      });
      setAppliedSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b132b] text-white pt-24 pb-20 px-4 md:px-8 flex items-center justify-center">
      <SEOHead
        title="Influencer Partner Verification Status | WanderLuxe"
        description="Check your WanderLuxe influencer application status and verification review."
        canonical="/influencer"
      />

      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {isPending || appliedSuccess ? (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-amber-500/20 text-amber-400 rounded-3xl mx-auto flex items-center justify-center border border-amber-500/30 animate-pulse">
              <Clock size={40} />
            </div>

            <div>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider inline-block mb-3">
                Application Under Admin Review
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white">Verification Pending</h1>
              <p className="text-slate-400 text-sm md:text-base mt-2 max-w-md mx-auto">
                Thank you for applying to the WanderLuxe Creator Program! Our team is reviewing your profile and metrics.
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700 text-left space-y-3 text-xs font-medium">
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Applicant:</span>
                <span className="font-bold text-white">{user?.name} ({user?.email})</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Handle / Platform:</span>
                <span className="font-bold text-emerald-400">{user?.influencerApplication?.socialHandle || handle} ({user?.influencerApplication?.platform || platform})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Application Date:</span>
                <span className="font-bold text-white">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => refreshUser && refreshUser()}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <RefreshCw size={16} /> Check Status
              </button>
              <Link
                to="/"
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
              >
                <ArrowLeft size={16} /> Return to Homepage
              </Link>
            </div>
          </div>
        ) : isRejected ? (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-rose-500/20 text-rose-400 rounded-3xl mx-auto flex items-center justify-center border border-rose-500/30">
              <ShieldAlert size={40} />
            </div>

            <div>
              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider inline-block mb-3">
                Application Declined
              </span>
              <h1 className="text-3xl font-extrabold text-white">Request Not Approved</h1>
              <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
                Unfortunately, your influencer verification application was not approved at this time.
              </p>
              {user?.influencerApplication?.reviewNotes && (
                <div className="mt-4 p-4 bg-rose-950/40 border border-rose-800/50 rounded-xl text-xs text-rose-300">
                  <span className="font-bold block mb-1">Admin Feedback:</span>
                  {user.influencerApplication.reviewNotes}
                </div>
              )}
            </div>

            <div className="pt-4">
              <Link
                to="/"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-extrabold inline-flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Return to Homepage
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center mb-3">
                <Sparkles size={28} />
              </div>
              <h1 className="text-3xl font-extrabold text-white">Apply for Influencer Access</h1>
              <p className="text-slate-400 text-xs mt-1">Submit your verification request for Admin approval.</p>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Social Handle / Profile URL</label>
                <input
                  type="text"
                  required
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="@yourhandle"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Primary Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="YouTube">YouTube</option>
                    <option value="X / Twitter">X / Twitter</option>
                    <option value="LinkedIn">LinkedIn</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Audience Size</label>
                  <input
                    type="text"
                    value={followers}
                    onChange={(e) => setFollowers(e.target.value)}
                    placeholder="e.g. 25,000+"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Content Niche</label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Travel, Backpacking, Photography"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-4"
              >
                {submitting ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                {submitting ? 'Submitting Application...' : 'Submit for Admin Verification'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfluencerPending;
