import { Router } from 'express';
import { list, readOne, readAll } from '../controllers/notifications.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', list);
router.put('/leer-todas', readAll);
router.put('/:id/leer', readOne);

export default router;
