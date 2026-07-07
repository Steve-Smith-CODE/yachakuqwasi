import { z } from 'zod';

export const addFavoriteSchema = z.object({
  listingId: z.string().uuid('listingId debe ser un UUID válido')
});
