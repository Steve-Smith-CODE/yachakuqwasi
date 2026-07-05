import { ensureBucketExists, uploadImage } from '../../../src/repositories/storage.repository.js';
import { supabaseAdmin } from '../../../src/config/supabase.js';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

describe('storage.repository (Supabase Storage real)', () => {
  it('vuelve a crear el bucket si no existe (rama no cubierta por el resto de la suite)', async () => {
    await supabaseAdmin.storage.emptyBucket('housing-images').catch(() => {});
    await supabaseAdmin.storage.deleteBucket('housing-images').catch(() => {});

    await ensureBucketExists();

    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    expect(buckets.some((b) => b.name === 'housing-images')).toBe(true);
  });

  it('lanza el error real de Supabase Storage al subir dos veces la misma ruta (upsert:false)', async () => {
    // El bucket solo acepta image/webp (ver ensureBucketExists); el contentType
    // debe coincidir aunque los bytes de prueba sean un PNG minimo.
    const path = `test-storage-repo/duplicado-${Date.now()}.webp`;
    await uploadImage(path, TINY_PNG, 'image/webp');

    await expect(uploadImage(path, TINY_PNG, 'image/webp')).rejects.toBeTruthy();

    await supabaseAdmin.storage.from('housing-images').remove([path]);
  });
});
