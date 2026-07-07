import { supabaseAdmin } from '../src/config/supabase.js';

export async function createUser({ email, password, role, name, faculty, career, phone }) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role, faculty, career, phone }
  });
  if (error) throw error;
  // El profile se crea solo via el trigger handle_new_auth_user (ver database/schema.sql),
  // que lee name/role/faculty/career/phone de user_metadata.
  return { id: data.user.id, email, password, name, role };
}

export async function createListing(landlordId, listingData) {
  const { data, error } = await supabaseAdmin
    .from('housing_listings')
    .insert({ landlord_id: landlordId, status: 'approved', images: [], ...listingData })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addFavorite(studentId, listingId) {
  const { error } = await supabaseAdmin.from('favorites').insert({ user_id: studentId, listing_id: listingId });
  if (error) throw error;
}

export function pickRandom(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const STREET_NAMES = [
  'Jr. 28 de Julio', 'Jr. Asamblea', 'Jr. Lima', 'Jr. Grau', 'Jr. San Martín',
  'Jr. Independencia', 'Jr. Bellido', 'Jr. Libertad', 'Psje. Vivanco', 'Av. Mariscal Cáceres',
  'Av. Los Incas', 'Jr. Chorro', 'Jr. Cusco', 'Av. Universitaria'
];

const AMENITIES_POOL = [
  'WiFi', 'Agua caliente', 'Cocina compartida', 'Lavandería', 'Estacionamiento',
  'Baño propio', 'Amoblado', 'Servicio de cable', 'Área de estudio', 'Seguridad 24h'
];

const DESCRIPTION_TEMPLATES = [
  (n) => `Habitación tranquila en ${n}, ideal para estudiantes de la UNSCH. Ambiente familiar y seguro.`,
  (n) => `Alojamiento cómodo cerca de ${n}, a pocos minutos de la universidad. Buena iluminación natural.`,
  (n) => `Cuarto amplio en zona de ${n}, cerca a mercados y paradero de mototaxis hacia la UNSCH.`,
  (n) => `Espacio independiente en ${n}, perfecto para estudiantes que buscan tranquilidad para estudiar.`
];

export function buildSyntheticListing(neighborhood, type) {
  const street = STREET_NAMES[randomInt(0, STREET_NAMES.length - 1)];
  const descTemplate = DESCRIPTION_TEMPLATES[randomInt(0, DESCRIPTION_TEMPLATES.length - 1)];
  const amenities = pickRandom(AMENITIES_POOL, randomInt(2, 4));

  const priceByType = {
    room: [200, 400],
    shared: [150, 300],
    apartment: [500, 900],
    family: [350, 600]
  };
  const [minPrice, maxPrice] = priceByType[type] || [200, 400];

  return {
    title: `${type === 'apartment' ? 'Departamento' : 'Habitación'} en ${neighborhood}`,
    type,
    price_pen: randomInt(minPrice, maxPrice),
    distance_to_unsch_minutes: randomInt(5, 25),
    neighborhood,
    address: `${street} ${randomInt(100, 950)}`,
    description: descTemplate(neighborhood),
    contact_phone: `9${randomInt(10000000, 99999999)}`,
    amenities
  };
}
