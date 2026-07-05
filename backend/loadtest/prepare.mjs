import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

const STUDENT = { email: 'loadtest.student@yachakuqwasi.test', password: 'LoadTest123!', name: 'LoadTest Student', role: 'student' };
const LANDLORD = { email: 'loadtest.landlord@yachakuqwasi.test', password: 'LoadTest123!', name: 'LoadTest Landlord', role: 'landlord', phone: '900000000' };

async function ensureUser({ email, password, name, role, phone }) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role, phone }
  });

  if (error && !error.message.includes('already been registered')) {
    throw error;
  }

  return data?.user?.id ?? 'ya existia';
}

const studentId = await ensureUser(STUDENT);
const landlordId = await ensureUser(LANDLORD);

console.log('Usuarios de carga listos:');
console.log('  student  ->', STUDENT.email, '/', STUDENT.password, '(id:', studentId, ')');
console.log('  landlord ->', LANDLORD.email, '/', LANDLORD.password, '(id:', landlordId, ')');
console.log();
console.log('Exporta estas variables antes de correr k6:');
console.log(`  export TEST_STUDENT_EMAIL='${STUDENT.email}'`);
console.log(`  export TEST_STUDENT_PASSWORD='${STUDENT.password}'`);
console.log(`  export TEST_LANDLORD_EMAIL='${LANDLORD.email}'`);
console.log(`  export TEST_LANDLORD_PASSWORD='${LANDLORD.password}'`);
