import { createClient } from "@supabase/supabase-js";

// Uso exclusivo para intercambiar el enlace de recuperacion de contraseña
// (Supabase Auth detecta la sesion de recuperacion directo en la URL). El
// resto de la app nunca habla con Supabase directo, todo pasa por la API
// propia del backend.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
