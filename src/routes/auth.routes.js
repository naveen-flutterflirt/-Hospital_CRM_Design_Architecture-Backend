import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import {
  validateLoginInput,
  validateRegisterInput,
  validateRefreshTokenInput,
} from '../validators/auth.validator.js';

const router = Router();

// Public Authentication Endpoints
router.post('/login', validateBody(validateLoginInput), AuthController.login);
router.post('/register', validateBody(validateRegisterInput), AuthController.register);
router.post('/refresh', validateBody(validateRefreshTokenInput), AuthController.refresh);
router.post('/logout', AuthController.logout);

// Protected Authentication Endpoints
router.get('/me', authenticate, AuthController.getMe);

export default router;
