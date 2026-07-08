// Fotos de stock reales (Pexels, licencia libre de uso comercial) usadas como
// imagen por defecto cuando un arrendador aun no sube fotos propias del cuarto.
// Se agrupan por tipo de alojamiento para que el placeholder sea visualmente
// coherente con lo que se esta anunciando.
function pexelsUrl(id, width = 800) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
}

export const HOUSING_IMAGE_POOL = {
  room: [31488380, 37884161, 36099150, 6903157, 31488428, 30909593, 34574606].map((id) => pexelsUrl(id)),
  apartment: [19239905, 33537442, 6920439, 15409515, 30386991, 7546648].map((id) => pexelsUrl(id)),
  shared: [4781426, 5146884, 6382460, 13334679, 6382472, 8119915].map((id) => pexelsUrl(id)),
  family: [27467329, 5557735, 30580640, 30503925, 31406334, 31517287].map((id) => pexelsUrl(id))
};

export const DEFAULT_HOUSING_IMAGE = HOUSING_IMAGE_POOL.room[0];

function hashSeed(seed) {
  const str = String(seed ?? "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Elige imagenes de forma estable por listing (mismo id -> mismas fotos)
// en vez de aleatorio en cada render, rotando dentro del pool del tipo.
export function getPlaceholderImages(type, seed, count = 3) {
  const pool = HOUSING_IMAGE_POOL[type] || HOUSING_IMAGE_POOL.room;
  const start = hashSeed(seed) % pool.length;
  const total = Math.min(count, pool.length);
  return Array.from({ length: total }, (_, i) => pool[(start + i) % pool.length]);
}

export function getPlaceholderImage(type, seed) {
  return getPlaceholderImages(type, seed, 1)[0];
}
