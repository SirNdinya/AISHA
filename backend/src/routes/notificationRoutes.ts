import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';

const router = Router();
const controller = new NotificationController();

router.get('/', controller.getMyNotifications);
router.patch('/:id/read', controller.markAsRead);

export default router;
