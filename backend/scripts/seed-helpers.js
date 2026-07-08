import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { supabaseAdmin } from '../src/config/supabase.js';
import { ensureBucketExists, uploadImage } from '../src/repositories/storage.repository.js';

export async function createUser({ email, password, role, name, faculty, career, phone }) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role, faculty, career, phone }
  });
  if (error) throw error;
  // El profile se crea solo via el trigger handle_new_auth_user (ver database/schema.sql),
  // que lee name/role/faculty/career/phone de user_metadata.
  return { id: data.user.id, email, password, name, role };
}

export async function createListing(landlordId, listingData) {
  const { data, error } = await supabaseAdmin
    .from('housing_listings')
    .insert({ landlord_id: landlordId, status: 'approved', images: [], ...listingData })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addFavorite(studentId, listingId) {
  const { error } = await supabaseAdmin.from('favorites').insert({ user_id: studentId, listing_id: listingId });
  if (error) throw error;
}

export function pickRandom(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Carpeta con las fotos reales de origen (ver backend/scripts/real-listings-data.js).
// No se versiona en git (.gitignore); solo debe existir localmente al sembrar.
const IMAGENES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../IMAGENES');
const MAX_IMAGES_PER_LISTING = 8;

// Sube las fotos reales de una publicacion al bucket de Supabase Storage,
// con el mismo procesamiento (rotar por EXIF, quitar metadata, redimensionar,
// convertir a webp) que usa la subida real desde la app (ver image.service.js).
// Descarta fotos duplicadas exactas (mismo contenido) presentes en la carpeta origen.
export async function uploadRealListingImages(slug, folderName) {
  const folderPath = path.join(IMAGENES_DIR, folderName);
  const entries = await readdir(folderPath);
  const imageFiles = entries.filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();

  await ensureBucketExists();

  const seenHashes = new Set();
  const urls = [];
  for (const file of imageFiles) {
    if (urls.length >= MAX_IMAGES_PER_LISTING) break;

    const buffer = await readFile(path.join(folderPath, file));
    const hash = crypto.createHash('sha1').update(buffer).digest('hex');
    if (seenHashes.has(hash)) continue;
    seenHashes.add(hash);

    const processed = await sharp(buffer)
      .rotate()
      .withMetadata(false)
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const uploadPath = `${slug}/${urls.length}.webp`;
    const url = await uploadImage(uploadPath, processed, 'image/webp');
    urls.push(url);
  }

  return urls;
}
