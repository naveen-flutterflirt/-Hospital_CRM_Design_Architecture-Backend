import { Router } from 'express';
import { ReferralController } from '../controllers/referral.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Staff authentication
router.use(authenticate);

router.get('/', ReferralController.getDoctors);
router.get('/summary', ReferralController.getSummary);
router.get('/:id', ReferralController.getDoctor);
router.post('/', ReferralController.createDoctor);
router.post('/:id/cases', ReferralController.logCase);
router.put('/:id', ReferralController.updateDoctor);
router.delete('/:id', ReferralController.deleteDoctor);

export default router;
