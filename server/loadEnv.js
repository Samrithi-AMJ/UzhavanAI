// Minimal, dependency-free .env loader for the local backend.
// Runs as a side effect on import so it executes before any other module
// reads process.env (ES module imports execute in source order).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf-8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

// .env.local (if present) takes precedence over .env, matching common
// Vite/Node conventions — but never overrides a variable already set in
// the real process environment.
parseEnvFile(path.join(projectRoot, '.env.local'));
parseEnvFile(path.join(projectRoot, '.env'));

export function loadEnvFile() {
  // No-op: loading already happened above as an import side effect.
  // Exported so callers can express intent explicitly if desired.
}
