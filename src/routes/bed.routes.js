import { Router } from 'express';
import { BedController } from '../controllers/bed.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Bed and Ward retrieval
router.get('/wards', authenticate, BedController.getWards);
router.get('/summary', authenticate, BedController.getSummary);
router.get('/', authenticate, BedController.getBeds);

// Bed Operations & Admissions
router.post('/admit', authenticate, BedController.admitPatient);
router.post('/transfer', authenticate, BedController.transferPatient);
router.post('/:bedId/discharge', authenticate, BedController.dischargePatient);
router.patch('/:bedId/clean', authenticate, BedController.markBedClean);
router.patch('/:bedId/status', authenticate, BedController.updateBedStatus);

export default router;
