import 'dotenv/config';
import { supabaseAdmin } from '../src/config/supabase.js';

// Requiere que exista la funcion RPC public.truncate_all_tables()
// (ver backend/database/maintenance.sql) con permisos solo para service_role.
const STORAGE_BUCKETS = ['housing-images', 'verification-docs'];

async function emptyBucket(bucket) {
  const { data: files, error } = await supabaseAdmin.storage.from(bucket).list();
  if (error) {
    console.warn(`No se pudo listar el bucket "${bucket}": ${error.message}`);
    return;
  }
  if (files && files.length > 0) {
    const fileNames = files.map((f) => f.name);
    await supabaseAdmin.storage.from(bucket).remove(fileNames);
  }
}

async function deleteAllAuthUsers() {
  let page = 1;
  for (;;) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    if (data.users.length === 0) break;

    await Promise.all(data.users.map((user) => supabaseAdmin.auth.admin.deleteUser(user.id)));
    page++;
  }
}

async function cleanup() {
  console.log('Iniciando limpieza completa de la base de datos y storage...');

  for (const bucket of STORAGE_BUCKETS) {
    await emptyBucket(bucket);
  }
  console.log('Buckets vaciados.');

  const { error: truncError } = await supabaseAdmin.rpc('truncate_all_tables');
  if (truncError) {
    throw new Error(
      `Error al truncar tablas via RPC: ${truncError.message}. ` +
      '¿Ejecutaste backend/database/maintenance.sql en el SQL Editor de Supabase?'
    );
  }
  console.log('Tablas truncadas.');

  await deleteAllAuthUsers();
  console.log('Usuarios de Auth eliminados.');

  console.log('Limpieza completada.');
}

cleanup().catch((err) => {
  console.error('Cleanup fallo:', err);
  process.exit(1);
});
