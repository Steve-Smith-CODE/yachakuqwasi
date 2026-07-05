import { Router } from 'express';
import { stats, pendingDocuments, reviewDoc, block } from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/stats', stats);
router.get('/documentos/pendientes', pendingDocuments);
router.put('/documentos/:id', reviewDoc);
router.put('/usuarios/:id/bloquear', block);

export default router;
