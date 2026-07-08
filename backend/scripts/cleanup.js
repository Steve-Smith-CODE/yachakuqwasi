import 'dotenv/config';
import { supabaseAdmin } from '../src/config/supabase.js';

// Requiere que exista la funcion RPC public.truncate_all_tables()
// (ver backend/database/maintenance.sql) con permisos solo para service_role.
const STORAGE_BUCKETS = ['housing-images', 'verification-docs'];

// list() solo devuelve el nivel indicado por `prefix`; las subidas reales
// quedan anidadas (ej. housing-images/<slug>/0.webp), asi que hay que bajar
// recursivamente por cada "carpeta" (entradas con id: null) para juntar las
// rutas completas de archivo antes de poder borrarlas.
async function collectFilePaths(bucket, prefix = '') {
  const { data: entries, error } = await supabaseAdmin.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) {
    console.warn(`No se pudo listar "${bucket}/${prefix}": ${error.message}`);
    return [];
  }

  const paths = [];
  for (const entry of entries || []) {
    const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id === null) {
      paths.push(...(await collectFilePaths(bucket, fullPath)));
    } else {
      paths.push(fullPath);
    }
  }
  return paths;
}

async function emptyBucket(bucket) {
  const filePaths = await collectFilePaths(bucket);
  if (filePaths.length === 0) return;

  const { error } = await supabaseAdmin.storage.from(bucket).remove(filePaths);
  if (error) {
    console.warn(`No se pudo vaciar completamente el bucket "${bucket}": ${error.message}`);
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
