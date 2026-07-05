import { z } from 'zod';

export const startChatSchema = z.object({
  landlordId: z.string().uuid('landlordId debe ser un uuid valido'),
  listingId: z.string().uuid('listingId debe ser un uuid valido')
});

export const sendMessageSchema = z.object({
  text: z.string().min(1, 'El mensaje no puede estar vacio').max(4000)
});
