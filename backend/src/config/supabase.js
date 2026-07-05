import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !publishableKey || !secretKey) {
  throw new Error(
    'Variables de entorno de Supabase no configuradas: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY'
  );
}

// Respeta RLS. Se usa para operaciones en nombre de un usuario (ej. login).
export const supabasePublic = createClient(supabaseUrl, publishableKey);

// Ignora RLS con la secret key. Uso exclusivo del backend, nunca exponer al cliente.
export const supabaseAdmin = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});
