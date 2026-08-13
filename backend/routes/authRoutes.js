import express from 'express';
import { 
  registerUser, loginUser, getMe, 
  updateUserProfile, applyInfluencer, addBooking, cancelUserBooking 
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateUserProfile);
router.post('/influencer-apply', protect, applyInfluencer);
router.post('/booking', protect, addBooking);
router.put('/booking/cancel', protect, cancelUserBooking);

export default router;
