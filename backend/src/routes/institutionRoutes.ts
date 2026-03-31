import { Router } from 'express';
import { InstitutionPortalController } from '../controllers/InstitutionPortalController';
import { DepartmentController } from '../controllers/DepartmentController';

import { authenticate, restrictTo } from '../middleware/authMiddleware';

const router = Router();
const controller = new InstitutionPortalController();
const deptController = new DepartmentController();

router.use(authenticate);
router.use(restrictTo('INSTITUTION', 'DEPARTMENT_ADMIN'));

// Analytics
router.get('/analytics', controller.getAnalytics);

// Student Management (Isolated)
router.get('/students', controller.getStudents);
router.get('/sync-status', controller.getSyncStatus);
router.patch('/settings', controller.updateSettings);
router.get('/placements', controller.getPlacements);
router.get('/documents', controller.getDocuments);

// Department Management
router.post('/departments', deptController.createDepartment);
router.get('/departments', deptController.getByInstitution);
router.get('/departments/:institutionId', deptController.getByInstitution);
router.patch('/departments/:id/metadata', deptController.updateMetadata);
router.post('/departments/:id/assign-admin', deptController.assignAdmin);
router.patch('/departments/:id/status', deptController.toggleStatus);

// Admin Access (Legacy/Alternative)
router.get('/:id/analytics', controller.getAnalytics);

// Document Assignment
const docController = new (require('../controllers/DocumentController').DocumentController)();
router.post('/documents/assign', docController.assignDocumentToStudent);

export default router;
