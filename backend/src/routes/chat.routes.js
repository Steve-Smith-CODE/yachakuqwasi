import { Router } from 'express';
import { startChat, listChats, getMessages, sendMessage } from '../controllers/chat.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { startChatSchema, sendMessageSchema } from '../validators/chat.validator.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('student'), validate(startChatSchema), startChat);
router.get('/', listChats);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', validate(sendMessageSchema), sendMessage);

export default router;
