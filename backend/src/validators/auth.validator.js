import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(1, 'El nombre es obligatorio'),
  role: z.enum(['student', 'landlord', 'admin']).optional(),
  faculty: z.string().optional(),
  career: z.string().optional(),
  phone: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido')
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'El refresh token es obligatorio')
});
