import { getStats, getPendingDocuments, reviewDocument, blockUser } from '../../../src/services/admin.service.js';
import { supabaseAdmin } from '../../../src/config/supabase.js';
import { createRealUser, cleanupCreatedUsers } from '../../helpers/testData.js';

const createdDocIds = [];

afterAll(async () => {
  for (const id of createdDocIds.splice(0)) {
    await supabaseAdmin.from('verification_documents').delete().eq('id', id).catch?.(() => {});
  }
  await cleanupCreatedUsers();
});

describe('Admin Service (Supabase local real)', () => {
  describe('getStats', () => {
    it('el conteo de usuarios sube en 1 real al crear un usuario', async () => {
      const before = await getStats();

      await createRealUser({ role: 'student' });

      const after = await getStats();

      expect(after.totalUsers).toBe(before.totalUsers + 1);
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

    it('lanza error con statusCode 400 si el id no es un uuid valido (error real de Postgres)', async () => {
      await expect(blockUser('esto-no-es-un-uuid', { motivo: 'x', dias: 1 })).rejects.toMatchObject({
        statusCode: 400
      });
    });
  });
});
