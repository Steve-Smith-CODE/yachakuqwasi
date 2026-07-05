import { stats, pendingDocuments, reviewDoc, block } from '../../../src/controllers/admin.controller.js';
import { supabaseAdmin } from '../../../src/config/supabase.js';
import { createRealUser, cleanupCreatedUsers } from '../../helpers/testData.js';

const createdDocIds = [];

afterAll(async () => {
  for (const id of createdDocIds.splice(0)) {
    await supabaseAdmin.from('verification_documents').delete().eq('id', id).catch?.(() => {});
  }
  await cleanupCreatedUsers();
});

describe('Admin Controller (Supabase local real)', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  });

  it('stats responde con conteos reales de la base de datos', async () => {
    const before = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
    await createRealUser({ role: 'student' });

    await stats(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.totalUsers).toBe((before.count ?? 0) + 1);
  });

  it('pendingDocuments responde con los documentos reales en estado pending', async () => {
    const student = await createRealUser({ role: 'student' });
    const { data: doc } = await supabaseAdmin
      .from('verification_documents')
      .insert({ user_id: student.id, doc_url: 'https://example.com/doc.png', status: 'pending' })
      .select()
      .single();
    createdDocIds.push(doc.id);

    await pendingDocuments(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.map((d) => d.id)).toContain(doc.id);
  });

  it('reviewDoc aprueba un documento real y envuelve el resultado en { documento }', async () => {
    const student = await createRealUser({ role: 'student' });
    const { data: doc } = await supabaseAdmin
      .from('verification_documents')
      .insert({ user_id: student.id, doc_url: 'https://example.com/doc2.png', status: 'pending' })
      .select()
      .single();
    createdDocIds.push(doc.id);

    req.params.id = doc.id;
    req.body = { estado: 'approved', comentario: 'Valido' };
    await reviewDoc(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.documento.status).toBe('approved');
  });

  it('block bloquea a un usuario real y responde con el mensaje', async () => {
    const student = await createRealUser({ role: 'student' });
    req.params.id = student.id;
    req.body = { motivo: 'Fraude', dias: 7 };

    await block(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Usuario bloqueado' });
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', student.id).single();
    expect(profile.blocked_reason).toBe('Fraude');
  });
});
