import { supabaseAdmin } from '../config/supabase.js';

export async function createHousing(landlordId, data) {
  const {
    title,
    description,
    pricePen,
    distanceToUnschMinutes,
    neighborhood,
    address,
    type,
    amenities,
    contactPhone,
    images
  } = data;

  const { data: listing, error } = await supabaseAdmin
    .from('housing_listings')
    .insert({
      landlord_id: landlordId,
      title,
      description,
      price_pen: pricePen,
      distance_to_unsch_minutes: distanceToUnschMinutes,
      neighborhood,
      address,
      type: type || 'room',
      amenities: amenities || [],
      contact_phone: contactPhone,
      images: images || [],
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return listing;
}

export async function listHousings({ tipo, precioMax, barrio } = {}) {
  let query = supabaseAdmin.from('housing_listings').select('*').eq('status', 'approved');

  if (tipo) query = query.eq('type', tipo);
  if (precioMax) query = query.lte('price_pen', Number(precioMax));
  if (barrio) query = query.eq('neighborhood', barrio);

  const { data, error } = await query;

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return data;
}
