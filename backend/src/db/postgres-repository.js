function mapUser(row) {
  return {
    id: row.id,
    emailNormalized: row.email_normalized,
    displayName: row.display_name,
    disabledAt: row.disabled_at,
    passwordHash: row.password_hash,
  };
}

async function withTransaction(pool, callback) {
  const client = typeof pool.connect === 'function' ? await pool.connect() : pool;
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    if (client !== pool && typeof client.release === 'function') client.release();
  }
}

export function createPostgresRepository(pool) {
  if (!pool || typeof pool.query !== 'function') throw new TypeError('A pg-compatible pool/queryable is required.');
  return {
    async ping() { const result = await pool.query('SELECT 1 AS ok'); return result.rows?.[0]?.ok === 1; },

    async createRegistration({ userId, emailNormalized, displayName, passwordHash, workspaceId, workspaceName }) {
      return withTransaction(pool, async (client) => {
        const userResult = await client.query(
          `INSERT INTO users (id, email_normalized, display_name) VALUES ($1,$2,$3)
           RETURNING id, email_normalized, display_name, disabled_at`,
          [userId, emailNormalized, displayName],
        );
        await client.query('INSERT INTO user_credentials (user_id, password_hash) VALUES ($1,$2)', [userId, passwordHash]);
        const workspaceResult = await client.query(
          'INSERT INTO workspaces (id, name, created_by) VALUES ($1,$2,$3) RETURNING id, name, created_at',
          [workspaceId, workspaceName, userId],
        );
        await client.query(
          `INSERT INTO workspace_memberships (workspace_id, user_id, role, status)
           VALUES ($1,$2,'owner','active')`,
          [workspaceId, userId],
        );
        return { user: mapUser(userResult.rows[0]), workspace: workspaceResult.rows[0] };
      });
    },

    async findAuthUserByEmail(emailNormalized) {
      const result = await pool.query(
        `SELECT u.id, u.email_normalized, u.display_name, u.disabled_at, c.password_hash
         FROM users u JOIN user_credentials c ON c.user_id = u.id
         WHERE u.email_normalized = $1 LIMIT 1`,
        [emailNormalized],
      );
      return result.rows[0] ? mapUser(result.rows[0]) : null;
    },

    async createSession({ id, userId, tokenHash, expiresAt }) {
      await pool.query(
        'INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES ($1,$2,$3,$4)',
        [id, userId, tokenHash, expiresAt],
      );
    },

    async findActiveSessionByTokenHash(tokenHash, at) {
      const result = await pool.query(
        `SELECT s.id AS session_id, s.expires_at,
                u.id, u.email_normalized, u.display_name, u.disabled_at
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > $2 AND u.disabled_at IS NULL
         LIMIT 1`,
        [tokenHash, at],
      );
      const row = result.rows[0];
      if (!row) return null;
      return { id: row.session_id, expiresAt: row.expires_at, user: mapUser(row) };
    },

    async touchSession(sessionId, at) {
      await pool.query('UPDATE sessions SET last_seen_at = $2 WHERE id = $1 AND revoked_at IS NULL', [sessionId, at]);
    },

    async revokeSessionByTokenHash(tokenHash, at) {
      await pool.query('UPDATE sessions SET revoked_at = COALESCE(revoked_at, $2) WHERE token_hash = $1', [tokenHash, at]);
    },
  };
}
