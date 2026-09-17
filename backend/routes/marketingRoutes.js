import express from 'express';
import {
  getMarketingDashboard,
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getBanners,
  getBannerById,
  getActiveBanners,
  createBanner,
  updateBanner,
  deleteBanner
} from '../controllers/marketingController.js';
import { protect, checkPermission } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public Banner Access for Customer Website
router.get('/banners/active', getActiveBanners);

// Protected Marketing Endpoints
router.use(protect);

router.get('/dashboard', checkPermission('marketing:view_dashboard'), getMarketingDashboard);

// Campaign Routes
router.get('/campaigns', checkPermission('marketing:manage_campaigns'), getCampaigns);
router.post('/campaigns', checkPermission('marketing:manage_campaigns'), createCampaign);
router.get('/campaigns/:id', checkPermission('marketing:manage_campaigns'), getCampaignById);
router.put('/campaigns/:id', checkPermission('marketing:manage_campaigns'), updateCampaign);
router.delete('/campaigns/:id', checkPermission('marketing:manage_campaigns'), deleteCampaign);

// Banner Management Routes
router.get('/banners', checkPermission('marketing:manage_banners'), getBanners);
router.post('/banners', checkPermission('marketing:manage_banners'), createBanner);
router.get('/banners/:id', checkPermission('marketing:manage_banners'), getBannerById);
router.put('/banners/:id', checkPermission('marketing:manage_banners'), updateBanner);
router.delete('/banners/:id', checkPermission('marketing:manage_banners'), deleteBanner);

export default router;
