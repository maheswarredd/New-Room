import express from 'express';
import {
  getPayments,
  createPayment,
  deletePayment,
} from '../controllers/paymentController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/', getPayments);
router.post('/', upload.single('proof'), createPayment);
router.delete('/:id', adminOnly, deletePayment);

export default router;
