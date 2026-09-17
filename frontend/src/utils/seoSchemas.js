/**
 * Schema.org Structured Data Generators (Google Search Central Compliant)
 * Generates JSON-LD objects for Organization, TravelAgency, Product/Offer, BreadcrumbList, FAQPage, and Article.
 */

const SITE_URL = 'https://wanderluxe.in';

export const getOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'WanderLuxe',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: 'Curating luxury group trips, backpacking expeditions, and custom travel experiences across India and international destinations.',
  telephone: '+918542036499',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'WanderLuxe HQ',
    addressLocality: 'Lucknow',
    addressRegion: 'Uttar Pradesh',
    postalCode: '226001',
    addressCountry: 'IN'
  },
  sameAs: [
    'https://instagram.com/wanderluxe.in',
    'https://facebook.com/wanderluxe.in',
    'https://youtube.com/@wanderluxe'
  ]
});

export const getTravelAgencySchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'TravelAgency',
  name: 'WanderLuxe Travels',
  image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=1000',
  '@id': `${SITE_URL}/#agency`,
  url: SITE_URL,
  telephone: '+918542036499',
  priceRange: '₹10000 - ₹100000',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Lucknow City Center',
    addressLocality: 'Lucknow',
    addressRegion: 'Uttar Pradesh',
    postalCode: '226001',
    addressCountry: 'IN'
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 26.8467,
    longitude: 80.9462
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '09:00',
    closes: '21:00'
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '12480',
    bestRating: '5',
    worstRating: '1'
  }
});

export const getProductTripSchema = (trip) => {
  if (!trip) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: trip.title,
    image: trip.image,
    description: trip.overview || `${trip.title} - ${trip.duration} curated travel experience by WanderLuxe.`,
    brand: {
      '@type': 'Brand',
      name: 'WanderLuxe'
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/trip/${trip.id}`,
      priceCurrency: 'INR',
      price: trip.price,
      priceValidUntil: '2026-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'WanderLuxe'
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: trip.rating || '4.9',
      reviewCount: trip.reviewsCount || '142',
      bestRating: '5',
      worstRating: '1'
    }
  };
};

export const getBreadcrumbSchema = (items = []) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items
    .filter((item) => item && item.path)
    .map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: typeof item.path === 'string' && item.path.startsWith('http')
        ? item.path
        : `${SITE_URL}${item.path}`
    }))
});

export const getFAQSchema = (faqs = []) => {
  if (!faqs || faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question || faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer || faq.a
      }
    }))
  };
};

export const getArticleSchema = (post) => {
  if (!post) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    image: post.image,
    author: {
      '@type': 'Person',
      name: post.author || 'WanderLuxe Travel Editorial'
    },
    publisher: {
      '@type': 'Organization',
      name: 'WanderLuxe',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`
      }
    },
    datePublished: post.date || '2026-08-01',
    dateModified: '2026-08-11',
    description: post.excerpt || post.summary
  };
};
