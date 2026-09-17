import express from 'express';
import { 
  uploadImageController, uploadVideoController, uploadDocumentController 
} from '../controllers/uploadController.js';
import { 
  uploadSingleImage, uploadMultipleImages, uploadSingleVideo, 
  uploadSingleDocument, uploadMultipleDocuments 
} from '../middlewares/uploadMiddleware.js';
import { protect, requireRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Protected Upload Endpoints
const staffUpload = requireRoles('admin', 'sales', 'marketing');
router.post('/image', protect, staffUpload, uploadSingleImage, uploadImageController);
router.post('/images', protect, staffUpload, uploadMultipleImages, uploadImageController);
router.post('/document', protect, staffUpload, uploadSingleDocument, uploadDocumentController);
router.post('/documents', protect, staffUpload, uploadMultipleDocuments, uploadDocumentController);
router.post('/video', protect, staffUpload, uploadSingleVideo, uploadVideoController);

export default router;
