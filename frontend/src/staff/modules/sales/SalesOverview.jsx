import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, BadgeCheck, BookOpen, CheckCircle2, Clock3, CreditCard, FileText, Headphones, RefreshCw, Send, Sparkles, TimerOff, UserRoundPlus, WandSparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSalesDashboardApi } from '../../../services/api.js';
import SalesMetricCard from './components/SalesMetricCard';

const METRICS = [
  { key: 'totalExpertRequests', label: 'Total Expert Requests', view: 'all', icon: Headphones },
  { key: 'newRequests', label: 'New Requests', view: 'new', icon: UserRoundPlus },
  { key: 'dueTodayCount', label: 'Due Today', view: 'due_today', icon: Clock3 },
  { key: 'overdueCount', label: 'Overdue', view: 'overdue', icon: TimerOff },
  { key: 'inProgressCount', label: 'In Progress', view: 'in_progress', icon: RefreshCw },
  { key: 'qualifiedCount', label: 'Qualified', view: 'qualified', icon: CheckCircle2 }
];

const QUOTATION_METRICS = [
  { key: 'totalQuotations', label: 'Quotations', icon: FileText },
  { key: 'DRAFT', label: 'Draft Quotations', icon: FileText },
  { key: 'SENT', label: 'Sent Quotations', icon: Send },
  { key: 'APPROVED', label: 'Approved Quotations', icon: BadgeCheck }
];

const BOOKING_METRICS = [
  { key: 'totalBookings', label: 'Converted Bookings', icon: BookOpen },
  { key: 'pendingPaymentBookings', label: 'Pending Payment', icon: CreditCard },
  { key: 'paidBookings', label: 'Paid Bookings', icon: BadgeCheck }
];

const AI_PLANNER_METRICS = [
  { key: 'total', label: 'AI Planner Leads', icon: WandSparkles },
  { key: 'new', label: 'New', icon: UserRoundPlus },
  { key: 'inProgress', label: 'In Progress', icon: RefreshCw },
  { key: 'qualified', label: 'Qualified', icon: CheckCircle2 },
  { key: 'withQuotation', label: 'With Quotation', icon: FileText },
  { key: 'converted', label: 'Converted', icon: BadgeCheck }
];

const SalesOverview = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadMetrics = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const data = await getSalesDashboardApi();
      setMetrics(data?.metrics || {});
    } catch (loadError) {
      setError(loadError.message || 'Unable to load Sales metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Sales</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Sales workspace</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Work shared traveler requests, then create and track commercial quotations through the same Staff application.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadMetrics(true)}
          disabled={refreshing}
          className="flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
          Refresh
        </button>
      </section>

      {error ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-600" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-rose-900">Sales overview unavailable</h3>
              <p className="mt-1 text-sm text-rose-700">{error}</p>
              <button type="button" onClick={() => loadMetrics()} className="mt-3 text-sm font-semibold text-rose-800 underline underline-offset-4">Retry</button>
            </div>
          </div>
        </section>
      ) : (
        <section aria-label="Sales queue metrics">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {METRICS.map((metric) => (
              <SalesMetricCard
                key={metric.key}
                label={metric.label}
                value={loading ? 0 : metrics?.[metric.key]}
                icon={metric.icon}
                loading={loading}
              />
            ))}
          </div>
        </section>
      )}

      {!error && (
        <section aria-labelledby="ai-planner-metrics-title">
          <div className="mb-3 flex items-center justify-between gap-4"><div><h3 id="ai-planner-metrics-title" className="flex items-center gap-2 text-base font-semibold text-slate-950"><Sparkles size={17} className="text-violet-500" aria-hidden="true" /> AI Planner pipeline</h3><p className="mt-1 text-sm text-slate-500">Traveler enquiries linked to persisted AI plans.</p></div><Link to="/staff/sales/ai-planner-leads" className="flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800">Open AI Planner Leads <ArrowRight size={16} aria-hidden="true" /></Link></div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{AI_PLANNER_METRICS.map((metric) => <SalesMetricCard key={metric.key} label={metric.label} value={metrics?.aiPlanner?.[metric.key]} icon={metric.icon} loading={loading} />)}</div>
        </section>
      )}

      {!error && (
        <section aria-labelledby="quotation-metrics-title">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div><h3 id="quotation-metrics-title" className="text-base font-semibold text-slate-950">Quotation pipeline</h3><p className="mt-1 text-sm text-slate-500">Records visible to your current quotation permissions.</p></div>
            <Link to="/staff/sales/quotations" className="flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800">Open quotations <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {QUOTATION_METRICS.map((metric) => (
              <SalesMetricCard key={metric.key} label={metric.label} value={metric.key === 'totalQuotations' ? metrics?.totalQuotations : metrics?.quotationsByStatus?.[metric.key]} icon={metric.icon} loading={loading} />
            ))}
          </div>
        </section>
      )}

      {!error && (
        <section aria-labelledby="booking-metrics-title">
          <div className="mb-3 flex items-center justify-between gap-4"><div><h3 id="booking-metrics-title" className="text-base font-semibold text-slate-950">Booking handoff</h3><p className="mt-1 text-sm text-slate-500">Quotation-originated bookings visible to your Sales permissions.</p></div><Link to="/staff/sales/bookings" className="flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800">Open bookings <ArrowRight size={16} /></Link></div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{BOOKING_METRICS.map((metric) => <SalesMetricCard key={metric.key} label={metric.label} value={metrics?.[metric.key]} icon={metric.icon} loading={loading} />)}</div>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Queue shortcuts</h3>
            <p className="mt-1 text-sm text-slate-500">Open the same shared CRM with a focused view.</p>
          </div>
          <Link to="/staff/sales/expert-requests" className="hidden items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 sm:flex">
            Open all requests <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          {METRICS.slice(1, 5).map((item) => (
            <Link
              key={item.view}
              to={`/staff/sales/expert-requests?view=${item.view}`}
              className="group flex min-h-12 items-center justify-between rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
            >
              {item.label}
              <ArrowRight size={15} className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-700" aria-hidden="true" />
            </Link>
          ))}
          <Link to="/staff/sales/ai-planner-leads" className="group flex min-h-12 items-center justify-between rounded-lg border border-violet-200 bg-violet-50/50 px-4 text-sm font-medium text-violet-800 transition-colors hover:bg-violet-50">AI Planner Leads <ArrowRight size={15} className="text-violet-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
          <Link to="/staff/sales/quotations" className="group flex min-h-12 items-center justify-between rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800">Quotations <ArrowRight size={15} className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-700" aria-hidden="true" /></Link>
          <Link to="/staff/sales/bookings" className="group flex min-h-12 items-center justify-between rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800">Bookings <ArrowRight size={15} className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-700" aria-hidden="true" /></Link>
        </div>
      </section>
    </div>
  );
};

export default SalesOverview;
