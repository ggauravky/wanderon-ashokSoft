import express from 'express';
import { 
  registerUser, loginUser, influencerLogin, getMe, 
  updateUserProfile, applyInfluencer, addBooking, cancelUserBooking 
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { loginRateLimit } from '../middlewares/authRateLimit.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginRateLimit, loginUser);
router.post('/influencer-login', loginRateLimit, influencerLogin);
router.post('/influencer-apply', protect, applyInfluencer);
router.post('/influencer-signup', protect, applyInfluencer);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateUserProfile);
router.post('/booking', protect, addBooking);
router.put('/booking/cancel', protect, cancelUserBooking);

export default router;
