import { Router } from 'express';
import { HospitalProfileController } from '../controllers/hospitalProfile.controller.js';
import { UserManagementController } from '../controllers/userManagement.controller.js';

import { IntegrationController } from '../controllers/integration.controller.js';

const router = Router();

// Hospital Profile
router.get('/hospital-profile', HospitalProfileController.getProfile);
router.put('/hospital-profile', HospitalProfileController.updateProfile);

// Roles & User Access Management
router.get('/users', UserManagementController.getAllUsers);
router.post('/users', UserManagementController.createUserAccess);
router.put('/users/:id', UserManagementController.updateUserRole);
router.delete('/users/:id', UserManagementController.deleteUser);

// Hospital System Integrations
router.get('/integrations', IntegrationController.getAll);
router.put('/integrations/:id/toggle', IntegrationController.toggle);
router.put('/integrations/:id/config', IntegrationController.updateConfig);

export default router;
