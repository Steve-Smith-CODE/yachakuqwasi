import { Router } from 'express';
import { me, updateMe, updatePassword, updateAvatar, publicProfile, updateInstitutionalEmail } from '../controllers/profile.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  updateProfileSchema,
  updatePasswordSchema,
  updateAvatarSchema,
  institutionalEmailSchema
} from '../validators/profile.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', me);
router.get('/publico/:id', publicProfile);
router.patch('/', validate(updateProfileSchema), updateMe);
router.patch('/password', validate(updatePasswordSchema), updatePassword);
router.patch('/correo-institucional', validate(institutionalEmailSchema), updateInstitutionalEmail);
router.post('/avatar', validate(updateAvatarSchema), updateAvatar);

export default router;
