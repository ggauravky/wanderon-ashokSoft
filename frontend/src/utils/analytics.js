/**
 * GA4 Event Tracking Helper (Google Search Central & GA4 Compliant)
 * Tracks user behavior and SEO landing page funnel events:
 * destination_view, package_view, itinerary_view, search, filter_use, wishlist_add, coupon_apply, checkout_start, purchase, lead_submit
 */

export const trackGA4Event = (eventName, eventParams = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  } else {
    // Log to console in development environment for verification
    if (import.meta.env.DEV) {
      console.log(`[GA4 Event Logged]: ${eventName}`, eventParams);
    }
  }
};

export const trackDestinationView = (destinationName, tripCount) => {
  trackGA4Event('destination_view', {
    destination: destinationName,
    trip_count: tripCount,
    timestamp: new Date().toISOString()
  });
};

export const trackPackageView = (trip) => {
  if (!trip) return;
  trackGA4Event('package_view', {
    trip_id: trip.id,
    trip_title: trip.title,
    price: trip.price,
    duration: trip.duration,
    category: trip.category || 'Group Trip'
  });
};

export const trackSearchQuery = (query, resultsCount) => {
  trackGA4Event('search', {
    search_term: query,
    results_count: resultsCount
  });
};

export const trackFilterUse = (filterType, filterValue) => {
  trackGA4Event('filter_use', {
    filter_type: filterType,
    filter_value: filterValue
  });
};

export const trackWishlistAdd = (tripId, tripTitle) => {
  trackGA4Event('wishlist_add', {
    trip_id: tripId,
    trip_title: tripTitle
  });
};

export const trackCouponApply = (code, discountAmount) => {
  trackGA4Event('coupon_apply', {
    coupon_code: code,
    discount_amount: discountAmount
  });
};

export const trackCheckoutStart = (tripId, totalAmount, travelersCount) => {
  trackGA4Event('checkout_start', {
    trip_id: tripId,
    total_amount: totalAmount,
    travelers_count: travelersCount
  });
};

export const trackPurchase = (bookingId, tripTitle, paidAmount, paymentMethod) => {
  trackGA4Event('purchase', {
    transaction_id: bookingId,
    trip_title: tripTitle,
    value: paidAmount,
    currency: 'INR',
    payment_type: paymentMethod
  });
};
