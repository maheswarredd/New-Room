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

router.get('/', getMembers);

// Admin carryover management
router.get('/carryovers', adminOnly, getCarryoverManagement);

router.get('/:id', getMemberById);

router.put(
  '/:id/carryover',
  adminOnly,
  saveMemberCarryover
);

router.delete(
  '/:id/carryover',
  adminOnly,
  removeMemberCarryover
);

router.post(
  '/:id/carryover/reset',
  adminOnly,
  resetManagedMemberCarryover
);
router.post('/', adminOnly, createMember);
router.put('/:id', adminOnly, updateMember);
router.delete('/:id', adminOnly, deleteMember);
router.post('/:id/adjust-balance', adminOnly, adjustBalance);

export default router;
