const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseDateOnly = (value, label) => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (!DATE_ONLY_PATTERN.test(raw)) {
    throw Object.assign(new Error(`Invalid ${label} date filter.`), { status: 400 });
  }

  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) {
    throw Object.assign(new Error(`Invalid ${label} date filter.`), { status: 400 });
  }
  return date;
};

export const buildCreatedAtRange = (dateFrom, dateTo, label = 'record') => {
  const from = parseDateOnly(dateFrom, label);
  const to = parseDateOnly(dateTo, label);
  if (!from && !to) return null;

  const range = {};
  if (from) range.$gte = from;
  if (to) {
    const exclusiveEnd = new Date(to);
    exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
    range.$lt = exclusiveEnd;
  }
  if (from && range.$lt && from >= range.$lt) {
    throw Object.assign(new Error(`Invalid ${label} date range.`), { status: 400 });
  }
  return range;
};
