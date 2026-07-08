import { updateProfile, changePassword, changeAvatar } from '../../../src/services/profile.service.js';
import * as profileRepo from '../../../src/repositories/profile.repository.js';
import * as authRepo from '../../../src/repositories/auth.repository.js';
import { createRealUser, cleanupCreatedUsers } from '../../helpers/testData.js';

afterAll(async () => {
  await cleanupCreatedUsers();
});

const TINY_PNG_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

describe('Profile Service (Supabase local real)', () => {
  describe('updateProfile', () => {
    it('actualiza campos reales del perfil', async () => {
      const user = await createRealUser({ role: 'student' });

      const updated = await updateProfile(user.id, { name: 'Nombre Service Real' });

      expect(updated.name).toBe('Nombre Service Real');
    });

    it('lanza AppError con PROFILE_UPDATE_FAILED si el repositorio falla', async () => {
      const originalFn = profileRepo.updateProfileFields;
      profileRepo.updateProfileFields = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      });

      try {
        await expect(updateProfile('cualquier-id', { name: 'X' })).rejects.toMatchObject({
          statusCode: 400,
          code: 'PROFILE_UPDATE_FAILED'
        });
      } finally {
        profileRepo.updateProfileFields = originalFn;
      }
    });
  });

  describe('changePassword', () => {
    it('cambia la contraseña real del usuario', async () => {
      const user = await createRealUser({ role: 'student' });

      const result = await changePassword(user.id, 'NuevaPassService123!');

      expect(result).toEqual({ message: 'Contraseña actualizada' });
    });

    it('lanza AppError con PASSWORD_UPDATE_FAILED si el repositorio falla', async () => {
      const originalFn = authRepo.updateAuthPassword;
      authRepo.updateAuthPassword = jest.fn().mockResolvedValue({ error: { message: 'Auth update failed' } });

      try {
        await expect(changePassword('cualquier-id', 'NuevaPass123!')).rejects.toMatchObject({
          statusCode: 400,
          code: 'PASSWORD_UPDATE_FAILED'
        });
      } finally {
        authRepo.updateAuthPassword = originalFn;
      }
    });
  });

  describe('changeAvatar', () => {
    it('sube la foto real y actualiza el avatar_url del perfil', async () => {
      const user = await createRealUser({ role: 'student' });

      const updated = await changeAvatar(user.id, TINY_PNG_BASE64);

      expect(updated.avatar_url).toMatch(/\.webp$/);
    });

    it('lanza AppError con AVATAR_UPDATE_FAILED si el repositorio falla al guardar la url', async () => {
      const user = await createRealUser({ role: 'student' });
      const originalFn = profileRepo.updateProfileAvatar;
      profileRepo.updateProfileAvatar = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Avatar update failed' }
      });

      try {
        await expect(changeAvatar(user.id, TINY_PNG_BASE64)).rejects.toMatchObject({
          statusCode: 400,
          code: 'AVATAR_UPDATE_FAILED'
        });
      } finally {
        profileRepo.updateProfileAvatar = originalFn;
      }
    });
  });
});
