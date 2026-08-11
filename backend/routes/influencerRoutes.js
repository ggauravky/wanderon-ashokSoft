import express from 'express';
import { 
  getEligiblePlans, generateCoupon, getInfluencerCoupons, 
  getWalletSummary, getWalletTransactions, requestPayout, getAnalytics 
} from '../controllers/influencerController.js';

const router = express.Router();

router.get('/plans', getEligiblePlans);
router.post('/coupons', generateCoupon);
router.get('/coupons', getInfluencerCoupons);
router.get('/wallet', getWalletSummary);
router.get('/wallet/transactions', getWalletTransactions);
router.post('/payouts', requestPayout);
router.get('/analytics', getAnalytics);

export default router;
