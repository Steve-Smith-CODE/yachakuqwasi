import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

const EMAILS = ['loadtest.student@yachakuqwasi.test', 'loadtest.landlord@yachakuqwasi.test'];

async function findUserIdByEmail(email) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email === email)?.id ?? null;
}

for (const email of EMAILS) {
  const id = await findUserIdByEmail(email);
  if (!id) {
    console.log(email, '-> no existe, nada que borrar');
    continue;
  }
  const { error } = await admin.auth.admin.deleteUser(id);
  console.log(email, '->', error ? 'ERROR: ' + error.message : 'eliminado (cascada borra profile/listings)');
}

const { count } = await admin.from('housing_listings').select('*', { count: 'exact', head: true });
console.log('housing_listings restantes en total:', count);
