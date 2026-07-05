import { supabaseAdmin } from '../config/supabase.js';

export function insertHousing(record) {
  return supabaseAdmin.from('housing_listings').insert(record).select().single();
}

export function findApprovedHousings({ tipo, precioMax, barrio } = {}) {
  let query = supabaseAdmin.from('housing_listings').select('*').eq('status', 'approved');

  if (tipo) query = query.eq('type', tipo);
  if (precioMax) query = query.lte('price_pen', Number(precioMax));
  if (barrio) query = query.eq('neighborhood', barrio);

  return query;
}
