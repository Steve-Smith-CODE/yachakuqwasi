import { supabaseAdmin } from '../config/supabase.js';

export function insertVerificationDocument(userId, docUrl) {
  return supabaseAdmin
    .from('verification_documents')
    .insert({ user_id: userId, doc_url: docUrl, status: 'pending' })
    .select()
    .single();
}
