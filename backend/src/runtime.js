import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJuloBackend } from './app.js';
import { runMigrations } from './db/migrations.js';
import { seedRequestedTestUsers } from './testing/test-users.js';

function requiredEnv(name) {
  const value = String(process.env[name] ?? '').trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function parsePort(value) {
  const port = Number(value || 10000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT is invalid.');
  return port;
}

function parseOrigins(value) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((origin) => new URL(origin).origin);
}

async function main() {
  const databaseUrl = requiredEnv('DATABASE_URL');
  const port = parsePort(process.env.PORT);
  const allowedOrigins = parseOrigins(process.env.JULO_ALLOWED_ORIGINS);
  if (!allowedOrigins.length) throw new Error('JULO_ALLOWED_ORIGINS must include at least one browser origin.');

  const pgModule = await import('pg');
  const Pool = pgModule.Pool ?? pgModule.default?.Pool;
  if (typeof Pool !== 'function') throw new Error('PostgreSQL Pool constructor is unavailable.');
  const pool = new Pool({
    connectionString: databaseUrl,
    max: Number(process.env.JULO_DB_POOL_MAX || 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: process.env.JULO_DB_SSL === 'require' ? { rejectUnauthorized: false } : undefined,
  });

  const root = path.dirname(fileURLToPath(import.meta.url));
  if (process.env.JULO_RUN_MIGRATIONS !== '0') {
    const applied = await runMigrations(pool, path.resolve(root, '../db/migrations'));
    if (applied.length) console.log(`Applied migrations: ${applied.join(', ')}`);
  }

  const backend = createJuloBackend({
    pool,
    secureCookies: true,
    crossSiteCookies: process.env.JULO_CROSS_SITE_COOKIES === '1',
    allowedOrigins,
  });

  if (process.env.JULO_SEED_TEST_USERS === '1') {
    const result = await seedRequestedTestUsers(backend.repository, process.env);
    console.log(`Test users seeded in workspace ${result.workspaceId || 'Julo Test Workspace'}.`);
  }

  await new Promise((resolve, reject) => {
    backend.server.once('error', reject);
    backend.server.listen(port, '0.0.0.0', () => {
      backend.server.off('error', reject);
      console.log(`Julo backend listening on 0.0.0.0:${port}`);
      resolve();
    });
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received; shutting down.`);
    backend.server.close(async () => {
      try { await pool.end(); } finally { process.exit(0); }
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  console.error('Julo backend startup failed:', error);
  process.exit(1);
});
