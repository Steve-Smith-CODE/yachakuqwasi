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
  it('sube DNI + carnet reales, los guarda pending con su doc_type y marca el perfil como verification_status pending', async () => {
    const student = await createRealUser({ role: 'student' });

    const documentos = await submitVerificationDocument(student.id, { dni: TINY_PNG_BASE64, carnet: TINY_PNG_BASE64 });
    documentos.forEach((d) => createdDocIds.push(d.id));

    expect(documentos).toHaveLength(2);
    expect(documentos.every((d) => d.user_id === student.id && d.status === 'pending')).toBe(true);
    expect(documentos.map((d) => d.doc_type).sort()).toEqual(['carnet', 'dni']);

    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', student.id).single();
    expect(profile.verification_status).toBe('pending');
  });

  it('acepta base64 plano sin el prefijo data:image/...;base64,', async () => {
    const student = await createRealUser({ role: 'student' });
    const plainBase64 = TINY_PNG_BASE64.split(',')[1];

    const documentos = await submitVerificationDocument(student.id, { dni: plainBase64, carnet: plainBase64 });
    documentos.forEach((d) => createdDocIds.push(d.id));

    expect(documentos.every((d) => d.doc_url.match(/\.webp$/))).toBe(true);
  });

  it('rechaza si la foto del DNI excede el limite de 5MB', async () => {
    const student = await createRealUser({ role: 'student' });
    const bigBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 0);
    const bigImage = 'data:image/png;base64,' + bigBuffer.toString('base64');

    await expect(
      submitVerificationDocument(student.id, { dni: bigImage, carnet: TINY_PNG_BASE64 })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rechaza un formato valido para sharp pero no permitido (gif) en el carnet', async () => {
    const student = await createRealUser({ role: 'student' });
    const tinyGifBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7';
    const gifImage = 'data:image/gif;base64,' + tinyGifBase64;

    await expect(
      submitVerificationDocument(student.id, { dni: TINY_PNG_BASE64, carnet: gifImage })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('lanza error con statusCode 400 si el repositorio falla al guardar los documentos', async () => {
    const student = await createRealUser({ role: 'student' });
    const originalFn = verificationRepo.insertVerificationDocuments;
    verificationRepo.insertVerificationDocuments = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed' }
    });

    try {
      await expect(
        submitVerificationDocument(student.id, { dni: TINY_PNG_BASE64, carnet: TINY_PNG_BASE64 })
      ).rejects.toMatchObject({ statusCode: 400 });
    } finally {
      verificationRepo.insertVerificationDocuments = originalFn;
    }
  });
});
