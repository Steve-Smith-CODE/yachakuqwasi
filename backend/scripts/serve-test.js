import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';

// Arranca el backend real (Express + Supabase de test) en un puerto propio
// para que los tests del frontend (Vitest) le peguen por HTTP de verdad, sin
// mockear fetch. Distinto de src/server.js: ese se salta app.listen() cuando
// NODE_ENV=test porque Jest habla con `app` directo via supertest.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.test') });

const { default: app } = await import('../src/app.js');
const { supabaseAdmin } = await import('../src/config/supabase.js');

const PORT = process.env.TEST_SERVER_PORT || 5099;

// Prefijo usado por los tests reales del frontend (ver frontend/src/context/AuthContext.real.test.jsx)
// para poder barrer solo SUS usuarios al apagar, sin tocar usuarios que la
// suite de Jest del backend haya creado en paralelo en el mismo proyecto.
const CLEANUP_EMAIL_PREFIX = 'frontend-realtest.';

async function cleanupFrontendTestUsers() {
  let page = 1;
  for (;;) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
    if (error || data.users.length === 0) break;

    const toDelete = data.users.filter((user) => user.email?.startsWith(CLEANUP_EMAIL_PREFIX));
    await Promise.all(toDelete.map((user) => supabaseAdmin.auth.admin.deleteUser(user.id).catch(() => {})));

    if (data.users.length < 100) break;
    page++;
  }
}

const server = app.listen(PORT, () => {
  console.log(`Backend de test (real, Supabase de prueba) escuchando en http://localhost:${PORT}`);
});

function shutdown() {
  server.close(() => {
    cleanupFrontendTestUsers().finally(() => process.exit(0));
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// En Windows, Node no emula SIGTERM de forma confiable entre procesos padre-hijo
// (child.kill() ahi termina el proceso a la fuerza sin disparar el handler de
// arriba), asi que el orquestador (scripts/run-frontend-real-tests.js) pide el
// apagado gracioso por IPC en vez de depender del signal.
process.on('message', (msg) => {
  if (msg === 'shutdown') shutdown();
});
