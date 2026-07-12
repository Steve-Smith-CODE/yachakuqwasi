import { updateProfileFields, updateProfileAvatar, findPublicProfileById } from '../repositories/profile.repository.js';
import { updateAuthPassword } from '../repositories/auth.repository.js';
import { insertAuditLog } from '../repositories/admin.repository.js';
import { findApprovedHousingsByLandlord } from '../repositories/housing.repository.js';
import { uploadAvatar } from './avatar.service.js';
import { AppError, NotFoundError } from '../errors/AppError.js';
import logger from '../config/logger.js';

const FIELD_LABEL = {
  name: 'nombre',
  phone: 'teléfono',
  faculty: 'facultad',
  career: 'carrera'
};

// Rastro de auditoria para que el admin vea que edito cada usuario sobre su
// propio perfil (name/phone/faculty/career, avatar, password) - separado de
// los logs de moderacion (que registra el admin sobre otros), mismo type
// 'user' para que ambos aparezcan juntos en el panel.
async function logProfileActivity(userId, actorName, action, details) {
  const { error } = await insertAuditLog({ userId, actorName: actorName ?? 'Usuario', action, details, type: 'user' });
  if (error) {
    logger.warn(`No se pudo registrar la auditoría de perfil de ${userId}: ${error.message}`);
  }
}

export async function updateProfile(userId, fields, actor) {
  const { data, error } = await updateProfileFields(userId, fields);

  if (error) {
    throw new AppError(error.message, 400, 'PROFILE_UPDATE_FAILED');
  }

  const changedLabels = Object.keys(fields).map((key) => FIELD_LABEL[key] || key);
  await logProfileActivity(userId, actor?.name, 'Editó su perfil', `Campos actualizados: ${changedLabels.join(', ')}.`);

  return data;
}

export async function changePassword(userId, password, actor) {
  const { error } = await updateAuthPassword(userId, password);

  if (error) {
    throw new AppError(error.message, 400, 'PASSWORD_UPDATE_FAILED');
  }

  await logProfileActivity(userId, actor?.name, 'Cambió su contraseña', null);

  return { message: 'Contraseña actualizada' };
}

export async function changeAvatar(userId, imageDataUrl, actor) {
  const avatarUrl = await uploadAvatar(userId, imageDataUrl);
  const { data, error } = await updateProfileAvatar(userId, avatarUrl);

  if (error) {
    throw new AppError(error.message, 400, 'AVATAR_UPDATE_FAILED');
  }

  await logProfileActivity(userId, actor?.name, 'Actualizó su foto de perfil', null);

  return data;
}

// Autodeclarado: no hay proveedor de correo transaccional configurado en
// este proyecto para mandar un link de confirmacion, asi que esto es una
// señal de confianza barata (coincide con el dominio institucional) y no
// un "verificado" real - complementa la revision manual de documentos, no
// la reemplaza.
export async function setInstitutionalEmail(userId, institutionalEmail, actor) {
  const { data, error } = await updateProfileFields(userId, { institutional_email: institutionalEmail });

  if (error) {
    throw new AppError(error.message, 400, 'INSTITUTIONAL_EMAIL_UPDATE_FAILED');
  }

  await logProfileActivity(userId, actor?.name, 'Declaró correo institucional', institutionalEmail);

  return data;
}

// Perfil que un estudiante ve de un arrendador (y viceversa) - identidad
// basica + publicaciones ya aprobadas si es arrendador. Nada de email,
// telefono, estado de bloqueo ni historial de auditoria (eso es exclusivo
// del admin, ver admin.service.js:getUserDetail).
export async function getPublicProfile(userId) {
  const { data: profile, error } = await findPublicProfileById(userId);

  if (error || !profile) {
    throw new NotFoundError('Usuario');
  }

  let listings = [];
  if (profile.role === 'landlord') {
    const { data } = await findApprovedHousingsByLandlord(userId);
    listings = data || [];
  }

  return { profile, listings };
}
