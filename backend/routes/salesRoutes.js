import express from 'express';
import { getSalesDashboard } from '../controllers/salesController.js';
import { protect, checkPermission } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', checkPermission('sales:view_dashboard'), getSalesDashboard);

export default router;
