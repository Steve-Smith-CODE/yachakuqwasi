const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
const cache = new Map();

// Nominatim exige max. 1 req/segundo por IP y un User-Agent identificable.
// El cache es obligatorio, no opcional: sin el, un pico de publicaciones
// nuevas produce 429s.
export async function geocode(direccionCompleta) {
  const cached = cache.get(direccionCompleta);
  if (cached && Date.now() - cached.storedAt < CACHE_TTL_MS) {
    return cached.coords;
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', direccionCompleta);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  const response = await fetch(url, {
    headers: { 'User-Agent': process.env.NOMINATIM_USER_AGENT || 'yachakuqwasi-dev' }
  });

  if (!response.ok) {
    return null;
  }

  const results = await response.json();
  if (!results.length) {
    return null;
  }

  const coords = { lat: Number(results[0].lat), lon: Number(results[0].lon) };
  cache.set(direccionCompleta, { coords, storedAt: Date.now() });
  return coords;
}

export function clearGeocodeCache() {
  cache.clear();
}
