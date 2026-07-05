import { z } from 'zod';

export const reviewDocSchema = z.object({
  estado: z.enum(['approved', 'rejected'], {
    errorMap: () => ({ message: "estado debe ser 'approved' o 'rejected'" })
  }),
  comentario: z.string().optional()
});

export const blockUserSchema = z.object({
  motivo: z.string().min(1, 'El motivo es obligatorio'),
  dias: z.coerce.number().int().positive().optional()
});

export const housingStatusSchema = z.object({
  estado: z.enum(['approved', 'flagged', 'suspended'], {
    errorMap: () => ({ message: "estado debe ser 'approved', 'flagged' o 'suspended'" })
  })
});
