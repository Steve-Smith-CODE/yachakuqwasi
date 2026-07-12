import { z } from 'zod';

export const submitVerificationSchema = z.object({
  dni: z.string().min(1, 'La foto del DNI es obligatoria'),
  carnet: z.string().min(1, 'La foto del carnet o constancia de matrícula es obligatoria')
});
