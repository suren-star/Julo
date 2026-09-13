import { TEST_WORKSPACE_ID } from './test-users.js';

export async function resetTestWorkspaceTasks(pool, env = process.env) {
  if (env.NODE_ENV === 'production') throw new Error('Test task reset is disabled in production.');
  if (env.JULO_ALLOW_TEST_SEED !== '1') throw new Error('Set JULO_ALLOW_TEST_SEED=1 to reset test workspace tasks.');
  if (env.JULO_RESET_TEST_TASKS_ON_START !== '1') return { reset:false, deletedTaskCount:0 };
  if (!pool || typeof pool.connect !== 'function') throw new TypeError('A pg-compatible pool with connect() is required.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const deleted = await client.query(
      'DELETE FROM tasks WHERE workspace_id = $1 RETURNING id',
      [TEST_WORKSPACE_ID],
    );
    await client.query(
      `INSERT INTO audit_events (workspace_id, actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1,NULL,'testing.tasks.reset','workspace',$1,$2::jsonb)`,
      [TEST_WORKSPACE_ID, JSON.stringify({ deletedTaskCount: deleted.rowCount ?? deleted.rows?.length ?? 0 })],
    );
    await client.query('COMMIT');
    return { reset:true, deletedTaskCount: deleted.rowCount ?? deleted.rows?.length ?? 0 };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}
