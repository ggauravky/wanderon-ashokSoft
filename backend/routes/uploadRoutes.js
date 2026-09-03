import express from 'express';
import { 
  uploadImageController, uploadVideoController, uploadDocumentController 
} from '../controllers/uploadController.js';
import { 
  uploadSingleImage, uploadMultipleImages, uploadSingleVideo, 
  uploadSingleDocument, uploadMultipleDocuments 
} from '../middlewares/uploadMiddleware.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Protected Upload Endpoints
router.post('/image', protect, uploadSingleImage, uploadImageController);
router.post('/images', protect, uploadMultipleImages, uploadImageController);
router.post('/document', protect, uploadSingleDocument, uploadDocumentController);
router.post('/documents', protect, uploadMultipleDocuments, uploadDocumentController);
router.post('/video', protect, uploadSingleVideo, uploadVideoController);

export default router;
