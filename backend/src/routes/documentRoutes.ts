import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { authenticate } from '../middleware/authMiddleware';
import { documentUpload } from '../middleware/uploadMiddleware';

const router = Router();
const controller = new DocumentController();

router.use(authenticate);

router.get('/placement-letter/:applicationId', controller.downloadPlacementLetter);
router.get('/nita-form/:applicationId', controller.downloadNITAForm);

// Unified Uploads
router.post('/upload', documentUpload.single('file'), controller.uploadDocument);
router.get('/mine', controller.getMyDocuments);
router.get('/placement/:placementId', controller.getPlacementDocuments);
router.delete('/:id', controller.deleteDocument);

export default router;
