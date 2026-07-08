import { updateProfileFields, updateProfileAvatar } from '../repositories/profile.repository.js';
import { updateAuthPassword } from '../repositories/auth.repository.js';
import { uploadAvatar } from './avatar.service.js';
import { AppError } from '../errors/AppError.js';

export async function updateProfile(userId, fields) {
  const { data, error } = await updateProfileFields(userId, fields);

  if (error) {
    throw new AppError(error.message, 400, 'PROFILE_UPDATE_FAILED');
  }

  return data;
}

export async function changePassword(userId, password) {
  const { error } = await updateAuthPassword(userId, password);

  if (error) {
    throw new AppError(error.message, 400, 'PASSWORD_UPDATE_FAILED');
  }

  return { message: 'Contraseña actualizada' };
}

export async function changeAvatar(userId, imageDataUrl) {
  const avatarUrl = await uploadAvatar(userId, imageDataUrl);
  const { data, error } = await updateProfileAvatar(userId, avatarUrl);

  if (error) {
    throw new AppError(error.message, 400, 'AVATAR_UPDATE_FAILED');
  }

  return data;
}
