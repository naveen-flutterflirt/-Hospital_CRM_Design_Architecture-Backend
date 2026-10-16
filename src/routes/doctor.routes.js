import { Router } from 'express';
import { DoctorController } from '../controllers/doctor.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { validateDoctorInput } from '../validators/doctor.validator.js';

const router = Router();

// Staff authentication required
router.use(authenticate);

router.get('/', DoctorController.getDoctors);
router.post('/', validateBody(validateDoctorInput), DoctorController.createDoctor);
router.get('/:id', DoctorController.getDoctor);
router.put('/:id', validateBody(validateDoctorInput), DoctorController.updateDoctor);
router.delete('/:id', DoctorController.deleteDoctor);

export default router;
