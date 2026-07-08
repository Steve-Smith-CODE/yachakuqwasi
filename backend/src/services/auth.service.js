import { createAuthUser, signInWithPassword, findProfileById, requestPasswordReset } from '../repositories/auth.repository.js';
import logger from '../config/logger.js';

export async function registerUser({ email, password, name, role, faculty, career, phone }) {
  const { data, error } = await createAuthUser({
    email,
    password,
    name,
    role: role || 'student',
    faculty,
    career,
    phone
  });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return { id: data.user.id, email: data.user.email };
}

export async function loginUser({ email, password }) {
  const { data, error } = await signInWithPassword({ email, password });

  if (error) {
    const err = new Error('Credenciales invalidas');
    err.statusCode = 401;
    throw err;
  }

  const { data: profile } = await findProfileById(data.user.id);

  return {
    token: data.session.access_token,
    user: { id: data.user.id, email: data.user.email, ...profile }
  };
}

const GENERIC_RESET_MESSAGE = 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.';

// Respuesta siempre generica (exista o no la cuenta) para no revelar que
// correos estan registrados. Cualquier fallo real de Supabase/SMTP se
// registra en el log del servidor, no se expone al cliente.
export async function forgotPassword({ email }) {
  const redirectTo = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/restablecer-password`;

  try {
    const { error } = await requestPasswordReset(email, redirectTo);
    if (error) logger.warn('No se pudo enviar el correo de restablecimiento: ' + error.message);
  } catch (err) {
    logger.warn('No se pudo enviar el correo de restablecimiento: ' + err.message);
  }

  return { message: GENERIC_RESET_MESSAGE };
}
