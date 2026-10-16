import { Router } from 'express';
import { FeedbackController } from '../controllers/feedback.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Retrieve feedbacks and NPS metrics
router.get('/', FeedbackController.getAll);

// Create / submit new patient feedback
router.post('/', FeedbackController.create);

// Send survey invitation (WhatsApp / Email)
router.post('/send-survey', authenticate, FeedbackController.sendSurvey);

// Update status / resolve detractor complaint
router.put('/:id/status', authenticate, FeedbackController.updateStatus);

export default router;
