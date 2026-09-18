import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, BarChart3, Loader2, RefreshCw, UserRoundSearch } from 'lucide-react';
import { getTeamAnalyticsMembersApi, getTeamMemberAnalyticsApi } from '../../../../services/api.js';
import ActivityTimeline from './components/ActivityTimeline.jsx';
import AnalyticsMetricCard from './components/AnalyticsMetricCard.jsx';
import CreatorAnalytics from './components/CreatorAnalytics.jsx';
import MarketingAnalytics from './components/MarketingAnalytics.jsx';
import MemberProfileCard from './components/MemberProfileCard.jsx';
import SalesAnalytics from './components/SalesAnalytics.jsx';
import TeamAnalyticsFilters from './components/TeamAnalyticsFilters.jsx';
import { formatDateTime, formatNumber } from './teamAnalyticsHelpers.js';

const TeamAnalyticsWorkspace = () => {
  const [category, setCategory] = useState('');
  const [memberId, setMemberId] = useState('');
  const [members, setMembers] = useState([]);
  const [range, setRange] = useState('30d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    setMemberId('');
    setData(null);
    setMembers([]);
    setError('');
    if (!category) return;
    let active = true;
    setLoadingMembers(true);
    getTeamAnalyticsMembersApi(category).then((response) => { if (active) setMembers(response.members || []); }).catch((loadError) => { if (active) setError(loadError.message || 'Unable to load team members.'); }).finally(() => { if (active) setLoadingMembers(false); });
    return () => { active = false; };
  }, [category]);

  const loadAnalytics = useCallback(async () => {
    if (!category || !memberId || (range === 'custom' && (!from || !to))) return;
    setLoading(true);
    setError('');
    try {
      setData(await getTeamMemberAnalyticsApi(memberId, { category, range, from: range === 'custom' ? from : undefined, to: range === 'custom' ? to : undefined }));
    } catch (loadError) {
      setData(null);
      setError(loadError.message || 'Unable to load member analytics.');
    } finally {
      setLoading(false);
    }
  }, [category, from, memberId, range, to]);

  useEffect(() => {
    if (range === 'custom' && (!from || !to)) setData(null);
  }, [from, range, to]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  return <div className="space-y-6">
    <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Administration · Team visibility</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Staff &amp; Creator Analytics</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Review factual actions, operational workload, conversions, and paid commercial outcomes for one selected member.</p></div>{data && <button type="button" onClick={loadAnalytics} disabled={loading} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/>Refresh</button>}</section>
    <TeamAnalyticsFilters category={category} memberId={memberId} members={members} range={range} from={from} to={to} loadingMembers={loadingMembers} onCategory={setCategory} onMember={setMemberId} onRange={setRange} onFrom={setFrom} onTo={setTo}/>
    {error && <section className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center"><AlertCircle className="mx-auto text-rose-600"/><h2 className="mt-2 font-semibold text-rose-900">Unable to load analytics</h2><p className="mt-1 text-sm text-rose-700">{error}</p>{memberId && <button type="button" onClick={loadAnalytics} className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white">Retry</button>}</section>}
    {!error && loading ? <section className="flex min-h-64 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 size={18} className="mr-2 animate-spin"/>Building the selected member report…</section> : !error && !data ? <section className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center"><UserRoundSearch size={30} className="mx-auto text-slate-300"/><h2 className="mt-3 font-semibold text-slate-900">Select a category and team member to view analytics.</h2><p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">Reports load only for the selected person and use persisted records. No employee score or ranking is calculated.</p></section> : null}
    {data && !loading && <><MemberProfileCard data={data}/><section><div className="mb-3 flex items-center gap-2"><BarChart3 size={17} className="text-emerald-700"/><h2 className="text-sm font-semibold text-slate-950">Common activity summary</h2></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-3"><AnalyticsMetricCard label="Tracked actions" value={formatNumber(data.summary?.trackedActions)}/><AnalyticsMetricCard label="Records worked on" value={formatNumber(data.summary?.recordsWorkedOn)}/><AnalyticsMetricCard label="Last activity" value={formatDateTime(data.summary?.lastActivity)}/></div></section>{data.category === 'sales' && <SalesAnalytics data={data}/>} {data.category === 'marketing' && <MarketingAnalytics data={data}/>} {data.category === 'creator' && <CreatorAnalytics data={data}/>}<ActivityTimeline items={data.recentActivity}/></>}
  </div>;
};

export default TeamAnalyticsWorkspace;
