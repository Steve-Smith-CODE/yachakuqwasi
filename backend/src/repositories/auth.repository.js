import { supabaseAdmin, supabasePublic } from '../config/supabase.js';

export function createAuthUser({ email, password, name, role, faculty, career, phone }) {
  return supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role, faculty, career, phone }
  });
}

export function signInWithPassword({ email, password }) {
  return supabasePublic.auth.signInWithPassword({ email, password });
}

export function findProfileById(id) {
  return supabaseAdmin.from('profiles').select('*').eq('id', id).single();
}
