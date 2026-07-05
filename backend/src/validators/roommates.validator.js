import { z } from 'zod';

const lifestyleProfile = z.object({
  fumador: z.boolean(),
  mascotas: z.boolean(),
  horario: z.enum(['diurno', 'nocturno']),
  presupuestoMax: z.coerce.number().positive()
});

export const compatibilitySchema = z.object({
  profileA: lifestyleProfile,
  profileB: lifestyleProfile
});
