import { z } from 'zod';

export const submitVerificationSchema = z.object({
  image: z.string().min(1, 'La imagen es obligatoria')
});
