import { Router } from 'express';
import { AIController } from '../controllers/AIController';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware';

const router = Router();

// Publicly accessible chat (optional auth)
router.post('/chat', optionalAuthenticate, AIController.chat);

// History routes still require authentication
router.get('/history', authenticate, AIController.getHistory);
router.delete('/history', authenticate, AIController.clearHistory);

export default router;
