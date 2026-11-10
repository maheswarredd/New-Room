import express from 'express';
import {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  adjustBalance,
  getCarryoverManagement,
  saveMemberCarryover,
  removeMemberCarryover,
  resetManagedMemberCarryover,
} from '../controllers/memberController.js';

import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Member list
router.get('/', getMembers);

// Admin Carryover Management
// IMPORTANT: Specific routes must come before /:id routes
router.get('/carryovers', adminOnly, getCarryoverManagement);

router.put('/:id/carryover', adminOnly, saveMemberCarryover);

router.delete('/:id/carryover', adminOnly, removeMemberCarryover);

router.post('/:id/carryover/reset', adminOnly, resetManagedMemberCarryover);

// Individual member routes
router.get('/:id', getMemberById);

router.post('/:id/adjust-balance', adminOnly, adjustBalance);

router.post('/', adminOnly, createMember);

router.put('/:id', adminOnly, updateMember);

router.delete('/:id', adminOnly, deleteMember);

export default router;
