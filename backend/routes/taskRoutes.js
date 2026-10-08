import express from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../controllers/taskController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', adminOnly, upload.single('photo'), createTask);
router.put('/:id', adminOnly, upload.single('photo'), updateTask);
router.patch('/:id/status', upload.single('completionPhoto'), updateTaskStatus);
router.delete('/:id', adminOnly, deleteTask);

export default router;
