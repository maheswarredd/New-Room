import express from 'express';
import {
  getAvailableMonths,
  getMonthlySummary,
  getDashboardMetrics,
} from '../controllers/summaryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/months', getAvailableMonths);
router.get('/monthly', getMonthlySummary);
router.get('/dashboard', getDashboardMetrics);

export default router;
