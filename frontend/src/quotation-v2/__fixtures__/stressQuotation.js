const stayImage = '/hero-bg.jpg';
const longTitle = 'Ultimate Ladakh, Nubra Valley, Pangong Lake and Tso Moriri Himalayan Expedition';
const longParagraph = 'Travel through the high valleys at a considered pace, with time for rest, photography, and local experiences. '.repeat(12).trim();
const hotel = (index) => ({
  optionId: `hotel-${index}`,
  hotelName: `Himalayan Heritage Retreat ${index}`,
  city: index === 1 ? 'Leh' : 'Nubra Valley',
  category: 'Boutique stay', roomType: 'Deluxe room', rooms: 2, occupancy: 'Double Sharing',
  mealPlan: 'CP (Breakfast)', nights: 2, selected: index === 1,
  imageUrl: `${stayImage}?hotel=${index}`,
  gallery: [{ url: `${stayImage}?gallery=${index}-1`, isPrimary: true, caption: 'Stay exterior' }, { secureUrl: `${stayImage}?gallery=${index}-2` }, { imageUrl: `${stayImage}?gallery=${index}-3` }],
  amenities: ['Wi-Fi', 'Heating', 'Mountain view', 'Breakfast'],
  customerNotes: index === 2 ? longParagraph : 'Accommodation details are subject to the confirmed service selection.',
  documents: index === 1 ? [
    { id: 'voucher-image', type: 'HOTEL_VOUCHER', title: 'Stay voucher', mimeType: 'image/jpeg', secureUrl: 'https://example.com/hotel-voucher.jpg', visibility: 'CUSTOMER_VISIBLE', bookingReference: 'STAY-BOOKING-REFERENCE-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890' },
    { id: 'internal-contract', type: 'HOTEL_VOUCHER', title: 'Supplier contract', mimeType: 'application/pdf', secureUrl: 'https://example.com/internal-contract.pdf', visibility: 'INTERNAL_ONLY' }
  ] : []
});
const transport = (index) => ({
  optionId: `transport-${index}`,
  mode: ['FLIGHT', 'TRAIN', 'CAB'][index % 3],
  title: ['Delhi to Leh flight', 'Delhi to Chandigarh train', 'Private valley transfer'][index % 3],
  pickup: ['Delhi', 'Delhi', 'Leh'][index % 3], drop: ['Leh', 'Chandigarh', 'Nubra Valley'][index % 3],
  vehicle: index % 3 === 2 ? 'Private SUV' : '', selected: true,
  schedule: { departureDate: '2026-10-12', departureTime: '09:30' },
  reference: { bookingReference: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ12345678901234567890' },
  vehicleMedia: index % 3 === 2 ? [{ url: `${stayImage}?vehicle=${index}`, isPrimary: true }] : [],
  documents: index < 2 ? [{ id: `ticket-${index}`, type: index ? 'TRAIN_TICKET' : 'FLIGHT_TICKET', title: index ? 'Train e-ticket' : 'Flight ticket', mimeType: 'application/pdf', secureUrl: 'https://example.com/ticket.pdf', visibility: 'CUSTOMER_VISIBLE', passengerName: 'Sample Traveler', bookingReference: `REF-00${index}` }] : []
});

export const stressQuotation = {
  quotationNumber: 'WL-Q-2026-00123', version: 2, status: 'APPROVED', createdAt: '2026-09-26', validUntil: '2026-10-10',
  customerSnapshot: { name: 'Alexandra-Josephine Sample Traveler With A Very Long Name', city: 'New Delhi' },
  tripRequirements: { title: longTitle, destination: 'Ladakh', origin: 'New Delhi', startDate: '2026-10-12', endDate: '2026-10-25', duration: '14 days / 13 nights', days: 14, nights: 13, adults: 2, totalTravelers: 2, coverImage: stayImage },
  itinerary: Array.from({ length: 14 }, (_, index) => ({ day: index + 1, title: `Day ${index + 1}: The high-altitude route and local discoveries`, destination: index < 4 ? 'Leh' : index < 9 ? 'Nubra Valley' : 'Pangong Lake', description: index === 3 ? longParagraph : 'A balanced day of travel, exploration, and time at leisure.', morning: 'Breakfast and departure with local assistance.', afternoon: 'Explore the route and settle into the next destination.', evening: 'Dinner at leisure.', activityHighlights: ['Scenic viewpoint'], coverMedia: { url: `${stayImage}?day=${index}`, altText: 'Ladakh mountain route' } })),
  hotelOptions: [hotel(1), hotel(2), hotel(3), hotel(4), hotel(5)],
  transportOptions: [transport(0), transport(1), transport(2), transport(3)],
  activities: Array.from({ length: 6 }, (_, index) => ({ activityId: `activity-${index}`, dayNumber: index + 1, name: `Local experience ${index + 1}`, location: 'Ladakh', description: 'An optional guided experience selected for this journey.', selected: true })),
  addOns: [{ addonId: 'addon-1', name: 'Photography support', category: 'Photography', description: 'Local photo guidance.', selected: true }, { addonId: 'addon-2', name: 'Private permit assistance', category: 'General', description: 'Customer-facing permit coordination.', selected: true }],
  attachments: [{ id: 'insurance', category: 'INSURANCE', title: 'Travel insurance document', mimeType: 'application/pdf', secureUrl: 'https://example.com/insurance.pdf', visibility: 'CUSTOMER_VISIBLE_AFTER_APPROVAL' }],
  inclusions: Array.from({ length: 25 }, (_, index) => `Confirmed inclusion ${index + 1}`),
  exclusions: Array.from({ length: 20 }, (_, index) => `Expense not included ${index + 1}`),
  policies: { paymentTerms: 'The confirmed deposit is due at booking. '.repeat(30), cancellationPolicy: 'Cancellation requests are reviewed under the confirmed supplier terms. '.repeat(30), refundNotes: 'Refund eligibility is subject to the confirmed booking conditions. '.repeat(20), travelRequirements: 'Carry valid travel identification and any required permits.', importantInformation: 'Mountain weather and road conditions may affect timings.', termsAndConditions: 'Services and dates remain subject to written confirmation. '.repeat(35) },
  manualPricing: { finalCustomerPrice: 245000, depositAmount: 24500, balanceAmount: 220500, currency: 'INR', finalizedAt: '2026-09-26', paymentSchedule: [{ label: 'Deposit', amount: 24500, dueDate: '2026-10-01' }, { label: 'Balance', amount: 220500, dueDate: '2026-10-07' }] },
  presentationSettings: { showAttachments: true, showTerms: true, showAdvisor: true, showPaymentSchedule: true, showItineraryGallery: true },
  advisor: { name: 'WanderLuxe Travel Desk', email: 'travel@example.com' },
  approval: { approvedAt: '2026-09-26', approvedByName: 'Sample Traveler', method: 'RECIPIENT_VERIFICATION' }
};

export const minimalQuotation = {
  quotationNumber: 'WL-Q-MINIMAL', version: 1, status: 'DRAFT', customerSnapshot: { name: 'Sample Traveler' },
  tripRequirements: { title: 'A Quiet Weekend in the Hills', destination: 'Himachal Pradesh', duration: '2 days', days: 2, adults: 1 },
  itinerary: [{ day: 1, title: 'Arrival', destination: 'Himachal Pradesh', description: 'Arrive and settle in.' }, { day: 2, title: 'Return', destination: 'Himachal Pradesh', description: 'Depart at leisure.' }],
  hotelOptions: [], transportOptions: [], activities: [], addOns: [], attachments: [], manualPricing: {}, presentationSettings: {}
};

export const normalQuotation = {
  ...stressQuotation,
  quotationNumber: 'WL-Q-NORMAL',
  status: 'APPROVED',
  customerSnapshot: { name: 'Rahul Sharma', city: 'Delhi' },
  tripRequirements: { ...stressQuotation.tripRequirements, title: 'Ladakh Explorer', origin: 'Delhi', days: 7, nights: 6, duration: '7 days / 6 nights', adults: 2, children: 1, seniors: 1, totalTravelers: 4, endDate: '2026-10-18' },
  tripPreferences: { interests: ['Photography', 'Culture'], stayPreference: 'Boutique stays', dietaryPreference: 'Vegetarian' },
  itinerary: stressQuotation.itinerary.slice(0, 7),
  hotelOptions: stressQuotation.hotelOptions.slice(0, 3),
  transportOptions: stressQuotation.transportOptions.slice(0, 3),
  activities: stressQuotation.activities.slice(0, 5),
  inclusions: stressQuotation.inclusions.slice(0, 15),
  exclusions: stressQuotation.exclusions.slice(0, 12),
  presentationSettings: { ...stressQuotation.presentationSettings, showTripPreferences: true }
};

export const fiveDayQuotation = {
  ...normalQuotation,
  quotationNumber: 'WL-Q-FIVE-DAY',
  tripRequirements: { ...normalQuotation.tripRequirements, days: 5, nights: 4, duration: '5 days / 4 nights', endDate: '2026-10-16' },
  itinerary: [
    { day: 1, title: 'Arrive in Leh', destination: 'Leh', description: 'Meet the local team and settle into the hotel.' },
    { day: 2, title: 'Leh heritage trail', destination: 'Leh', description: 'A compact guided walk through the old town.', morning: 'Breakfast and market walk.' },
    { day: 3, title: 'Nubra Valley crossing', destination: 'Nubra Valley', description: longParagraph, morning: 'Cross Khardung La with scenic pauses.', afternoon: 'Village visit and local lunch.', evening: 'Check in and rest.', transferDetails: longParagraph.slice(0, 700), activityHighlights: ['Mountain pass', 'Village experience'] },
    { day: 4, title: 'Nubra discoveries', destination: 'Nubra Valley', description: 'Explore the valley with a flexible private vehicle.', morning: 'Sand dunes.', afternoon: 'Monastery visit.' },
    { day: 5, title: 'Return to Leh', destination: 'Leh', description: 'Drive back to Leh and conclude the journey.' }
  ]
};

export const ticketHeavyQuotation = {
  ...normalQuotation,
  quotationNumber: 'WL-Q-TICKETS',
  status: 'CONVERTED',
  bookingId: 'booking-ticket-heavy',
  attachments: [
    { id: 'portrait-jpg', category: 'FLIGHT_TICKET', title: 'Portrait flight ticket', fileName: 'flight-ticket.jpg', mimeType: 'image/jpeg', secureUrl: 'https://example.com/portrait-ticket.jpg', visibility: 'CUSTOMER_VISIBLE', pdfDisplayMode: 'ALWAYS_PREVIEW', passengerName: 'Rahul Sharma', bookingReference: 'FL-RAHUL-01' },
    { id: 'landscape-png', category: 'HOTEL_VOUCHER', title: 'Landscape hotel voucher', fileName: 'hotel-voucher.png', mimeType: 'image/png', secureUrl: 'https://example.com/landscape-ticket.png', visibility: 'CUSTOMER_VISIBLE', pdfDisplayMode: 'AUTO', bookingReference: 'HTL-991' },
    { id: 'tall-webp', category: 'TRAIN_TICKET', title: 'Tall train ticket screenshot', fileName: 'train-ticket.webp', mimeType: '', secureUrl: 'https://example.com/tall-ticket.webp', visibility: 'CUSTOMER_VISIBLE_AFTER_APPROVAL', pdfDisplayMode: 'ALWAYS_PREVIEW', passengerName: 'Rahul Sharma', bookingReference: 'PNR-TALL-42' },
    { id: 'flight-pdf', category: 'FLIGHT_TICKET', title: 'Flight ticket PDF', fileName: 'flight.pdf', mimeType: 'application/pdf', secureUrl: 'https://example.com/ticket.pdf', visibility: 'CUSTOMER_VISIBLE', pdfDisplayMode: 'ALWAYS_PREVIEW' },
    { id: 'voucher-pdf', category: 'HOTEL_VOUCHER', title: 'Hotel voucher PDF', fileName: 'voucher.pdf', mimeType: 'application/pdf', secureUrl: 'https://example.com/voucher.pdf', visibility: 'CUSTOMER_VISIBLE_AFTER_BOOKING', pdfDisplayMode: 'ALWAYS_PREVIEW' },
    { id: 'broken-image', category: 'BUS_TICKET', title: 'Unavailable bus ticket image', fileName: 'broken.jpg', mimeType: 'image/jpeg', secureUrl: 'https://example.com/broken-image.jpg', visibility: 'CUSTOMER_VISIBLE', pdfDisplayMode: 'ALWAYS_PREVIEW' },
    { id: 'broken-pdf', category: 'GENERAL', title: 'Unavailable PDF', fileName: 'broken.pdf', mimeType: 'application/pdf', secureUrl: 'https://example.com/broken.pdf?invalid=1', visibility: 'CUSTOMER_VISIBLE', pdfDisplayMode: 'ALWAYS_PREVIEW' },
    { id: 'link-only', category: 'PERMIT', title: 'Permit reference', fileName: 'permit.pdf', mimeType: 'application/pdf', secureUrl: 'https://example.com/permit.pdf', visibility: 'CUSTOMER_VISIBLE', pdfDisplayMode: 'LINK_ONLY' },
    { id: 'hidden', category: 'INSURANCE', title: 'Hidden from PDF', fileName: 'hidden.pdf', mimeType: 'application/pdf', secureUrl: 'https://example.com/hidden.pdf', visibility: 'CUSTOMER_VISIBLE', pdfDisplayMode: 'HIDDEN' },
    { id: 'internal', category: 'INVOICE', title: 'Internal supplier invoice', fileName: 'internal.pdf', mimeType: 'application/pdf', secureUrl: 'https://example.com/internal.pdf', visibility: 'INTERNAL_ONLY', pdfDisplayMode: 'ALWAYS_PREVIEW' }
  ]
};

export const brokenMediaQuotation = {
  ...minimalQuotation,
  quotationNumber: 'WL-Q-BROKEN',
  tripRequirements: { ...minimalQuotation.tripRequirements, coverImage: '/missing-pdf-image.jpg' },
  hotelOptions: [{ ...hotel(1), imageUrl: '/missing-hotel-image.jpg', gallery: [{ url: '/missing-gallery.jpg', isPrimary: true }] }],
  attachments: [{ id: 'broken-pdf', category: 'GENERAL', title: 'Unavailable PDF preview', mimeType: 'application/pdf', secureUrl: 'https://example.com/broken.pdf?invalid=1', visibility: 'CUSTOMER_VISIBLE' }]
};

export const extremeQuotation = {
  ...stressQuotation,
  quotationNumber: 'WL-Q-EXTREME',
  tripRequirements: { ...stressQuotation.tripRequirements, days: 20, duration: '20 days' },
  itinerary: Array.from({ length: 20 }, (_, index) => ({ ...stressQuotation.itinerary[index % 14], day: index + 1, title: `Day ${index + 1}: ${longTitle}`, description: longParagraph })),
  hotelOptions: Array.from({ length: 8 }, (_, index) => hotel(index + 1)),
  transportOptions: Array.from({ length: 10 }, (_, index) => transport(index)),
  policies: { ...stressQuotation.policies, termsAndConditions: stressQuotation.policies.termsAndConditions.repeat(4) }
};
