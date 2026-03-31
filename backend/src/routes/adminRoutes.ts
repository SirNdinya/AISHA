import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';

const router = Router();
const controller = new AdminController();

// Verify Users
router.get('/users/unverified', controller.getUnverifiedUsers);
router.patch('/users/:userId/verify', controller.verifyUser);

// Broadcasts
router.post('/broadcasts', controller.createBroadcast);
router.get('/broadcasts', controller.getBroadcasts);
router.patch('/broadcasts/:id/toggle', controller.toggleBroadcast);

// Settings
router.get('/settings', controller.getSettings);
router.patch('/settings', controller.updateSetting);

// Institutions
router.get('/institutions', controller.getInstitutions);
router.patch('/institutions/:institutionId/verify', controller.verifyInstitution);

// Command Centre
router.post('/execute-command', controller.executeCommand);

export default router;
