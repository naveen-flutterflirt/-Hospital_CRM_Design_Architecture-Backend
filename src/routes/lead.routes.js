import { Router } from 'express';
import { LeadController } from '../controllers/lead.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { validateLeadInput, validateUpdateLeadInput } from '../validators/lead.validator.js';

const router = Router();

// Public Webhook Ingestion (from Meta Ads, Google Ads, Zapier, Web Forms)
router.post('/webhook', LeadController.ingestWebhook);

// Staff authentication required
router.use(authenticate);

router.get('/', LeadController.getLeads);
router.get('/board', LeadController.getKanbanBoard);
router.post('/', validateBody(validateLeadInput), LeadController.createLead);
router.get('/:id', LeadController.getLead);
router.put('/:id', validateBody(validateUpdateLeadInput), LeadController.updateLead);
router.patch('/:id/stage', LeadController.updateStage);
router.post('/:id/convert', LeadController.convertToPatient);
router.delete('/:id', LeadController.deleteLead);

export default router;
