import { Router } from 'express';
import { ApplicationController } from '../controllers/ApplicationController';

const router = Router();
const controller = new ApplicationController();

// Student Routes
router.post('/apply', controller.apply);
router.get('/my-applications', controller.getMyApplications);

// Company Routes
// Get applicants for a specific job
router.get('/job/:opportunityId', controller.getApplicants);
// Update application status
router.put('/:id/status', controller.updateStatus);
router.post('/:id/respond-to-offer', controller.respondToOffer);

export default router;
