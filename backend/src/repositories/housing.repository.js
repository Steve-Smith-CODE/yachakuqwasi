import { supabaseAdmin } from '../config/supabase.js';

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;

export function insertHousing(record) {
  return supabaseAdmin.from('housing_listings').insert(record).select().single();
}

// Paginado via .range(): sin esto, un listado approved que crezca trae todas
// las filas en cada request (era el principal cuello de botella de /housings).
export function findApprovedHousings({ tipo, precioMax, barrio, q, page = 1, limit = DEFAULT_LIMIT } = {}) {
  const safeLimit = Math.min(Number(limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const safePage = Math.max(Number(page) || 1, 1);
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  let query = supabaseAdmin
    .from('housing_listings')
    .select('*, profiles!housing_listings_landlord_id_fkey(name)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (tipo) query = query.eq('type', tipo);
  if (precioMax) query = query.lte('price_pen', Number(precioMax));
  if (barrio) query = query.eq('neighborhood', barrio);

  // Busqueda libre por zona/calle: se limpian "," y "()" porque tienen
  // significado especial en la sintaxis de filtros de PostgREST y romperian
  // el .or() de abajo si vinieran del texto que escribe el usuario.
  if (q) {
    const safeQ = q.replace(/[,()]/g, ' ').trim();
    if (safeQ) query = query.or(`title.ilike.%${safeQ}%,neighborhood.ilike.%${safeQ}%,description.ilike.%${safeQ}%,address.ilike.%${safeQ}%`);
  }

  return query;
}

export function findHousingById(id) {
  return supabaseAdmin.from('housing_listings').select('*').eq('id', id).single();
}

// Para la pagina de detalle publica (compartible por URL): solo publicaciones
// aprobadas, con el nombre del arrendador para mostrarlo en la ficha.
export function findApprovedHousingById(id) {
  return supabaseAdmin
    .from('housing_listings')
    .select('*, profiles!housing_listings_landlord_id_fkey(name)')
    .eq('id', id)
    .eq('status', 'approved')
    .single();
}

export function findHousingsByLandlord(landlordId) {
  return supabaseAdmin
    .from('housing_listings')
    .select('*')
    .eq('landlord_id', landlordId)
    .order('created_at', { ascending: false });
}

export function updateHousingImages(id, images) {
  return supabaseAdmin.from('housing_listings').update({ images }).eq('id', id).select().single();
}
