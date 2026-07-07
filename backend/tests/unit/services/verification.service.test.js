import { submitVerificationDocument } from '../../../src/services/verification.service.js';
import * as verificationRepo from '../../../src/repositories/verification.repository.js';
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

describe('verification.service (Supabase Storage + DB real)', () => {
  it('sube un documento real, lo guarda pending y marca el perfil como verification_status pending', async () => {
    const student = await createRealUser({ role: 'student' });

    const documento = await submitVerificationDocument(student.id, TINY_PNG_BASE64);
    createdDocIds.push(documento.id);

    expect(documento.user_id).toBe(student.id);
    expect(documento.status).toBe('pending');

    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', student.id).single();
    expect(profile.verification_status).toBe('pending');
  });

  it('acepta base64 plano sin el prefijo data:image/...;base64,', async () => {
    const student = await createRealUser({ role: 'student' });
    const plainBase64 = TINY_PNG_BASE64.split(',')[1];

    const documento = await submitVerificationDocument(student.id, plainBase64);
    createdDocIds.push(documento.id);

    expect(documento.doc_url).toMatch(/\.webp$/);
  });

  it('rechaza una imagen que excede el limite de 5MB', async () => {
    const student = await createRealUser({ role: 'student' });
    const bigBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 0);
    const bigImage = 'data:image/png;base64,' + bigBuffer.toString('base64');

    await expect(submitVerificationDocument(student.id, bigImage)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rechaza un formato valido para sharp pero no permitido (gif)', async () => {
    const student = await createRealUser({ role: 'student' });
    const tinyGifBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7';
    const gifImage = 'data:image/gif;base64,' + tinyGifBase64;

    await expect(submitVerificationDocument(student.id, gifImage)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('lanza error con statusCode 400 si el repositorio falla al guardar el documento', async () => {
    const student = await createRealUser({ role: 'student' });
    const originalFn = verificationRepo.insertVerificationDocument;
    verificationRepo.insertVerificationDocument = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed' }
    });

    try {
      await expect(submitVerificationDocument(student.id, TINY_PNG_BASE64)).rejects.toMatchObject({
        statusCode: 400
      });
    } finally {
      verificationRepo.insertVerificationDocument = originalFn;
    }
  });
});
