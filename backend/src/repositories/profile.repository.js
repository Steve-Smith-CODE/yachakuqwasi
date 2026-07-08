import { supabaseAdmin } from '../config/supabase.js';

export function updateProfileFields(userId, fields) {
  return supabaseAdmin.from('profiles').update(fields).eq('id', userId).select().single();
}

export function updateProfileAvatar(userId, avatarUrl) {
  return supabaseAdmin.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId).select().single();
}
