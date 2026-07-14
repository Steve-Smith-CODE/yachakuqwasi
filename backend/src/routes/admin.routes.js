import { Router } from 'express';
import {
  stats,
  pendingDocuments,
  reviewDocs,
  pendingHousings,
  reviewHousing,
  block,
  unblock,
  deleteUser,
  allHousings,
  allUsers,
  setRole,
  logs,
  userDetail,
  getDomains,
  addDomain,
  removeDomain
} from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  reviewDocSchema,
  blockUserSchema,
  deleteUserSchema,
  housingStatusSchema,
  setRoleSchema,
  addVerifiedDomainSchema
} from '../validators/admin.validator.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/stats', stats);
router.get('/documentos/pendientes', pendingDocuments);
router.put('/documentos/usuario/:userId', validate(reviewDocSchema), reviewDocs);
router.get('/habitaciones/pendientes', pendingHousings);
router.get('/habitaciones', allHousings);
router.put('/habitaciones/:id/estado', validate(housingStatusSchema), reviewHousing);
router.get('/usuarios', allUsers);
router.get('/usuarios/:id', userDetail);
router.put('/usuarios/:id/bloquear', validate(blockUserSchema), block);
router.put('/usuarios/:id/reactivar', unblock);
router.delete('/usuarios/:id', validate(deleteUserSchema), deleteUser);
router.put('/usuarios/:id/rol', validate(setRoleSchema), setRole);
router.get('/logs', logs);
router.get('/dominios', getDomains);
router.post('/dominios', validate(addVerifiedDomainSchema), addDomain);
router.delete('/dominios/:domain', removeDomain);

export default router;
