const API_BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('wanderluxe_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const registerApi = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(userData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  return data;
};

export const loginApi = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(credentials)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Invalid email or password');
  }
  return data;
};

export const getMeApi = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch session');
  }
  return data;
};

export const addBookingApi = async (bookingData) => {
  const response = await fetch(`${API_BASE_URL}/auth/booking`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(bookingData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create booking');
  }
  return data;
};
