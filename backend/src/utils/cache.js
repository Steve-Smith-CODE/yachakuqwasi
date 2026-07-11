// Cache TTL en memoria del proceso. Encaja con el despliegue actual (un solo
// proceso Node); si el backend llega a correr en varias instancias, esto deja
// de invalidar entre procesos y hay que migrar a Redis.
const store = new Map();
const MAX_ENTRIES = 500;

export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function cacheSet(key, value, ttlMs) {
  if (!store.has(key) && store.size >= MAX_ENTRIES) {
    store.delete(store.keys().next().value); // evict oldest (FIFO)
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheDeletePrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

// Cache-aside: si `fn` lanza (error de Supabase, etc.) no se cachea nada.
export async function withCache(key, ttlMs, fn) {
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;

  const value = await fn();
  cacheSet(key, value, ttlMs);
  return value;
}
