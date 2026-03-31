import { Router } from 'express';
import { AIController } from '../controllers/AIController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All AI routes require authentication
router.use(authenticate);

router.post('/chat', AIController.chat);
router.get('/history', AIController.getHistory);
router.delete('/history', AIController.clearHistory);

export default router;
