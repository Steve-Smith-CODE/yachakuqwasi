import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
    faculty: z.string().optional(),
    career: z.string().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Debes enviar al menos un campo' });

export const updatePasswordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

export const updateAvatarSchema = z.object({
  image: z.string().min(1, 'La imagen es obligatoria')
});
