export const SALES_QUICK_VIEWS = Object.freeze([
  Object.freeze({ id: 'all', label: 'All' }),
  Object.freeze({ id: 'new', label: 'New' }),
  Object.freeze({ id: 'due_today', label: 'Due Today' }),
  Object.freeze({ id: 'overdue', label: 'Overdue' }),
  Object.freeze({ id: 'in_progress', label: 'In Progress' }),
  Object.freeze({ id: 'qualified', label: 'Qualified' })
]);

export const SALES_VIEW_IDS = new Set(SALES_QUICK_VIEWS.map((view) => view.id));

export const LEAD_STATUSES = Object.freeze([
  'NEW',
  'CONTACTED',
  'IN_PROGRESS',
  'QUALIFIED',
  'CONVERTED',
  'LOST'
]);

export const CONTACT_OUTCOMES = Object.freeze([
  Object.freeze({ value: 'CONNECTED', label: 'Connected' }),
  Object.freeze({ value: 'NO_ANSWER', label: 'No answer' }),
  Object.freeze({ value: 'BUSY', label: 'Line busy' }),
  Object.freeze({ value: 'CALL_LATER', label: 'Call later' }),
  Object.freeze({ value: 'WHATSAPP_SENT', label: 'WhatsApp sent' }),
  Object.freeze({ value: 'EMAIL_SENT', label: 'Email sent' }),
  Object.freeze({ value: 'WRONG_NUMBER', label: 'Wrong number' })
]);

export const LOST_REASONS = Object.freeze([
  'Not Interested',
  'Budget',
  'Travel Dates',
  'Unreachable',
  'Booked Elsewhere',
  'Other'
]);

export const getMetricValue = (metrics, viewId) => {
  const metricKeys = {
    all: 'totalExpertRequests',
    new: 'newRequests',
    due_today: 'dueTodayCount',
    overdue: 'overdueCount',
    in_progress: 'inProgressCount',
    qualified: 'qualifiedCount'
  };

  return Number(metrics?.[metricKeys[viewId]] || 0);
};
