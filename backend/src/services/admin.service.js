import { supabaseAdmin } from '../config/supabase.js';

export async function getStats() {
  const [users, housings, pendingDocs] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('housing_listings').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('verification_documents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
  ]);

  return {
    totalUsers: users.count ?? 0,
    totalHousings: housings.count ?? 0,
    pendingDocuments: pendingDocs.count ?? 0
  };
}

export async function getPendingDocuments() {
  const { data, error } = await supabaseAdmin
    .from('verification_documents')
    .select('*, profiles!verification_documents_user_id_fkey(name, role)')
    .eq('status', 'pending');

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return data;
}

export async function reviewDocument(docId, { estado, comentario }) {
  const { data: doc, error } = await supabaseAdmin
    .from('verification_documents')
    .update({ status: estado, comment: comentario, reviewed_at: new Date().toISOString() })
    .eq('id', docId)
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  if (estado === 'approved') {
    await supabaseAdmin
      .from('profiles')
      .update({ is_verified: true, verification_status: 'approved' })
      .eq('id', doc.user_id);
  } else if (estado === 'rejected') {
    await supabaseAdmin
      .from('profiles')
      .update({ verification_status: 'rejected' })
      .eq('id', doc.user_id);
  }

  return doc;
}

export async function blockUser(userId, { motivo, dias }) {
  const blockedUntil = dias ? new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString() : null;

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ blocked_until: blockedUntil, blocked_reason: motivo })
    .eq('id', userId);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return { message: 'Usuario bloqueado' };
}
