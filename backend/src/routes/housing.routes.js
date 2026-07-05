import { Router } from 'express';
import { create, list } from '../controllers/housing.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', requireAuth, requireRole('landlord', 'admin'), create);
router.get('/', list);

export default router;
