import { supabaseAdmin } from '../config/supabase.js';

export function insertVerificationDocuments(rows) {
  return supabaseAdmin.from('verification_documents').insert(rows).select();
}
