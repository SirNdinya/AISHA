
import { Router } from 'express';
import { DepartmentController } from '../controllers/DepartmentController';
import { AdminController } from '../controllers/AdminController';

const router = Router();
const deptController = new DepartmentController();
const adminController = new AdminController();

router.get('/departments', deptController.list);
router.get('/broadcasts/active', adminController.getActiveBroadcasts);
router.get('/settings/global', adminController.getGlobalSettings);

export default router;
