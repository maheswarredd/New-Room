import express from 'express';
import {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  adjustBalance,
} from '../controllers/memberController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getMembers);
router.get('/:id', getMemberById);
router.post('/', adminOnly, createMember);
router.put('/:id', adminOnly, updateMember);
router.delete('/:id', adminOnly, deleteMember);
router.post('/:id/adjust-balance', adminOnly, adjustBalance);

export default router;
