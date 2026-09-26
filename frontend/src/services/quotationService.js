import { API_BASE_URL, getHeaders, parseApiResponse, request, toQueryString } from './apiConfig.js';

export async function calculateQuotationPricingPreviewApi(quotationData) {
  const response = await request(`${API_BASE_URL}/quotations/calculate-preview`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(quotationData)
  });
  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to calculate quotation preview pricing');
  return data;
}

export async function createQuotationApi(quotationData) {
  const response = await request(`${API_BASE_URL}/quotations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(quotationData)
  });
  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to create quotation');
  return data;
}

export async function getQuotationsApi(params = {}) {
  const query = toQueryString(params);
  const response = await request(`${API_BASE_URL}/quotations${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to fetch quotations');
  return data;
}

export async function getQuotationByIdApi(id) {
  const response = await request(`${API_BASE_URL}/quotations/${id}`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to fetch quotation details');
  return data;
}

export async function updateQuotationApi(id, quotationData) {
  const response = await request(`${API_BASE_URL}/quotations/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(quotationData)
  });
  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to update quotation');
  return data;
}

export async function deleteQuotationApi(id) {
  const response = await request(`${API_BASE_URL}/quotations/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to delete quotation');
  return data;
}

export async function sendQuotationApi(id) {
  const response = await request(`${API_BASE_URL}/quotations/${id}/send`, {
    method: 'POST',
    headers: getHeaders()
  });
  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to send quotation');
  return data;
}

export async function createQuotationRevisionApi(id, payload = {}) {
  const response = await request(`${API_BASE_URL}/quotations/${id}/create-revision`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to create quotation revision');
  return data;
}

export async function approveQuotationApi(id, payload = {}) {
  const response = await request(`${API_BASE_URL}/quotations/${id}/approve`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to approve quotation');
  return data;
}

export async function rejectQuotationApi(id, payload = {}) {
  const response = await request(`${API_BASE_URL}/quotations/${id}/reject`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to reject quotation');
  return data;
}

export async function archiveQuotationApi(id, payload = {}) {
  const response = await request(`${API_BASE_URL}/quotations/${id}/archive`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to archive quotation');
  return data;
}

export async function convertQuotationToTripApi(id) {
  const response = await request(`${API_BASE_URL}/quotations/${id}/convert-to-trip`, {
    method: 'POST',
    headers: getHeaders()
  });
  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to convert quotation to trip');
  return data;
}

export async function createBookingFromQuotationApi(id) {
  const response = await request(`${API_BASE_URL}/quotations/${id}/create-booking`, {
    method: 'POST',
    headers: getHeaders()
  });
  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to convert quotation to booking');
  return data;
}

export async function getPublicQuotationByTokenApi(token) {
  const response = await request(`${API_BASE_URL}/quotations/public/${token}`, {
    method: 'GET'
  });
  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to load quotation proposal');
  return data;
}

export async function updatePublicSelectedOptionsApi(token, payload) {
  const response = await request(`${API_BASE_URL}/quotations/public/${token}/select-options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to update proposal options');
  return data;
}

export async function customerQuotationDecisionApi(token, payload) {
  const response = await request(`${API_BASE_URL}/quotations/public/${token}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to record customer decision');
  return data;
}

async function quotationV2Request(path, { method = 'GET', body, auth = true } = {}) {
  const response = await request(`${API_BASE_URL}/quotations${path}`, {
    method,
    headers: auth ? getHeaders() : { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const data = await parseApiResponse(response);
  if (!response.ok) {
    const error = new Error(data.message || 'Quotation request failed');
    error.status = response.status;
    error.details = data.details;
    error.code = data.code;
    error.retryable = data.retryable;
    error.referenceId = data.referenceId;
    error.model = data.model;
    throw error;
  }
  return data;
}

export const createQuotationV2Api = (payload) => quotationV2Request('/v2', { method: 'POST', body: payload });
export const createSmartQuotationFromAiLeadApi = (leadId) => quotationV2Request(`/v2/from-ai-lead/${encodeURIComponent(leadId)}`, { method: 'POST', body: {} });
export const previewQuotationAiImportApi = (payload) => quotationV2Request('/v2/ai/import-preview', { method: 'POST', body: payload });
export const listImportableItinerariesApi = (search = '') => quotationV2Request(`/v2/ai/importable-itineraries?search=${encodeURIComponent(search)}`);
export const getQuotationPolicyDefaultsApi = (quotation) => quotationV2Request('/v2/ai/policy-defaults', { method: 'POST', body: { quotation } });
export const getQuotationAiStatusApi = () => quotationV2Request('/v2/ai/status');
export const checkQuotationAiStatusApi = () => quotationV2Request('/v2/ai/status/check', { method: 'POST', body: {} });
export const getQuotationAiSampleApi = () => quotationV2Request('/v2/ai/sample');
export const suggestQuotationAiFieldApi = (payload, id = null) => quotationV2Request(`${id ? `/${encodeURIComponent(id)}` : ''}/v2/ai/field-suggest`, { method: 'POST', body: payload });
export const draftQuotationAiTextApi = (payload) => quotationV2Request('/v2/ai/draft-text', { method: 'POST', body: payload });
export const updateQuotationV2Api = (id, payload) => quotationV2Request(`/${encodeURIComponent(id)}/v2`, { method: 'PATCH', body: payload });
export const applyQuotationAiImportApi = (id, payload) => quotationV2Request(`/${encodeURIComponent(id)}/v2/ai/import-apply`, { method: 'POST', body: payload });
export const draftQuotationAiTextForQuotationApi = (id, payload) => quotationV2Request(`/${encodeURIComponent(id)}/v2/ai/draft-text`, { method: 'POST', body: payload });
export const requestQuotationPricingV2Api = (id, payload = {}) => quotationV2Request(`/${encodeURIComponent(id)}/v2/request-pricing`, { method: 'POST', body: payload });
export const finalizeQuotationPricingV2Api = (id, manualPricing) => quotationV2Request(`/${encodeURIComponent(id)}/v2/finalize-pricing`, { method: 'POST', body: { manualPricing } });
export const createQuotationRevisionV2Api = (id, payload = {}) => quotationV2Request(`/${encodeURIComponent(id)}/v2/revisions`, { method: 'POST', body: payload });
export const getQuotationRevisionsV2Api = (id) => quotationV2Request(`/${encodeURIComponent(id)}/v2/revisions`);
export async function downloadQuotationPdfServerApi(id, { templateKey, revisionId, filename }) {
  const response = await request(`${API_BASE_URL}/quotations/${encodeURIComponent(id)}/v2/pdf`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify({ templateKey, revisionId })
  });
  if (!response.ok) {
    const data = await parseApiResponse(response);
    const error = new Error(data?.message || 'Unable to render quotation PDF.');
    error.status = response.status;
    throw error;
  }
  const blob = await response.blob();
  if (blob.type !== 'application/pdf' || blob.size < 1000) throw new Error('The server returned an invalid PDF.');
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  return true;
}
export const createQuotationShareV2Api = (id, payload) => quotationV2Request(`/${encodeURIComponent(id)}/v2/shares`, { method: 'POST', body: payload });
export const getQuotationSharesV2Api = (id) => quotationV2Request(`/${encodeURIComponent(id)}/v2/shares`);
export const revokeQuotationShareV2Api = (id, shareId, reason = '') => quotationV2Request(`/${encodeURIComponent(id)}/v2/shares/${encodeURIComponent(shareId)}/revoke`, { method: 'POST', body: { reason } });
export const getQuotationEventsV2Api = (id) => quotationV2Request(`/${encodeURIComponent(id)}/v2/events`);
export const duplicateQuotationV2Api = (id) => quotationV2Request(`/${encodeURIComponent(id)}/v2/duplicate`, { method: 'POST', body: {} });
export const addQuotationAttachmentV2Api = (id, payload) => quotationV2Request(`/${encodeURIComponent(id)}/v2/attachments`, { method: 'POST', body: payload });
export const deleteQuotationAttachmentV2Api = (id, attachmentId) => quotationV2Request(`/${encodeURIComponent(id)}/v2/attachments/${encodeURIComponent(attachmentId)}`, { method: 'DELETE' });
export const adminApproveQuotationV2Api = (id, reason) => quotationV2Request(`/${encodeURIComponent(id)}/v2/admin-approve`, { method: 'POST', body: { reason } });
export const createBookingFromQuotationV2Api = (id) => quotationV2Request(`/${encodeURIComponent(id)}/v2/create-booking`, { method: 'POST', body: {} });
export const getQuotationSourcePlanApi = (id) => quotationV2Request(`/${encodeURIComponent(id)}/v2/source-plan`);
export const compareQuotationSourcePlanApi = (id) => quotationV2Request(`/${encodeURIComponent(id)}/v2/source-plan/compare`);
export const reviewQuotationCandidateApi = (id, type, candidateId, payload) => quotationV2Request(`/${encodeURIComponent(id)}/v2/candidates/${encodeURIComponent(type)}/${encodeURIComponent(candidateId)}/review`, { method: 'POST', body: payload });

export const getPublicQuotationV2Api = (token) => quotationV2Request(`/public/v2/${encodeURIComponent(token)}`, { auth: true });
export const requestQuotationVerificationV2Api = (token, email) => quotationV2Request(`/public/v2/${encodeURIComponent(token)}/request-verification`, { method: 'POST', body: { email }, auth: false });
export const verifyQuotationRecipientV2Api = (token, payload) => quotationV2Request(`/public/v2/${encodeURIComponent(token)}/verify`, { method: 'POST', body: payload, auth: false });
export const decidePublicQuotationV2Api = (token, payload) => quotationV2Request(`/public/v2/${encodeURIComponent(token)}/decision`, { method: 'POST', body: payload, auth: true });
export const trackPublicQuotationEventV2Api = (token, payload) => quotationV2Request(`/public/v2/${encodeURIComponent(token)}/events`, { method: 'POST', body: payload, auth: false });

export async function uploadQuotationDocumentApi(file) {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('folder', 'wanderluxe/quotation_documents');

  const token = localStorage.getItem('wanderluxe_token') || localStorage.getItem('token') || '';
  const response = await request(`${API_BASE_URL}/upload/document`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to upload document');
  return data.data;
}

export async function uploadVehicleImageApi(file) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', 'wanderluxe/fleet_media');

  const token = localStorage.getItem('wanderluxe_token') || localStorage.getItem('token') || '';
  const response = await request(`${API_BASE_URL}/upload/image`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  const data = await parseApiResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to upload vehicle image');
  return data.data;
}

export const TRANSPORT_MODES = [
  { value: 'FLIGHT', label: 'Commercial Flight', icon: 'Plane', defaultType: 'Flight' },
  { value: 'TRAIN', label: 'Express / Shatabdi Train', icon: 'Train', defaultType: 'Train' },
  { value: 'BUS', label: 'Volvo / Luxury Bus', icon: 'Bus', defaultType: 'Luxury Coach / Bus' },
  { value: 'CAB', label: 'Private Cab', icon: 'Car', defaultType: 'Private Cab' },
  { value: 'SUV', label: 'Dedicated SUV (Innova / 4x4)', icon: 'Car', defaultType: 'SUV (Innova/Crysta)' },
  { value: 'TEMPO_TRAVELLER', label: 'Tempo Traveller (12/17 Seater)', icon: 'Truck', defaultType: 'Tempo Traveller (12/17 Seater)' },
  { value: 'COACH', label: 'Chartered Coach', icon: 'Bus', defaultType: 'Luxury Coach / Bus' },
  { value: 'PRIVATE_CAR', label: 'Premium Sedan', icon: 'Car', defaultType: 'Sedan (Dzire/Etios)' },
  { value: 'BIKE', label: 'Expedition Motorcycle / Bike', icon: 'Bike', defaultType: 'Self Drive' },
  { value: 'FERRY', label: 'Speedboat / Cruise Ferry', icon: 'Ship', defaultType: 'None' },
  { value: 'TRANSFER', label: 'Airport / Station Transfer', icon: 'Navigation', defaultType: 'Private Cab' },
  { value: 'OTHER', label: 'Other Bespoke Transit', icon: 'MoveRight', defaultType: 'None' }
];

export const DOCUMENT_TYPES = [
  { value: 'FLIGHT_TICKET', label: 'Flight E-Ticket', icon: 'Plane', defaultVisibility: 'CUSTOMER_VISIBLE' },
  { value: 'TRAIN_TICKET', label: 'Railway E-Ticket', icon: 'Train', defaultVisibility: 'CUSTOMER_VISIBLE' },
  { value: 'BUS_TICKET', label: 'Bus Pass / Ticket', icon: 'Bus', defaultVisibility: 'CUSTOMER_VISIBLE' },
  { value: 'TRANSPORT_VOUCHER', label: 'Transport / Transfer Voucher', icon: 'FileText', defaultVisibility: 'CUSTOMER_VISIBLE' },
  { value: 'BOOKING_CONFIRMATION', label: 'Booking Confirmation', icon: 'CheckCircle2', defaultVisibility: 'CUSTOMER_VISIBLE' },
  { value: 'BOARDING_DOCUMENT', label: 'Boarding Pass / Document', icon: 'Ticket', defaultVisibility: 'CUSTOMER_VISIBLE' },
  { value: 'PERMIT', label: 'Transit / Border Permit', icon: 'ShieldCheck', defaultVisibility: 'CUSTOMER_VISIBLE' },
  { value: 'SUPPLIER_INVOICE', label: 'Supplier Invoice (Internal)', icon: 'Receipt', defaultVisibility: 'INTERNAL_ONLY' },
  { value: 'OTHER', label: 'Other Travel Document', icon: 'Paperclip', defaultVisibility: 'CUSTOMER_VISIBLE' }
];

export const TRANSPORT_TYPES = [
  'SUV (Innova/Crysta)',
  'Sedan (Dzire/Etios)',
  'Tempo Traveller (12/17 Seater)',
  'Luxury Coach / Bus',
  'Private Cab',
  'Flight',
  'Train',
  'Self Drive',
  'None'
];

// Commercial add-ons must come from confirmed staff/vendor data. Hard-coded demo
// pricing, insurance coverage, and availability claims are intentionally disabled.
export const ADDON_PRESETS = [];

/**
 * Calculates trip days, nights, and duration string safely from two dates.
 */
export function calculateDuration(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) {
    return { days: 5, nights: 4, durationStr: '5D/4N' };
  }

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return { days: 5, nights: 4, durationStr: '5D/4N' };
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;
  const nights = Math.max(0, diffDays - 1);

  return {
    days: diffDays,
    nights: nights,
    durationStr: `${diffDays}D/${nights}N`
  };
}

/**
 * Generates an empty initial quotation template.
 */
/** @deprecated Showcase-only fixture retained for old screenshots. Never use for a new quotation. */
function getDeprecatedInitialQuotationDemoState() {
  return {
    quotationNumber: '',
    version: 1,
    leadId: null,
    sourceItineraryId: null,
    customerId: null,
    assignedTo: null,
    customerSnapshot: {
      name: '',
      email: '',
      phone: '',
      city: '',
      notes: ''
    },
    tripRequirements: {
      title: '',
      destination: 'Spiti Valley, Himachal',
      startDate: '',
      endDate: '',
      duration: '5D/4N',
      days: 5,
      nights: 4,
      adults: 2,
      children: 0,
      infants: 0,
      totalTravelers: 2,
      travelStyle: 'Adventure',
      budgetPerPerson: '',
      specialRequests: ''
    },
    pricingRules: {
      adultMultiplier: 1.0,
      childMultiplier: 0.70,
      infantMultiplier: 0.0,
      maxSalesDiscount: 10,
      maxSalesMarkup: 30
    },
    itinerary: [
      {
        day: 1,
        title: 'Arrival & Welcome Briefing',
        description: 'Meet your dedicated tour captain and check in to your mountain stay.',
        morning: 'Airport/Station pickup in private SUV',
        afternoon: 'Hotel check-in and scenic acclimatization walk',
        evening: 'Welcome tea, local market stroll, and traditional dinner',
        stay: 'Deluxe Heritage Mountain Resort',
        mealsIncluded: ['Breakfast', 'Dinner'],
        transferDetails: 'Private SUV transfer',
        activityHighlights: ['Acclimatization Walk', 'Welcome Dinner']
      }
    ],
    hotelOptions: [
      {
        optionId: 'hotel_opt_1',
        segmentId: 'seg_1',
        segmentName: 'Manali Stay',
        segmentOrder: 1,
        tier: 'Deluxe',
        label: 'Option A: 4-Star Premium Resort (Recommended)',
        hotelName: 'Grand Himalayan Resort & Spa',
        city: 'Manali',
        location: 'Old Manali / River Facing',
        category: 'Deluxe',
        roomType: 'Deluxe Valley View Room',
        rooms: 1,
        occupancy: 'Double Sharing',
        mealPlan: 'MAP (Breakfast + Dinner)',
        checkIn: '',
        checkOut: '',
        nights: 4,
        costPerNight: 3500,
        pricePerNight: 5000,
        taxRate: 0,
        totalCost: 14000,
        totalPrice: 20000,
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
        amenities: ['Free Wi-Fi', 'Heater on Request', 'Mountain View', 'Buffet Dining'],
        notes: 'Complimentary room upgrade subject to availability.',
        selected: true
      },
      {
        optionId: 'hotel_opt_2',
        segmentId: 'seg_1',
        segmentName: 'Manali Stay',
        segmentOrder: 1,
        tier: 'Luxury',
        label: 'Option B: 5-Star Luxury Heritage Boutique',
        hotelName: 'The Imperial Heights & Spa',
        city: 'Manali',
        location: 'Upper Ridge View',
        category: 'Luxury',
        roomType: 'Luxury Panoramic Suite',
        rooms: 1,
        occupancy: 'Double Sharing',
        mealPlan: 'MAP (Breakfast + Dinner)',
        checkIn: '',
        checkOut: '',
        nights: 4,
        costPerNight: 7500,
        pricePerNight: 10500,
        taxRate: 0,
        totalCost: 30000,
        totalPrice: 42000,
        imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800',
        amenities: ['Infinity Jacuzzi', 'Central Heating', 'Private Balcony', 'Spa Access'],
        notes: 'Includes signature evening bonfire and high tea.',
        selected: false
      }
    ],
    transportOptions: [
      {
        optionId: 'trans_opt_1',
        type: 'SUV (Innova/Crysta)',
        vehicle: 'Toyota Innova Crysta 4x4 (AC / High Ground Clearance)',
        provider: 'WanderLuxe Dedicated Fleet',
        pickup: 'Airport / Railway Station',
        drop: 'Airport / Railway Station',
        startDate: '',
        endDate: '',
        capacity: 6,
        quantity: 1,
        unitCost: 12000,
        unitPrice: 18000,
        totalCost: 12000,
        totalPrice: 18000,
        inclusions: ['Fuel', 'Toll Taxes', 'Driver Allowance', 'State Border Permits'],
        notes: 'Dedicated sanitized vehicle with experienced hill driver.',
        selected: true
      },
      {
        optionId: 'trans_opt_2',
        type: 'Tempo Traveller (12/17 Seater)',
        vehicle: 'Force Tempo Traveller 12-Seater Luxury Pushback',
        provider: 'WanderLuxe Dedicated Fleet',
        pickup: 'Central Assembly Point',
        drop: 'Central Assembly Point',
        startDate: '',
        endDate: '',
        capacity: 12,
        quantity: 1,
        unitCost: 22000,
        unitPrice: 32000,
        totalCost: 22000,
        totalPrice: 32000,
        inclusions: ['Fuel', 'All State Taxes', 'Driver Lodging', 'Luggage Carrier'],
        notes: 'Spacious legroom and audio system for group tours.',
        selected: false
      }
    ],
    activities: [
      {
        activityId: 'act_1',
        dayNumber: 2,
        name: 'Guided Monastery & Heritage Cultural Walk',
        description: 'Private English-speaking storyteller guide with all entrance passes.',
        location: 'Old Town Heritage Circuit',
        pricingType: 'PER_PERSON',
        quantity: 1,
        unitCost: 600,
        unitPrice: 1200,
        totalCost: 1200,
        totalPrice: 2400,
        isIncluded: true,
        isOptional: false,
        selected: true
      }
    ],
    addOns: [
      {
        addonId: 'addon_1',
        category: 'Insurance',
        name: 'Comprehensive High-Altitude Travel & Medical Insurance',
        description: 'Covers emergency evacuation, flight delays, and cashless medical up to ₹5 Lakhs.',
        pricingType: 'PER_PERSON',
        quantity: 1,
        unitCost: 350,
        unitPrice: 750,
        totalCost: 700,
        totalPrice: 1500,
        selected: true
      },
      {
        addonId: 'addon_2',
        category: 'Photography',
        name: 'Private Trip Photographer (1 Full Day Excursion)',
        description: 'Professional photographer with 50+ edited high-res digital shots and drone footage.',
        pricingType: 'FIXED',
        quantity: 1,
        unitCost: 3000,
        unitPrice: 5000,
        totalCost: 3000,
        totalPrice: 5000,
        selected: false
      }
    ],
    inclusions: [
      'All stays as specified in the selected hotel option',
      'Daily buffet breakfast & chef-curated dinner (MAP Plan)',
      'Dedicated private vehicle (pickup to drop) with all tolls, parking & fuel',
      'Certified WanderLuxe trip captain and local cultural guide',
      'Inner-line permits, state wildlife fees & monument entrance passes'
    ],
    exclusions: [
      'Airfare / Train tickets to and from reporting hub',
      'Personal expenses, laundry, telephone, and extra beverage charges',
      'Optional adventure rides not mentioned in confirmed inclusions',
      'Applicable 5% Tour Operator GST'
    ],
    termsAndConditions: [
      'Quotation rates are locked and valid for 7 calendar days.',
      '10% initial deposit confirms provisional reservation & hotel block.',
      'Remaining 90% balance is payable 6 days prior to journey departure.'
    ],
    cancellationPolicy: [
      '100% refund of deposit if cancelled 15+ days prior to departure.',
      '50% refund if cancelled between 7-14 days prior to departure.',
      'Non-refundable if cancelled within 6 days of departure.'
    ],
    paymentTerms: {
      depositPercent: 10,
      balanceDueDays: 6,
      paymentMode: 'PARTIAL',
      currency: 'INR'
    },
    pricing: {
      internalBaseCost: 0,
      internalHotelCost: 14000,
      internalTransportCost: 12000,
      internalActivityCost: 1200,
      internalAddOnCost: 700,
      totalInternalCost: 27900,
      customerBasePrice: 0,
      customerHotelPrice: 20000,
      customerTransportPrice: 18000,
      customerActivityPrice: 2400,
      customerAddOnPrice: 1500,
      subtotal: 41900,
      markupType: 'percentage',
      markupPercent: 0,
      markupValue: 0,
      markupAmount: 0,
      discountType: 'flat',
      discountValue: 1900,
      discountAmount: 1900,
      taxableAmount: 40000,
      gstPercent: 5,
      gstAmount: 2000,
      tcsPercent: 0,
      tcsAmount: 0,
      finalTotal: 42000,
      perPersonPrice: 21000,
      adultPrice: 21000,
      childPrice: 14700,
      infantPrice: 0,
      adultTotal: 42000,
      childTotal: 0,
      infantTotal: 0,
      depositRequired: 4200,
      balanceAmount: 37800,
      projectedMargin: 12100,
      projectedMarginPercent: 30.25
    },
    priceSnapshot: null,
    revisions: [],
    status: 'DRAFT',
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
}

/**
 * Backward-compatible public factory. New quotations always start blank and never
 * inherit the deprecated showcase's fictional traveler, supplier, or price data.
 */
export function getInitialQuotationState() {
  return getBlankQuotationState();
}

/**
 * Empty commercial draft used by the Staff quotation workspace.
 * Unlike the legacy showcase template, it contains no invented traveler,
 * supplier, itinerary, or price data.
 */
export function getBlankQuotationState() {
  return {
    schemaVersion: 2,
    quotationNumber: '',
    version: 1,
    leadId: null,
    sourceItineraryId: null,
    customerId: null,
    assignedTo: null,
    customerSnapshot: { name: '', email: '', phone: '', city: '', notes: '' },
    tripRequirements: {
      title: '', destination: '', origin: '', startDate: '', endDate: '', datesFlexible: false, flexibleMonth: '', duration: '1D/0N',
      days: 1, nights: 0, adults: 1, children: 0, infants: 0, seniors: 0, totalTravelers: 1,
      travelStyle: 'Custom', budgetPerPerson: '', specialRequests: ''
    },
    tripPreferences: {
      tripType: '', pace: '', paceRhythm: '', acclimatization: '', interests: [],
      stayPreference: '', roomStyle: '', hotelRating: null, dietaryPreference: '',
      transportPreference: '', mobilityConstraints: [], mustInclude: [], avoid: [], customPreferences: ''
    },
    planningReference: null,
    pricingRules: {
      adultMultiplier: 1,
      childMultiplier: 0.7,
      infantMultiplier: 0,
      maxSalesDiscount: 10,
      maxSalesMarkup: 30
    },
    itinerary: [],
    hotelOptions: [],
    transportOptions: [],
    activities: [],
    addOns: [],
    inclusions: [],
    exclusions: [],
    termsAndConditions: [],
    cancellationPolicy: [],
    policies: {
      paymentTerms: '', cancellationPolicy: '', refundNotes: '', importantInformation: '',
      travelRequirements: '', termsAndConditions: ''
    },
    personalNote: '',
    attachments: [],
    presentationSettings: {
      template: 'journey', showComponentPrices: false, showPaymentSchedule: true,
      showAttachments: true, showAdvisor: true, showTerms: true, showItineraryGallery: true, showTripPreferences: false
    },
    commercialState: 'DRAFT',
    manualPricing: {
      currency: 'INR', componentReference: 0, finalCustomerPrice: 0, depositAmount: 0,
      balanceAmount: 0, adjustments: [], paymentSchedule: [], priceNotes: '',
      finalizedBy: null, finalizedByName: '', finalizedAt: null
    },
    paymentTerms: { depositPercent: 10, balanceDueDays: 6, paymentMode: 'PARTIAL', currency: 'INR' },
    pricing: {
      internalBaseCost: 0, internalHotelCost: 0, internalTransportCost: 0,
      internalActivityCost: 0, internalAddOnCost: 0, totalInternalCost: 0,
      customerBasePrice: 0, customerHotelPrice: 0, customerTransportPrice: 0,
      customerActivityPrice: 0, customerAddOnPrice: 0, subtotal: 0,
      markupType: 'percentage', markupPercent: 0, markupValue: 0, markupAmount: 0,
      discountType: 'none', discountValue: 0, discountAmount: 0,
      taxableAmount: 0, gstPercent: 5, gstAmount: 0, tcsPercent: 0, tcsAmount: 0,
      finalTotal: 0, perPersonPrice: 0, adultPrice: 0, childPrice: 0, infantPrice: 0,
      adultTotal: 0, childTotal: 0, infantTotal: 0, depositRequired: 0,
      balanceAmount: 0, projectedMargin: 0, projectedMarginPercent: 0
    },
    priceSnapshot: null,
    revisions: [],
    status: 'DRAFT',
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
}

export function getEmptyHotelOption(index = 1, segmentId = 'seg_1', segmentName = 'Primary Stay') {
  return {
    sourceKind: 'MANUAL', reviewStatus: 'REVIEWED', sourceLabel: '', sourceDayNumbers: [], reviewedBy: null, reviewedAt: null,
    optionId: `hotel_opt_${Date.now()}_${index}`,
    segmentId: segmentId || 'seg_1',
    segmentName: segmentName || 'Primary Stay',
    segmentOrder: 1,
    tier: 'Custom',
    label: '',
    hotelName: '',
    city: '',
    location: '',
    category: '',
    roomType: '',
    rooms: 1,
    occupancy: '',
    mealPlan: '',
    checkIn: '',
    checkOut: '',
    nights: 1,
    costPerNight: 0,
    pricePerNight: 0,
    taxRate: 0,
    totalCost: 0,
    totalPrice: 0,
    imageUrl: '',
    amenities: [],
    notes: '',
    selected: false
  };
}

export function getEmptyTransportOption(index = 1) {
  return {
    sourceKind: 'MANUAL', reviewStatus: 'REVIEWED', sourceLabel: '', sourceDayNumbers: [], reviewedBy: null, reviewedAt: null,
    optionId: `trans_opt_${Date.now()}_${index}`,
    mode: 'OTHER',
    type: '',
    title: '',
    vehicle: '',
    provider: '',
    pickup: '',
    drop: '',
    route: {
      from: '',
      to: '',
      pickupPoint: '',
      dropPoint: ''
    },
    schedule: {
      departureDate: '',
      departureTime: '',
      arrivalDate: '',
      arrivalTime: ''
    },
    reference: {
      flightNumber: '',
      trainNumber: '',
      busNumber: '',
      vehicleNumber: '',
      pnr: '',
      bookingReference: ''
    },
    cabinClass: '',
    seatDetails: '',
    baggage: {
      cabin: '',
      checkIn: ''
    },
    driverDetails: {
      name: '',
      phone: '',
      licenseNumber: ''
    },
    startDate: '',
    endDate: '',
    capacity: 1,
    quantity: 1,
    pricingType: 'PER_VEHICLE',
    unitCost: 0,
    unitPrice: 0,
    taxRate: 0,
    totalCost: 0,
    totalPrice: 0,
    inclusions: [],
    notes: '',
    selected: false,
    vehicleMedia: [],
    documents: []
  };
}

export function getEmptyActivity(index = 1) {
  return {
    sourceKind: 'MANUAL', reviewStatus: 'REVIEWED', sourceLabel: '', sourceDayNumbers: [], reviewedBy: null, reviewedAt: null,
    activityId: `act_${Date.now()}_${index}`,
    dayNumber: 1,
    name: '',
    description: '',
    location: '',
    pricingType: 'PER_PERSON',
    quantity: 1,
    unitCost: 0,
    unitPrice: 0,
    totalCost: 0,
    totalPrice: 0,
    isIncluded: false,
    isOptional: true,
    selected: false
  };
}

export function getEmptyAddOn(index = 1) {
  return {
    addonId: `addon_${Date.now()}_${index}`,
    category: 'General',
    name: '',
    description: '',
    pricingType: 'FIXED',
    quantity: 1,
    unitCost: 0,
    unitPrice: 0,
    totalCost: 0,
    totalPrice: 0,
    selected: false
  };
}

export function getEmptyItineraryDay(dayNumber = 1) {
  return {
    day: dayNumber,
    title: `Day ${dayNumber}`,
    locationName: '',
    locationId: '',
    destination: '',
    description: '',
    morning: '',
    afternoon: '',
    evening: '',
    stay: '',
    mealsIncluded: [],
    transferDetails: '',
    activityHighlights: [],
    coverMedia: {
      id: '',
      url: '',
      altText: '',
      caption: '',
      width: 1600,
      height: 900
    },
    coverMediaAssetId: null,
    galleryMedia: [],
    mediaSelectionMode: 'AUTO'
  };
}

export default {
  TRANSPORT_TYPES,
  ADDON_PRESETS,
  calculateDuration,
  getInitialQuotationState,
  getBlankQuotationState,
  getEmptyHotelOption,
  getEmptyTransportOption,
  getEmptyActivity,
  getEmptyAddOn,
  getEmptyItineraryDay,
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
  archiveQuotationApi,
  convertQuotationToTripApi,
  createBookingFromQuotationApi,
  getPublicQuotationByTokenApi,
  updatePublicSelectedOptionsApi,
  customerQuotationDecisionApi
};
