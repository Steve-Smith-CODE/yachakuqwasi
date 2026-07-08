import { Router } from 'express';
import { me, updateMe, updatePassword, updateAvatar } from '../controllers/profile.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateProfileSchema, updatePasswordSchema, updateAvatarSchema } from '../validators/profile.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', me);
router.patch('/', validate(updateProfileSchema), updateMe);
router.patch('/password', validate(updatePasswordSchema), updatePassword);
router.post('/avatar', validate(updateAvatarSchema), updateAvatar);

export default router;
