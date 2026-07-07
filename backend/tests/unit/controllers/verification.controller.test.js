import { submit } from '../../../src/controllers/verification.controller.js';
import { supabaseAdmin } from '../../../src/config/supabase.js';
import { createRealUser, cleanupCreatedUsers } from '../../helpers/testData.js';

const TINY_PNG_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const createdDocIds = [];

afterAll(async () => {
  for (const id of createdDocIds.splice(0)) {
    await supabaseAdmin.from('verification_documents').delete().eq('id', id).catch?.(() => {});
  }
  await cleanupCreatedUsers();
});

describe('Verification Controller (Supabase real)', () => {
  it('submit sube un documento real y responde 201 con { documento }', async () => {
    const student = await createRealUser({ role: 'student' });
    const req = { user: { id: student.id }, body: { image: TINY_PNG_BASE64 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await submit(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.documento.user_id).toBe(student.id);
    createdDocIds.push(body.documento.id);
  });
});
