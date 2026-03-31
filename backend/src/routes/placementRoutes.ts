
import { Router } from 'express';
import { PlacementController } from '../controllers/PlacementController';
import { authenticate, restrictTo } from '../middleware/authMiddleware';

const router = Router();
const placementController = new PlacementController();

router.use(authenticate);

router.get('/my-placements', restrictTo('COMPANY'), placementController.getMyPlacements);
router.get('/student-contacts', restrictTo('COMPANY'), placementController.getStudentContacts);
router.get('/host-contacts', restrictTo('STUDENT'), placementController.getHostContacts);
router.patch('/:id/feedback', restrictTo('COMPANY'), placementController.submitFeedback);
router.post('/:id/certificate', restrictTo('COMPANY'), placementController.generateCertificate);
router.post('/assessments', placementController.submitAssessment);
router.get('/:id/assessments', placementController.getAssessments);

// Logbook Routes
router.get('/logbook', placementController.getWeeklyLogbooks);
router.post('/logbook', restrictTo('STUDENT'), placementController.saveWeeklyLogbook);
router.post('/logbook/sign', placementController.signWeeklyLogbook);
router.get('/logbook/export', placementController.exportWeeklyLogbookToPDF);

export default router;
