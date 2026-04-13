import { Router } from 'express';
import { ApplicationController } from '../controllers/ApplicationController';
import { authenticate, restrictTo } from '../middleware/authMiddleware';

const router = Router();
const controller = new ApplicationController();

// App Routes
router.use(authenticate);

// Student Routes
router.post('/apply', restrictTo('STUDENT'), controller.apply);
router.get('/my-applications', restrictTo('STUDENT'), controller.getMyApplications);
router.get('/download-acceptance-letter/:id', restrictTo('STUDENT'), controller.downloadAcceptanceLetter);

// Company Routes
// Get applicants for a specific job
router.get('/job/:opportunityId', controller.getApplicants);
// Get all applicants for the company
router.get('/all', restrictTo('COMPANY'), controller.getAllApplicants);
// Update application status
router.put('/:id/status', controller.updateStatus);
router.post('/:id/respond-to-offer', controller.respondToOffer);

export default router;
