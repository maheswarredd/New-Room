import express from 'express';

import {
  getAvailableMonths,
  getMonthlySummary,
  getDashboardMetrics,
  resetMemberCarryover,
  resetAllCarryovers,
} from '../controllers/summaryController.js';

import {
  protect,
  adminOnly,
} from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/months', getAvailableMonths);
router.get('/monthly', getMonthlySummary);
router.get('/dashboard', getDashboardMetrics);

// Admin-only carryover reset
router.post(
  '/reset-member-carryover',
  adminOnly,
  resetMemberCarryover
);

router.post(
  '/reset-all-carryovers',
  adminOnly,
  resetAllCarryovers
);

export default router;
