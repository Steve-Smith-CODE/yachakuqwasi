import { supabaseAdmin } from '../config/supabase.js';

export function insertNotifications(rows) {
  return supabaseAdmin.from('notifications').insert(rows).select();
}

export function findNotificationsForUser(userId) {
  return supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
}

export function countUnreadNotifications(userId) {
  return supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .is('read_at', null);
}

export function markNotificationRead(id, userId) {
  return supabaseAdmin
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('recipient_id', userId)
    .select()
    .maybeSingle();
}

export function markAllNotificationsRead(userId) {
  return supabaseAdmin
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', userId)
    .is('read_at', null);
}

export function findAdminIds() {
  return supabaseAdmin.from('profiles').select('id').eq('role', 'admin');
}
