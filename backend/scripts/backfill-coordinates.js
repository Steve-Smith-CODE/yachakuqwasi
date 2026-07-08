import 'dotenv/config';
import { supabaseAdmin } from '../src/config/supabase.js';
import { geocode } from '../src/services/geocoding.service.js';

// Utilidad de un solo uso: geocodifica las publicaciones existentes que no
// tienen coordenadas (ej. las creadas por el seed, que inserta directo a la
// tabla sin pasar por housing.service.js, o cuya direccion exacta no existe
// en OpenStreetMap por ser sintetica). Respeta el limite de Nominatim de
// 1 req/segundo con una pausa entre llamadas.

// Caja delimitadora aproximada del distrito de Huamanga (Ayacucho ciudad).
// Cualquier resultado de Nominatim fuera de este rango se descarta (evita
// falsos positivos como una "Belen" o "Santa Ana" homonima en otra provincia).
const HUAMANGA_BOUNDS = { minLat: -13.25, maxLat: -13.05, minLon: -74.3, maxLon: -74.15 };

// Centroides aproximados de los 5 distritos urbanos de la provincia de
// Huamanga (Ayacucho ciudad), estimados sobre el mapa (no todos vienen de
// una busqueda exitosa en Nominatim, ya que varios centros distritales no
// existen como lugar propio en OpenStreetMap).
const NEIGHBORHOOD_CENTROIDS = {
  Ayacucho: { lat: -13.1588, lon: -74.2239 },
  'San Juan Bautista': { lat: -13.1706, lon: -74.2183 },
  'Carmen Alto': { lat: -13.1757, lon: -74.2265 },
  'Jesús Nazareno': { lat: -13.1493, lon: -74.2117 },
  'Andrés Avelino Cáceres Dorregaray': { lat: -13.1435, lon: -74.2065 }
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function inBounds(lat, lon) {
  return (
    lat >= HUAMANGA_BOUNDS.minLat &&
    lat <= HUAMANGA_BOUNDS.maxLat &&
    lon >= HUAMANGA_BOUNDS.minLon &&
    lon <= HUAMANGA_BOUNDS.maxLon
  );
}

// Jitter pequeño y estable por id para que las publicaciones de un mismo
// barrio no queden todas apiladas en el mismo punto exacto.
function jitter(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const a = ((hash % 1000) / 1000 - 0.5) * 0.006;
  const b = (((hash >> 8) % 1000) / 1000 - 0.5) * 0.006;
  return { dLat: a, dLon: b };
}

async function run() {
  const { data: listings, error } = await supabaseAdmin
    .from('housing_listings')
    .select('id, address, neighborhood, title');

  if (error) {
    console.error('Error consultando publicaciones:', error.message);
    process.exit(1);
  }

  console.log(`${listings.length} publicaciones a procesar.`);

  let exact = 0;
  let approx = 0;
  let skipped = 0;

  for (const listing of listings) {
    let lat;
    let lon;
    let source;

    const query = `${listing.address}, ${listing.neighborhood}, Ayacucho, Peru`;
    try {
      const coords = await geocode(query);
      if (coords && inBounds(coords.lat, coords.lon)) {
        lat = coords.lat;
        lon = coords.lon;
        source = 'exacta';
      }
    } catch {
      // se resuelve por el fallback de abajo
    }
    await sleep(1100);

    if (lat == null) {
      const centroid = NEIGHBORHOOD_CENTROIDS[listing.neighborhood];
      if (centroid) {
        const { dLat, dLon } = jitter(listing.id);
        lat = centroid.lat + dLat;
        lon = centroid.lon + dLon;
        source = 'barrio (aproximada)';
      }
    }

    if (lat == null) {
      console.log(`Sin barrio conocido, se omite: "${listing.title}" (${listing.neighborhood})`);
      skipped += 1;
      continue;
    }

    const { error: updateError } = await supabaseAdmin
      .from('housing_listings')
      .update({ coordinate_x: lon, coordinate_y: lat })
      .eq('id', listing.id);

    if (updateError) {
      console.log(`Error guardando "${listing.title}": ${updateError.message}`);
      skipped += 1;
    } else {
      console.log(`OK (${source}): "${listing.title}" -> (${lat.toFixed(5)}, ${lon.toFixed(5)})`);
      if (source === 'exacta') exact += 1;
      else approx += 1;
    }
  }

  console.log(`\nCompletado. ${exact} con direccion exacta, ${approx} aproximadas por barrio, ${skipped} omitidas.`);
}

run().catch((err) => {
  console.error('Fallo el backfill:', err.message);
  process.exit(1);
});
