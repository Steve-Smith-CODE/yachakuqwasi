import { Router } from 'express';
import { stats, pendingDocuments, reviewDoc, block } from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { reviewDocSchema, blockUserSchema } from '../validators/admin.validator.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/stats', stats);
router.get('/documentos/pendientes', pendingDocuments);
router.put('/documentos/:id', validate(reviewDocSchema), reviewDoc);
router.put('/usuarios/:id/bloquear', validate(blockUserSchema), block);

export default router;
