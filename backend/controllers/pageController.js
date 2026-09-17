import mongoose from 'mongoose';
import Page from '../models/Page.js';

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

// Memory Fallback Store for Pages
const memoryPages = [
  {
    _id: 'page_meghalaya_guide',
    title: 'Complete Meghalaya Travel Guide 2026',
    slug: 'meghalaya-travel-guide',
    heroSubtitle: 'Explore the Abode of Clouds, Living Root Bridges, and Crystal Clear Rivers',
    category: 'Guides',
    content: 'Meghalaya, located in Northeast India, is famous for Cherrapunji, Mawlynnong, and the magical Umngot River in Dawki. Plan your perfect adventure with WanderLuxe curated itineraries.',
    sections: [
      {
        heading: 'Top Attractions in Meghalaya',
        subheading: 'From Nohkalikai Falls to Double Decker Root Bridges',
        body: 'Walk through lush rainforests of Nongriat and experience indigenous Khasi bio-engineering at the living root bridges.',
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        imageAlt: 'Meghalaya Living Root Bridge',
        ctaLabel: 'Book Meghalaya Trip',
        ctaUrl: '/trip/meghalaya-backpacking-living-root-bridges'
      }
    ],
    status: 'published',
    author: 'WanderLuxe Editorial',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-15'),
    seo: {
      metaTitle: 'Meghalaya Travel Guide 2026 | Itinerary, Best Time & Root Bridges | WanderLuxe',
      metaDescription: 'Discover the ultimate Meghalaya backpacking guide. Explore Dawki river, living root bridges, waterfalls, and local Khasi culture with WanderLuxe.',
      keywords: 'Meghalaya travel, Cherrapunji, Dawki, Living Root Bridges, Northeast India tours',
      canonicalUrl: 'https://wanderluxe.in/page/meghalaya-travel-guide',
      robots: 'index, follow',
      ogTitle: 'Ultimate Meghalaya Backpacking Guide 2026',
      ogDescription: 'Experience living root bridges and crystal Dawki river with curated WanderLuxe itineraries.',
      ogImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      ogType: 'article',
      twitterCard: 'summary_large_image',
      twitterTitle: 'Meghalaya Travel Guide | WanderLuxe',
      twitterDescription: 'Complete guide to Meghalaya waterfalls and root bridges.',
      twitterImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      structuredDataType: 'TouristAttraction',
      structuredDataJson: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "TouristAttraction",
        "name": "Meghalaya Living Root Bridges",
        "description": "Natural living root bridges engineered by local Khasi tribes in Meghalaya.",
        "location": {
          "@type": "Place",
          "name": "Nongriat, Meghalaya, India"
        }
      })
    }
  },
  {
    _id: 'page_spiti_guide',
    title: 'Spiti Valley High Altitude Expedition Blueprint',
    slug: 'spiti-valley-guide',
    heroSubtitle: 'Conquer Key Monastery, Chandratal Lake, and High Himalayan Passes',
    category: 'Expeditions',
    content: 'Spiti Valley is a cold desert mountain valley located high in the Himalayas. Discover ancient monasteries, homestays, and rugged terrain.',
    sections: [
      {
        heading: 'Monasteries & High Passes',
        subheading: 'Key Monastery & Kunzum Pass',
        body: 'Visit 1000-year-old Key Monastery perched atop a cliff at 13,668 feet above sea level.',
        imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
        imageAlt: 'Key Monastery Spiti Valley',
        ctaLabel: 'Book Spiti Expedition',
        ctaUrl: '/trip/spiti-valley-circuit-high-altitude-roadtrip'
      }
    ],
    status: 'published',
    author: 'Gaurav Sharma',
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-05'),
    seo: {
      metaTitle: 'Spiti Valley Travel Guide 2026 | Key Monastery & Roadtrips | WanderLuxe',
      metaDescription: 'Complete travel guide for Spiti Valley circuit. Tips for acclimatization, best month to visit, Chandratal camping, and monastery circuits.',
      keywords: 'Spiti Valley roadtrip, Key Monastery, Kaza, Chandratal, Himachal Pradesh',
      canonicalUrl: 'https://wanderluxe.in/page/spiti-valley-guide',
      robots: 'index, follow',
      ogTitle: 'Spiti Valley Circuit Expedition Blueprint',
      ogDescription: 'Experience the raw magic of Himachal cold desert in Spiti Valley.',
      ogImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
      ogType: 'article',
      twitterCard: 'summary_large_image',
      twitterTitle: 'Spiti Valley Expedition Guide',
      twitterDescription: 'Key Monastery and Chandratal roadtrip blueprint.',
      twitterImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
      structuredDataType: 'Article',
      structuredDataJson: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Spiti Valley High Altitude Expedition Blueprint",
        "author": { "@type": "Person", "name": "Gaurav Sharma" }
      })
    }
  }
];

// Helper: Calculate Live Backend SEO Health Audit Score (0 - 100%)
export const calculateSeoHealth = (seo, pageTitle) => {
  let score = 0;
  const checks = [];

  // Title check (ideal: 30-65 chars)
  const title = seo?.metaTitle || pageTitle || '';
  if (title.length >= 30 && title.length <= 65) {
    score += 20;
    checks.push({ label: 'Meta Title Length', passed: true, score: 20, note: `${title.length} characters (Optimal 30-65)` });
  } else if (title.length > 0) {
    score += 10;
    checks.push({ label: 'Meta Title Length', passed: false, score: 10, note: `${title.length} chars (Target 30-65)` });
  } else {
    checks.push({ label: 'Meta Title', passed: false, score: 0, note: 'Missing meta title' });
  }

  // Description check (ideal: 110-165 chars)
  const desc = seo?.metaDescription || '';
  if (desc.length >= 110 && desc.length <= 165) {
    score += 25;
    checks.push({ label: 'Meta Description', passed: true, score: 25, note: `${desc.length} characters (Optimal 110-165)` });
  } else if (desc.length > 0) {
    score += 12;
    checks.push({ label: 'Meta Description', passed: false, score: 12, note: `${desc.length} chars (Target 110-165)` });
  } else {
    checks.push({ label: 'Meta Description', passed: false, score: 0, note: 'Missing meta description' });
  }

  // Keywords check
  if (seo?.keywords && seo.keywords.trim().length > 5) {
    score += 15;
    checks.push({ label: 'Keywords Defined', passed: true, score: 15, note: 'Target search terms specified' });
  } else {
    checks.push({ label: 'Keywords Defined', passed: false, score: 0, note: 'No keywords provided' });
  }

  // Open Graph Image check
  if (seo?.ogImage || seo?.twitterImage) {
    score += 15;
    checks.push({ label: 'Social Media Sharing Image (OG/Twitter)', passed: true, score: 15, note: 'Rich preview image provided' });
  } else {
    checks.push({ label: 'Social Media Sharing Image', passed: false, score: 0, note: 'Missing Open Graph image' });
  }

  // Canonical URL check
  if (seo?.canonicalUrl && seo.canonicalUrl.startsWith('http')) {
    score += 10;
    checks.push({ label: 'Canonical URL', passed: true, score: 10, note: 'Self-referencing canonical set' });
  } else {
    checks.push({ label: 'Canonical URL', passed: false, score: 0, note: 'Missing valid canonical URL' });
  }

  // Structured Data (JSON-LD) check
  if (seo?.structuredDataJson || seo?.structuredDataType) {
    score += 15;
    checks.push({ label: 'JSON-LD Structured Data Schema', passed: true, score: 15, note: `${seo.structuredDataType || 'Schema'} defined` });
  } else {
    checks.push({ label: 'JSON-LD Schema Markup', passed: false, score: 0, note: 'No schema markup attached' });
  }

  return { totalScore: score, checks };
};

// @desc    Get all dynamic pages (Admin access sees drafts, public sees published)
// @route   GET /api/pages
// @access  Public / Admin
export const getAllPages = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const filter = isAdmin ? {} : { status: 'published' };

    let pages = [];
    if (isDbConnected()) {
      try {
        pages = await Page.find(filter).sort({ updatedAt: -1 });
      } catch (e) {}
    }

    if (pages.length === 0) {
      pages = memoryPages.filter((p) => (isAdmin ? true : p.status === 'published'));
    }

    const pagesWithSeoScore = pages.map((p) => {
      const pageObj = typeof p.toObject === 'function' ? p.toObject() : p;
      const seoAudit = calculateSeoHealth(pageObj.seo, pageObj.title);
      return { ...pageObj, seoHealthScore: seoAudit.totalScore, seoAudit };
    });

    res.json(pagesWithSeoScore);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error fetching pages' });
  }
};

// @desc    Get single dynamic page by slug
// @route   GET /api/pages/:slug
// @access  Public
export const getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cleanSlug = String(slug).toLowerCase().trim();

    let page = null;
    if (isDbConnected()) {
      try {
        page = await Page.findOne({ slug: cleanSlug, status: 'published' });
      } catch (e) {}
    }

    if (!page) {
      page = memoryPages.find((p) => p.slug === cleanSlug && p.status === 'published');
    }

    if (!page) {
      return res.status(404).json({ message: `Dynamic page '/page/${cleanSlug}' not found or in draft mode.` });
    }

    const pageObj = typeof page.toObject === 'function' ? page.toObject() : page;
    const seoAudit = calculateSeoHealth(pageObj.seo, pageObj.title);

    res.json({ ...pageObj, seoHealthScore: seoAudit.totalScore, seoAudit });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error fetching page' });
  }
};

// @desc    Create new dynamic page (Admin Only)
// @route   POST /api/pages
// @access  Private/Admin
export const createPage = async (req, res) => {
  try {
    const { title, slug, heroSubtitle, category, content, sections, status, author, seo } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ message: 'Page title and URL slug are required.' });
    }

    const cleanSlug = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    // Check duplicate
    let existing = null;
    if (isDbConnected()) {
      try { existing = await Page.findOne({ slug: cleanSlug }); } catch (e) {}
    }
    if (!existing) {
      existing = memoryPages.find((p) => p.slug === cleanSlug);
    }

    if (existing) {
      return res.status(400).json({ message: `A page with URL slug '/page/${cleanSlug}' already exists.` });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://wanderluxe.in';

    const pageData = {
      title,
      slug: cleanSlug,
      heroSubtitle: heroSubtitle || '',
      category: category || 'General',
      content: content || '',
      sections: sections || [],
      status: status || 'published',
      author: author || req.user?.name || 'WanderLuxe Editorial',
      seo: {
        metaTitle: seo?.metaTitle || `${title} | WanderLuxe`,
        metaDescription: seo?.metaDescription || heroSubtitle || content.substring(0, 160) || title,
        keywords: seo?.keywords || '',
        canonicalUrl: seo?.canonicalUrl || `${frontendUrl}/page/${cleanSlug}`,
        robots: seo?.robots || 'index, follow',
        ogTitle: seo?.ogTitle || seo?.metaTitle || title,
        ogDescription: seo?.ogDescription || seo?.metaDescription || '',
        ogImage: seo?.ogImage || (sections?.[0]?.imageUrl || ''),
        ogType: seo?.ogType || 'article',
        twitterCard: seo?.twitterCard || 'summary_large_image',
        twitterTitle: seo?.twitterTitle || seo?.metaTitle || title,
        twitterDescription: seo?.twitterDescription || seo?.metaDescription || '',
        twitterImage: seo?.twitterImage || seo?.ogImage || '',
        structuredDataType: seo?.structuredDataType || 'WebPage',
        structuredDataJson: seo?.structuredDataJson || ''
      }
    };

    let newPage = null;
    if (isDbConnected()) {
      try {
        newPage = await Page.create(pageData);
      } catch (dbErr) {
        console.warn('Page DB Save fallback:', dbErr.message);
      }
    }

    if (!newPage) {
      newPage = { ...pageData, _id: 'page_' + Date.now(), createdAt: new Date(), updatedAt: new Date() };
      memoryPages.unshift(newPage);
    }

    const seoAudit = calculateSeoHealth(newPage.seo, newPage.title);

    res.status(201).json({
      message: 'Dynamic page created successfully with full backend SEO configuration.',
      page: { ...newPage, seoHealthScore: seoAudit.totalScore, seoAudit }
    });
  } catch (error) {
    console.error('Create Page Error:', error);
    res.status(500).json({ message: error.message || 'Server Error creating page' });
  }
};

// @desc    Update existing dynamic page (Admin Only)
// @route   PUT /api/pages/:id
// @access  Private/Admin
export const updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, heroSubtitle, category, content, sections, status, author, seo } = req.body;

    let page = null;
    if (isDbConnected()) {
      try {
        page = await Page.findById(id);
      } catch (e) {}
    }

    if (!page) {
      page = memoryPages.find((p) => String(p._id) === String(id) || p.slug === id);
    }

    if (!page) {
      return res.status(404).json({ message: 'Page record not found.' });
    }

    if (title) page.title = title;
    if (slug) page.slug = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (heroSubtitle !== undefined) page.heroSubtitle = heroSubtitle;
    if (category !== undefined) page.category = category;
    if (content !== undefined) page.content = content;
    if (sections !== undefined) page.sections = sections;
    if (status !== undefined) page.status = status;
    if (author !== undefined) page.author = author;

    if (seo) {
      page.seo = {
        ...(page.seo || {}),
        ...seo
      };
    }

    page.updatedAt = new Date();

    if (isDbConnected() && typeof page.save === 'function') {
      await page.save();
    }

    const pageObj = typeof page.toObject === 'function' ? page.toObject() : page;
    const seoAudit = calculateSeoHealth(pageObj.seo, pageObj.title);

    res.json({
      message: 'Page updated successfully.',
      page: { ...pageObj, seoHealthScore: seoAudit.totalScore, seoAudit }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error updating page' });
  }
};

// @desc    Delete dynamic page (Admin Only)
// @route   DELETE /api/pages/:id
// @access  Private/Admin
export const deletePage = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      try {
        await Page.findByIdAndDelete(id);
      } catch (e) {}
    }

    const idx = memoryPages.findIndex((p) => String(p._id) === String(id) || p.slug === id);
    if (idx !== -1) {
      memoryPages.splice(idx, 1);
    }

    res.json({ message: 'Dynamic page deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error deleting page' });
  }
};
