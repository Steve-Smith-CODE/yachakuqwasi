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

// Autodeclarado, no verificado por link de confirmación (no hay proveedor de
// correo transaccional configurado en el proyecto) - es una señal de
// confianza complementaria a la revisión manual de documentos, no la reemplaza.
export const institutionalEmailSchema = z.object({
  institutionalEmail: z
    .string()
    .email('Correo inválido')
    .refine((email) => email.toLowerCase().endsWith('.edu.pe'), 'Debe ser un correo institucional (.edu.pe)')
});
