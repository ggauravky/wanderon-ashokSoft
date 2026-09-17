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
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public / Read-Only Endpoints
router.get('/', listMediaAssets);
router.post('/resolve-itinerary', resolveItineraryMediaController);

// Protected Admin Operations
router.get('/coverage', protect, adminOnly, getMediaCoverageReport);
router.get('/health', protect, adminOnly, getMediaHealth);
router.get('/admin', protect, adminOnly, (req, res) => {
  req.mediaAdmin = true;
  return listMediaAssets(req, res);
});
router.post('/', protect, adminOnly, createMediaAsset);
router.get('/:id', protect, adminOnly, getMediaAssetById);
router.put('/:id', protect, adminOnly, updateMediaAsset);
router.patch('/:id', protect, adminOnly, updateMediaAsset);
router.delete('/:id', protect, adminOnly, deleteMediaAsset);

export default router;
