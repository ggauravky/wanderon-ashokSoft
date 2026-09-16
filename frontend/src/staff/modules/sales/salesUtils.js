const CLOSED_STATUSES = new Set(['CONVERTED', 'LOST']);

export const getLeadId = (lead) => lead?._id || lead?.id;

export const getTripTitle = (lead) => (
  lead?.tripTitle || lead?.tripTitleSnapshot || lead?.tripRef?.title || lead?.destination || 'Not provided'
);

export const formatDateTime = (value, fallback = '—') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDate = (value, fallback = '—') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Price on request';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const getCallbackState = (lead) => {
  if (CLOSED_STATUSES.has(lead?.status)) {
    return { id: 'closed', label: 'Closed', classes: 'border-slate-200 bg-slate-100 text-slate-600' };
  }

  const rawDate = lead?.preferredCallDate;
  if (!rawDate) {
    return { id: 'flexible', label: 'Flexible', classes: 'border-slate-200 bg-slate-50 text-slate-600' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const callbackDate = new Date(`${rawDate}T00:00:00`);
  if (Number.isNaN(callbackDate.getTime())) {
    return { id: 'flexible', label: 'Flexible', classes: 'border-slate-200 bg-slate-50 text-slate-600' };
  }

  if (callbackDate < today) {
    return { id: 'overdue', label: 'Overdue', classes: 'border-rose-200 bg-rose-50 text-rose-700' };
  }
  if (callbackDate.getTime() === today.getTime()) {
    return { id: 'due_today', label: 'Due today', classes: 'border-amber-200 bg-amber-50 text-amber-800' };
  }
  return { id: 'upcoming', label: 'Upcoming', classes: 'border-sky-200 bg-sky-50 text-sky-700' };
};

export const getLastActivity = (lead) => {
  const outcomes = Array.isArray(lead?.callOutcomes) ? lead.callOutcomes : [];
  const latestOutcome = outcomes
    .filter((item) => item?.loggedAt)
    .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))[0];

  if (latestOutcome) {
    return {
      label: latestOutcome.outcome?.replaceAll('_', ' ') || 'Contact logged',
      at: latestOutcome.loggedAt,
      by: latestOutcome.loggedByName || ''
    };
  }
  if (lead?.lastContactAt) return { label: 'Last contact', at: lead.lastContactAt, by: '' };
  if (lead?.nextFollowUpAt) return { label: 'Follow-up scheduled', at: lead.nextFollowUpAt, by: '' };
  return { label: 'No activity yet', at: null, by: '' };
};

export const normalizePhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

export const getStatusClasses = (status) => ({
  NEW: 'border-sky-200 bg-sky-50 text-sky-700',
  CONTACTED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  IN_PROGRESS: 'border-amber-200 bg-amber-50 text-amber-800',
  QUALIFIED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CONVERTED: 'border-teal-200 bg-teal-50 text-teal-700',
  LOST: 'border-slate-200 bg-slate-100 text-slate-600'
}[status] || 'border-slate-200 bg-slate-50 text-slate-600');

export const getPriorityClasses = (priority) => ({
  LOW: 'text-slate-500',
  MEDIUM: 'text-sky-700',
  HIGH: 'text-amber-700',
  URGENT: 'text-rose-700'
}[priority] || 'text-slate-500');
