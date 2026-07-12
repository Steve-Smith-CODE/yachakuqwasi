import { supabaseAdmin } from '../config/supabase.js';

export function updateProfileFields(userId, fields) {
  return supabaseAdmin.from('profiles').update(fields).eq('id', userId).select().single();
}

export function updateProfileAvatar(userId, avatarUrl) {
  return supabaseAdmin.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId).select().single();
}

// Solo columnas no sensibles - nada de blocked_*, verification_doc_url, etc.
// Este select acota lo que un usuario cualquiera puede ver de otro (a
// diferencia de admin.repository.js:findProfileById, que trae la fila completa).
export function findPublicProfileById(userId) {
  return supabaseAdmin
    .from('profiles')
    .select('id, name, role, faculty, career, avatar_url, created_at')
    .eq('id', userId)
    .single();
}
