import { Router } from 'express';
import { LearningController } from '../controllers/LearningController';

const router = Router();
const controller = new LearningController();

router.get('/', controller.getAllResources);
router.get('/recommended', controller.getRecommended);

export default router;
