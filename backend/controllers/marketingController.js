import mongoose from 'mongoose';
import Campaign from '../models/Campaign.js';
import Banner from '../models/Banner.js';
import Lead from '../models/Lead.js';
import Booking from '../models/Booking.js';
import Coupon from '../models/Coupon.js';
import Trip from '../models/Trip.js';

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

export let memoryCampaigns = [
  {
    _id: 'camp_1',
    name: 'Autumn Himalayan Escapes 2026',
    code: 'AUTUMN_HIMALAYA_26',
    utmSource: 'meta',
    utmMedium: 'cpc',
    utmCampaign: 'autumn_himalaya',
    type: 'meta_ads',
    status: 'active',
    startDate: new Date('2026-08-15'),
    endDate: new Date('2026-10-31'),
    budget: 50000,
    spend: 22400,
    targetAudience: 'Adventure Travelers (Age 22-38)',
    targetDestinations: ['Spiti Valley', 'Meghalaya'],
    featuredTrips: ['spiti-valley-circuit-roadtrip', 'meghalaya-backpacking'],
    metrics: {
      impressions: 48500,
      clicks: 3420,
      leadsCount: 142,
      conversionsCount: 28,
      revenueGenerated: 616000
    },
    notes: 'Primary acquisition campaign for Q3 backpacking batches.',
    createdAt: new Date('2026-08-15')
  },
  {
    _id: 'camp_2',
    name: 'Diwali Festive Long Weekend Special',
    code: 'DIWALI_FESTIVE_26',
    utmSource: 'google_ads',
    utmMedium: 'search',
    utmCampaign: 'diwali_getaways',
    type: 'google_ads',
    status: 'active',
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-11-10'),
    budget: 35000,
    spend: 11200,
    targetAudience: 'Working Professionals, Couples',
    targetDestinations: ['Goa', 'Bali'],
    featuredTrips: ['goa-sun-beach', 'bali-island-escape'],
    metrics: {
      impressions: 29000,
      clicks: 1890,
      leadsCount: 68,
      conversionsCount: 14,
      revenueGenerated: 395000
    },
    notes: 'Search intent targeting for long weekend travel packages.',
    createdAt: new Date('2026-09-01')
  }
];

export let memoryBanners = [
  {
    _id: 'ban_1',
    title: 'Spiti Valley Autumn Circuit 2026',
    subtitle: 'Limited departures before the mountain passes close. Flat 15% Early Bird discount.',
    tag: 'Trending Adventure',
    imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200',
    mobileImageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=600',
    ctaText: 'Explore Spiti Expeditions',
    ctaLink: '/trip/spiti-valley-circuit-high-altitude-roadtrip',
    placement: 'home_hero',
    status: 'active',
    priorityOrder: 1,
    targetAudience: 'All',
    createdAt: new Date()
  },
  {
    _id: 'ban_2',
    title: 'Meghalaya Living Root Bridges & Waterfalls',
    subtitle: 'Experience the wettest place on Earth with verified local captains.',
    tag: 'Monsoon Magic',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200',
    mobileImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=600',
    ctaText: 'Book Meghalaya Batch',
    ctaLink: '/trip/meghalaya-backpacking-living-root-bridges',
    placement: 'offer_strip',
    status: 'active',
    priorityOrder: 2,
    targetAudience: 'All',
    createdAt: new Date()
  }
];

// ============================================================================
// 1. MARKETING DASHBOARD & ANALYTICS
// ============================================================================
// @desc    Get marketing metrics, lead sources, campaign ROI, coupon stats
// @route   GET /api/marketing/dashboard
// @access  Private (Marketing, Admin)
export const getMarketingDashboard = async (req, res) => {
  try {
    let campaigns = [];
    let totalLeads = 0;
    let leadsBySource = [];
    let totalSpend = 0;
    let totalRevenueGenerated = 0;
    let totalConversions = 0;
    let activeBannersCount = 0;

    if (isDbConnected()) {
      try {
        campaigns = await Campaign.find().sort({ createdAt: -1 });
        totalLeads = await Lead.countDocuments();
        activeBannersCount = await Banner.countDocuments({ status: 'active' });

        // Lead source aggregation
        const sourceAgg = await Lead.aggregate([
          { $group: { _id: '$source', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]);
        leadsBySource = sourceAgg.map(s => ({
          source: s._id || 'direct_website',
          count: s.count
        }));
      } catch (e) {
        console.warn('Marketing aggregate DB fallback:', e.message);
      }
    }

    if (campaigns.length === 0) {
      campaigns = memoryCampaigns;
      totalLeads = 210;
      activeBannersCount = memoryBanners.filter(b => b.status === 'active').length;
      leadsBySource = [
        { source: 'meta_ads', count: 112 },
        { source: 'trip_page', count: 54 },
        { source: 'google_search', count: 32 },
        { source: 'contact_page', count: 12 }
      ];
    }

    for (const c of campaigns) {
      totalSpend += Number(c.spend || 0);
      totalRevenueGenerated += Number(c.metrics?.revenueGenerated || 0);
      totalConversions += Number(c.metrics?.conversionsCount || 0);
    }

    const estimatedRoi = totalSpend > 0 
      ? Number((((totalRevenueGenerated - totalSpend) / totalSpend) * 100).toFixed(1))
      : 0;

    const conversionRate = totalLeads > 0 
      ? Number(((totalConversions / totalLeads) * 100).toFixed(1)) 
      : 0;

    res.json({
      success: true,
      dashboard: {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        activeBannersCount,
        totalLeads,
        totalConversions,
        conversionRate: `${conversionRate}%`,
        totalSpend,
        totalRevenueGenerated,
        estimatedRoi: `${estimatedRoi}%`,
        leadsBySource,
        topCampaigns: campaigns.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('getMarketingDashboard Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error generating marketing dashboard' });
  }
};

// ============================================================================
// 2. CAMPAIGN MANAGEMENT CRUD
// ============================================================================
// @desc    Get all campaigns
// @route   GET /api/marketing/campaigns
// @access  Private (Marketing, Admin)
export const getCampaigns = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status && status !== 'All') filter.status = status;
    if (type && type !== 'All') filter.type = type;

    let campaigns = [];
    if (isDbConnected()) {
      try {
        campaigns = await Campaign.find(filter).sort({ createdAt: -1 });
      } catch (e) {}
    }

    if (campaigns.length === 0) {
      campaigns = memoryCampaigns.filter(c => {
        if (status && status !== 'All' && c.status !== status) return false;
        if (type && type !== 'All' && c.type !== type) return false;
        return true;
      });
    }

    res.json({ success: true, count: campaigns.length, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server Error fetching campaigns' });
  }
};

// @desc    Get single campaign by ID
// @route   GET /api/marketing/campaigns/:id
// @access  Private (Marketing, Admin)
export const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    let campaign = null;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        campaign = await Campaign.findById(id);
      } catch (e) {}
    }
    if (!campaign) {
      campaign = memoryCampaigns.find(c => String(c._id) === String(id) || c.code === id);
    }

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    res.json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server Error fetching campaign' });
  }
};

// @desc    Create a new marketing campaign
// @route   POST /api/marketing/campaigns
// @access  Private (Marketing, Admin)
export const createCampaign = async (req, res) => {
  try {
    const {
      name,
      code,
      utmSource,
      utmMedium,
      utmCampaign,
      type,
      status,
      startDate,
      endDate,
      budget,
      spend,
      targetAudience,
      targetDestinations,
      featuredTrips,
      notes
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Campaign name and unique code are required.' });
    }

    const cleanCode = code.toUpperCase().trim();
    const campaignData = {
      name: name.trim(),
      code: cleanCode,
      utmSource: utmSource || 'meta',
      utmMedium: utmMedium || 'cpc',
      utmCampaign: utmCampaign || cleanCode.toLowerCase(),
      type: type || 'meta_ads',
      status: status || 'draft',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      budget: budget ? Number(budget) : 0,
      spend: spend ? Number(spend) : 0,
      targetAudience: targetAudience || '',
      targetDestinations: Array.isArray(targetDestinations) ? targetDestinations : [],
      featuredTrips: Array.isArray(featuredTrips) ? featuredTrips : [],
      metrics: { impressions: 0, clicks: 0, leadsCount: 0, conversionsCount: 0, revenueGenerated: 0 },
      notes: notes || '',
      createdBy: req.user?._id
    };

    let newCampaign = null;
    if (isDbConnected()) {
      try {
        const existing = await Campaign.findOne({ code: cleanCode });
        if (existing) {
          return res.status(400).json({ success: false, message: `Campaign code "${cleanCode}" already exists.` });
        }
        newCampaign = await Campaign.create(campaignData);
      } catch (e) {
        console.warn('Campaign create DB warning:', e.message);
      }
    }

    if (!newCampaign) {
      newCampaign = {
        _id: 'camp_' + Date.now(),
        ...campaignData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryCampaigns.unshift(newCampaign);
    }

    res.status(201).json({
      success: true,
      message: `Campaign "${newCampaign.name}" created successfully.`,
      campaign: newCampaign
    });
  } catch (error) {
    console.error('createCampaign Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error creating campaign' });
  }
};

// @desc    Update marketing campaign
// @route   PUT /api/marketing/campaigns/:id
// @access  Private (Marketing, Admin)
export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    let campaign = null;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        campaign = await Campaign.findById(id);
      } catch (e) {}
    }
    if (!campaign) {
      const memIndex = memoryCampaigns.findIndex(c => String(c._id) === String(id) || c.code === id);
      if (memIndex !== -1) campaign = memoryCampaigns[memIndex];
    }

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    const fields = ['name', 'utmSource', 'utmMedium', 'utmCampaign', 'type', 'status', 'budget', 'spend', 'targetAudience', 'targetDestinations', 'featuredTrips', 'notes'];
    for (const f of fields) {
      if (req.body[f] !== undefined) campaign[f] = req.body[f];
    }
    if (req.body.startDate) campaign.startDate = new Date(req.body.startDate);
    if (req.body.endDate !== undefined) campaign.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
    if (req.body.metrics) {
      campaign.metrics = { ...(campaign.metrics || {}), ...req.body.metrics };
    }
    campaign.updatedBy = req.user?._id;

    if (isDbConnected() && typeof campaign.save === 'function') {
      await campaign.save();
    }

    res.json({
      success: true,
      message: `Campaign "${campaign.name}" updated successfully.`,
      campaign
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server Error updating campaign' });
  }
};

// @desc    Delete marketing campaign
// @route   DELETE /api/marketing/campaigns/:id
// @access  Private (Marketing, Admin)
export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await Campaign.findByIdAndDelete(id);
      } catch (e) {}
    }

    memoryCampaigns = memoryCampaigns.filter(c => String(c._id) !== String(id) && c.code !== id);

    res.json({ success: true, message: 'Campaign deleted successfully.', id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server Error deleting campaign' });
  }
};

// ============================================================================
// 3. WEBSITE CONTENT & BANNER MANAGEMENT
// ============================================================================
// @desc    Get all website promotional banners (Admin/Marketing)
// @route   GET /api/marketing/banners
// @access  Private (Marketing, Admin)
export const getBanners = async (req, res) => {
  try {
    const { placement, status } = req.query;
    const filter = {};
    if (placement && placement !== 'All') filter.placement = placement;
    if (status && status !== 'All') filter.status = status;

    let banners = [];
    if (isDbConnected()) {
      try {
        banners = await Banner.find(filter).sort({ priorityOrder: 1, createdAt: -1 });
      } catch (e) {}
    }

    if (banners.length === 0) {
      banners = memoryBanners.filter(b => {
        if (placement && placement !== 'All' && b.placement !== placement) return false;
        if (status && status !== 'All' && b.status !== status) return false;
        return true;
      });
    }

    res.json({ success: true, count: banners.length, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server Error fetching banners' });
  }
};

// @desc    Get active banners for public website display
// @route   GET /api/marketing/banners/active
// @access  Public
export const getActiveBanners = async (req, res) => {
  try {
    const { placement } = req.query;
    const filter = { status: 'active' };
    if (placement && placement !== 'All') filter.placement = placement;

    let banners = [];
    if (isDbConnected()) {
      try {
        banners = await Banner.find(filter).sort({ priorityOrder: 1 });
      } catch (e) {}
    }

    if (banners.length === 0) {
      banners = memoryBanners.filter(b => b.status === 'active' && (!placement || placement === 'All' || b.placement === placement));
    }

    res.json({ success: true, count: banners.length, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server Error fetching active banners' });
  }
};

// @desc    Create a promotional banner
// @route   POST /api/marketing/banners
// @access  Private (Marketing, Admin)
export const createBanner = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      tag,
      imageUrl,
      mobileImageUrl,
      ctaText,
      ctaLink,
      placement,
      status,
      priorityOrder,
      startDate,
      endDate,
      targetAudience
    } = req.body;

    if (!title || !imageUrl) {
      return res.status(400).json({ success: false, message: 'Banner title and image URL are required.' });
    }

    const bannerData = {
      title: title.trim(),
      subtitle: subtitle || '',
      tag: tag || 'Special Offer',
      imageUrl: imageUrl.trim(),
      mobileImageUrl: mobileImageUrl || '',
      ctaText: ctaText || 'Explore Expeditions',
      ctaLink: ctaLink || '/trips',
      placement: placement || 'home_hero',
      status: status || 'active',
      priorityOrder: priorityOrder ? Number(priorityOrder) : 1,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      targetAudience: targetAudience || 'All',
      createdBy: req.user?._id
    };

    let newBanner = null;
    if (isDbConnected()) {
      try {
        newBanner = await Banner.create(bannerData);
      } catch (e) {}
    }

    if (!newBanner) {
      newBanner = {
        _id: 'ban_' + Date.now(),
        ...bannerData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryBanners.push(newBanner);
    }

    res.status(201).json({
      success: true,
      message: `Banner "${newBanner.title}" created successfully.`,
      banner: newBanner
    });
  } catch (error) {
    console.error('createBanner Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error creating banner' });
  }
};

// @desc    Update a promotional banner
// @route   PUT /api/marketing/banners/:id
// @access  Private (Marketing, Admin)
export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    let banner = null;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        banner = await Banner.findById(id);
      } catch (e) {}
    }
    if (!banner) {
      const memIndex = memoryBanners.findIndex(b => String(b._id) === String(id));
      if (memIndex !== -1) banner = memoryBanners[memIndex];
    }

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found.' });
    }

    const fields = ['title', 'subtitle', 'tag', 'imageUrl', 'mobileImageUrl', 'ctaText', 'ctaLink', 'placement', 'status', 'priorityOrder', 'targetAudience'];
    for (const f of fields) {
      if (req.body[f] !== undefined) banner[f] = req.body[f];
    }
    if (req.body.startDate !== undefined) banner.startDate = req.body.startDate ? new Date(req.body.startDate) : null;
    if (req.body.endDate !== undefined) banner.endDate = req.body.endDate ? new Date(req.body.endDate) : null;

    if (isDbConnected() && typeof banner.save === 'function') {
      await banner.save();
    }

    res.json({ success: true, message: 'Banner updated successfully.', banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server Error updating banner' });
  }
};

// @desc    Delete a promotional banner
// @route   DELETE /api/marketing/banners/:id
// @access  Private (Marketing, Admin)
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await Banner.findByIdAndDelete(id);
      } catch (e) {}
    }

    memoryBanners = memoryBanners.filter(b => String(b._id) !== String(id));

    res.json({ success: true, message: 'Banner deleted successfully.', id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server Error deleting banner' });
  }
};
