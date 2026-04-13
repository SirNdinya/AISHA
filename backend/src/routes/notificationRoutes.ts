import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();
const controller = new NotificationController();

router.use(authenticate);

router.get('/', controller.getMyNotifications);
router.patch('/:id/read', controller.markAsRead);

export default router;
