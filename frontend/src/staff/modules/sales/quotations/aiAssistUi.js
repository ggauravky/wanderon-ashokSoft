const indexedFields = new Set(['itinerary', 'hotel', 'transport', 'activity', 'addon']);

export const getAiKey = (field, index = 0) => indexedFields.has(String(field).split('.')[0])
  ? `${field}:${index}`
  : field;

export const hasMeaningfulSuggestion = (value) => {
  if (typeof value === 'string') return Boolean(value.trim());
  if (Array.isArray(value)) return value.some((item) => typeof item === 'object'
    ? Boolean(String(item?.description || '').trim())
    : Boolean(String(item || '').trim()));
  if (value && typeof value === 'object') return Object.values(value).some(hasMeaningfulSuggestion);
  return false;
};

export const normalizeSuggestionLine = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

export const getAiSuggestionSourceLabel = ({ source, provider } = {}) => ({
  ai: 'AI suggestion',
  fallback: 'Safe fallback',
  quotation: 'Generated from quotation',
  deterministic: 'Smart default',
  default: 'Smart default'
})[source] || ({
  gemini: 'AI suggestion',
  fallback: 'Safe fallback',
  deterministic: 'Smart default'
})[provider] || 'Smart default';

export const mergeSelectedSuggestionLines = (current = [], selected = [], replace = false) => {
  const result = replace ? [] : [...current];
  const seen = new Set(result.map(normalizeSuggestionLine).filter(Boolean));
  selected.forEach((line) => {
    const normalized = normalizeSuggestionLine(line);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(String(line).trim());
  });
  return result;
};

export const getAiAssistVisualState = ({ key, busyKey, readyKey, mode = 'generate', blocked = false } = {}) => {
  if (busyKey === key) return {
    state: 'busy',
    label: mode === 'improve' ? 'Improving text…' : mode === 'format' ? 'Formatting…' : 'AI is writing…',
    disabled: true
  };
  if (readyKey === key) return { state: 'ready', label: 'Suggestion ready', disabled: true };
  if (blocked) return { state: 'blocked', label: 'Wait for the current AI suggestion.', disabled: true };
  return { state: 'idle', label: 'Create suggestion', disabled: false };
};
