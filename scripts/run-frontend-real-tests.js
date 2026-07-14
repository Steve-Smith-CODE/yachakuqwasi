import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Reemplaza a start-server-and-test: esa herramienta mata el arbol de procesos
// via tree-kill, que en Windows depende de wmic.exe (removido en Windows 11
// 24H2+) y crashea en el cleanup, dejando el backend de test huerfano en el
// puerto. Aca el backend se spawnea directo (sin wrapper de npm/cmd de por
// medio) para poder apagarlo con un solo mensaje IPC, sin necesitar matar un
// arbol de procesos en ningun SO.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const backendDir = path.join(root, 'backend');
const frontendDir = path.join(root, 'frontend');

const PORT = process.env.TEST_SERVER_PORT || 5099;
const HEALTH_URL = `http://localhost:${PORT}/health`;

function npmCmd() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

async function waitForHealth(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(HEALTH_URL);
      if (res.ok) return;
    } catch {
      // el backend todavia no levanto, reintenta
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`El backend de test no respondio en ${HEALTH_URL} despues de ${timeoutMs}ms`);
}

async function shutdownServer(server) {
  if (server.exitCode !== null) return;
  await new Promise((resolve) => {
    server.once('exit', resolve);
    server.send('shutdown');
    setTimeout(() => {
      server.kill();
      resolve();
    }, 5000).unref();
  });
}

const server = spawn(process.execPath, ['scripts/serve-test.js'], {
  cwd: backendDir,
  stdio: ['inherit', 'inherit', 'inherit', 'ipc']
});

let exitCode = 1;
try {
  await waitForHealth();

  exitCode = await new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    const tests = isWin
      ? spawn(`${npmCmd()} run test:real`, { cwd: frontendDir, stdio: 'inherit', shell: true })
      : spawn(npmCmd(), ['run', 'test:real'], { cwd: frontendDir, stdio: 'inherit' });
    tests.on('exit', (code) => resolve(code ?? 1));
  });
} finally {
  await shutdownServer(server);
}

process.exit(exitCode);
