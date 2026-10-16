import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Staff authentication
router.use(authenticate);

router.get('/financial', ReportController.getFinancial);
router.get('/operational', ReportController.getOperational);
router.get('/marketing', ReportController.getMarketing);
router.get('/executive', ReportController.getExecutive);

export default router;
