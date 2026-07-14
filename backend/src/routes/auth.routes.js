import { Router } from 'express';
import { register, login, refresh, forgotPassword } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema, refreshSchema, forgotPasswordSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

export default router;
