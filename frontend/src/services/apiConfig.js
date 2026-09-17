export const API_BASE_URL = String(import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

const NETWORK_ERROR_MESSAGE = 'Unable to reach the server. Please try again.';

export function getHeaders() {
  const token = localStorage.getItem('wanderluxe_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export function getApiErrorMessage(error, fallback = 'Something went wrong.') {
  const message = error?.response?.data?.message || error?.message;
  return typeof message === 'string' && message.trim() ? message.trim() : fallback;
}

export function toQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return;
    if (Array.isArray(value)) value.forEach((item) => query.append(key, String(item)));
    else query.set(key, String(value));
  });
  return query.toString();
}

export async function request(input, init) {
  try {
    return await globalThis.fetch(input, init);
  } catch (error) {
    const networkError = new Error(NETWORK_ERROR_MESSAGE);
    networkError.code = 'NETWORK_ERROR';
    networkError.cause = error;
    throw networkError;
  }
}

export async function parseApiResponse(response) {
  let text;
  try {
    text = await response.text();
  } catch (error) {
    const networkError = new Error(NETWORK_ERROR_MESSAGE);
    networkError.code = 'NETWORK_ERROR';
    networkError.cause = error;
    throw networkError;
  }

  if (!text.trim()) {
    return response.ok
      ? null
      : { success: false, message: `Server request failed (${response.status || 'network error'}).` };
  }

  try {
    return JSON.parse(text);
  } catch {
    if (!response.ok) {
      return { success: false, message: 'The server returned an invalid error response. Please try again.' };
    }
    throw new Error('The server returned an invalid response. Please try again.');
  }
}
