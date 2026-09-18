import express from 'express';
import { 
  getAdminStats, getAdminUsers, getAdminUserById, createAdminStaffUser, updateUserRole, updateUserAccountStatus, getAdminBookings, getAdminBookingById,
  getInfluencerApplications, getInfluencerApplicationById, approveInfluencerApplication, rejectInfluencerApplication, updateTripSeo,
  getRevenueReport, getDepartureOccupancyReport, getLeadFunnelReport
} from '../controllers/adminController.js';
import { getCoupons, createCoupon, updateCoupon, toggleCoupon, deleteCoupon } from '../controllers/couponAdminController.js';
import { createPayout, getEligiblePayoutCreators, getPayoutById, getPayouts, updatePayoutStatus } from '../controllers/payoutAdminController.js';
import { getTeamAnalyticsMembers, getTeamMemberAnalytics } from '../controllers/teamAnalyticsController.js';
import { protect, adminOnly, checkPermission } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply authentication & admin authorization to all /api/admin endpoints
router.use(protect);
router.use(adminOnly);

router.get('/stats', getAdminStats);
router.get('/team-analytics/members', getTeamAnalyticsMembers);
router.get('/team-analytics/members/:userId', getTeamMemberAnalytics);
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.put('/coupons/:id/toggle', toggleCoupon);
router.delete('/coupons/:id', deleteCoupon);
router.get('/payouts/eligible-creators', getEligiblePayoutCreators);
router.get('/payouts', getPayouts);
router.post('/payouts', createPayout);
router.get('/payouts/:id', getPayoutById);
router.put('/payouts/:id/status', updatePayoutStatus);
router.get('/users', getAdminUsers);
router.post('/users/staff', createAdminStaffUser);
router.get('/users/:id', getAdminUserById);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserAccountStatus);
router.get('/bookings', getAdminBookings);
router.get('/bookings/:id', getAdminBookingById);

// Influencer Verification Routes
router.get('/influencer-applications', getInfluencerApplications);
router.get('/influencer-applications/:id', getInfluencerApplicationById);
router.put('/influencer-applications/:id/approve', approveInfluencerApplication);
router.put('/influencer-applications/:id/reject', rejectInfluencerApplication);

// Trip-Level SEO Route
router.put('/trips/:id/seo', updateTripSeo);

// Reports & Analytics Routes
router.get('/reports/revenue', getRevenueReport);
router.get('/reports/departures', getDepartureOccupancyReport);
router.get('/reports/lead-funnel', getLeadFunnelReport);

export default router;

