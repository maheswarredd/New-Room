import express from 'express';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/', getExpenses);
router.post('/', upload.single('receipt'), createExpense);
router.put('/:id', upload.single('receipt'), updateExpense);
router.delete('/:id', deleteExpense);

export default router;
