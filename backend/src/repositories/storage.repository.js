import { supabaseAdmin } from '../config/supabase.js';

const BUCKET = 'housing-images';

export async function ensureBucketExists() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  if (buckets?.some((b) => b.name === BUCKET)) return;

  await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: '5MB',
    allowedMimeTypes: ['image/webp']
  });
}

export async function uploadImage(path, buffer, contentType) {
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, buffer, { contentType, upsert: false });

  if (error) {
    throw error;
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
