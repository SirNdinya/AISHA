import { Router } from 'express';
import { MessageController } from '../controllers/MessageController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();
const controller = new MessageController();

router.use(authenticate);

router.post('/send', controller.send);
router.get('/conversation', controller.getConversation);
router.get('/analyze-context', controller.analyzeContext);
router.post('/suggest-response', controller.suggestResponse);

export default router;
