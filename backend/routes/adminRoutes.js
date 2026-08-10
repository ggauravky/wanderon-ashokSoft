import express from 'express';
import { 
  getAdminStats, getCoupons, createCoupon, 
  toggleCoupon, deleteCoupon, getAdminUsers, updateUserRole 
} from '../controllers/adminController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/stats', getAdminStats);
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id/toggle', toggleCoupon);
router.delete('/coupons/:id', deleteCoupon);
router.get('/users', getAdminUsers);
router.put('/users/:id/role', updateUserRole);

export default router;
