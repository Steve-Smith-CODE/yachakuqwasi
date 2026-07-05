import { uploadHousingImages } from '../../../src/services/image.service.js';

// PNG real de 1x1 pixel (valido), suficiente para que sharp lea su metadata real.
const TINY_PNG_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

describe('image.service (Supabase Storage real)', () => {
  it('sube una imagen real, la convierte a webp y devuelve una URL publica', async () => {
    const urls = await uploadHousingImages('test-image-service', [TINY_PNG_BASE64]);

    expect(urls).toHaveLength(1);
    expect(urls[0]).toMatch(/\.webp$/);
    expect(urls[0]).toContain('housing-images');
  });

  it('rechaza mas de 8 imagenes', async () => {
    const images = Array(9).fill(TINY_PNG_BASE64);
    await expect(uploadHousingImages('test-too-many', images)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rechaza contenido que no es una imagen valida', async () => {
    const fakeImage = 'data:image/png;base64,' + Buffer.from('esto no es una imagen').toString('base64');
    await expect(uploadHousingImages('test-invalid', [fakeImage])).rejects.toThrow();
  });

  it('acepta base64 plano sin el prefijo data:image/...;base64,', async () => {
    const plainBase64 = TINY_PNG_BASE64.split(',')[1];
    const urls = await uploadHousingImages('test-plain-base64', [plainBase64]);
    expect(urls).toHaveLength(1);
  });

  it('rechaza una imagen que excede el limite de 5MB', async () => {
    const bigBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 0);
    const bigImage = 'data:image/png;base64,' + bigBuffer.toString('base64');
    await expect(uploadHousingImages('test-too-big', [bigImage])).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rechaza un formato valido para sharp pero no permitido (gif)', async () => {
    // GIF 1x1 valido: sharp SI puede leer su metadata (a diferencia de bytes
    // arbitrarios), lo que ejercita la rama de "formato no soportado" en vez
    // de un error de parseo.
    const tinyGifBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7';
    const gifImage = 'data:image/gif;base64,' + tinyGifBase64;
    await expect(uploadHousingImages('test-gif', [gifImage])).rejects.toMatchObject({ statusCode: 400 });
  });
});
