import { Router } from 'express';
import { add, remove, list } from '../controllers/favorites.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { addFavoriteSchema } from '../validators/favorites.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', list);
router.post('/', validate(addFavoriteSchema), add);
router.delete('/:listingId', remove);

export default router;
