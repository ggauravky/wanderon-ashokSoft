import express from 'express';
import { 
  uploadImageController, uploadVideoController 
} from '../controllers/uploadController.js';
import { uploadSingleImage, uploadMultipleImages, uploadSingleVideo } from '../middlewares/uploadMiddleware.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Protected Upload Endpoints
router.post('/image', protect, uploadSingleImage, uploadImageController);
router.post('/images', protect, uploadMultipleImages, uploadImageController);
router.post('/video', protect, uploadSingleVideo, uploadVideoController);

export default router;
