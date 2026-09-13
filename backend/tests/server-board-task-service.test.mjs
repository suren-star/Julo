import test from 'node:test';
import assert from 'node:assert/strict';
import { createTaskCommandService } from '../src/services/task-command-service.js';

function contextRepository({ role = 'member', version = 2, overrides = {} } = {}) {
  const calls = [];
  const tx = {
    projectExists: async (projectId) => { calls.push(['projectExists', projectId]); return true; },
    projectRole: async () => null,
    listAssigneeIds: async () => ['user-0001'],
    validateAssignees: async (projectId, ids) => { calls.push(['validateAssignees', projectId, ids]); return []; },
    replaceAssignees: async () => {},
    completeTimer: async () => {},
    reopenTimer: async () => {},
    updateTask: async (changes, expectedVersion) => {
      calls.push(['updateTask', changes, expectedVersion]);
      return { id: 'task-0001', version: expectedVersion + 1, status: changes.status || 'todo', project_id: changes.projectId ?? 'project-0001', ...changes };
    },
    addComment: async (id, body) => {
      calls.push(['addComment', id, body]);
      return { id, body, text: body };
    },
    deleteTask: async (expectedVersion) => { calls.push(['deleteTask', expectedVersion]); return { id: 'task-0001', version: expectedVersion }; },
    pauseOtherRunningTimers: async () => {},
    startTimer: async () => ({ state: 'running' }),
    pauseTimer: async () => ({ state: 'paused' }),
    stopTimer: async () => ({ state: 'stopped' }),
    audit: async (action, metadata) => { calls.push(['audit', action, metadata]); },
    ...overrides,
  };
  const repository = {
    withTaskMutationContext: async (_input, callback) => callback({
      membership: { role, status: 'active' },
      task: { id: 'task-0001', version, status: 'todo', project_id: 'project-0001' },
      projectRole: null,
      timer: { state: 'idle' },
      tx,
    }),
  };
  return { repository, calls };
}

test('board edit can move project and persist tags while preserving assignee eligibility', async () => {
  const { repository, calls } = contextRepository();
  const service = createTaskCommandService(repository);
  const task = await service.updateTask('user-actor', 'workspace-1', 'task-0001', {
    expectedVersion: 2,
    projectId: 'project-0002',
    tags: ['alpha', 'alpha', 'beta'],
  });
  assert.equal(task.projectId, 'project-0002');
  assert.deepEqual(task.tags, ['alpha', 'beta']);
  assert.ok(calls.some(([name, projectId]) => name === 'projectExists' && projectId === 'project-0002'));
  assert.ok(calls.some(([name, projectId]) => name === 'validateAssignees' && projectId === 'project-0002'));
});

test('viewer may add a board comment but may not update a task', async () => {
  const { repository, calls } = contextRepository({ role: 'viewer' });
  const service = createTaskCommandService(repository);
  const comment = await service.addComment('user-viewer', 'workspace-1', 'task-0001', { body: '  hello  ' });
  assert.equal(comment.text, 'hello');
  assert.ok(calls.some(([name]) => name === 'addComment'));
  await assert.rejects(
    service.updateTask('user-viewer', 'workspace-1', 'task-0001', { expectedVersion: 2, status: 'doing' }),
    (error) => error.status === 403 && error.code === 'FORBIDDEN',
  );
});

test('board delete requires the loaded task version', async () => {
  const { repository, calls } = contextRepository({ version: 4 });
  const service = createTaskCommandService(repository);
  await assert.rejects(
    service.deleteTask('user-member', 'workspace-1', 'task-0001', { expectedVersion: 3 }),
    (error) => error.status === 409 && error.code === 'task_version_conflict',
  );
  await service.deleteTask('user-member', 'workspace-1', 'task-0001', { expectedVersion: 4 });
  assert.ok(calls.some(([name, version]) => name === 'deleteTask' && version === 4));
});
