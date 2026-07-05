import { Router } from 'express';
import { compatibility } from '../controllers/roommates.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { compatibilitySchema } from '../validators/roommates.validator.js';

const router = Router();

router.post('/compatibilidad', requireAuth, validate(compatibilitySchema), compatibility);

export default router;
