import { Router } from 'express';
import { submit } from '../controllers/verification.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { submitVerificationSchema } from '../validators/verification.validator.js';

const router = Router();

router.post('/', requireAuth, validate(submitVerificationSchema), submit);

export default router;
