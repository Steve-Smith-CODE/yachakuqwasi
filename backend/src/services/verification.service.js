import sharp from 'sharp';
import { ensureBucketExists, uploadImage } from '../repositories/storage.repository.js';
import { insertVerificationDocument } from '../repositories/verification.repository.js';
import { updateProfileVerification } from '../repositories/admin.repository.js';
import { ValidationError } from '../errors/AppError.js';

const BUCKET = 'verification-docs';
const ALLOWED_FORMATS = ['jpeg', 'png', 'webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

function decodeDataUrl(input) {
  const match = /^data:image\/\w+;base64,(.+)$/.exec(input);
  return Buffer.from(match ? match[1] : input, 'base64');
}

export async function submitVerificationDocument(userId, imageDataUrl) {
  const buffer = decodeDataUrl(imageDataUrl);

  if (buffer.length > MAX_SIZE_BYTES) {
    throw new ValidationError({ image: ['La imagen excede 5MB'] });
  }

  const metadata = await sharp(buffer).metadata();
  if (!ALLOWED_FORMATS.includes(metadata.format)) {
    throw new ValidationError({ image: ['Formato no soportado (solo jpeg/png/webp)'] });
  }

  await ensureBucketExists(BUCKET);

  const processed = await sharp(buffer)
    .rotate()
    .withMetadata(false)
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const path = `${userId}/${Date.now()}.webp`;
  const url = await uploadImage(path, processed, 'image/webp', BUCKET);

  const { data, error } = await insertVerificationDocument(userId, url);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  await updateProfileVerification(userId, { verification_status: 'pending' });

  return data;
}
