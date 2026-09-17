const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export * from './quotationService.js';

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

export async function getCouponsApi(params = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== 'all')).toString();
  const response = await fetch(`${API_BASE_URL}/admin/coupons${query ? `?${query}` : ''}`, {
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

export async function updateCouponApi(couponId, couponData) {
  const response = await fetch(`${API_BASE_URL}/admin/coupons/${encodeURIComponent(couponId)}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(couponData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update coupon');
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

export async function getAdminPayoutsApi(params = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== 'all')).toString();
  const response = await fetch(`${API_BASE_URL}/admin/payouts${query ? `?${query}` : ''}`, { headers: getHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch payouts');
  return data;
}

export async function getAdminPayoutApi(payoutId) {
  const response = await fetch(`${API_BASE_URL}/admin/payouts/${encodeURIComponent(payoutId)}`, { headers: getHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch payout');
  return data.payout || data;
}

export async function getEligiblePayoutCreatorsApi() {
  const response = await fetch(`${API_BASE_URL}/admin/payouts/eligible-creators`, { headers: getHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch eligible creators');
  return data.creators || [];
}

export async function createPayoutApi(payload) {
  const response = await fetch(`${API_BASE_URL}/admin/payouts`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create payout');
  return data.payout || data;
}

export async function updatePayoutStatusApi(payoutId, action, reason = '') {
  const response = await fetch(`${API_BASE_URL}/admin/payouts/${encodeURIComponent(payoutId)}/status`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ action, reason }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update payout');
  return data.payout || data;
}

export async function getAdminUsersApi(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([key, value]) => key !== 'envelope' && value !== undefined && value !== null && value !== '' && value !== 'all')
  ).toString();
  const response = await fetch(`${API_BASE_URL}/admin/users${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch users');
  }
  return params.envelope ? data : (data.users || data);
}

export async function getAdminUserByIdApi(userId) {
  const response = await fetch(`${API_BASE_URL}/admin/users/${encodeURIComponent(userId)}`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch user details');
  return data;
}

export async function createAdminStaffUserApi(staffData) {
  const response = await fetch(`${API_BASE_URL}/admin/users/staff`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(staffData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create staff account');
  return data.user || data;
}

export async function updateUserRoleApi(userId, role, options = {}) {
  const response = await fetch(`${API_BASE_URL}/admin/users/${encodeURIComponent(userId)}/role`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ role, confirmSelfChange: options.confirmSelfChange === true })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update user role');
  }
  return data.user || data;
}

export async function updateUserAccountStatusApi(userId, isActive, options = {}) {
  const response = await fetch(`${API_BASE_URL}/admin/users/${encodeURIComponent(userId)}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ isActive, confirmSelfChange: options.confirmSelfChange === true })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update account status');
  return data.user || data;
}

export async function getAdminBookingsApi(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([key, value]) => key !== 'envelope' && value !== undefined && value !== null && value !== '' && value !== 'all')
  ).toString();
  const response = await fetch(`${API_BASE_URL}/admin/bookings${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch admin bookings');
  }
  return params.envelope ? data : (data.bookings || data);
}

export async function getAdminBookingByIdApi(bookingId) {
  const response = await fetch(`${API_BASE_URL}/admin/bookings/${encodeURIComponent(bookingId)}`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch booking details');
  return data.booking || data;
}

export async function cancelBookingRecordApi(bookingId, reason) {
  const response = await fetch(`${API_BASE_URL}/bookings/${encodeURIComponent(bookingId)}/cancel`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ reason })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to cancel booking');
  return data;
}

export async function resendBookingWhatsAppApi(bookingId) {
  const response = await fetch(`${API_BASE_URL}/bookings/${encodeURIComponent(bookingId)}/send-whatsapp`, {
    method: 'POST',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to process WhatsApp notification');
  return data;
}

// Influencer Verification Endpoints (Database-Driven)
export async function getInfluencerApplicationsApi(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([key, value]) => key !== 'envelope' && value !== undefined && value !== null && value !== '' && value !== 'all')
  ).toString();
  const response = await fetch(`${API_BASE_URL}/admin/influencer-applications${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch influencer applications');
  }
  return params.envelope ? data : (data.applications || data);
}

export async function getInfluencerApplicationByIdApi(userId) {
  const response = await fetch(`${API_BASE_URL}/admin/influencer-applications/${encodeURIComponent(userId)}`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch creator application');
  return data.application || data;
}

export async function approveInfluencerApplicationApi(userId, notes = '') {
  const response = await fetch(`${API_BASE_URL}/admin/influencer-applications/${encodeURIComponent(userId)}/approve`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ notes })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to approve application');
  }
  return data;
}

export async function rejectInfluencerApplicationApi(userId, reason) {
  const response = await fetch(`${API_BASE_URL}/admin/influencer-applications/${encodeURIComponent(userId)}/reject`, {
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
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch eligible plans');
  return data.plans || data;
}

export async function generateCouponApi(planData) {
  const response = await fetch(`${API_BASE_URL}/influencer/coupons`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(planData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to generate coupon');
  return data.coupon || data;
}

export async function getInfluencerCouponsApi() {
  const response = await fetch(`${API_BASE_URL}/influencer/coupons`, { headers: getHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch creator coupons');
  return data.coupons || data;
}

export async function getWalletSummaryApi() {
  const response = await fetch(`${API_BASE_URL}/influencer/wallet`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch wallet summary');
  return data.wallet || data;
}

export async function getWalletTransactionsApi() {
  const response = await fetch(`${API_BASE_URL}/influencer/wallet/transactions`, { headers: getHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch wallet transactions');
  return data.transactions || data;
}

export async function getInfluencerPayoutsApi() {
  const response = await fetch(`${API_BASE_URL}/influencer/payouts`, { headers: getHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch payout history');
  return data.payouts || data;
}

export async function requestPayoutApi(amount, destination) {
  const response = await fetch(`${API_BASE_URL}/influencer/payouts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ amount, destination })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to request payout');
  return data.payout || data;
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

export async function getSalesBookingsApi(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ).toString();
  const response = await fetch(`${API_BASE_URL}/bookings/staff/sales${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch Sales bookings');
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

export async function getAdminLeadsApi(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'all') {
      query.append(key, val);
    }
  });
  const queryString = query.toString() ? `?${query.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/leads${queryString}`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch leads');
  }
  if (params.envelope) {
    return data;
  }
  return Array.isArray(data) ? data : (data.items || data.leads || data.data || []);
}

export async function getLeadByIdApi(leadId) {
  const response = await fetch(`${API_BASE_URL}/leads/${leadId}`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch lead details');
  }
  return data.lead || data;
}

export async function claimLeadApi(leadId) {
  const response = await fetch(`${API_BASE_URL}/leads/${leadId}/claim`, {
    method: 'POST',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to claim lead');
  }
  return data;
}

export async function logLeadContactApi(leadId, contactPayload) {
  const response = await fetch(`${API_BASE_URL}/leads/${leadId}/log-contact`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(contactPayload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to log contact outcome');
  }
  return data;
}

export async function getSalesUsersApi() {
  const response = await fetch(`${API_BASE_URL}/leads/sales-users`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch sales users');
  }
  return data.users || [];
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

export async function assignLeadApi(leadId, assignPayload) {
  const body = typeof assignPayload === 'string'
    ? { assignedToName: assignPayload }
    : assignPayload;
  const response = await fetch(`${API_BASE_URL}/leads/${leadId}/assign`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to assign lead');
  }
  return data;
}

// CRM FOLLOW-UP APIS
export async function getFollowUpsApi(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'All') {
      query.append(key, val);
    }
  });
  const queryString = query.toString() ? `?${query.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/follow-ups${queryString}`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch follow-ups');
  }
  return data.followUps || [];
}

export async function createFollowUpApi(followUpData) {
  const response = await fetch(`${API_BASE_URL}/follow-ups`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(followUpData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create follow-up');
  }
  return data;
}

export async function updateFollowUpApi(id, followUpData) {
  const response = await fetch(`${API_BASE_URL}/follow-ups/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(followUpData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update follow-up');
  }
  return data;
}

export async function completeFollowUpApi(id, payload = {}) {
  const response = await fetch(`${API_BASE_URL}/follow-ups/${id}/complete`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to complete follow-up');
  }
  return data;
}

export async function deleteFollowUpApi(id) {
  const response = await fetch(`${API_BASE_URL}/follow-ups/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete follow-up');
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

export async function getAdminTripsApi(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== 'all')
  ).toString();
  const response = await fetch(`${API_BASE_URL}/trips/admin/catalog${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch trips');
  }
  return data.data || [];
}

export async function getAdminTripByIdApi(tripId) {
  const response = await fetch(`${API_BASE_URL}/trips/admin/catalog/${encodeURIComponent(tripId)}`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch trip');
  return data.data;
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

// Staff Media / Image Upload API (Cloudinary)
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

export async function getAllAdminPagesApi(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([key, value]) => key !== 'envelope' && value !== undefined && value !== null && value !== '' && value !== 'all')
  ).toString();
  const response = await fetch(`${API_BASE_URL}/pages/admin${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch dynamic pages');
  }
  return params.envelope ? data : (data.pages || []);
}

export async function getAdminPageByIdApi(pageId) {
  const response = await fetch(`${API_BASE_URL}/pages/admin/${encodeURIComponent(pageId)}`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch CMS page');
  return data.page || data;
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

// ==========================================
// QUOTATION BUILDER & MANAGEMENT APIS (PHASE 2)
// ==========================================
export async function calculateQuotationPricingPreviewApi(quotationData) {
  const response = await fetch(`${API_BASE_URL}/quotations/calculate-preview`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(quotationData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to calculate quotation pricing');
  return data;
}

export async function createQuotationApi(quotationData) {
  const response = await fetch(`${API_BASE_URL}/quotations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(quotationData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create quotation');
  return data;
}

export async function getQuotationsApi(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/quotations${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch quotations');
  return data;
}

export async function getQuotationByIdApi(id) {
  const response = await fetch(`${API_BASE_URL}/quotations/${id}`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch quotation details');
  return data;
}

export async function updateQuotationApi(id, quotationData) {
  const response = await fetch(`${API_BASE_URL}/quotations/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(quotationData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update quotation');
  return data;
}

export async function deleteQuotationApi(id) {
  const response = await fetch(`${API_BASE_URL}/quotations/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to delete quotation');
  return data;
}

export async function sendQuotationApi(id) {
  const response = await fetch(`${API_BASE_URL}/quotations/${id}/send`, {
    method: 'POST',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to send quotation');
  return data;
}

export async function approveQuotationApi(id, payload = {}) {
  const response = await fetch(`${API_BASE_URL}/quotations/${id}/approve`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to approve quotation');
  return data;
}

export async function rejectQuotationApi(id, payload = {}) {
  const response = await fetch(`${API_BASE_URL}/quotations/${id}/reject`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to reject quotation');
  return data;
}

export async function convertQuotationToTripApi(id) {
  const response = await fetch(`${API_BASE_URL}/quotations/${id}/convert-to-trip`, {
    method: 'POST',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to convert quotation to trip');
  return data;
}

export async function createBookingFromQuotationApi(id) {
  const response = await fetch(`${API_BASE_URL}/quotations/${id}/create-booking`, {
    method: 'POST',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to convert quotation to booking');
  return data;
}

export async function createQuotationRevisionApi(id, payload = {}) {
  const response = await fetch(`${API_BASE_URL}/quotations/${id}/create-revision`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create quotation revision');
  return data;
}

export async function getPublicQuotationByTokenApi(token) {
  const response = await fetch(`${API_BASE_URL}/quotations/public/${token}`, {
    method: 'GET'
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to load quotation proposal');
  return data;
}

export async function updatePublicSelectedOptionsApi(token, payload) {
  const response = await fetch(`${API_BASE_URL}/quotations/public/${token}/select-options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update proposal options');
  return data;
}

export async function customerQuotationDecisionApi(token, payload) {
  const response = await fetch(`${API_BASE_URL}/quotations/public/${token}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to record customer decision');
  return data;
}

// ================================================================
// LOCATION MEDIA ASSETS API HELPERS
// ================================================================

export async function listMediaAssetsApi(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([key, value]) => key !== 'admin' && value !== undefined && value !== null && value !== '' && (value !== 'all' || key === 'active'))
  ).toString();
  const url = `${API_BASE_URL}/media${params.admin ? '/admin' : ''}${query ? `?${query}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to list media assets');
  return data;
}

export async function getMediaAssetByIdApi(id) {
  const response = await fetch(`${API_BASE_URL}/media/${id}`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch media asset');
  return data.data;
}

export async function resolveItineraryMediaApi(payload) {
  const response = await fetch(`${API_BASE_URL}/media/resolve-itinerary`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to resolve itinerary media');
  return data.data;
}

export async function getMediaCoverageReportApi(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/media/coverage${query ? `?${query}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch media coverage report');
  return data.data;
}

export async function createMediaAssetApi(assetData) {
  const response = await fetch(`${API_BASE_URL}/media`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(assetData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create media asset');
  return data.data;
}

export async function updateMediaAssetApi(id, assetData) {
  const response = await fetch(`${API_BASE_URL}/media/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(assetData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update media asset');
  return data.data;
}

export async function deleteMediaAssetApi(id, { permanent = false } = {}) {
  const response = await fetch(`${API_BASE_URL}/media/${id}${permanent ? '?permanent=true' : ''}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to delete media asset');
  return data;
}

export async function getMediaHealthApi() {
  const response = await fetch(`${API_BASE_URL}/media/health`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch media health status');
  return data.data;
}

// Dedicated Sales Dashboard API
export async function getSalesDashboardApi() {
  const response = await fetch(`${API_BASE_URL}/sales/dashboard`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch sales dashboard metrics');
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
  updateCouponApi,
  toggleCouponApi,
  deleteCouponApi,
  getAdminPayoutsApi,
  getAdminPayoutApi,
  getEligiblePayoutCreatorsApi,
  createPayoutApi,
  updatePayoutStatusApi,
  getAdminUsersApi,
  getAdminUserByIdApi,
  createAdminStaffUserApi,
  updateUserRoleApi,
  updateUserAccountStatusApi,
  getAdminBookingsApi,
  getAdminBookingByIdApi,
  cancelBookingRecordApi,
  resendBookingWhatsAppApi,
  getInfluencerApplicationsApi,
  getInfluencerApplicationByIdApi,
  approveInfluencerApplicationApi,
  rejectInfluencerApplicationApi,
  updateTripSeoApi,
  validateCouponServerApi,
  getInfluencerPlansApi,
  generateCouponApi,
  getInfluencerCouponsApi,
  getWalletSummaryApi,
  getWalletTransactionsApi,
  getInfluencerPayoutsApi,
  requestPayoutApi,
  calculateBookingPricingApi,
  createBookingOrderApi,
  verifyBookingPaymentApi,
  getMyBookingsApi,
  getSalesBookingsApi,
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
  getLeadByIdApi,
  claimLeadApi,
  logLeadContactApi,
  getSalesUsersApi,
  updateLeadStatusApi,
  assignLeadApi,
  getFollowUpsApi,
  createFollowUpApi,
  updateFollowUpApi,
  completeFollowUpApi,
  deleteFollowUpApi,
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
  getAdminPageByIdApi,
  getPageBySlugApi,
  createPageApi,
  updatePageApi,
  deletePageApi,
  calculateQuotationPricingPreviewApi,
  createQuotationApi,
  getQuotationsApi,
  getQuotationByIdApi,
  updateQuotationApi,
  deleteQuotationApi,
  sendQuotationApi,
  createQuotationRevisionApi,
  approveQuotationApi,
  rejectQuotationApi,
  convertQuotationToTripApi,
  createBookingFromQuotationApi,
  getPublicQuotationByTokenApi,
  updatePublicSelectedOptionsApi,
  customerQuotationDecisionApi,
  listMediaAssetsApi,
  getMediaAssetByIdApi,
  resolveItineraryMediaApi,
  getMediaCoverageReportApi,
  createMediaAssetApi,
  updateMediaAssetApi,
  deleteMediaAssetApi,
  getMediaHealthApi,
  getSalesDashboardApi
};
