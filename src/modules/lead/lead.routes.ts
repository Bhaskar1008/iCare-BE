import { Router } from 'express';
import { leadController } from './lead.controller';

const router: Router = Router();

// Lead Routes
router.post('/', leadController.createLead);

// Lead Status Routes (placed before parameterized routes to avoid conflicts)
router.get('/status-counts/:userId', leadController.getLeadStatusCounts);
router.get('/leadStatus/:status/:userId', leadController.getLeadsByStatus);
router.get('/user/:allocatedTo', leadController.getLeads);

// Lead Management Routes
router.put('/:id', leadController.updateLead);
router.get('/:id', leadController.getLead);

// Lead Ownership Route
router.post('/change-ownership', leadController.changeOwnership);

export default router;
