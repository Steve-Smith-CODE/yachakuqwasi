import { z } from 'zod';

export const makiChatSchema = z.object({
  message: z.string().min(1, 'El mensaje no puede estar vacío').max(2000),
  history: z
    .array(
      z.object({
        sender: z.enum(['user', 'maki']),
        text: z.string()
      })
    )
    .optional()
});
