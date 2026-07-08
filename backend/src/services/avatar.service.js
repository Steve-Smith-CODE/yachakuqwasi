import sharp from 'sharp';
import { ensureBucketExists, uploadImage } from '../repositories/storage.repository.js';
import { ValidationError } from '../errors/AppError.js';

const ALLOWED_FORMATS = ['jpeg', 'png', 'webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const BUCKET = 'avatars';

function decodeDataUrl(input) {
  const match = /^data:image\/\w+;base64,(.+)$/.exec(input);
  return Buffer.from(match ? match[1] : input, 'base64');
}

export async function uploadAvatar(userId, imageDataUrl) {
  const buffer = decodeDataUrl(imageDataUrl);

  if (buffer.length > MAX_SIZE_BYTES) {
    throw new ValidationError({ image: ['La imagen excede 5MB'] });
  }

  // Se valida el formato real del archivo (contenido), no la extension
  // del nombre ni el mimetype reportado por el cliente, que se puede falsificar.
  const metadata = await sharp(buffer).metadata();
  if (!ALLOWED_FORMATS.includes(metadata.format)) {
    throw new ValidationError({ image: ['Formato no soportado (solo jpeg/png/webp)'] });
  }

  await ensureBucketExists(BUCKET);

  const processed = await sharp(buffer)
    .rotate()
    .withMetadata(false)
    .resize(512, 512, { fit: 'cover' })
    .webp({ quality: 85 })
    .toBuffer();

  const path = `${userId}/${Date.now()}.webp`;
  return uploadImage(path, processed, 'image/webp', BUCKET);
}
