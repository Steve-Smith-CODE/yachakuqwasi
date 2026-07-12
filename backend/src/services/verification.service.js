import sharp from 'sharp';
import { ensureBucketExists, uploadImage } from '../repositories/storage.repository.js';
import { insertVerificationDocuments } from '../repositories/verification.repository.js';
import { updateProfileVerification } from '../repositories/admin.repository.js';
import { ValidationError } from '../errors/AppError.js';

const BUCKET = 'verification-docs';
const ALLOWED_FORMATS = ['jpeg', 'png', 'webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

function decodeDataUrl(input) {
  const match = /^data:image\/\w+;base64,(.+)$/.exec(input);
  return Buffer.from(match ? match[1] : input, 'base64');
}

async function processAndUpload(userId, docType, imageDataUrl) {
  const buffer = decodeDataUrl(imageDataUrl);

  if (buffer.length > MAX_SIZE_BYTES) {
    throw new ValidationError({ [docType]: ['La imagen excede 5MB'] });
  }

  const metadata = await sharp(buffer).metadata();
  if (!ALLOWED_FORMATS.includes(metadata.format)) {
    throw new ValidationError({ [docType]: ['Formato no soportado (solo jpeg/png/webp)'] });
  }

  const processed = await sharp(buffer)
    .rotate()
    .withMetadata(false)
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const path = `${userId}/${docType}-${Date.now()}.webp`;
  return uploadImage(path, processed, 'image/webp', BUCKET);
}

// El estudiante/arrendador sube DNI + carnet o constancia de matricula
// juntos, para que el admin pueda contrastar ambos y aprobar/rechazar de
// una sola vez (ver admin.service.js:reviewUserDocuments) - un documento
// suelto ya no alcanza para confirmar que es estudiante universitario.
export async function submitVerificationDocument(userId, { dni, carnet }) {
  await ensureBucketExists(BUCKET);

  const dniUrl = await processAndUpload(userId, 'dni', dni);
  const carnetUrl = await processAndUpload(userId, 'carnet', carnet);

  const { data, error } = await insertVerificationDocuments([
    { user_id: userId, doc_url: dniUrl, doc_type: 'dni', status: 'pending' },
    { user_id: userId, doc_url: carnetUrl, doc_type: 'carnet', status: 'pending' }
  ]);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  await updateProfileVerification(userId, { verification_status: 'pending' });

  return data;
}
