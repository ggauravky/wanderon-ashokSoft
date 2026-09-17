import express from 'express';
import {
  listMediaAssets,
  getMediaAssetById,
  createMediaAsset,
  updateMediaAsset,
  deleteMediaAsset,
  resolveItineraryMediaController,
  getMediaCoverageReport,
  getMediaHealth
} from '../controllers/mediaAssetController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public / Read-Only Endpoints
router.get('/', listMediaAssets);
router.post('/resolve-itinerary', resolveItineraryMediaController);

// Protected Admin / Staff Operations
router.get('/coverage', protect, getMediaCoverageReport);
router.get('/health', protect, getMediaHealth);
router.post('/', protect, createMediaAsset);
router.get('/:id', protect, getMediaAssetById);
router.put('/:id', protect, updateMediaAsset);
router.patch('/:id', protect, updateMediaAsset);
router.delete('/:id', protect, deleteMediaAsset);

export default router;
