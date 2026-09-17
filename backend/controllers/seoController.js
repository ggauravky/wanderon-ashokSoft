import mongoose from 'mongoose';
import Trip from '../models/Trip.js';
import Page from '../models/Page.js';

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

// @desc    Generate and serve XML Sitemap for Search Engines
// @route   GET /api/seo/sitemap.xml or /sitemap.xml
// @access  Public
export const getSitemapXml = async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://wanderluxe.in';
    const currentDate = new Date().toISOString().split('T')[0];

    // Static Routes
    const staticUrls = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${baseUrl}/destinations`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/about`, priority: '0.7', changefreq: 'monthly' },
      { loc: `${baseUrl}/contact`, priority: '0.6', changefreq: 'monthly' },
      { loc: `${baseUrl}/blog`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${baseUrl}/influencer`, priority: '0.8', changefreq: 'weekly' }
    ];

    // Fetch Trips
    let trips = [];
    if (isDbConnected()) {
      try {
        trips = await Trip.find({}).select('slug updatedAt');
      } catch (e) {}
    }

    if (trips.length === 0) {
      trips = [
        { slug: 'meghalaya-backpacking-living-root-bridges', updatedAt: new Date() },
        { slug: 'spiti-valley-circuit-high-altitude-roadtrip', updatedAt: new Date() },
        { slug: 'goa-sun-beach-and-party-getaway', updatedAt: new Date() },
        { slug: 'bali-island-escape-beaches-and-culture', updatedAt: new Date() }
      ];
    }

    const tripUrls = trips.map((t) => ({
      loc: `${baseUrl}/trip/${t.slug}`,
      lastmod: (t.updatedAt || new Date()).toISOString().split('T')[0],
      priority: '0.9',
      changefreq: 'weekly'
    }));

    // Fetch Dynamic Pages
    let pages = [];
    if (isDbConnected()) {
      try {
        pages = await Page.find({ status: 'published' }).select('slug updatedAt');
      } catch (e) {}
    }

    if (pages.length === 0) {
      pages = [
        { slug: 'meghalaya-travel-guide', updatedAt: new Date() },
        { slug: 'spiti-valley-guide', updatedAt: new Date() }
      ];
    }

    const pageUrls = pages.map((p) => ({
      loc: `${baseUrl}/page/${p.slug}`,
      lastmod: (p.updatedAt || new Date()).toISOString().split('T')[0],
      priority: '0.8',
      changefreq: 'weekly'
    }));

    const allUrls = [...staticUrls, ...tripUrls, ...pageUrls];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    allUrls.forEach((u) => {
      xml += `  <url>\n`;
      xml += `    <loc>${u.loc}</loc>\n`;
      xml += `    <lastmod>${u.lastmod || currentDate}</lastmod>\n`;
      xml += `    <changefreq>${u.changefreq || 'weekly'}</changefreq>\n`;
      xml += `    <priority>${u.priority || '0.5'}</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap Error:', error);
    res.status(500).send('Error generating XML sitemap');
  }
};

// @desc    Generate and serve Robots.txt
// @route   GET /api/seo/robots.txt or /robots.txt
// @access  Public
export const getRobotsTxt = async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://wanderluxe.in';

    const robotsTxt = `# WanderLuxe Search Engine Robots Directive
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /profile
Disallow: /checkout
Disallow: /booking/verify/

# Sitemap Location
Sitemap: ${baseUrl}/sitemap.xml
`;

    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  } catch (error) {
    res.status(500).send('Error serving robots.txt');
  }
};

// @desc    Get complete SEO metadata & JSON-LD schema by path/route
// @route   GET /api/seo/metadata
// @access  Public
export const getSeoMetadataByPath = async (req, res) => {
  try {
    const { path: routePath } = req.query;
    const baseUrl = process.env.FRONTEND_URL || 'https://wanderluxe.in';

    if (!routePath || routePath === '/') {
      return res.json({
        metaTitle: 'WanderLuxe - Experiential Small Group Expeditions & Luxury Travel',
        metaDescription: 'Book curated small-group travel expeditions across Meghalaya, Spiti Valley, Goa, Bali, and pristine global destinations.',
        keywords: 'group travel, backpacking, Meghalaya tours, Spiti Valley, adventure travel India',
        canonicalUrl: `${baseUrl}/`,
        robots: 'index, follow',
        ogTitle: 'WanderLuxe Expeditions',
        ogDescription: 'Curated experiential group travel and adventure trips.',
        ogImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        ogType: 'website',
        twitterCard: 'summary_large_image',
        structuredDataType: 'Organization',
        structuredDataJson: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TravelAgency",
          "name": "WanderLuxe Expeditions",
          "url": baseUrl,
          "description": "Curated experiential travel and group expeditions."
        })
      });
    }

    // Check if it matches dynamic page (/page/:slug)
    const pageMatch = routePath.match(/\/page\/([^\/]+)/);
    if (pageMatch) {
      const slug = pageMatch[1];
      let page = null;
      if (isDbConnected()) {
        try { page = await Page.findOne({ slug, status: 'published' }); } catch (e) {}
      }
      if (page && page.seo) {
        return res.json(page.seo);
      }
    }

    // Default Fallback Metadata
    res.json({
      metaTitle: 'WanderLuxe Travel Platform',
      metaDescription: 'Explore handcrafted trip packages and authentic local cultural experiences.',
      keywords: 'wanderluxe, travel, adventures, trips',
      canonicalUrl: `${baseUrl}${routePath}`,
      robots: 'index, follow',
      ogTitle: 'WanderLuxe Travel Platform',
      ogDescription: 'Handcrafted trip packages and cultural travel experiences.',
      ogImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      ogType: 'website',
      twitterCard: 'summary_large_image',
      structuredDataType: 'WebPage',
      structuredDataJson: ''
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
