const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Cuenta cuantos `items` (con created_at) caen en cada uno de los ultimos
// `days` dias, incluyendo hoy. Usado para graficar tendencias reales sin
// necesitar un endpoint nuevo en el backend (ya tenemos created_at de cada fila).
export function dailySeries(items, days, now = new Date()) {
  const todayStart = startOfDay(now);
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    buckets.push({ date: new Date(todayStart - i * DAY_MS), count: 0 });
  }

  const indexByTime = new Map(buckets.map((b, idx) => [b.date.getTime(), idx]));
  for (const item of items) {
    if (!item?.created_at) continue;
    const idx = indexByTime.get(startOfDay(item.created_at));
    if (idx !== undefined) buckets[idx].count += 1;
  }

  return buckets;
}

// Serie combinada usuarios/anuncios lista para un LineChart de recharts.
export function buildRegistrationTrend(users, housings, days = 14, now = new Date()) {
  const userSeries = dailySeries(users, days, now);
  const housingSeries = dailySeries(housings, days, now);

  return userSeries.map((bucket, idx) => ({
    date: bucket.date.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" }),
    usuarios: bucket.count,
    anuncios: housingSeries[idx]?.count ?? 0
  }));
}

// Compara los ultimos `days` dias contra los `days` dias anteriores para dar
// una variacion porcentual real (no inventada) para las KPI cards.
export function periodTrend(items, days, now = new Date()) {
  const todayStart = startOfDay(now);
  const currentStart = todayStart - (days - 1) * DAY_MS;
  const previousStart = currentStart - days * DAY_MS;

  let current = 0;
  let previous = 0;
  for (const item of items) {
    if (!item?.created_at) continue;
    const t = startOfDay(item.created_at);
    if (t >= currentStart) current += 1;
    else if (t >= previousStart) previous += 1;
  }

  if (previous === 0) {
    if (current === 0) return { direction: "flat", pct: 0 };
    return { direction: "up", pct: 100 };
  }

  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return { direction: "up", pct };
  if (pct < 0) return { direction: "down", pct: Math.abs(pct) };
  return { direction: "flat", pct: 0 };
}
