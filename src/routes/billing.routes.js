import { Router } from 'express';
import { BillingController } from '../controllers/billing.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/summary', authenticate, BillingController.getSummary);
router.get('/', authenticate, BillingController.getAll);
router.post('/', authenticate, BillingController.create);
router.patch('/:id/status', authenticate, BillingController.updateStatus);

export default router;
