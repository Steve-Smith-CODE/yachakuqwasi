import {
  updateProfile,
  changePassword,
  changeAvatar,
  getPublicProfile,
  setInstitutionalEmail
} from '../../../src/services/profile.service.js';
import * as profileRepo from '../../../src/repositories/profile.repository.js';
import * as authRepo from '../../../src/repositories/auth.repository.js';
import * as adminRepo from '../../../src/repositories/admin.repository.js';
import { supabaseAdmin } from '../../../src/config/supabase.js';
import { createRealUser, cleanupCreatedUsers } from '../../helpers/testData.js';

const createdListingIds = [];

afterAll(async () => {
  for (const id of createdListingIds.splice(0)) {
    await supabaseAdmin.from('housing_listings').delete().eq('id', id).catch?.(() => {});
  }
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

    it('no lanza error si falla el registro de auditoria (solo se loguea el warning)', async () => {
      const user = await createRealUser({ role: 'student' });
      const originalFn = adminRepo.insertAuditLog;
      adminRepo.insertAuditLog = jest.fn().mockResolvedValue({ error: { message: 'Audit insert failed' } });

      try {
        const updated = await updateProfile(user.id, { name: 'Nombre Sin Auditoria' });
        expect(updated.name).toBe('Nombre Sin Auditoria');
      } finally {
        adminRepo.insertAuditLog = originalFn;
      }
    });

    it('usa el nombre del campo tal cual si no tiene una etiqueta amigable', async () => {
      const originalUpdateFn = profileRepo.updateProfileFields;
      const originalAuditFn = adminRepo.insertAuditLog;
      profileRepo.updateProfileFields = jest.fn().mockResolvedValue({ data: { id: 'fake-id' }, error: null });
      adminRepo.insertAuditLog = jest.fn().mockResolvedValue({ error: null });

      try {
        await updateProfile('fake-id', { campoNoMapeado: 'valor' });
        expect(adminRepo.insertAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({ details: expect.stringContaining('campoNoMapeado') })
        );
      } finally {
        profileRepo.updateProfileFields = originalUpdateFn;
        adminRepo.insertAuditLog = originalAuditFn;
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

  describe('getPublicProfile', () => {
    it('estudiante: perfil basico sin listings, sin email/telefono/estado de bloqueo', async () => {
      const student = await createRealUser({ role: 'student', name: 'Estudiante Publico' });

      const result = await getPublicProfile(student.id);

      expect(result.profile.name).toBe('Estudiante Publico');
      expect(result.profile.role).toBe('student');
      expect(result.profile.email).toBeUndefined();
      expect(result.profile.blocked_reason).toBeUndefined();
      expect(result.listings).toEqual([]);
    });

    it('arrendador: incluye solo sus publicaciones aprobadas y visibles', async () => {
      const landlord = await createRealUser({ role: 'landlord', name: 'Arrendador Publico' });
      const { data: approved } = await supabaseAdmin
        .from('housing_listings')
        .insert({
          landlord_id: landlord.id,
          title: 'Publicacion aprobada publica',
          price_pen: 300,
          distance_to_unsch_minutes: 5,
          neighborhood: 'San Blas',
          address: 'Jr. Publico 1',
          contact_phone: '900000000',
          status: 'approved'
        })
        .select()
        .single();
      createdListingIds.push(approved.id);
      const { data: pending } = await supabaseAdmin
        .from('housing_listings')
        .insert({
          landlord_id: landlord.id,
          title: 'Publicacion pendiente no publica',
          price_pen: 300,
          distance_to_unsch_minutes: 5,
          neighborhood: 'San Blas',
          address: 'Jr. Publico 2',
          contact_phone: '900000000',
          status: 'pending'
        })
        .select()
        .single();
      createdListingIds.push(pending.id);

      const result = await getPublicProfile(landlord.id);

      const ids = result.listings.map((l) => l.id);
      expect(ids).toContain(approved.id);
      expect(ids).not.toContain(pending.id);
    });

    it('lanza NotFoundError (404) si el usuario no existe', async () => {
      const inexistente = '00000000-0000-0000-0000-000000000000';

      await expect(getPublicProfile(inexistente)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('setInstitutionalEmail', () => {
    it('guarda el correo institucional real del usuario', async () => {
      const student = await createRealUser({ role: 'student' });

      const updated = await setInstitutionalEmail(student.id, 'estudiante@unsch.edu.pe', { name: 'Estudiante Test' });

      expect(updated.institutional_email).toBe('estudiante@unsch.edu.pe');
    });

    it('lanza AppError con INSTITUTIONAL_EMAIL_UPDATE_FAILED si el repositorio falla', async () => {
      const originalFn = profileRepo.updateProfileFields;
      profileRepo.updateProfileFields = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      });

      try {
        await expect(setInstitutionalEmail('cualquier-id', 'x@unsch.edu.pe')).rejects.toMatchObject({
          statusCode: 400,
          code: 'INSTITUTIONAL_EMAIL_UPDATE_FAILED'
        });
      } finally {
        profileRepo.updateProfileFields = originalFn;
      }
    });
  });
});
