import { supabaseAdmin } from '../../src/config/supabase.js';

const createdUserIds = [];

// El proyecto Supabase de test es real (no local), asi que createUser/deleteUser
// viajan por red de verdad. Bajo corridas largas (--runInBand, suite completa)
// se ven timeouts de conexion transitorios; reintentamos antes de dar por
// fallido un setup de test para no confundir flakiness de red con bugs reales.
async function withRetry(fn, { retries = 2, delayMs = 500 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  throw lastError;
}

export function uniqueEmail(prefix) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1000000)}@test.yachakuqwasi.local`;
}

export async function createRealUser({ role = 'student', name = 'Test User', password = 'TestPass123!', ...rest } = {}) {
  const email = uniqueEmail(role);
  const { data, error } = await withRetry(() =>
    supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, ...rest }
    })
  );
  if (error) throw error;
  createdUserIds.push(data.user.id);
  return { id: data.user.id, email, password, name, role };
}

export function trackUserForCleanup(id) {
  createdUserIds.push(id);
}

export async function cleanupCreatedUsers() {
  const ids = createdUserIds.splice(0, createdUserIds.length);
  for (const id of ids) {
    await withRetry(() => supabaseAdmin.auth.admin.deleteUser(id)).catch(() => {});
  }
}
