export const emptyTrip = () => ({
  title: '', slug: '', location: '', destination: '', region: '', duration: '',
  days: '', nights: '', price: '', originalPrice: '', discount: 0, currency: 'INR',
  image: '', heroImage: '', gallery: [], tags: [], category: '', mood: '', difficulty: '',
  groupType: '', bestMonths: [], batches: [], sharingPricing: {}, pickupPoints: [], capacity: '',
  shortDescription: '', overview: '', itinerary: [], inclusions: [], exclusions: [], faqs: [],
  status: 'draft', isActive: false,
  seo: { seoTitle: '', metaDescription: '', canonicalUrl: '', indexingDirective: 'index, follow', ogTitle: '', ogDescription: '', ogImage: '', structuredSchemaType: 'Product' }
});

export const slugify = (value) => String(value || '').toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

export const hydrateTrip = (trip) => ({
  ...emptyTrip(),
  ...trip,
  gallery: trip?.gallery || [], tags: trip?.tags || [], bestMonths: trip?.bestMonths || [],
  batches: trip?.batches || [], pickupPoints: trip?.pickupPoints || [], itinerary: trip?.itinerary || [],
  inclusions: trip?.inclusions || [], exclusions: trip?.exclusions || [], faqs: trip?.faqs || [],
  sharingPricing: trip?.sharingPricing || {}, seo: { ...emptyTrip().seo, ...(trip?.seo || {}) }
});

export const nextDeparture = (trip) => {
  const now = Date.now();
  return (trip?.batches || [])
    .filter((batch) => batch.status !== 'sold_out' && (!batch.startDate || new Date(batch.startDate).getTime() >= now))
    .sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0))[0] || null;
};

export const futureDepartures = (trip) => {
  const now = Date.now();
  return (trip?.batches || []).filter((batch) => !batch.startDate || new Date(batch.startDate).getTime() >= now);
};

export const money = (value, currency = 'INR') => Number.isFinite(Number(value))
  ? new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value))
  : '—';

export const toDateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';

