import { withTransaction } from './transaction.js';

function mapTimer(row) {
  if (!row) return null;
  return {
    taskId: row.task_id,
    workspaceId: row.workspace_id,
    state: row.state,
    elapsedMs: Number(row.elapsed_ms ?? 0),
    startedAt: row.started_at,
    stoppedAt: row.stopped_at,
    stopReason: row.stop_reason,
    updatedAt: row.updated_at,
  };
}

function taskMutationTools(client, { workspaceId, taskId, userId }) {
  return {
    async updateTask(changes, expectedVersion, now) {
      const columns = {
        title: 'title',
        description: 'description',
        executionType: 'execution_type',
        dueDate: 'due_date',
        priority: 'priority',
        status: 'status',
        projectId: 'project_id',
        tags: 'tags',
      };
      const values = [workspaceId, taskId, expectedVersion];
      const sets = [];

      for (const [key, value] of Object.entries(changes)) {
        const column = columns[key];
        if (!column) continue;
        values.push(value);
        sets.push(`${column} = $${values.length}`);
      }

      values.push(now);
      sets.push(`updated_at = $${values.length}`);
      sets.push('version = version + 1');

      const result = await client.query(
        `UPDATE tasks
         SET ${sets.join(', ')}
         WHERE workspace_id = $1 AND id = $2 AND version = $3
         RETURNING *`,
        values,
      );
      return result.rows[0] ?? null;
    },

    async projectExists(projectId) {
      if (!projectId) return true;
      const result = await client.query(
        `SELECT id
         FROM projects
         WHERE workspace_id = $1 AND id = $2 AND archived_at IS NULL
         LIMIT 1`,
        [workspaceId, projectId],
      );
      return Boolean(result.rows[0]);
    },

    async projectRole(projectId) {
      if (!projectId) return null;
      const result = await client.query(
        `SELECT role
         FROM project_memberships
         WHERE workspace_id = $1 AND project_id = $2 AND user_id = $3
         LIMIT 1`,
        [workspaceId, projectId, userId],
      );
      return result.rows[0]?.role ?? null;
    },

    async listAssigneeIds() {
      const result = await client.query(
        `SELECT user_id
         FROM task_assignees
         WHERE task_id = $1
         ORDER BY is_primary DESC, user_id`,
        [taskId],
      );
      return result.rows.map((row) => row.user_id);
    },

    async validateAssignees(projectId, assigneeUserIds) {
      if (!assigneeUserIds.length) return [];
      const result = await client.query(
        `SELECT wm.user_id
         FROM workspace_memberships wm
         LEFT JOIN project_memberships pm
           ON pm.workspace_id = wm.workspace_id
          AND pm.user_id = wm.user_id
          AND pm.project_id = $2::uuid
         JOIN users u ON u.id = wm.user_id
         WHERE wm.workspace_id = $1
           AND wm.user_id = ANY($3::uuid[])
           AND wm.status = 'active'
           AND u.disabled_at IS NULL
           AND (
             wm.role IN ('owner','admin','member')
             OR ($2::uuid IS NOT NULL AND pm.role IN ('manager','editor'))
           )`,
        [workspaceId, projectId, assigneeUserIds],
      );
      const eligible = new Set(result.rows.map((row) => row.user_id));
      return assigneeUserIds.filter((id) => !eligible.has(id));
    },

    async replaceAssignees(assigneeUserIds, primaryAssigneeUserId, now) {
      await client.query('DELETE FROM task_assignees WHERE task_id = $1', [taskId]);
      for (const assigneeUserId of assigneeUserIds) {
        await client.query(
          `INSERT INTO task_assignees (
             task_id, workspace_id, user_id, assigned_by, is_primary, created_at, updated_at
           )
           VALUES ($1,$2,$3,$4,$5,$6,$6)`,
          [taskId, workspaceId, assigneeUserId, userId, assigneeUserId === primaryAssigneeUserId, now],
        );
      }
      await client.query(
        'UPDATE tasks SET assignee_user_id = $3 WHERE workspace_id = $1 AND id = $2',
        [workspaceId, taskId, primaryAssigneeUserId],
      );
    },

    async addComment(commentId, body, now) {
      const result = await client.query(
        `INSERT INTO task_comments (id, workspace_id, task_id, author_user_id, body, created_at)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id, author_user_id, body, created_at, edited_at`,
        [commentId, workspaceId, taskId, userId, body, now],
      );
      await client.query(
        `UPDATE tasks SET updated_at = $3 WHERE workspace_id = $1 AND id = $2`,
        [workspaceId, taskId, now],
      );
      const author = await client.query('SELECT display_name FROM users WHERE id = $1', [userId]);
      const row = result.rows[0];
      return {
        id: row.id,
        authorId: row.author_user_id,
        authorName: author.rows[0]?.display_name ?? 'User',
        text: row.body,
        createdAt: row.created_at,
        editedAt: row.edited_at,
      };
    },

    async deleteTask(expectedVersion) {
      const result = await client.query(
        `DELETE FROM tasks
         WHERE workspace_id = $1 AND id = $2 AND version = $3
         RETURNING id, version`,
        [workspaceId, taskId, expectedVersion],
      );
      return result.rows[0] ?? null;
    },

    async pauseOtherRunningTimers(now) {
      await client.query(
        `UPDATE task_timers
         SET elapsed_ms = elapsed_ms + GREATEST(
               0,
               FLOOR(EXTRACT(EPOCH FROM ($3::timestamptz - started_at)) * 1000)
             )::bigint,
             state = 'paused',
             started_at = NULL,
             updated_at = $3
         WHERE workspace_id = $1
           AND task_id <> $2
           AND state = 'running'`,
        [workspaceId, taskId, now],
      );
    },

    async startTimer(now) {
      const result = await client.query(
        `INSERT INTO task_timers (
           task_id, workspace_id, state, elapsed_ms, started_at, stopped_at, stop_reason, updated_at
         )
         VALUES ($1,$2,'running',0,$3,NULL,NULL,$3)
         ON CONFLICT (task_id) DO UPDATE
         SET state = 'running',
             started_at = EXCLUDED.started_at,
             stopped_at = NULL,
             stop_reason = NULL,
             updated_at = EXCLUDED.updated_at
         WHERE task_timers.state IN ('idle','paused')
         RETURNING *`,
        [taskId, workspaceId, now],
      );
      return mapTimer(result.rows[0]);
    },

    async pauseTimer(now) {
      const result = await client.query(
        `UPDATE task_timers
         SET elapsed_ms = elapsed_ms + GREATEST(
               0,
               FLOOR(EXTRACT(EPOCH FROM ($3::timestamptz - started_at)) * 1000)
             )::bigint,
             state = 'paused',
             started_at = NULL,
             updated_at = $3
         WHERE workspace_id = $1
           AND task_id = $2
           AND state = 'running'
         RETURNING *`,
        [workspaceId, taskId, now],
      );
      return mapTimer(result.rows[0]);
    },

    async stopTimer(now, reason) {
      const result = await client.query(
        `UPDATE task_timers
         SET elapsed_ms = elapsed_ms + CASE
               WHEN state = 'running'
               THEN GREATEST(0, FLOOR(EXTRACT(EPOCH FROM ($3::timestamptz - started_at)) * 1000))::bigint
               ELSE 0
             END,
             state = 'stopped',
             started_at = NULL,
             stopped_at = $3,
             stop_reason = $4,
             updated_at = $3
         WHERE workspace_id = $1
           AND task_id = $2
           AND state IN ('running','paused')
         RETURNING *`,
        [workspaceId, taskId, now, reason],
      );
      return mapTimer(result.rows[0]);
    },

    async completeTimer(now) {
      const existing = await client.query(
        `SELECT *
         FROM task_timers
         WHERE workspace_id = $1 AND task_id = $2
         FOR UPDATE`,
        [workspaceId, taskId],
      );
      const timer = existing.rows[0];
      if (timer?.state === 'stopped' && timer.stop_reason === 'manual') return mapTimer(timer);

      if (!timer) {
        const inserted = await client.query(
          `INSERT INTO task_timers (
             task_id, workspace_id, state, elapsed_ms, stopped_at, stop_reason, updated_at
           )
           VALUES ($1,$2,'stopped',0,$3,'completed',$3)
           RETURNING *`,
          [taskId, workspaceId, now],
        );
        return mapTimer(inserted.rows[0]);
      }

      const result = await client.query(
        `UPDATE task_timers
         SET elapsed_ms = elapsed_ms + CASE
               WHEN state = 'running'
               THEN GREATEST(0, FLOOR(EXTRACT(EPOCH FROM ($3::timestamptz - started_at)) * 1000))::bigint
               ELSE 0
             END,
             state = 'stopped',
             started_at = NULL,
             stopped_at = $3,
             stop_reason = 'completed',
             updated_at = $3
         WHERE workspace_id = $1 AND task_id = $2
         RETURNING *`,
        [workspaceId, taskId, now],
      );
      return mapTimer(result.rows[0]);
    },

    async reopenTimer(now) {
      const result = await client.query(
        `INSERT INTO task_timers (
           task_id, workspace_id, state, elapsed_ms, started_at, stopped_at, stop_reason, updated_at
         )
         VALUES ($1,$2,'paused',0,NULL,NULL,NULL,$3)
         ON CONFLICT (task_id) DO UPDATE
         SET elapsed_ms = task_timers.elapsed_ms + CASE
               WHEN task_timers.state = 'running'
               THEN GREATEST(0, FLOOR(EXTRACT(EPOCH FROM ($3::timestamptz - task_timers.started_at)) * 1000))::bigint
               ELSE 0
             END,
             state = 'paused',
             started_at = NULL,
             stopped_at = NULL,
             stop_reason = NULL,
             updated_at = $3
         RETURNING *`,
        [taskId, workspaceId, now],
      );
      return mapTimer(result.rows[0]);
    },

    async audit(action, metadata = {}) {
      await client.query(
        `INSERT INTO audit_events (workspace_id, actor_user_id, action, entity_type, entity_id, metadata)
         VALUES ($1,$2,$3,'task',$4,$5::jsonb)`,
        [workspaceId, userId, action, taskId, JSON.stringify(metadata)],
      );
    },
  };
}

export function createPostgresTaskCommandRepository(pool) {
  if (!pool || typeof pool.query !== 'function') {
    throw new TypeError('A pg-compatible pool/queryable is required.');
  }

  return {
    async withTaskMutationContext({ userId, workspaceId, taskId }, callback) {
      return withTransaction(pool, async (client) => {
        const workspaceLock = await client.query(
          'SELECT id FROM workspaces WHERE id = $1 FOR UPDATE',
          [workspaceId],
        );
        const tx = taskMutationTools(client, { workspaceId, taskId, userId });
        if (!workspaceLock.rows[0]) {
          return callback({ membership: null, task: null, projectRole: null, timer: null, tx });
        }

        const membershipResult = await client.query(
          `SELECT workspace_id, user_id, role, status
           FROM workspace_memberships
           WHERE workspace_id = $1 AND user_id = $2
           FOR SHARE`,
          [workspaceId, userId],
        );
        const membership = membershipResult.rows[0] ?? null;
        if (!membership || membership.status !== 'active') {
          return callback({ membership, task: null, projectRole: null, timer: null, tx });
        }

        const taskResult = await client.query(
          `SELECT *
           FROM tasks
           WHERE workspace_id = $1 AND id = $2
           FOR UPDATE`,
          [workspaceId, taskId],
        );
        const task = taskResult.rows[0] ?? null;

        let projectRole = null;
        if (task?.project_id) {
          const projectMembership = await client.query(
            `SELECT role
             FROM project_memberships
             WHERE workspace_id = $1 AND project_id = $2 AND user_id = $3
             FOR SHARE`,
            [workspaceId, task.project_id, userId],
          );
          projectRole = projectMembership.rows[0]?.role ?? null;
        }

        let timer = null;
        if (task) {
          const timerResult = await client.query(
            `SELECT *
             FROM task_timers
             WHERE workspace_id = $1 AND task_id = $2
             FOR UPDATE`,
            [workspaceId, taskId],
          );
          timer = mapTimer(timerResult.rows[0]);
        }

        return callback({ membership, task, projectRole, timer, tx });
      });
    },
  };
}
