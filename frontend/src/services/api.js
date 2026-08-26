const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function getHeaders() {
  const token = localStorage.getItem('wanderluxe_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function registerApi(userData) {
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
}

export async function loginApi(credentials) {
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
}

export async function influencerLoginApi(credentials) {
  const response = await fetch(`${API_BASE_URL}/auth/influencer-login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(credentials)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Invalid creator credentials or unapproved status.');
  }
  return data;
}

export async function influencerApplyApi(applicationData) {
  const response = await fetch(`${API_BASE_URL}/auth/influencer-apply`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(applicationData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to submit influencer application');
  }
  return data;
}

export async function getMeApi() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch session');
  }
  return data;
}

export async function updateProfileApi(profileData) {
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
}

export async function addBookingApi(bookingData) {
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
}

export async function cancelBookingApi(bookingId) {
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
}

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

export async function getAdminStatsApi(range = '30d') {
  const response = await fetch(`${API_BASE_URL}/admin/stats?range=${range}`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch admin stats');
  }
  return data;
}

export async function getCouponsApi() {
  const response = await fetch(`${API_BASE_URL}/admin/coupons`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch coupons');
  }
  return data;
}

export async function createCouponApi(couponData) {
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
}

export async function toggleCouponApi(couponId) {
  const response = await fetch(`${API_BASE_URL}/admin/coupons/${couponId}/toggle`, {
    method: 'PUT',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to toggle coupon status');
  }
  return data;
}

export async function deleteCouponApi(couponId) {
  const response = await fetch(`${API_BASE_URL}/admin/coupons/${couponId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete coupon');
  }
  return data;
}

export async function getAdminUsersApi() {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch users');
  }
  return data;
}

export async function updateUserRoleApi(userId, role) {
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
}

export async function getAdminBookingsApi() {
  const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch admin bookings');
  }
  return data;
}

// Influencer Verification Endpoints (Database-Driven)
export async function getInfluencerApplicationsApi() {
  const response = await fetch(`${API_BASE_URL}/admin/influencer-applications`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch influencer applications');
  }
  return data;
}

export async function approveInfluencerApplicationApi(userId) {
  const response = await fetch(`${API_BASE_URL}/admin/influencer-applications/${userId}/approve`, {
    method: 'PUT',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to approve application');
  }
  return data;
}

export async function rejectInfluencerApplicationApi(userId, reason) {
  const response = await fetch(`${API_BASE_URL}/admin/influencer-applications/${userId}/reject`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ reason })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to reject application');
  }
  return data;
}

// Trip SEO API
export async function updateTripSeoApi(tripId, seoData) {
  const response = await fetch(`${API_BASE_URL}/admin/trips/${tripId}/seo`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(seoData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update trip SEO');
  }
  return data;
}

// Influencer & Checkout Server APIs
export async function validateCouponServerApi(code, bookingAmount, planId) {
  const response = await fetch(`${API_BASE_URL}/checkout/coupon/validate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ code, bookingAmount, planId })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Coupon validation failed');
  }
  return data;
}

export async function getInfluencerPlansApi() {
  const response = await fetch(`${API_BASE_URL}/influencer/plans`, {
    method: 'GET',
    headers: getHeaders()
  });
  return response.json();
}

export async function generateCouponApi(planData) {
  const response = await fetch(`${API_BASE_URL}/influencer/coupons`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(planData)
  });
  return response.json();
}

export async function getWalletSummaryApi() {
  const response = await fetch(`${API_BASE_URL}/influencer/wallet`, {
    method: 'GET',
    headers: getHeaders()
  });
  return response.json();
}

export async function requestPayoutApi(amount, destination) {
  const response = await fetch(`${API_BASE_URL}/influencer/payouts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ amount, destination })
  });
  return response.json();
}

// ==========================================
// REAL BOOKING & RAZORPAY TEST PAYMENT APIS
// ==========================================

export async function calculateBookingPricingApi(pricingPayload) {
  const response = await fetch(`${API_BASE_URL}/bookings/calculate-pricing`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(pricingPayload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to calculate booking pricing');
  }
  return data.pricing || data;
}

export async function createBookingOrderApi(bookingPayload) {
  const response = await fetch(`${API_BASE_URL}/bookings/create-order`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(bookingPayload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to initialize booking order');
  }
  return data;
}

export async function verifyBookingPaymentApi(verificationPayload) {
  const response = await fetch(`${API_BASE_URL}/bookings/verify-payment`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(verificationPayload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Payment verification failed');
  }
  return data;
}

export async function getMyBookingsApi() {
  const response = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch user bookings');
  }
  return data;
}

export async function getBookingByIdApi(bookingId) {
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch booking details');
  }
  return data;
}

export async function getBoardingPassApi(bookingId) {
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/boarding-pass`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch boarding pass document');
  }
  return data.boardingPass || data;
}

export async function getProvisionalLetterApi(bookingId) {
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/provisional-letter`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch provisional booking letter');
  }
  return data.provisionalLetter || data;
}

export async function payRemainingBalanceApi(bookingId) {
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/pay-balance`, {
    method: 'POST',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to initialize balance payment');
  }
  return data;
}

export async function verifyRemainingBalanceApi(bookingId, verificationPayload) {
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/verify-balance`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(verificationPayload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Balance payment verification failed');
  }
  return data;
}

export async function verifyBookingTokenApi(token) {
  const response = await fetch(`${API_BASE_URL}/bookings/verify/${token}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify booking token');
  }
  return data;
}

// ==========================================
// TRIPS, LEADS, REVIEWS & DYNAMIC PAGES APIS
// ==========================================

export async function getTripsApi(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/trips${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch trips');
  }
  return data.data || data;
}

export async function getTripByIdOrSlugApi(idOrSlug) {
  const response = await fetch(`${API_BASE_URL}/trips/${idOrSlug}`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch trip details');
  }
  return data.data || data;
}

export async function createLeadApi(leadData) {
  const response = await fetch(`${API_BASE_URL}/leads`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(leadData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to submit inquiry lead');
  }
  return data;
}

export async function getAdminLeadsApi() {
  const response = await fetch(`${API_BASE_URL}/leads`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch leads');
  }
  return Array.isArray(data) ? data : (data.data || []);
}

export async function updateLeadStatusApi(leadId, statusPayload) {
  const body = typeof statusPayload === 'string' ? { status: statusPayload } : statusPayload;
  const response = await fetch(`${API_BASE_URL}/leads/${leadId}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update lead status');
  }
  return data;
}

export async function getTripReviewsApi(tripId) {
  const response = await fetch(`${API_BASE_URL}/reviews/trip/${tripId}`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch reviews');
  }
  return data.data || data;
}

export async function createReviewApi(reviewPayload) {
  const response = await fetch(`${API_BASE_URL}/reviews`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(reviewPayload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to submit review');
  }
  return data.data || data;
}

// ================================================================
// AI ITINERARY & SHARING API HELPERS
// ================================================================

export async function generateAIItineraryApi(params) {
  const response = await fetch(`${API_BASE_URL}/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to generate AI itinerary');
  }
  return data.data;
}

export async function saveAIItineraryApi(itineraryData) {
  const response = await fetch(`${API_BASE_URL}/ai/save`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(itineraryData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to save itinerary');
  }
  return data.data;
}

export async function updateAIItineraryApi(id, itineraryData) {
  const response = await fetch(`${API_BASE_URL}/ai/itinerary/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(itineraryData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update itinerary');
  }
  return data.data;
}

export async function getAIItineraryByIdApi(id) {
  const response = await fetch(`${API_BASE_URL}/ai/itinerary/${id}`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch itinerary');
  }
  return data.data;
}

export async function getMySavedItinerariesApi() {
  const response = await fetch(`${API_BASE_URL}/ai/my-itineraries`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch saved itineraries');
  }
  return data.data || [];
}

export async function deleteSavedItineraryApi(id) {
  const response = await fetch(`${API_BASE_URL}/ai/itinerary/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete itinerary');
  }
  return data;
}

export async function toggleShareItineraryApi(id, enable = true) {
  const response = await fetch(`${API_BASE_URL}/ai/itinerary/${id}/share`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ enable })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to toggle share settings');
  }
  return data;
}

export async function getPublicSharedItineraryApi(shareToken) {
  const response = await fetch(`${API_BASE_URL}/ai/shared/${shareToken}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to load shared itinerary');
  }
  return data.data;
}

export async function regenerateDayApi(payload) {
  const response = await fetch(`${API_BASE_URL}/ai/regenerate-day`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to regenerate day');
  }
  return data.data;
}

// ==========================================
// MASTER ADMIN TRIP CMS & MEDIA APIS
// ==========================================

export async function getAdminTripsApi() {
  const response = await fetch(`${API_BASE_URL}/trips?includeDrafts=true`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch trips');
  }
  return data.data || [];
}

export async function createTripApi(tripData) {
  const response = await fetch(`${API_BASE_URL}/trips`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(tripData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create trip package');
  }
  return data.data || data;
}

export async function updateTripApi(tripId, tripData) {
  const response = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(tripData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update trip package');
  }
  return data.data || data;
}

export async function deleteTripApi(tripId) {
  const response = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete trip package');
  }
  return data;
}

// Media / Image Upload API (Cloudinary + Local Fallback)
export async function uploadImageApi(file, folder = 'wanderluxe/trips') {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);

  const token = localStorage.getItem('wanderluxe_token');
  const response = await fetch(`${API_BASE_URL}/upload/image`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload image asset');
  }
  return data.data;
}

// ==========================================
// MASTER ADMIN DYNAMIC PAGES CMS APIS
// ==========================================

export async function getAllAdminPagesApi() {
  const response = await fetch(`${API_BASE_URL}/pages`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch dynamic pages');
  }
  return Array.isArray(data) ? data : (data.pages || []);
}

export async function getPageBySlugApi(slug) {
  const response = await fetch(`${API_BASE_URL}/pages/${slug}`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Page not found');
  }
  return data;
}

export async function createPageApi(pageData) {
  const response = await fetch(`${API_BASE_URL}/pages`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(pageData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create page');
  }
  return data.page || data;
}

export async function updatePageApi(pageId, pageData) {
  const response = await fetch(`${API_BASE_URL}/pages/${pageId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(pageData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update page');
  }
  return data.page || data;
}

export async function deletePageApi(pageId) {
  const response = await fetch(`${API_BASE_URL}/pages/${pageId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete page');
  }
  return data;
}

export default {
  getHeaders,
  registerApi,
  loginApi,
  influencerLoginApi,
  influencerApplyApi,
  getMeApi,
  updateProfileApi,
  addBookingApi,
  cancelBookingApi,
  getAdminStatsApi,
  getCouponsApi,
  createCouponApi,
  toggleCouponApi,
  deleteCouponApi,
  getAdminUsersApi,
  updateUserRoleApi,
  getAdminBookingsApi,
  getInfluencerApplicationsApi,
  approveInfluencerApplicationApi,
  rejectInfluencerApplicationApi,
  updateTripSeoApi,
  validateCouponServerApi,
  getInfluencerPlansApi,
  generateCouponApi,
  getWalletSummaryApi,
  requestPayoutApi,
  calculateBookingPricingApi,
  createBookingOrderApi,
  verifyBookingPaymentApi,
  getMyBookingsApi,
  getBookingByIdApi,
  getBoardingPassApi,
  getProvisionalLetterApi,
  payRemainingBalanceApi,
  verifyRemainingBalanceApi,
  verifyBookingTokenApi,
  getTripsApi,
  getTripByIdOrSlugApi,
  createLeadApi,
  getAdminLeadsApi,
  updateLeadStatusApi,
  getTripReviewsApi,
  createReviewApi,
  generateAIItineraryApi,
  saveAIItineraryApi,
  updateAIItineraryApi,
  getAIItineraryByIdApi,
  getMySavedItinerariesApi,
  deleteSavedItineraryApi,
  toggleShareItineraryApi,
  getPublicSharedItineraryApi,
  regenerateDayApi,
  getAdminTripsApi,
  createTripApi,
  updateTripApi,
  deleteTripApi,
  uploadImageApi,
  getAllAdminPagesApi,
  getPageBySlugApi,
  createPageApi,
  updatePageApi,
  deletePageApi
};
