import { Router } from 'express';
import { stats, pendingDocuments, reviewDoc, pendingHousings, reviewHousing, block } from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { reviewDocSchema, blockUserSchema, housingStatusSchema } from '../validators/admin.validator.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/stats', stats);
router.get('/documentos/pendientes', pendingDocuments);
router.put('/documentos/:id', validate(reviewDocSchema), reviewDoc);
router.get('/habitaciones/pendientes', pendingHousings);
router.put('/habitaciones/:id/estado', validate(housingStatusSchema), reviewHousing);
router.put('/usuarios/:id/bloquear', validate(blockUserSchema), block);

export default router;
