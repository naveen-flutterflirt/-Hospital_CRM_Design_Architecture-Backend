import { Router } from 'express';
import { CampaignController } from '../controllers/campaign.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/summary', authenticate, CampaignController.getSummary);
router.get('/', authenticate, CampaignController.getAll);
router.post('/', authenticate, CampaignController.create);
router.patch('/:id/status', authenticate, CampaignController.updateStatus);
router.put('/:id', authenticate, CampaignController.update);
router.delete('/:id', authenticate, CampaignController.delete);

export default router;
