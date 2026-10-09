import express from 'express';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  reviewExpense,
} from '../controllers/expenseController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/', getExpenses);
router.post('/', upload.single('receipt'), createExpense);
// NEW: Admin accepts or rejects an expense
router.put('/:id/review', reviewExpense);
router.put('/:id', upload.single('receipt'), updateExpense);
router.delete('/:id', deleteExpense);

export default router;
