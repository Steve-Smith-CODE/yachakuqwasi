import autocannon from 'autocannon';

const BASE_URL = process.env.LOAD_TEST_BASE_URL || 'http://localhost:5001';
const DURATION_S = Number(process.env.LOAD_TEST_DURATION_S) || 20;
const CONNECTIONS = Number(process.env.LOAD_TEST_CONNECTIONS) || 50;
const P99_THRESHOLD_MS = Number(process.env.LOAD_TEST_P99_MS) || 300;
const MAX_ERROR_RATE = Number(process.env.LOAD_TEST_MAX_ERROR_RATE) || 0.01;

// El explorador publico esta detras de apiLimiter (100 req/15min por IP por
// defecto, ver src/middlewares/rateLimiter.middleware.js). Autocannon pega
// desde una sola IP, asi que para medir capacidad real (no el rate limit)
// levanta el server para esta corrida con:
//   RATE_LIMIT_MAX_REQUESTS=100000 npm run dev
console.log(`Load test contra ${BASE_URL}`);
console.log('Si ves muchos 429, sube RATE_LIMIT_MAX_REQUESTS para esta corrida (ver comentario en scripts/load-test.js).\n');

async function findSampleListingId() {
  try {
    const res = await fetch(`${BASE_URL}/api/housings?limit=1`);
    if (!res.ok) return null;
    const listings = await res.json();
    return Array.isArray(listings) && listings[0] ? listings[0].id : null;
  } catch {
    return null;
  }
}

function runScenario(name, path) {
  return new Promise((resolve, reject) => {
    autocannon(
      {
        url: `${BASE_URL}${path}`,
        connections: CONNECTIONS,
        duration: DURATION_S,
        title: name
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
  });
}

function evaluate(name, result) {
  const failedRequests = result.errors + result.timeouts + result.non2xx;
  const errorRate = failedRequests / result.requests.sent;
  const p99 = result.latency.p99;
  const passed = p99 <= P99_THRESHOLD_MS && errorRate <= MAX_ERROR_RATE;

  console.log(`\n${passed ? 'PASS' : 'FAIL'} — ${name}`);
  console.log(`  req/s promedio: ${result.requests.average}`);
  console.log(`  latencia p50/p99: ${result.latency.p50}ms / ${p99}ms (umbral: ${P99_THRESHOLD_MS}ms)`);
  console.log(
    `  fallos: ${failedRequests}/${result.requests.sent} (${(errorRate * 100).toFixed(2)}%, umbral: ${(MAX_ERROR_RATE * 100).toFixed(2)}%)`
  );

  return passed;
}

async function main() {
  const sampleId = await findSampleListingId();

  const scenarios = [
    { name: 'GET /api/housings (explorador, sin filtros)', path: '/api/housings' },
    { name: 'GET /api/housings (filtrado)', path: '/api/housings?tipo=room&precio_max=500' }
  ];

  if (sampleId) {
    scenarios.push({ name: 'GET /api/housings/:id (detalle)', path: `/api/housings/${sampleId}` });
  } else {
    console.warn('No se encontro ninguna publicacion aprobada; se omite el escenario de detalle. Corre "npm run seed" primero.\n');
  }

  let allPassed = true;
  for (const scenario of scenarios) {
    const result = await runScenario(scenario.name, scenario.path);
    allPassed = evaluate(scenario.name, result) && allPassed;
  }

  if (!allPassed) {
    console.error('\nAlgun escenario supero el umbral. Revisa antes de desplegar.');
    process.exit(1);
  }

  console.log('\nTodos los escenarios dentro del umbral.');
}

main();
