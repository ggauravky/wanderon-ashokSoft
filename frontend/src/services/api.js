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

export const updateProfileApi = async (profileData) => {
  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(profileData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update profile');
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

export const cancelBookingApi = async (bookingId) => {
  const response = await fetch(`${API_BASE_URL}/auth/booking/cancel`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ bookingId })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to cancel booking');
  }
  return data;
};

// Admin Endpoints
export const getAdminStatsApi = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/stats`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch admin stats');
  }
  return data;
};

export const getCouponsApi = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/coupons`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch coupons');
  }
  return data;
};

export const createCouponApi = async (couponData) => {
  const response = await fetch(`${API_BASE_URL}/admin/coupons`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(couponData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create coupon');
  }
  return data;
};

export const toggleCouponApi = async (couponId) => {
  const response = await fetch(`${API_BASE_URL}/admin/coupons/${couponId}/toggle`, {
    method: 'PUT',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to toggle coupon status');
  }
  return data;
};

export const deleteCouponApi = async (couponId) => {
  const response = await fetch(`${API_BASE_URL}/admin/coupons/${couponId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete coupon');
  }
  return data;
};

export const getAdminUsersApi = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch users');
  }
  return data;
};

export const updateUserRoleApi = async (userId, role) => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ role })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update user role');
  }
  return data;
};
