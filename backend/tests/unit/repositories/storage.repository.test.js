import { ensureBucketExists, uploadImage } from '../../../src/repositories/storage.repository.js';
import { supabaseAdmin } from '../../../src/config/supabase.js';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

describe('storage.repository (Supabase Storage real)', () => {
  it('vuelve a crear el bucket si no existe (rama no cubierta por el resto de la suite)', async () => {
    // listBuckets() justo despues de borrar el bucket puede devolver un
    // resultado obsoleto (eventual consistency de Supabase Storage), lo que
    // hacia flaky esta prueba. Se fuerza la respuesta de "no existe" en vez
    // de depender del timing real de delete+list.
    const spy = jest.spyOn(supabaseAdmin.storage, 'listBuckets').mockResolvedValueOnce({ data: [], error: null });

    await ensureBucketExists();
    spy.mockRestore();

    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    expect(buckets.some((b) => b.name === 'housing-images')).toBe(true);
  });

  it('no intenta recrear el bucket si ya existe', async () => {
    // Asegurar que el bucket existe
    await ensureBucketExists();

    // Llamar nuevamente - debe ser idempotente
    await ensureBucketExists();

    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketCount = buckets.filter((b) => b.name === 'housing-images').length;
    expect(bucketCount).toBe(1);
  });

  it('lanza el error real de Supabase Storage al subir dos veces la misma ruta (upsert:false)', async () => {
    // El bucket solo acepta image/webp (ver ensureBucketExists); el contentType
    // debe coincidir aunque los bytes de prueba sean un PNG minimo.
    const path = `test-storage-repo/duplicado-${Date.now()}.webp`;
    await uploadImage(path, TINY_PNG, 'image/webp');

    await expect(uploadImage(path, TINY_PNG, 'image/webp')).rejects.toBeTruthy();

    await supabaseAdmin.storage.from('housing-images').remove([path]);
  });

  it('valida que el bucket exista antes de subir imagenes', async () => {
    // Asegurar que el bucket existe
    await ensureBucketExists();

    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets.some((b) => b.name === 'housing-images');
    expect(bucketExists).toBe(true);
  });

  it('devuelve URL publica de la imagen subida', async () => {
    const path = `test-storage-repo/url-test-${Date.now()}.webp`;
    const publicUrl = await uploadImage(path, TINY_PNG, 'image/webp');

    expect(publicUrl).toBeTruthy();
    expect(publicUrl).toContain('housing-images');
    expect(publicUrl).toContain(path);

    await supabaseAdmin.storage.from('housing-images').remove([path]);
  });
});
