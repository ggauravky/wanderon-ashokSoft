import express from 'express';
import { 
  getAdminStats, getCoupons, createCoupon, 
  toggleCoupon, deleteCoupon, getAdminUsers, updateUserRole, getAdminBookings,
  getInfluencerApplications, approveInfluencerApplication, rejectInfluencerApplication, updateTripSeo
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply authentication & admin authorization to all /api/admin endpoints
router.use(protect);
router.use(adminOnly);

router.get('/stats', getAdminStats);
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id/toggle', toggleCoupon);
router.delete('/coupons/:id', deleteCoupon);
router.get('/users', getAdminUsers);
router.put('/users/:id/role', updateUserRole);
router.get('/bookings', getAdminBookings);

// Influencer Verification Routes
router.get('/influencer-applications', getInfluencerApplications);
router.put('/influencer-applications/:id/approve', approveInfluencerApplication);
router.put('/influencer-applications/:id/reject', rejectInfluencerApplication);

// Trip-Level SEO Route
router.put('/trips/:id/seo', updateTripSeo);

export default router;
