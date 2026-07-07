import { supabaseAdmin } from '../config/supabase.js';

export function insertFavorite(userId, listingId) {
  return supabaseAdmin.from('favorites').insert({ user_id: userId, listing_id: listingId }).select().single();
}

export function deleteFavorite(userId, listingId) {
  return supabaseAdmin.from('favorites').delete().eq('user_id', userId).eq('listing_id', listingId);
}

export function findFavoritesByUser(userId) {
  return supabaseAdmin
    .from('favorites')
    .select('listing_id, housing_listings(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}
