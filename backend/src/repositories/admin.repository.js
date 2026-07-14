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

// Revisa TODOS los documentos pendientes de un usuario (DNI + carnet) en un
// solo update, para que el admin apruebe/rechace la solicitud completa de
// una vez en vez de documento por documento - evita que se verifique al
// usuario habiendo aprobado solo uno de los dos.
export function updateDocumentsStatusForUser(userId, { status, comment }) {
  return supabaseAdmin
    .from('verification_documents')
    .update({ status, comment, reviewed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'pending')
    .select();
}

export function updateProfileVerification(userId, fields) {
  return supabaseAdmin.from('profiles').update(fields).eq('id', userId);
}

export function findPendingHousings() {
  return supabaseAdmin
    .from('housing_listings')
    .select('*, profiles!housing_listings_landlord_id_fkey(name, phone, avatar_url)')
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
    .select('*, profiles!housing_listings_landlord_id_fkey(name, phone, avatar_url)')
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

export function findAuditLogs({ types, listingId, userId } = {}) {
  let query = supabaseAdmin.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);

  if (types?.length) query = query.in('type', types);
  if (listingId) query = query.eq('listing_id', listingId);
  if (userId) query = query.eq('user_id', userId);

  return query;
}

export function findVerifiedDomains() {
  return supabaseAdmin.from('verified_domains').select('*').order('domain', { ascending: true });
}

export function findVerifiedDomainByDomain(domain) {
  return supabaseAdmin.from('verified_domains').select('*').eq('domain', domain).maybeSingle();
}

export function insertVerifiedDomain(domain, institutionName) {
  return supabaseAdmin.from('verified_domains').insert({ domain, institution_name: institutionName }).select().single();
}

export function deleteVerifiedDomain(domain) {
  return supabaseAdmin.from('verified_domains').delete().eq('domain', domain);
}
