import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import {
  validateAppointmentInput,
  validateUpdateAppointmentInput,
} from '../validators/appointment.validator.js';

const router = Router();

// Staff authentication required
router.use(authenticate);

router.get('/', AppointmentController.getAppointments);
router.post('/', validateBody(validateAppointmentInput), AppointmentController.bookAppointment);
router.get('/:id', AppointmentController.getAppointment);
router.put('/:id', validateBody(validateUpdateAppointmentInput), AppointmentController.updateAppointment);
router.delete('/:id', AppointmentController.deleteAppointment);

export default router;
