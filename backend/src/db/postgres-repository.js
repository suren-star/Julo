function mapUser(row) {
  return {
    id: row.id,
    usernameNormalized: row.username_normalized ?? null,
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

const TASK_FIELDS = `
  t.*,
  creator.display_name AS creator_name,
  creator.username_normalized AS creator_username,
  primary_user.display_name AS primary_assignee_name,
  primary_user.username_normalized AS primary_assignee_username,
  COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', assignee_user.id,
        'displayName', assignee_user.display_name,
        'username', assignee_user.username_normalized,
        'isPrimary', ta.is_primary
      )
      ORDER BY ta.is_primary DESC, assignee_user.display_name, assignee_user.id
    )
    FROM task_assignees ta
    JOIN users assignee_user ON assignee_user.id = ta.user_id
    WHERE ta.task_id = t.id
  ), '[]'::jsonb) AS assignees`;

export function createPostgresRepository(pool) {
  if (!pool || typeof pool.query !== 'function') throw new TypeError('A pg-compatible pool/queryable is required.');
  return {
    async ping() { const result = await pool.query('SELECT 1 AS ok'); return result.rows?.[0]?.ok === 1; },

    async createRegistration({ userId, usernameNormalized, emailNormalized, displayName, passwordHash, workspaceId, workspaceName }) {
      return withTransaction(pool, async (client) => {
        const userResult = await client.query(
          `INSERT INTO users (id, username_normalized, email_normalized, display_name) VALUES ($1,$2,$3,$4)
           RETURNING id, username_normalized, email_normalized, display_name, disabled_at`,
          [userId, usernameNormalized, emailNormalized, displayName],
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

    async findAuthUserByIdentifier(identifier, kind) {
      const column = kind === 'username' ? 'u.username_normalized' : 'u.email_normalized';
      const result = await pool.query(
        `SELECT u.id, u.username_normalized, u.email_normalized, u.display_name, u.disabled_at, c.password_hash
         FROM users u JOIN user_credentials c ON c.user_id = u.id
         WHERE ${column} = $1 LIMIT 1`,
        [identifier],
      );
      return result.rows[0] ? mapUser(result.rows[0]) : null;
    },

    async findAuthUserByEmail(emailNormalized) {
      return this.findAuthUserByIdentifier(emailNormalized, 'email');
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
                u.id, u.username_normalized, u.email_normalized, u.display_name, u.disabled_at
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

    async listWorkspacesForUser(userId) {
      const result = await pool.query(
        `SELECT w.id, w.name, wm.role, w.created_at, w.updated_at
         FROM workspace_memberships wm JOIN workspaces w ON w.id = wm.workspace_id
         WHERE wm.user_id = $1 AND wm.status = 'active'
         ORDER BY w.created_at, w.id`, [userId]);
      return result.rows;
    },

    async getWorkspaceMembership(workspaceId, userId) {
      const result = await pool.query(
        `SELECT workspace_id, user_id, role, status
         FROM workspace_memberships WHERE workspace_id = $1 AND user_id = $2 LIMIT 1`,
        [workspaceId, userId]);
      return result.rows[0] ?? null;
    },

    async getWorkspaceForMember(workspaceId, userId, role) {
      const result = await pool.query(
        `SELECT w.id, w.name, w.created_at, w.updated_at
         FROM workspaces w JOIN workspace_memberships wm ON wm.workspace_id = w.id
         WHERE w.id = $1 AND wm.user_id = $2 AND wm.status = 'active' LIMIT 1`,
        [workspaceId, userId]);
      const row = result.rows[0];
      return row ? { ...row, role } : null;
    },

    async getProject(workspaceId, projectId) {
      const result = await pool.query(
        `SELECT id, workspace_id, name, created_by, created_at, updated_at
         FROM projects WHERE workspace_id = $1 AND id = $2 AND archived_at IS NULL LIMIT 1`,
        [workspaceId, projectId]);
      return result.rows[0] ?? null;
    },

    async getProjectMembership(projectId, userId) {
      const result = await pool.query(
        `SELECT project_id, workspace_id, user_id, role
         FROM project_memberships WHERE project_id = $1 AND user_id = $2 LIMIT 1`,
        [projectId, userId]);
      return result.rows[0] ?? null;
    },

    async listProjectsForMember(workspaceId, userId, workspaceRole) {
      if (workspaceRole === 'guest') {
        const result = await pool.query(
          `SELECT p.id, p.workspace_id, p.name, p.created_at, p.updated_at, pm.role AS project_role
           FROM project_memberships pm JOIN projects p ON p.id = pm.project_id AND p.workspace_id = pm.workspace_id
           WHERE pm.workspace_id = $1 AND pm.user_id = $2 AND p.archived_at IS NULL
           ORDER BY p.created_at, p.id`, [workspaceId, userId]);
        return result.rows;
      }
      const result = await pool.query(
        `SELECT id, workspace_id, name, created_at, updated_at
         FROM projects WHERE workspace_id = $1 AND archived_at IS NULL ORDER BY created_at, id`, [workspaceId]);
      return result.rows;
    },

    async listEligibleTaskAssignees(workspaceId, projectId = null) {
      const result = await pool.query(
        `SELECT u.id, u.display_name, u.username_normalized, wm.role AS workspace_role, pm.role AS project_role
         FROM workspace_memberships wm
         JOIN users u ON u.id = wm.user_id
         LEFT JOIN project_memberships pm
           ON pm.workspace_id = wm.workspace_id
          AND pm.user_id = wm.user_id
          AND pm.project_id = $2::uuid
         WHERE wm.workspace_id = $1
           AND wm.status = 'active'
           AND u.disabled_at IS NULL
           AND (
             wm.role IN ('owner','admin','member')
             OR (wm.role = 'guest' AND $2::uuid IS NOT NULL AND pm.role IN ('manager','editor'))
           )
         ORDER BY CASE wm.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 WHEN 'member' THEN 3 ELSE 4 END,
                  u.display_name, u.id`,
        [workspaceId, projectId]);
      return result.rows;
    },

    async listTasksForMember(workspaceId, userId, workspaceRole) {
      if (workspaceRole === 'guest') {
        const result = await pool.query(
          `SELECT ${TASK_FIELDS}
           FROM tasks t
           JOIN users creator ON creator.id = t.created_by
           LEFT JOIN users primary_user ON primary_user.id = t.assignee_user_id
           JOIN project_memberships pm ON pm.project_id = t.project_id AND pm.workspace_id = t.workspace_id
           WHERE t.workspace_id = $1 AND pm.user_id = $2
           ORDER BY t.updated_at DESC, t.id`, [workspaceId, userId]);
        return result.rows;
      }
      const result = await pool.query(
        `SELECT ${TASK_FIELDS}
         FROM tasks t
         JOIN users creator ON creator.id = t.created_by
         LEFT JOIN users primary_user ON primary_user.id = t.assignee_user_id
         WHERE t.workspace_id = $1
         ORDER BY t.updated_at DESC, t.id`, [workspaceId]);
      return result.rows;
    },

    async createTask(input) {
      return withTransaction(pool, async (client) => {
        const result = await client.query(
          `INSERT INTO tasks (id, workspace_id, project_id, title, description, status, execution_type, due_date, priority, assignee_user_id, created_by, tags)
           VALUES ($1,$2,$3,$4,$5,'todo',$6,$7,$8,$9,$10,$11)
           RETURNING *`,
          [input.id, input.workspaceId, input.projectId, input.title, input.description, input.executionType, input.dueDate, input.priority, input.primaryAssigneeUserId ?? null, input.createdBy, input.tags ?? []]);
        for (const assigneeUserId of input.assigneeUserIds ?? []) {
          await client.query(
            `INSERT INTO task_assignees (task_id, workspace_id, user_id, assigned_by, is_primary)
             VALUES ($1,$2,$3,$4,$5)`,
            [input.id, input.workspaceId, assigneeUserId, input.createdBy, assigneeUserId === input.primaryAssigneeUserId]);
        }
        await client.query(
          `INSERT INTO task_timers (task_id, workspace_id, state, elapsed_ms) VALUES ($1,$2,'idle',0)`,
          [input.id, input.workspaceId]);
        await client.query(
          `INSERT INTO audit_events (workspace_id, actor_user_id, action, entity_type, entity_id, metadata)
           VALUES ($1,$2,'task.created','task',$3,$4::jsonb)`,
          [input.workspaceId, input.createdBy, input.id, JSON.stringify({ projectId: input.projectId, assigneeUserIds: input.assigneeUserIds ?? [], primaryAssigneeUserId: input.primaryAssigneeUserId ?? null })]);
        return { ...result.rows[0], assignees: input.assigneeUserIds ?? [] };
      });
    },
  };
}
