import {
  getStats,
  getPendingDocuments,
  reviewUserDocuments,
  getPendingHousings,
  updateHousingStatus,
  blockUser,
  unblockUser,
  deleteUserAccount,
  getAllHousingsAdmin,
  getAllUsers,
  setUserRole,
  getAuditLogs,
  getUserDetail,
  getVerifiedDomains,
  addVerifiedDomain,
  removeVerifiedDomain
} from '../../../src/services/admin.service.js';
import * as adminRepo from '../../../src/repositories/admin.repository.js';
import * as notificationsService from '../../../src/services/notifications.service.js';
import { supabaseAdmin } from '../../../src/config/supabase.js';
import { createRealUser, cleanupCreatedUsers } from '../../helpers/testData.js';

const createdDocIds = [];
const createdListingIds = [];

afterAll(async () => {
  for (const id of createdDocIds.splice(0)) {
    await supabaseAdmin.from('verification_documents').delete().eq('id', id).catch?.(() => {});
  }
  for (const id of createdListingIds.splice(0)) {
    await supabaseAdmin.from('housing_listings').delete().eq('id', id).catch?.(() => {});
  }
  await cleanupCreatedUsers();
});

async function insertPendingHousing(landlordId, overrides = {}) {
  const { data, error } = await supabaseAdmin
    .from('housing_listings')
    .insert({
      landlord_id: landlordId,
      title: 'Habitacion pendiente de prueba',
      price_pen: 200,
      distance_to_unsch_minutes: 5,
      neighborhood: 'San Blas',
      address: 'Jr. Pendiente 1',
      contact_phone: '900000000',
      status: 'pending',
      ...overrides
    })
    .select()
    .single();
  if (error) throw error;
  createdListingIds.push(data.id);
  return data;
}

describe('Admin Service (Supabase local real)', () => {
  describe('getStats', () => {
    it('el conteo de usuarios sube en 1 real al crear un usuario', async () => {
      const before = await getStats();

      await createRealUser({ role: 'student' });

      const after = await getStats();

      expect(after.totalUsers).toBe(before.totalUsers + 1);
    });

    it('usa 0 por defecto si algun conteo viene null/undefined', async () => {
      const originalCountProfiles = adminRepo.countProfiles;
      const originalCountHousings = adminRepo.countHousings;
      const originalCountPending = adminRepo.countPendingDocuments;
      adminRepo.countProfiles = jest.fn().mockResolvedValue({ count: null });
      adminRepo.countHousings = jest.fn().mockResolvedValue({ count: undefined });
      adminRepo.countPendingDocuments = jest.fn().mockResolvedValue({ count: null });

      try {
        const stats = await getStats();
        expect(stats).toEqual({ totalUsers: 0, totalHousings: 0, pendingDocuments: 0 });
      } finally {
        adminRepo.countProfiles = originalCountProfiles;
        adminRepo.countHousings = originalCountHousings;
        adminRepo.countPendingDocuments = originalCountPending;
      }
    });
  });

  describe('getPendingDocuments + reviewUserDocuments', () => {
    it('lista DNI+carnet pendientes reales y los aprueba juntos en una sola decision, verificando el perfil', async () => {
      const student = await createRealUser({ role: 'student' });

      const { data: docs } = await supabaseAdmin
        .from('verification_documents')
        .insert([
          { user_id: student.id, doc_url: 'https://example.com/dni.png', doc_type: 'dni', status: 'pending' },
          { user_id: student.id, doc_url: 'https://example.com/carnet.png', doc_type: 'carnet', status: 'pending' }
        ])
        .select();
      docs.forEach((d) => createdDocIds.push(d.id));

      const pending = await getPendingDocuments();
      expect(docs.every((d) => pending.map((p) => p.id).includes(d.id))).toBe(true);

      const reviewed = await reviewUserDocuments(student.id, { estado: 'approved', comentario: 'Documentos validos' });
      expect(reviewed).toHaveLength(2);
      expect(reviewed.every((d) => d.status === 'approved')).toBe(true);

      const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', student.id).single();
      expect(profile.is_verified).toBe(true);
      expect(profile.verification_status).toBe('approved');
    });

    it('rechaza ambos documentos reales y actualiza el estado de verificacion del perfil', async () => {
      const student = await createRealUser({ role: 'student' });

      const { data: docs } = await supabaseAdmin
        .from('verification_documents')
        .insert([
          { user_id: student.id, doc_url: 'https://example.com/dni-borroso.png', doc_type: 'dni', status: 'pending' },
          { user_id: student.id, doc_url: 'https://example.com/carnet-borroso.png', doc_type: 'carnet', status: 'pending' }
        ])
        .select();
      docs.forEach((d) => createdDocIds.push(d.id));

      await reviewUserDocuments(student.id, { estado: 'rejected', comentario: 'Ilegibles' });

      const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', student.id).single();
      expect(profile.verification_status).toBe('rejected');
      expect(profile.is_verified).toBe(false);
    });

    it('lanza NotFoundError (404) si el usuario no tiene documentos pendientes', async () => {
      const student = await createRealUser({ role: 'student' });

      await expect(reviewUserDocuments(student.id, { estado: 'approved', comentario: 'x' })).rejects.toMatchObject({
        statusCode: 404
      });
    });

    it('lanza error con statusCode 400 si el userId no es un uuid valido (error real de Postgres)', async () => {
      await expect(reviewUserDocuments('esto-no-es-un-uuid', { estado: 'approved' })).rejects.toMatchObject({
        statusCode: 400
      });
    });

    it('no actualiza verification_status si estado no es approved ni rejected', async () => {
      const originalUpdateDocs = adminRepo.updateDocumentsStatusForUser;
      const originalUpdateVerif = adminRepo.updateProfileVerification;
      adminRepo.updateDocumentsStatusForUser = jest.fn().mockResolvedValue({
        data: [{ id: 'fake-doc', user_id: 'fake-user' }],
        error: null
      });
      adminRepo.updateProfileVerification = jest.fn();

      try {
        const result = await reviewUserDocuments('fake-user', { estado: 'otro-estado' });
        expect(result).toHaveLength(1);
        expect(adminRepo.updateProfileVerification).not.toHaveBeenCalled();
      } finally {
        adminRepo.updateDocumentsStatusForUser = originalUpdateDocs;
        adminRepo.updateProfileVerification = originalUpdateVerif;
      }
    });
  });

  describe('getPendingHousings + updateHousingStatus', () => {
    it('lista una habitacion pendiente real y la aprueba', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const listing = await insertPendingHousing(landlord.id);

      const pending = await getPendingHousings();
      expect(pending.map((l) => l.id)).toContain(listing.id);

      const approved = await updateHousingStatus(listing.id, { estado: 'approved' });
      expect(approved.status).toBe('approved');

      const { data: fetched } = await supabaseAdmin.from('housing_listings').select('*').eq('id', listing.id).single();
      expect(fetched.status).toBe('approved');
    });

    it('marca una habitacion como flagged (rechazada)', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const listing = await insertPendingHousing(landlord.id);

      const flagged = await updateHousingStatus(listing.id, { estado: 'flagged' });
      expect(flagged.status).toBe('flagged');
    });

    it('lanza error con statusCode 400 si el id no es un uuid valido (error real de Postgres)', async () => {
      await expect(updateHousingStatus('esto-no-es-un-uuid', { estado: 'approved' })).rejects.toMatchObject({
        statusCode: 400
      });
    });

    it('no lanza error si falla la notificacion al arrendador (solo se registra en el log)', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const listing = await insertPendingHousing(landlord.id);

      const originalFn = notificationsService.notifyLandlordOfHousingReview;
      notificationsService.notifyLandlordOfHousingReview = jest.fn().mockRejectedValue(new Error('Notify failed'));

      try {
        const approved = await updateHousingStatus(listing.id, { estado: 'approved' });
        expect(approved.status).toBe('approved');
      } finally {
        notificationsService.notifyLandlordOfHousingReview = originalFn;
      }
    });

    it('usa el housingId en los detalles del log si el repositorio no devuelve datos', async () => {
      const originalFn = adminRepo.updateHousingStatusRecord;
      adminRepo.updateHousingStatusRecord = jest.fn().mockResolvedValue({ data: null, error: null });

      try {
        const result = await updateHousingStatus('fake-housing-id', { estado: 'approved' });
        expect(result).toBeNull();

        const logs = await getAuditLogs();
        expect(logs.some((l) => l.details?.includes('fake-housing-id'))).toBe(true);
      } finally {
        adminRepo.updateHousingStatusRecord = originalFn;
      }
    });
  });

  describe('blockUser', () => {
    it('bloquea a un usuario real calculando la fecha de fin segun los dias', async () => {
      const student = await createRealUser({ role: 'student' });

      const result = await blockUser(student.id, { motivo: 'Publicaciones fraudulentas', dias: 7 });
      expect(result).toEqual({ message: 'Usuario bloqueado' });

      const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', student.id).single();
      expect(profile.blocked_reason).toBe('Publicaciones fraudulentas');
      expect(profile.blocked_until).toBeTruthy();
    });

    it('bloquea a un usuario real de forma permanente cuando no se especifican dias', async () => {
      const student = await createRealUser({ role: 'student' });

      const result = await blockUser(student.id, { motivo: 'Spam permanente', dias: null });
      expect(result).toEqual({ message: 'Usuario bloqueado' });

      const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', student.id).single();
      expect(profile.blocked_reason).toBe('Spam permanente');
      expect(profile.blocked_until).toBeNull();
    });

    it('lanza error con statusCode 400 si el id no es un uuid valido (error real de Postgres)', async () => {
      await expect(blockUser('esto-no-es-un-uuid', { motivo: 'x', dias: 1 })).rejects.toMatchObject({
        statusCode: 400
      });
    });

    it('notifica al usuario bloqueado con el motivo', async () => {
      const student = await createRealUser({ role: 'student' });
      const originalFn = notificationsService.notifyUserOfBlock;
      notificationsService.notifyUserOfBlock = jest.fn().mockResolvedValue(undefined);

      try {
        await blockUser(student.id, { motivo: 'Publicaciones falsas', dias: 3 });

        expect(notificationsService.notifyUserOfBlock).toHaveBeenCalledWith(
          expect.objectContaining({ userId: student.id, motivo: 'Publicaciones falsas' })
        );
      } finally {
        notificationsService.notifyUserOfBlock = originalFn;
      }
    });

    it('no lanza error si falla la notificacion al usuario bloqueado', async () => {
      const student = await createRealUser({ role: 'student' });
      const originalFn = notificationsService.notifyUserOfBlock;
      notificationsService.notifyUserOfBlock = jest.fn().mockRejectedValue(new Error('Notify failed'));

      try {
        const result = await blockUser(student.id, { motivo: 'x' });
        expect(result).toEqual({ message: 'Usuario bloqueado' });
      } finally {
        notificationsService.notifyUserOfBlock = originalFn;
      }
    });
  });

  describe('unblockUser', () => {
    it('limpia blocked_until/blocked_reason de un usuario real', async () => {
      const student = await createRealUser({ role: 'student' });
      await blockUser(student.id, { motivo: 'Temporal', dias: 5 });

      const result = await unblockUser(student.id, { id: 'admin-id', name: 'Admin Test' });
      expect(result).toEqual({ message: 'Usuario reactivado' });

      const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', student.id).single();
      expect(profile.blocked_reason).toBeNull();
      expect(profile.blocked_until).toBeNull();
    });

    it('lanza error con statusCode 400 si el id no es un uuid valido', async () => {
      await expect(unblockUser('esto-no-es-un-uuid')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('no lanza error si falla la notificacion de reactivacion', async () => {
      const student = await createRealUser({ role: 'student' });
      const originalFn = notificationsService.notifyUserOfReactivation;
      notificationsService.notifyUserOfReactivation = jest.fn().mockRejectedValue(new Error('Notify failed'));

      try {
        const result = await unblockUser(student.id);
        expect(result).toEqual({ message: 'Usuario reactivado' });
      } finally {
        notificationsService.notifyUserOfReactivation = originalFn;
      }
    });
  });

  describe('reviewUserDocuments - Estado Rejected', () => {
    it('rechaza un unico documento pendiente y deja al usuario sin verificar', async () => {
      const student = await createRealUser({ role: 'student' });

      const { data: doc } = await supabaseAdmin
        .from('verification_documents')
        .insert({ user_id: student.id, doc_url: 'https://example.com/invalido.png', doc_type: 'dni', status: 'pending' })
        .select()
        .single();
      createdDocIds.push(doc.id);

      const reviewed = await reviewUserDocuments(student.id, { estado: 'rejected', comentario: 'Documento borroso' });
      expect(reviewed[0].status).toBe('rejected');

      const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', student.id).single();
      expect(profile.verification_status).toBe('rejected');
      expect(profile.is_verified).toBe(false);
    });
  });

  describe('getPendingDocuments - Error Cases', () => {
    it('maneja error cuando falla la consulta de documentos', async () => {
      // Mock para forzar error en el repositorio
      const originalFn = adminRepo.findPendingDocuments;
      adminRepo.findPendingDocuments = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      try {
        await expect(getPendingDocuments()).rejects.toMatchObject({
          statusCode: 500
        });
      } finally {
        adminRepo.findPendingDocuments = originalFn;
      }
    });
  });

  describe('getPendingHousings - Error Cases', () => {
    it('maneja error cuando falla la consulta de housing pendientes', async () => {
      // Mock para forzar error en el repositorio
      const originalFn = adminRepo.findPendingHousings;
      adminRepo.findPendingHousings = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      try {
        await expect(getPendingHousings()).rejects.toMatchObject({
          statusCode: 500
        });
      } finally {
        adminRepo.findPendingHousings = originalFn;
      }
    });
  });

  describe('getAllHousingsAdmin', () => {
    it('devuelve todas las publicaciones reales (cualquier estado)', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const listing = await insertPendingHousing(landlord.id, { title: 'Para listado admin' });

      const all = await getAllHousingsAdmin();

      expect(all.map((l) => l.id)).toContain(listing.id);
    });

    it('lanza error con statusCode 500 si el repositorio falla', async () => {
      const originalFn = adminRepo.findAllHousingsAdmin;
      adminRepo.findAllHousingsAdmin = jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });

      try {
        await expect(getAllHousingsAdmin()).rejects.toMatchObject({ statusCode: 500 });
      } finally {
        adminRepo.findAllHousingsAdmin = originalFn;
      }
    });
  });

  describe('getAllUsers', () => {
    it('devuelve todos los perfiles reales', async () => {
      const student = await createRealUser({ role: 'student' });

      const all = await getAllUsers();

      expect(all.map((u) => u.id)).toContain(student.id);
    });

    it('lanza error con statusCode 500 si el repositorio falla', async () => {
      const originalFn = adminRepo.findAllProfiles;
      adminRepo.findAllProfiles = jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });

      try {
        await expect(getAllUsers()).rejects.toMatchObject({ statusCode: 500 });
      } finally {
        adminRepo.findAllProfiles = originalFn;
      }
    });
  });

  describe('setUserRole', () => {
    it('actualiza el rol real de un usuario', async () => {
      const student = await createRealUser({ role: 'student' });

      const updated = await setUserRole(student.id, 'landlord');

      expect(updated.role).toBe('landlord');
    });

    it('lanza error con statusCode 400 si el id no es un uuid valido (error real de Postgres)', async () => {
      await expect(setUserRole('esto-no-es-un-uuid', 'landlord')).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('getVerifiedDomains + addVerifiedDomain + removeVerifiedDomain', () => {
    const createdTestDomains = [];

    afterAll(async () => {
      for (const domain of createdTestDomains.splice(0)) {
        await supabaseAdmin.from('verified_domains').delete().eq('domain', domain).catch?.(() => {});
      }
    });

    it('agrega un dominio real y aparece en la lista', async () => {
      const domain = `dominio-admin-${Date.now()}.edu.pe`;
      createdTestDomains.push(domain);

      const created = await addVerifiedDomain({ domain, institutionName: 'Universidad de Prueba' });
      const list = await getVerifiedDomains();

      expect(created.domain).toBe(domain);
      expect(list.map((d) => d.domain)).toContain(domain);
    });

    it('normaliza el dominio a minusculas', async () => {
      const domain = `dominio-mayus-${Date.now()}.edu.pe`;
      createdTestDomains.push(domain);

      const created = await addVerifiedDomain({ domain: domain.toUpperCase(), institutionName: 'Universidad Mayus' });

      expect(created.domain).toBe(domain);
    });

    it('lanza error 400 con mensaje claro si el dominio ya existe', async () => {
      const domain = `dominio-duplicado-${Date.now()}.edu.pe`;
      createdTestDomains.push(domain);
      await addVerifiedDomain({ domain, institutionName: 'Primera vez' });

      await expect(addVerifiedDomain({ domain, institutionName: 'Segunda vez' })).rejects.toMatchObject({
        statusCode: 400,
        message: 'Ese dominio ya está registrado.'
      });
    });

    it('elimina un dominio real', async () => {
      const domain = `dominio-a-borrar-${Date.now()}.edu.pe`;
      await addVerifiedDomain({ domain, institutionName: 'Se va a borrar' });

      const result = await removeVerifiedDomain(domain);

      expect(result).toEqual({ message: 'Dominio eliminado' });
      const list = await getVerifiedDomains();
      expect(list.map((d) => d.domain)).not.toContain(domain);
    });

    it('getVerifiedDomains lanza error 500 si el repositorio falla', async () => {
      const originalFn = adminRepo.findVerifiedDomains;
      adminRepo.findVerifiedDomains = jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });

      try {
        await expect(getVerifiedDomains()).rejects.toMatchObject({ statusCode: 500 });
      } finally {
        adminRepo.findVerifiedDomains = originalFn;
      }
    });
  });

  describe('getAuditLogs', () => {
    it('devuelve el log real generado al aprobar los documentos de un usuario', async () => {
      const student = await createRealUser({ role: 'student' });
      const admin = await createRealUser({ role: 'admin', name: 'Admin Auditoria' });
      const { data: doc } = await supabaseAdmin
        .from('verification_documents')
        .insert({ user_id: student.id, doc_url: 'https://example.com/audit.png', doc_type: 'dni', status: 'pending' })
        .select()
        .single();
      createdDocIds.push(doc.id);

      await reviewUserDocuments(student.id, { estado: 'approved', comentario: 'ok' }, { id: admin.id, name: admin.name });

      const logs = await getAuditLogs();

      expect(logs.some((l) => l.details?.includes(student.id))).toBe(true);
    });

    it('lanza error con statusCode 500 si el repositorio falla', async () => {
      const originalFn = adminRepo.findAuditLogs;
      adminRepo.findAuditLogs = jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });

      try {
        await expect(getAuditLogs()).rejects.toMatchObject({ statusCode: 500 });
      } finally {
        adminRepo.findAuditLogs = originalFn;
      }
    });
  });

  describe('getUserDetail', () => {
    it('lanza NotFoundError (404) si el usuario no existe', async () => {
      const inexistente = '00000000-0000-0000-0000-000000000000';

      await expect(getUserDetail(inexistente)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('arrendador real: perfil + email + stats + sus publicaciones', async () => {
      const landlord = await createRealUser({ role: 'landlord' });
      const listing = await insertPendingHousing(landlord.id, { title: 'Anuncio del detalle admin' });

      const detail = await getUserDetail(landlord.id);

      expect(detail.profile.id).toBe(landlord.id);
      expect(detail.profile.email).toBe(landlord.email);
      expect(detail.profile.role).toBe('landlord');
      expect(detail.stats).toHaveProperty('totalListings');
      expect(detail.listings.map((l) => l.id)).toContain(listing.id);
      expect(Array.isArray(detail.activity)).toBe(true);
    });

    it('estudiante real: perfil + stats + sus favoritos', async () => {
      const student = await createRealUser({ role: 'student' });
      const landlord = await createRealUser({ role: 'landlord' });
      const listing = await insertPendingHousing(landlord.id, { title: 'Anuncio favorito del detalle admin' });
      await supabaseAdmin.from('favorites').insert({ user_id: student.id, listing_id: listing.id });

      const detail = await getUserDetail(student.id);

      expect(detail.profile.id).toBe(student.id);
      expect(detail.profile.role).toBe('student');
      expect(detail.stats).toHaveProperty('savedFavorites');
      expect(detail.favorites.map((l) => l.id)).toContain(listing.id);
    });

    it('lanza error con statusCode 500 si falla la consulta de actividad', async () => {
      const student = await createRealUser({ role: 'student' });
      const originalFn = adminRepo.findAuditLogs;
      adminRepo.findAuditLogs = jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });

      try {
        await expect(getUserDetail(student.id)).rejects.toMatchObject({ statusCode: 500 });
      } finally {
        adminRepo.findAuditLogs = originalFn;
      }
    });

    it('admin real: sin stats/listings/favoritos (ningun rol de estudiante/arrendador)', async () => {
      const admin = await createRealUser({ role: 'admin' });

      const detail = await getUserDetail(admin.id);

      expect(detail.profile.role).toBe('admin');
      expect(detail.stats).toBeNull();
      expect(detail.listings).toEqual([]);
      expect(detail.favorites).toEqual([]);
    });
  });

  describe('deleteUserAccount', () => {
    it('borra al usuario real de auth.users y deja de existir su perfil', async () => {
      const student = await createRealUser({ role: 'student', name: 'A Eliminar' });

      const result = await deleteUserAccount(student.id, { motivo: 'Cuenta de prueba' }, { id: 'admin-id', name: 'Admin Test' });
      expect(result).toEqual({ message: 'Cuenta eliminada' });

      const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', student.id).maybeSingle();
      expect(profile).toBeNull();
    });

    it('registra la auditoria con el nombre y rol del usuario eliminado en los detalles', async () => {
      // El actor debe ser un usuario real: audit_logs.user_id es FK a
      // profiles, un id inventado hace fallar el insert en silencio (mismo
      // try/catch resiliente que ya usan blockUser/unblockUser) y no queda log.
      const admin = await createRealUser({ role: 'admin', name: 'Admin Que Elimina' });
      const student = await createRealUser({ role: 'student', name: 'Auditado Al Eliminar' });

      await deleteUserAccount(student.id, { motivo: 'Spam' }, { id: admin.id, name: admin.name });

      const { data: logs } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('action', 'Eliminó cuenta')
        .order('created_at', { ascending: false })
        .limit(1);
      expect(logs[0].details).toContain('Auditado Al Eliminar');
      expect(logs[0].details).toContain('Spam');
    });

    it('lanza NotFoundError (404) si el usuario no existe', async () => {
      const inexistente = '00000000-0000-0000-0000-000000000000';

      await expect(deleteUserAccount(inexistente, { motivo: 'x' })).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
