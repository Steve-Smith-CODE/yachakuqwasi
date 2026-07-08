import { Router } from 'express';
import { studentStats, landlordStats } from '../controllers/stats.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/estudiante', requireAuth, requireRole('student'), studentStats);
router.get('/arrendador', requireAuth, requireRole('landlord'), landlordStats);

export default router;
