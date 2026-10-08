import express from 'express';
import { protect } from '../middleware/auth.js';
import { registerDevice, unregisterDevice, testNotification } from '../controllers/notificationController.js';

const router = express.Router();
router.use(protect);
router.post('/register', registerDevice);
router.post('/unregister', unregisterDevice);
router.post('/test', testNotification);
export default router;
