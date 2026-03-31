import { Router } from 'express';
import { AssessmentController } from '../controllers/AssessmentController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();
const assessmentController = new AssessmentController();

router.use(authenticate);

router.post('/propose', assessmentController.proposeAssessment);
router.patch('/:id/status', assessmentController.updateAssessmentStatus);
router.get('/', assessmentController.getAssessments);
router.get('/:id', assessmentController.getOne);

export default router;
