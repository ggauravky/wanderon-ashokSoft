import mongoose from 'mongoose';
import Page from '../models/Page.js';

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

const normalizeSlug = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^{}()|[\]\\$]/g, '\\$&');
const requireDatabase = (res) => {
  if (isDbConnected()) return true;
  res.status(503).json({ success: false, message: 'CMS pages are unavailable while the database is disconnected.' });
  return false;
};

const withSeoAudit = (page) => {
  const pageObject = typeof page?.toObject === 'function' ? page.toObject() : page;
  const seoAudit = calculateSeoHealth(pageObject?.seo, pageObject?.title);
  return { ...pageObject, seoHealthScore: seoAudit.totalScore, seoAudit };
};

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

// @desc    Get published dynamic pages
// @route   GET /api/pages
// @access  Public
export const getAllPages = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const pages = await Page.find({ status: 'published' }).sort({ updatedAt: -1 }).limit(100).lean();
    return res.json(pages.map(withSeoAudit));
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server Error fetching pages' });
  }
};

// @desc    Get all CMS pages, including drafts
// @route   GET /api/pages/admin
// @access  Private/Admin
export const getAdminPages = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const { search, status = 'all', page = 1, limit = 25, sort = 'updated_desc' } = req.query;
    const filter = {};
    if (status !== 'all') filter.status = status;
    if (search?.trim()) {
      const pattern = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ title: pattern }, { slug: pattern }, { category: pattern }, { author: pattern }];
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 25));
    const sortOptions = {
      updated_desc: { updatedAt: -1 },
      updated_asc: { updatedAt: 1 },
      title_asc: { title: 1 },
      title_desc: { title: -1 }
    };
    const [total, pages] = await Promise.all([
      Page.countDocuments(filter),
      Page.find(filter)
        .sort(sortOptions[sort] || sortOptions.updated_desc)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean()
    ]);

    return res.json({
      success: true,
      pages: pages.map(withSeoAudit),
      pagination: { page: pageNumber, limit: pageSize, total, pages: Math.ceil(total / pageSize) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server Error fetching CMS pages' });
  }
};

// @desc    Get one CMS page, including drafts
// @route   GET /api/pages/admin/:id
// @access  Private/Admin
export const getAdminPageById = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const { id } = req.params;
    const filter = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: normalizeSlug(id) };
    const page = await Page.findOne(filter).lean();
    if (!page) return res.status(404).json({ success: false, message: 'Page record not found.' });
    return res.json({ success: true, page: withSeoAudit(page) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server Error fetching CMS page' });
  }
};

// @desc    Get single published dynamic page by slug
// @route   GET /api/pages/:slug
// @access  Public
export const getPageBySlug = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const cleanSlug = normalizeSlug(req.params.slug);
    const page = await Page.findOne({ slug: cleanSlug, status: 'published' }).lean();
    if (!page) {
      return res.status(404).json({ message: `Dynamic page '/page/${cleanSlug}' not found or in draft mode.` });
    }
    return res.json(withSeoAudit(page));
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server Error fetching page' });
  }
};

const buildSeo = ({ seo = {}, title, slug, heroSubtitle = '', content = '', sections = [] }, currentSeo = {}) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://wanderluxe.in';
  const merged = { ...currentSeo, ...seo };
  return {
    metaTitle: merged.metaTitle || `${title} | WanderLuxe`,
    metaDescription: merged.metaDescription || heroSubtitle || String(content).slice(0, 160),
    keywords: merged.keywords || '',
    canonicalUrl: merged.canonicalUrl || `${frontendUrl}/page/${slug}`,
    robots: merged.robots || 'index, follow',
    ogTitle: merged.ogTitle || merged.metaTitle || title,
    ogDescription: merged.ogDescription || merged.metaDescription || '',
    ogImage: merged.ogImage || sections?.[0]?.imageUrl || '',
    ogType: merged.ogType || 'website',
    twitterCard: merged.twitterCard || 'summary_large_image',
    twitterTitle: merged.twitterTitle || merged.ogTitle || title,
    twitterDescription: merged.twitterDescription || merged.ogDescription || '',
    twitterImage: merged.twitterImage || merged.ogImage || '',
    structuredDataType: merged.structuredDataType || 'WebPage',
    structuredDataJson: merged.structuredDataJson || ''
  };
};

// @desc    Create new dynamic page
// @route   POST /api/pages
// @access  Private/Admin
export const createPage = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const { title, slug, heroSubtitle = '', category = 'General', content = '', sections = [], status = 'draft', author, seo = {} } = req.body;
    const cleanTitle = String(title || '').trim();
    const cleanSlug = normalizeSlug(slug || cleanTitle);
    if (!cleanTitle || !cleanSlug) return res.status(400).json({ message: 'Page title and URL slug are required.' });
    if (!['draft', 'published'].includes(status)) return res.status(400).json({ message: 'Page status must be draft or published.' });

    const duplicate = await Page.exists({ slug: cleanSlug });
    if (duplicate) return res.status(409).json({ message: `A page with URL slug '/page/${cleanSlug}' already exists.` });

    const pageData = {
      title: cleanTitle,
      slug: cleanSlug,
      heroSubtitle,
      category,
      content,
      sections: Array.isArray(sections) ? sections : [],
      status,
      author: String(author || req.user?.name || 'WanderLuxe Editorial Team').trim(),
      seo: buildSeo({ seo, title: cleanTitle, slug: cleanSlug, heroSubtitle, content, sections })
    };
    const newPage = await Page.create(pageData);
    return res.status(201).json({ message: 'Dynamic page created successfully.', page: withSeoAudit(newPage) });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'A page with this URL slug already exists.' });
    console.error('Create Page Error:', error);
    return res.status(500).json({ message: error.message || 'Server Error creating page' });
  }
};

// @desc    Update existing dynamic page
// @route   PUT /api/pages/:id
// @access  Private/Admin
export const updatePage = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid page ID.' });
    const page = await Page.findById(id);
    if (!page) return res.status(404).json({ message: 'Page record not found.' });

    const nextTitle = req.body.title !== undefined ? String(req.body.title).trim() : page.title;
    const nextSlug = req.body.slug !== undefined ? normalizeSlug(req.body.slug) : page.slug;
    const identityChanged = nextSlug !== page.slug || nextTitle !== page.title;
    if (!nextTitle || !nextSlug) return res.status(400).json({ message: 'Page title and URL slug are required.' });
    if (req.body.status !== undefined && !['draft', 'published'].includes(req.body.status)) {
      return res.status(400).json({ message: 'Page status must be draft or published.' });
    }
    const duplicate = await Page.exists({ slug: nextSlug, _id: { $ne: page._id } });
    if (duplicate) return res.status(409).json({ message: `A page with URL slug '/page/${nextSlug}' already exists.` });

    page.title = nextTitle;
    page.slug = nextSlug;
    if (req.body.heroSubtitle !== undefined) page.heroSubtitle = req.body.heroSubtitle;
    if (req.body.category !== undefined) page.category = req.body.category;
    if (req.body.content !== undefined) page.content = req.body.content;
    if (req.body.sections !== undefined) page.sections = Array.isArray(req.body.sections) ? req.body.sections : [];
    if (req.body.status !== undefined) page.status = req.body.status;
    if (req.body.author !== undefined) page.author = req.body.author;
    if (req.body.seo !== undefined || identityChanged) {
      page.seo = buildSeo({
        seo: req.body.seo || {},
        title: page.title,
        slug: page.slug,
        heroSubtitle: page.heroSubtitle,
        content: page.content,
        sections: page.sections
      }, page.seo?.toObject?.() || page.seo || {});
    }

    await page.save();
    return res.json({ message: 'Page updated successfully.', page: withSeoAudit(page) });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'A page with this URL slug already exists.' });
    return res.status(500).json({ message: error.message || 'Server Error updating page' });
  }
};

// @desc    Delete dynamic page
// @route   DELETE /api/pages/:id
// @access  Private/Admin
export const deletePage = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid page ID.' });
    const page = await Page.findByIdAndDelete(id);
    if (!page) return res.status(404).json({ message: 'Page record not found.' });
    return res.json({ message: 'Dynamic page deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server Error deleting page' });
  }
};
