import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import {
  validateCreatePatientInput,
  validateUpdatePatientInput,
} from '../validators/patient.validator.js';

const router = Router();

// All patient endpoints require authenticated staff session
router.use(authenticate);

router.get('/', PatientController.getPatients);
router.post('/', validateBody(validateCreatePatientInput), PatientController.createPatient);
router.get('/:id', PatientController.getPatient);
router.get('/:id/profile-360', PatientController.getPatientProfile360);
router.put('/:id', validateBody(validateUpdatePatientInput), PatientController.updatePatient);
router.delete('/:id', PatientController.deletePatient);

export default router;
