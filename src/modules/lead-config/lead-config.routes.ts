import { Router } from 'express';
import { leadConfigController } from './lead-config.controller';

const router: Router = Router();

// Lead Configuration Routes
router.post('/product', leadConfigController.createLeadConfiguration);
router.put('/product/:productId', leadConfigController.updateLeadConfiguration);
router.get('/product/:productId', leadConfigController.getLeadConfiguration);
router.get('/product/:productId/progress/:progressId/dispositions', leadConfigController.getDispositions);
router.get('/product/:productId/disposition/:dispositionId/subdispositions', leadConfigController.getSubDispositions);
router.get('/product/:productId/field-conditions', leadConfigController.getFieldConditions);

export default router; 