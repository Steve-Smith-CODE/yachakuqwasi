import { z } from 'zod';

export const createHousingSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  pricePen: z.coerce.number().nonnegative('El precio no puede ser negativo'),
  distanceToUnschMinutes: z.coerce.number().int().nonnegative('La distancia no puede ser negativa'),
  neighborhood: z.string().min(1, 'El barrio es obligatorio'),
  address: z.string().min(1, 'La dirección es obligatoria'),
  type: z.enum(['room', 'apartment', 'shared', 'family']).optional(),
  amenities: z.array(z.string()).optional(),
  contactPhone: z.string().min(1, 'El teléfono de contacto es obligatorio'),
  images: z.array(z.string()).optional()
});
