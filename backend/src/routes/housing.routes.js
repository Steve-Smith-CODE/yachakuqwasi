import { Router } from 'express';
import { create, list } from '../controllers/housing.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createHousingSchema } from '../validators/housing.validator.js';

const router = Router();

// Orden importa: auth/rol antes que validate, para que "sin token" siga
// devolviendo 401 (y "rol incorrecto" 403) aunque el body tambien sea invalido.
router.post('/', requireAuth, requireRole('landlord', 'admin'), validate(createHousingSchema), create);
router.get('/', list);

export default router;
