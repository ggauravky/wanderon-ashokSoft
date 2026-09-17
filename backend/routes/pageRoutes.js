import express from 'express';
import { 
  getAllPages, getAdminPages, getAdminPageById, getPageBySlug, createPage,
  updatePage, deletePage 
} from '../controllers/pageController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public Dynamic Pages Endpoints
router.get('/', getAllPages);
router.get('/admin', protect, adminOnly, getAdminPages);
router.get('/admin/:id', protect, adminOnly, getAdminPageById);
router.get('/:slug', getPageBySlug);

// Admin Protected Dynamic Page Management
router.post('/', protect, adminOnly, createPage);
router.put('/:id', protect, adminOnly, updatePage);
router.delete('/:id', protect, adminOnly, deletePage);

export default router;
