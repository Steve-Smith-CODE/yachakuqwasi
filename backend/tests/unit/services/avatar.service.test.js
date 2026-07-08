import { uploadAvatar } from '../../../src/services/avatar.service.js';

// PNG real de 1x1 pixel (valido), suficiente para que sharp lea su metadata real.
const TINY_PNG_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

describe('avatar.service (Supabase Storage real)', () => {
  it('sube una foto de perfil real, la convierte a webp cuadrado y devuelve una URL publica', async () => {
    const url = await uploadAvatar('test-avatar-service', TINY_PNG_BASE64);

    expect(url).toMatch(/\.webp$/);
    expect(url).toContain('avatars');
  });

  it('rechaza contenido que no es una imagen valida', async () => {
    const fakeImage = 'data:image/png;base64,' + Buffer.from('esto no es una imagen').toString('base64');
    await expect(uploadAvatar('test-avatar-invalid', fakeImage)).rejects.toThrow();
  });

  it('acepta base64 plano sin el prefijo data:image/...;base64,', async () => {
    const plainBase64 = TINY_PNG_BASE64.split(',')[1];
    const url = await uploadAvatar('test-avatar-plain-base64', plainBase64);
    expect(url).toMatch(/\.webp$/);
  });

  it('rechaza una imagen que excede el limite de 5MB', async () => {
    const bigBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 0);
    const bigImage = 'data:image/png;base64,' + bigBuffer.toString('base64');
    await expect(uploadAvatar('test-avatar-too-big', bigImage)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rechaza un formato valido para sharp pero no permitido (gif)', async () => {
    const tinyGifBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7';
    const gifImage = 'data:image/gif;base64,' + tinyGifBase64;
    await expect(uploadAvatar('test-avatar-gif', gifImage)).rejects.toMatchObject({ statusCode: 400 });
  });
});
