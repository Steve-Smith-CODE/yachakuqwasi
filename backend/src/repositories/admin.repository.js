import { supabaseAdmin } from '../config/supabase.js';

export function countProfiles() {
  return supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
}

export function countHousings() {
  return supabaseAdmin.from('housing_listings').select('*', { count: 'exact', head: true });
}

export function countPendingDocuments() {
  return supabaseAdmin
    .from('verification_documents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
}

export function findPendingDocuments() {
  return supabaseAdmin
    .from('verification_documents')
    .select('*, profiles!verification_documents_user_id_fkey(name, role)')
    .eq('status', 'pending');
}

export function updateDocumentStatus(docId, { status, comment }) {
  return supabaseAdmin
    .from('verification_documents')
    .update({ status, comment, reviewed_at: new Date().toISOString() })
    .eq('id', docId)
    .select()
    .single();
}

export function updateProfileVerification(userId, fields) {
  return supabaseAdmin.from('profiles').update(fields).eq('id', userId);
}

export function findPendingHousings() {
  return supabaseAdmin
    .from('housing_listings')
    .select('*, profiles!housing_listings_landlord_id_fkey(name, phone)')
    .eq('status', 'pending');
}

export function updateHousingStatusRecord(housingId, status) {
  return supabaseAdmin.from('housing_listings').update({ status }).eq('id', housingId).select().single();
}

export function updateProfileBlock(userId, { blockedUntil, motivo }) {
  return supabaseAdmin
    .from('profiles')
    .update({ blocked_until: blockedUntil, blocked_reason: motivo })
    .eq('id', userId);
}

export function findAllHousingsAdmin() {
  return supabaseAdmin
    .from('housing_listings')
    .select('*, profiles!housing_listings_landlord_id_fkey(name, phone)')
    .order('created_at', { ascending: false });
}

export function findAllProfiles() {
  return supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false });
}

export function updateProfileRole(userId, role) {
  return supabaseAdmin.from('profiles').update({ role }).eq('id', userId).select().single();
}

export function insertAuditLog({ userId, actorName, action, details, type, listingId }) {
  return supabaseAdmin
    .from('audit_logs')
    .insert({ user_id: userId ?? null, actor_name: actorName, action, details, type, listing_id: listingId ?? null })
    .select()
    .single();
}

export function findAuditLogs({ types, listingId } = {}) {
  let query = supabaseAdmin.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);

  if (types?.length) query = query.in('type', types);
  if (listingId) query = query.eq('listing_id', listingId);

  return query;
}
