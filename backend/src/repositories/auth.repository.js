import { supabaseAdmin, supabasePublic } from '../config/supabase.js';

export function createAuthUser({ email, password, name, role, faculty, career, phone }) {
  return supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role, faculty, career, phone }
  });
}

export function signInWithPassword({ email, password }) {
  return supabasePublic.auth.signInWithPassword({ email, password });
}

export function refreshSession(refreshToken) {
  return supabasePublic.auth.refreshSession({ refresh_token: refreshToken });
}

export function findProfileById(id) {
  return supabaseAdmin.from('profiles').select('*').eq('id', id).single();
}

// El email vive en auth.users (Supabase Auth), no en profiles - solo
// consultable via la Admin API con la secret key.
export function findAuthUserById(id) {
  return supabaseAdmin.auth.admin.getUserById(id);
}

export function updateAuthPassword(userId, password) {
  return supabaseAdmin.auth.admin.updateUserById(userId, { password });
}

// Borra al usuario de auth.users; profiles (y por cascada housing_listings,
// favorites, chats, notifications de ese usuario) se van con el via
// "on delete cascade" del esquema.
export function deleteAuthUser(userId) {
  return supabaseAdmin.auth.admin.deleteUser(userId);
}

// Dispara el correo de "restablecer contraseña" de Supabase Auth. El enlace
// del correo trae una sesion de recuperacion que el frontend intercambia por
// una nueva contraseña (ver ResetPasswordPage.jsx) — este backend nunca ve
// la contraseña nueva en este paso.
export function requestPasswordReset(email, redirectTo) {
  return supabasePublic.auth.resetPasswordForEmail(email, { redirectTo });
}
