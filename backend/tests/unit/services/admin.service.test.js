import {
  getStats,
  getPendingDocuments,
  reviewDocument,
  getPendingHousings,
  updateHousingStatus,
  blockUser,
  getAllHousingsAdmin,
  getAllUsers,
  setUserRole,
  getAuditLogs
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

  describe('getPendingDocuments + reviewDocument', () => {
    it('lista un documento pendiente real y lo aprueba, verificando el perfil', async () => {
      const student = await createRealUser({ role: 'student' });

      const { data: doc } = await supabaseAdmin
        .from('verification_documents')
        .insert({ user_id: student.id, doc_url: 'https://example.com/carnet.png', status: 'pending' })
        .select()
        .single();
      createdDocIds.push(doc.id);

      const pending = await getPendingDocuments();
      expect(pending.map((d) => d.id)).toContain(doc.id);

      const reviewed = await reviewDocument(doc.id, { estado: 'approved', comentario: 'Documento valido' });
      expect(reviewed.status).toBe('approved');

      const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', student.id).single();
      expect(profile.is_verified).toBe(true);
      expect(profile.verification_status).toBe('approved');
    });

    it('rechaza un documento real y actualiza el estado de verificacion del perfil', async () => {
      const student = await createRealUser({ role: 'student' });

      const { data: doc } = await supabaseAdmin
        .from('verification_documents')
        .insert({ user_id: student.id, doc_url: 'https://example.com/borroso.png', status: 'pending' })
        .select()
        .single();
      createdDocIds.push(doc.id);

      await reviewDocument(doc.id, { estado: 'rejected', comentario: 'Ilegible' });

      const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', student.id).single();
      expect(profile.verification_status).toBe('rejected');
      expect(profile.is_verified).toBe(false);
    });

    it('lanza error con statusCode 400 si el documento no existe (real: .single() sin filas)', async () => {
      const inexistente = '00000000-0000-0000-0000-000000000000';

      await expect(reviewDocument(inexistente, { estado: 'approved', comentario: 'x' })).rejects.toMatchObject({
        statusCode: 400
      });
    });

    it('no actualiza verification_status si estado no es approved ni rejected', async () => {
      const originalUpdateDoc = adminRepo.updateDocumentStatus;
      const originalUpdateVerif = adminRepo.updateProfileVerification;
      adminRepo.updateDocumentStatus = jest.fn().mockResolvedValue({
        data: { id: 'fake-doc', user_id: 'fake-user' },
        error: null
      });
      adminRepo.updateProfileVerification = jest.fn();

      try {
        const result = await reviewDocument('fake-doc', { estado: 'otro-estado' });
        expect(result.id).toBe('fake-doc');
        expect(adminRepo.updateProfileVerification).not.toHaveBeenCalled();
      } finally {
        adminRepo.updateDocumentStatus = originalUpdateDoc;
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
  });

  describe('reviewDocument - Estado Rejected', () => {
    it('rechaza un documento y deja al usuario sin verificar', async () => {
      const student = await createRealUser({ role: 'student' });

      const { data: doc } = await supabaseAdmin
        .from('verification_documents')
        .insert({ user_id: student.id, doc_url: 'https://example.com/invalido.png', status: 'pending' })
        .select()
        .single();
      createdDocIds.push(doc.id);

      const reviewed = await reviewDocument(doc.id, { estado: 'rejected', comentario: 'Documento borroso' });
      expect(reviewed.status).toBe('rejected');

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

  describe('getAuditLogs', () => {
    it('devuelve el log real generado al aprobar un documento', async () => {
      const student = await createRealUser({ role: 'student' });
      const { data: doc } = await supabaseAdmin
        .from('verification_documents')
        .insert({ user_id: student.id, doc_url: 'https://example.com/audit.png', status: 'pending' })
        .select()
        .single();
      createdDocIds.push(doc.id);

      await reviewDocument(doc.id, { estado: 'approved', comentario: 'ok' }, { id: student.id, name: 'Admin Test' });

      const logs = await getAuditLogs();

      expect(logs.some((l) => l.details?.includes(doc.id))).toBe(true);
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
});
