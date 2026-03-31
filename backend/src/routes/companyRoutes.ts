import { Router } from 'express';
import { CompanyController } from '../controllers/CompanyController';
import { OpportunityController } from '../controllers/OpportunityController';
import { authenticate, restrictTo } from '../middleware/authMiddleware';

const companyRouter = Router();
const companyController = new CompanyController();

// Protect all company routes
companyRouter.use(authenticate);
companyRouter.use(restrictTo('COMPANY'));

// Company Profile Routes
companyRouter.get('/profile', companyController.getProfile);
companyRouter.patch('/profile', companyController.updateProfile);

// Department Routes
companyRouter.get('/departments', companyController.getDepartments);
companyRouter.post('/departments', companyController.createDepartment);
companyRouter.delete('/departments/:id', companyController.deleteDepartment);

// Supervisor Routes
companyRouter.get('/supervisors', companyController.getSupervisors);
companyRouter.post('/supervisors', companyController.createSupervisor);
companyRouter.delete('/supervisors/:id', companyController.deleteSupervisor);

const opportunityRouter = Router();
const opportunityController = new OpportunityController();

// Protect specific opportunity routes
opportunityRouter.post('/generate', authenticate, restrictTo('COMPANY'), opportunityController.generateOpportunity);
opportunityRouter.get('/my-postings', authenticate, restrictTo('COMPANY'), opportunityController.getMyOpportunities);
opportunityRouter.post('/', authenticate, restrictTo('COMPANY'), opportunityController.createOpportunity);
opportunityRouter.put('/:id', authenticate, restrictTo('COMPANY'), opportunityController.updateOpportunity);
opportunityRouter.delete('/:id', authenticate, restrictTo('COMPANY'), opportunityController.deleteOpportunity);
opportunityRouter.get('/analytics', authenticate, restrictTo('COMPANY'), companyController.getTalentAnalytics);

// Opportunity Routes (Public/Student)
opportunityRouter.get('/', opportunityController.searchOpportunities);
opportunityRouter.get('/:id', opportunityController.getOne);

export { companyRouter, opportunityRouter };
