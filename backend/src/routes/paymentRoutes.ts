import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';

import { authenticate } from '../middleware/authMiddleware';

const router = Router();
const controller = new PaymentController();

// Create Payment
router.post('/pay', authenticate, controller.initiatePayment);

// Get History
router.get('/my-history', authenticate, controller.getMyHistory);

// Get Company Transactions
router.get('/company-transactions', authenticate, controller.getCompanyTransactions);

// Callback (Publicly accessible, no auth middleware usually, but here behind /api)
router.post('/callback', controller.handleCallback);

export default router;
