import sharp from 'sharp';
import { ensureBucketExists, uploadImage } from '../repositories/storage.repository.js';
import { ValidationError } from '../errors/AppError.js';

const ALLOWED_FORMATS = ['jpeg', 'png', 'webp'];
const MAX_FILES = 8;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

function decodeDataUrl(input) {
  const match = /^data:image\/\w+;base64,(.+)$/.exec(input);
  return Buffer.from(match ? match[1] : input, 'base64');
}

export async function uploadHousingImages(housingId, images) {
  if (images.length > MAX_FILES) {
    throw new ValidationError({ images: [`Máximo ${MAX_FILES} fotos por publicación`] });
  }

  await ensureBucketExists();

  const urls = [];
  for (let i = 0; i < images.length; i++) {
    const buffer = decodeDataUrl(images[i]);

    if (buffer.length > MAX_SIZE_BYTES) {
      throw new ValidationError({ [`images[${i}]`]: ['La imagen excede 5MB'] });
    }

    // Se valida el formato real del archivo (contenido), no la extension
    // del nombre ni el mimetype reportado por el cliente, que se puede falsificar.
    const metadata = await sharp(buffer).metadata();
    if (!ALLOWED_FORMATS.includes(metadata.format)) {
      throw new ValidationError({ [`images[${i}]`]: ['Formato no soportado (solo jpeg/png/webp)'] });
    }

    const processed = await sharp(buffer)
      .rotate() // aplica la orientacion EXIF antes de eliminarla
      .withMetadata(false) // elimina EXIF (privacidad: ubicacion, dispositivo, etc.)
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const path = `${housingId}/${Date.now()}-${i}.webp`;
    const url = await uploadImage(path, processed, 'image/webp');
    urls.push(url);
  }

  return urls;
}
