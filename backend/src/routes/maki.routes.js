import { Router } from 'express';
import { chat } from '../controllers/maki.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { makiChatSchema } from '../validators/maki.validator.js';

const router = Router();

router.post('/chat', validate(makiChatSchema), chat);

export default router;
