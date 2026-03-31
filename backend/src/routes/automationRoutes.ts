import { Router } from 'express';
import { AutomationController } from '../controllers/AutomationController';

const router = Router();
const controller = new AutomationController();

// Trigger Match (Manually called by user or scheduler)
router.post('/match/run', controller.runAutoMatch);

// Settings
router.patch('/settings', controller.toggleAutoApply);

export default router;
