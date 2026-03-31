import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';

const router = Router();
const controller = new PaymentController();

// Create Payment
router.post('/pay', controller.initiatePayment);

// Get History
router.get('/my-history', controller.getMyHistory);

// Callback (Publicly accessible, no auth middleware usually, but here behind /api)
// In prod, this should be whitelisted or authenticated via IP/secret
router.post('/callback', controller.handleCallback);

export default router;
