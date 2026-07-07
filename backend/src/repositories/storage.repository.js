import { supabaseAdmin } from '../config/supabase.js';

const DEFAULT_BUCKET = 'housing-images';

export async function ensureBucketExists(bucket = DEFAULT_BUCKET) {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  if (buckets?.some((b) => b.name === bucket)) return;

  await supabaseAdmin.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: '5MB',
    allowedMimeTypes: ['image/webp']
  });
}

export async function uploadImage(path, buffer, contentType, bucket = DEFAULT_BUCKET) {
  const { error } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, { contentType, upsert: false });

  if (error) {
    throw error;
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
