import { Router } from 'express';
import { create, list, uploadImages } from '../controllers/housing.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createHousingSchema, uploadImagesSchema } from '../validators/housing.validator.js';

const router = Router();

// Orden importa: auth/rol antes que validate, para que "sin token" siga
// devolviendo 401 (y "rol incorrecto" 403) aunque el body tambien sea invalido.
router.post('/', requireAuth, requireRole('landlord', 'admin'), validate(createHousingSchema), create);
router.get('/', list);
// La verificacion de "es tu propia publicacion" vive en el service (necesita
// leer el listing primero), no aqui como requireRole.
router.post('/:id/imagenes', requireAuth, validate(uploadImagesSchema), uploadImages);

export default router;
