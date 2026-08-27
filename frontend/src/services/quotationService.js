import * as apiModule from './api.js';

export async function calculateQuotationPricingPreviewApi(quotationData) {
  const fn = apiModule.calculateQuotationPricingPreviewApi || apiModule.default?.calculateQuotationPricingPreviewApi;
  if (typeof fn !== 'function') throw new Error('calculateQuotationPricingPreviewApi is not available');
  return fn(quotationData);
}

export async function createQuotationApi(quotationData) {
  const fn = apiModule.createQuotationApi || apiModule.default?.createQuotationApi;
  if (typeof fn !== 'function') throw new Error('createQuotationApi is not available');
  return fn(quotationData);
}

export async function getQuotationsApi(params) {
  const fn = apiModule.getQuotationsApi || apiModule.default?.getQuotationsApi;
  if (typeof fn !== 'function') throw new Error('getQuotationsApi is not available');
  return fn(params);
}

export async function getQuotationByIdApi(id) {
  const fn = apiModule.getQuotationByIdApi || apiModule.default?.getQuotationByIdApi;
  if (typeof fn !== 'function') throw new Error('getQuotationByIdApi is not available');
  return fn(id);
}

export async function updateQuotationApi(id, quotationData) {
  const fn = apiModule.updateQuotationApi || apiModule.default?.updateQuotationApi;
  if (typeof fn !== 'function') throw new Error('updateQuotationApi is not available');
  return fn(id, quotationData);
}

export async function deleteQuotationApi(id) {
  const fn = apiModule.deleteQuotationApi || apiModule.default?.deleteQuotationApi;
  if (typeof fn !== 'function') throw new Error('deleteQuotationApi is not available');
  return fn(id);
}

export async function sendQuotationApi(id) {
  const fn = apiModule.sendQuotationApi || apiModule.default?.sendQuotationApi;
  if (typeof fn !== 'function') throw new Error('sendQuotationApi is not available');
  return fn(id);
}

export async function createQuotationRevisionApi(id, payload) {
  const fn = apiModule.createQuotationRevisionApi || apiModule.default?.createQuotationRevisionApi;
  if (typeof fn !== 'function') throw new Error('createQuotationRevisionApi is not available');
  return fn(id, payload);
}

export async function approveQuotationApi(id, payload) {
  const fn = apiModule.approveQuotationApi || apiModule.default?.approveQuotationApi;
  if (typeof fn !== 'function') throw new Error('approveQuotationApi is not available');
  return fn(id, payload);
}

export async function rejectQuotationApi(id, payload) {
  const fn = apiModule.rejectQuotationApi || apiModule.default?.rejectQuotationApi;
  if (typeof fn !== 'function') throw new Error('rejectQuotationApi is not available');
  return fn(id, payload);
}

export async function convertQuotationToTripApi(id) {
  const fn = apiModule.convertQuotationToTripApi || apiModule.default?.convertQuotationToTripApi;
  if (typeof fn !== 'function') throw new Error('convertQuotationToTripApi is not available');
  return fn(id);
}

export async function createBookingFromQuotationApi(id) {
  const fn = apiModule.createBookingFromQuotationApi || apiModule.default?.createBookingFromQuotationApi;
  if (typeof fn !== 'function') throw new Error('createBookingFromQuotationApi is not available');
  return fn(id);
}

export async function getPublicQuotationByTokenApi(token) {
  const fn = apiModule.getPublicQuotationByTokenApi || apiModule.default?.getPublicQuotationByTokenApi;
  if (typeof fn !== 'function') throw new Error('getPublicQuotationByTokenApi is not available');
  return fn(token);
}

export async function updatePublicSelectedOptionsApi(token, payload) {
  const fn = apiModule.updatePublicSelectedOptionsApi || apiModule.default?.updatePublicSelectedOptionsApi;
  if (typeof fn !== 'function') throw new Error('updatePublicSelectedOptionsApi is not available');
  return fn(token, payload);
}

export async function customerQuotationDecisionApi(token, payload) {
  const fn = apiModule.customerQuotationDecisionApi || apiModule.default?.customerQuotationDecisionApi;
  if (typeof fn !== 'function') throw new Error('customerQuotationDecisionApi is not available');
  return fn(token, payload);
}

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

export const ADDON_PRESETS = [
  {
    name: 'High-Altitude Medical & Oxygen Cylinder Kit',
    category: 'Adventure Gear',
    pricingType: 'FIXED',
    unitCost: 1800,
    unitPrice: 3000,
    description: '2 x 10L Portable Oxygen Canisters, medical oximeter & first aid emergency kit.'
  },
  {
    name: 'Comprehensive Mountain Travel & Evacuation Insurance',
    category: 'Insurance',
    pricingType: 'PER_PERSON',
    unitCost: 350,
    unitPrice: 750,
    description: 'Emergency evacuation, trip cancellation, and cashless medical up to ₹5 Lakhs.'
  },
  {
    name: 'Private Bonfire, High Tea & Stargazing Session',
    category: 'Special Meals',
    pricingType: 'FIXED',
    unitCost: 2000,
    unitPrice: 4500,
    description: 'Exclusive evening bonfire setup with gourmet snacks, hot beverages & acoustic music.'
  },
  {
    name: 'Personal Drone & DSLR Storyteller (1 Full Day)',
    category: 'Photography',
    pricingType: 'FIXED',
    unitCost: 4000,
    unitPrice: 7000,
    description: 'Professional creator with 50+ color-graded high-res photos & 4K cinematic reels.'
  },
  {
    name: 'Premium Suite / Panoramic Mountain View Room Upgrade',
    category: 'Room Upgrade',
    pricingType: 'PER_NIGHT',
    unitCost: 1500,
    unitPrice: 2800,
    description: 'Guaranteed upgrade to highest category suite with private balcony & heating.'
  }
];

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
export function getInitialQuotationState() {
  return {
    quotationNumber: '',
    version: 1,
    leadId: null,
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

export function getEmptyHotelOption(index = 1, segmentId = 'seg_1', segmentName = 'Primary Stay') {
  return {
    optionId: `hotel_opt_${Date.now()}_${index}`,
    segmentId: segmentId || 'seg_1',
    segmentName: segmentName || 'Primary Stay',
    segmentOrder: 1,
    tier: 'Deluxe',
    label: `Option ${String.fromCharCode(64 + index)}: Deluxe Stay`,
    hotelName: '',
    city: '',
    location: '',
    category: 'Deluxe',
    roomType: 'Deluxe Room',
    rooms: 1,
    occupancy: 'Double Sharing',
    mealPlan: 'MAP (Breakfast + Dinner)',
    checkIn: '',
    checkOut: '',
    nights: 1,
    costPerNight: 0,
    pricePerNight: 0,
    taxRate: 0,
    totalCost: 0,
    totalPrice: 0,
    imageUrl: '',
    amenities: ['Wi-Fi', 'Hot Water', 'Breakfast Included'],
    notes: '',
    selected: false
  };
}

export function getEmptyTransportOption(index = 1) {
  return {
    optionId: `trans_opt_${Date.now()}_${index}`,
    type: 'SUV (Innova/Crysta)',
    vehicle: '',
    provider: '',
    pickup: '',
    drop: '',
    startDate: '',
    endDate: '',
    capacity: 6,
    quantity: 1,
    unitCost: 0,
    unitPrice: 0,
    totalCost: 0,
    totalPrice: 0,
    inclusions: ['Fuel', 'Tolls', 'Driver Allowance', 'State Permits'],
    notes: '',
    selected: false
  };
}

export function getEmptyActivity(index = 1) {
  return {
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
    isIncluded: true,
    isOptional: false,
    selected: true
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
    title: `Day ${dayNumber}: Exploration & Local Experience`,
    description: '',
    morning: '',
    afternoon: '',
    evening: '',
    stay: '',
    mealsIncluded: ['Breakfast'],
    transferDetails: '',
    activityHighlights: []
  };
}

export default {
  TRANSPORT_TYPES,
  ADDON_PRESETS,
  calculateDuration,
  getInitialQuotationState,
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
  convertQuotationToTripApi,
  createBookingFromQuotationApi,
  getPublicQuotationByTokenApi,
  updatePublicSelectedOptionsApi,
  customerQuotationDecisionApi
};
