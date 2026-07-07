import { Router } from 'express';
import {
  stats,
  pendingDocuments,
  reviewDoc,
  pendingHousings,
  reviewHousing,
  block,
  allHousings,
  allUsers,
  setRole,
  logs
} from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { reviewDocSchema, blockUserSchema, housingStatusSchema, setRoleSchema } from '../validators/admin.validator.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/stats', stats);
router.get('/documentos/pendientes', pendingDocuments);
router.put('/documentos/:id', validate(reviewDocSchema), reviewDoc);
router.get('/habitaciones/pendientes', pendingHousings);
router.get('/habitaciones', allHousings);
router.put('/habitaciones/:id/estado', validate(housingStatusSchema), reviewHousing);
router.get('/usuarios', allUsers);
router.put('/usuarios/:id/bloquear', validate(blockUserSchema), block);
router.put('/usuarios/:id/rol', validate(setRoleSchema), setRole);
router.get('/logs', logs);

export default router;
