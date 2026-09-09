/**
 * Itinerary Formatting Utilities for PDF & Web Travel Dossiers
 */

const MONTH_ORDER = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Intelligently compresses a list or comma-separated string of recommended months into a clean range.
 * e.g., "October, November, December, January, February, March, April, May" -> "Oct – May"
 * e.g., "March, April, May" -> "Mar – May"
 * e.g., "All Year" -> "All Year Round"
 */
export const formatBestTimeToVisit = (input) => {
  if (!input) return 'All Season';
  if (typeof input !== 'string' && !Array.isArray(input)) return String(input);

  const rawStr = Array.isArray(input) ? input.join(', ') : input;
  const lower = rawStr.toLowerCase();

  // Already a formatted range
  if (lower.includes(' to ') || lower.includes(' - ') || lower.includes(' – ')) {
    const parts = rawStr.split(/\s+(?:to|-|–)\s+/i);
    if (parts.length === 2) {
      const startIdx = MONTH_ORDER.findIndex(m => m.startsWith(parts[0].trim().toLowerCase().slice(0, 3)));
      const endIdx = MONTH_ORDER.findIndex(m => m.startsWith(parts[1].trim().toLowerCase().slice(0, 3)));
      if (startIdx !== -1 && endIdx !== -1) {
        return `${MONTH_SHORT[startIdx]} – ${MONTH_SHORT[endIdx]}`;
      }
    }
    return rawStr;
  }

  // Extract identified months in order of appearance
  const words = rawStr.split(/[,\s/&]+/).map(w => w.trim().toLowerCase()).filter(Boolean);
  const matchedIndices = [];

  for (const word of words) {
    const idx = MONTH_ORDER.findIndex(m => m.startsWith(word.slice(0, 3)));
    if (idx !== -1 && !matchedIndices.includes(idx)) {
      matchedIndices.push(idx);
    }
  }

  if (matchedIndices.length === 0) {
    return rawStr.length > 25 ? `${rawStr.slice(0, 22)}...` : rawStr;
  }

  // If covers all 12 months
  if (matchedIndices.length === 12) {
    return 'All Year Round';
  }

  // If only 1 or 2 months
  if (matchedIndices.length === 1) {
    return MONTH_SHORT[matchedIndices[0]];
  }
  if (matchedIndices.length === 2) {
    return `${MONTH_SHORT[matchedIndices[0]]} & ${MONTH_SHORT[matchedIndices[1]]}`;
  }

  // Check if indices form a contiguous circular sequence on the 12-month calendar
  let isContiguous = true;
  for (let i = 0; i < matchedIndices.length - 1; i++) {
    const curr = matchedIndices[i];
    const next = matchedIndices[i + 1];
    const expectedNext = (curr + 1) % 12;
    if (next !== expectedNext) {
      isContiguous = false;
      break;
    }
  }

  if (isContiguous) {
    const firstMonth = MONTH_SHORT[matchedIndices[0]];
    const lastMonth = MONTH_SHORT[matchedIndices[matchedIndices.length - 1]];
    return `${firstMonth} – ${lastMonth}`;
  }

  // If not contiguous, return comma-separated short month names
  return matchedIndices.map(i => MONTH_SHORT[i]).join(', ');
};

/**
 * Formats currency amount into clean INR display
 */
export const formatCurrency = (val) => {
  if (!val && val !== 0) return 'Estimated';
  const num = typeof val === 'number' ? val : Number(String(val).replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return String(val);
  return `₹${num.toLocaleString('en-IN')}`;
};

/**
 * Sanitizes destination/title for filenames and print headings
 */
export const sanitizeFilename = (title) => {
  if (!title) return 'WanderLuxe-Travel-Itinerary';
  return title
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .trim()
    .replace(/\s+/g, '-');
};
