import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5001';
const STUDENT_EMAIL = __ENV.TEST_STUDENT_EMAIL;
const STUDENT_PASSWORD = __ENV.TEST_STUDENT_PASSWORD;
const LANDLORD_EMAIL = __ENV.TEST_LANDLORD_EMAIL;
const LANDLORD_PASSWORD = __ENV.TEST_LANDLORD_PASSWORD;

const healthDuration = new Trend('health_duration');
const listingsDuration = new Trend('listings_duration');
const loginDuration = new Trend('login_duration');
const housingCreateDuration = new Trend('housing_create_duration');

export const options = {
  scenarios: {
    // Carga sostenida sobre endpoints de solo lectura, sin costo en Supabase Auth.
    health_checks: {
      executor: 'constant-vus',
      exec: 'healthChecks',
      vus: 15,
      duration: '20s'
    },
    public_listings: {
      executor: 'constant-vus',
      exec: 'publicListings',
      vus: 15,
      duration: '20s'
    },
    // VUs bajos a proposito: Supabase Auth (GoTrue) tiene rate-limit propio
    // para /token; una carga alta aqui solo mediria ese limite, no tu backend.
    auth_login: {
      executor: 'constant-vus',
      exec: 'authLogin',
      vus: 3,
      duration: '20s'
    },
    // Ruta de escritura real (INSERT en Supabase): iteraciones acotadas
    // para no dejar basura en la base de datos ni gastar cuota de escritura.
    publish_housing_smoke: {
      executor: 'shared-iterations',
      exec: 'publishHousingSmoke',
      vus: 1,
      iterations: 5,
      maxDuration: '30s'
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.05'],
    checks: ['rate>0.95'],
    health_duration: ['p(95)<300'],
    listings_duration: ['p(95)<600'],
    login_duration: ['p(95)<1200'],
    housing_create_duration: ['p(95)<1500']
  }
};

export function healthChecks() {
  const res = http.get(`${BASE_URL}/health`);
  healthDuration.add(res.timings.duration);
  check(res, {
    'health: status 200': (r) => r.status === 200,
    'health: body tiene status OK': (r) => r.json('status') === 'OK'
  });
  sleep(1);
}

export function publicListings() {
  const res = http.get(`${BASE_URL}/api/housings?tipo=room`);
  listingsDuration.add(res.timings.duration);
  check(res, {
    'listings: status 200': (r) => r.status === 200,
    'listings: responde un array': (r) => Array.isArray(r.json())
  });
  sleep(1);
}

export function authLogin() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: STUDENT_EMAIL, password: STUDENT_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  loginDuration.add(res.timings.duration);
  check(res, {
    'login: status 200': (r) => r.status === 200,
    'login: recibe token': (r) => !!r.json('token')
  });
  sleep(2);
}

export function publishHousingSmoke() {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: LANDLORD_EMAIL, password: LANDLORD_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  const token = loginRes.json('token');

  const res = http.post(
    `${BASE_URL}/api/housings`,
    JSON.stringify({
      title: `Carga k6 ${Date.now()}`,
      description: 'Publicacion generada por prueba de carga',
      pricePen: 250,
      distanceToUnschMinutes: 10,
      neighborhood: 'San Blas',
      address: 'Jr. Carga 1',
      contactPhone: '900000000',
      type: 'room'
    }),
    { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
  );
  housingCreateDuration.add(res.timings.duration);
  check(res, {
    'housing create: status 201': (r) => r.status === 201,
    'housing create: responde con id': (r) => !!r.json('id')
  });
  sleep(1);
}

export function handleSummary(data) {
  const m = data.metrics;
  const fmt = (ms) => (ms === undefined ? 'n/a' : `${ms.toFixed(1)}ms`);
  const pct = (r) => (r === undefined ? 'n/a' : `${(r * 100).toFixed(2)}%`);

  const lines = [];
  lines.push('');
  lines.push('================ RESUMEN DE PRUEBA DE CARGA (k6) ================');
  lines.push(`Duracion total del test: ${(data.state.testRunDurationMs / 1000).toFixed(1)}s`);
  lines.push(`Iteraciones totales: ${m.iterations.values.count}`);
  lines.push(`Requests HTTP totales: ${m.http_reqs.values.count} (${m.http_reqs.values.rate.toFixed(1)} req/s)`);
  lines.push('');
  lines.push('--- Latencia global (http_req_duration) ---');
  lines.push(`  avg: ${fmt(m.http_req_duration.values.avg)}  med: ${fmt(m.http_req_duration.values.med)}`);
  lines.push(
    `  p90: ${fmt(m.http_req_duration.values['p(90)'])}  p95: ${fmt(m.http_req_duration.values['p(95)'])}  max: ${fmt(m.http_req_duration.values.max)}`
  );
  lines.push('');
  lines.push('--- Latencia por endpoint ---');
  const endpoints = [
    ['health_duration', 'GET /health'],
    ['listings_duration', 'GET /api/housings'],
    ['login_duration', 'POST /api/auth/login'],
    ['housing_create_duration', 'POST /api/housings']
  ];
  for (const [name, label] of endpoints) {
    if (m[name]) {
      lines.push(`  ${label.padEnd(24)} avg=${fmt(m[name].values.avg)} p95=${fmt(m[name].values['p(95)'])} max=${fmt(m[name].values.max)}`);
    }
  }
  lines.push('');
  lines.push('--- Errores ---');
  lines.push(`  http_req_failed rate: ${pct(m.http_req_failed.values.rate)}`);
  lines.push(
    `  checks pasados: ${pct(m.checks.values.rate)} (${m.checks.values.passes}/${m.checks.values.passes + m.checks.values.fails})`
  );
  lines.push('');
  lines.push('--- Criterios de aceptacion (thresholds) ---');
  for (const [name, metric] of Object.entries(m)) {
    if (metric.thresholds) {
      for (const [thName, thResult] of Object.entries(metric.thresholds)) {
        lines.push(`  ${name} "${thName}": ${thResult.ok ? 'CUMPLE' : 'NO CUMPLE'}`);
      }
    }
  }
  lines.push('===================================================================');

  return {
    stdout: lines.join('\n'),
    'backend/loadtest/summary.json': JSON.stringify(data, null, 2)
  };
}
