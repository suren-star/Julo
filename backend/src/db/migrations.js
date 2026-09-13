import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const MIGRATION_RE = /^\d{3,}_[a-z0-9_-]+\.sql$/i;
const ADVISORY_LOCK_ID = '749365127401';

function stripOuterTransaction(sql) {
  const trimmed = sql.trim();
  if (/^BEGIN;[\s\S]*COMMIT;$/i.test(trimmed)) {
    return trimmed.replace(/^BEGIN;\s*/i, '').replace(/\s*COMMIT;$/i, '');
  }
  return sql;
}

export async function runMigrations(pool, migrationsDir) {
  if (!pool || typeof pool.query !== 'function') throw new TypeError('A pg-compatible pool/queryable is required.');
  const names = (await readdir(migrationsDir)).filter((name) => MIGRATION_RE.test(name)).sort();
  const client = typeof pool.connect === 'function' ? await pool.connect() : pool;
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      sha256 char(64) NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    await client.query(`SELECT pg_advisory_lock(${ADVISORY_LOCK_ID}::bigint)`);
    const appliedResult = await client.query('SELECT name, sha256 FROM schema_migrations ORDER BY name');
    const applied = new Map(appliedResult.rows.map((row) => [row.name, row.sha256]));
    const newlyApplied = [];

    for (const name of names) {
      const sql = await readFile(path.join(migrationsDir, name), 'utf8');
      const sha256 = createHash('sha256').update(sql).digest('hex');
      if (applied.has(name)) {
        if (applied.get(name) !== sha256) throw new Error(`Applied migration changed: ${name}`);
        continue;
      }
      try {
        await client.query('BEGIN');
        await client.query(stripOuterTransaction(sql));
        await client.query('INSERT INTO schema_migrations (name, sha256) VALUES ($1,$2)', [name, sha256]);
        await client.query('COMMIT');
        newlyApplied.push(name);
      } catch (error) {
        try { await client.query('ROLLBACK'); } catch {}
        throw error;
      }
    }
    return newlyApplied;
  } finally {
    try { await client.query(`SELECT pg_advisory_unlock(${ADVISORY_LOCK_ID}::bigint)`); } finally {
      if (client !== pool && typeof client.release === 'function') client.release();
    }
  }
}
