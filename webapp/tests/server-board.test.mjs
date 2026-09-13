import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canProjectAction,
  canReopenCompletedTask,
  canTaskAction,
  getTimerElapsedMs,
  normalizeServerTask,
  taskAssigneeDraft,
} from '../src/lib/server-board.js';

test('normalizes PostgreSQL task fields for the board', () => {
  const task = normalizeServerTask({
    id: 'task-1',
    project_id: 'project-1',
    execution_type: 'execute',
    due_date: '2026-09-13T00:00:00.000Z',
    version: '3',
    creator_name: 'Owner One',
    assignee_user_id: 'user-1',
    assignees: [{ id: 'user-1', displayName: 'Owner One', isPrimary: true }],
    timer: { state: 'running', elapsedMs: 5000, startedAt: '2026-09-13T10:00:00.000Z' },
    comments: [{ id: 'comment-1', text: 'ok' }],
    tags: ['alpha'],
  });
  assert.equal(task.projectId, 'project-1');
  assert.equal(task.executionType, 'execute');
  assert.equal(task.dueDate, '2026-09-13');
  assert.equal(task.version, 3);
  assert.equal(task.creatorName, 'Owner One');
  assert.deepEqual(taskAssigneeDraft(task), { assigneeUserIds: ['user-1'], primaryAssigneeUserId: 'user-1' });
  assert.equal(task.comments.length, 1);
});

test('mirrors server role boundaries for board controls', () => {
  assert.equal(canTaskAction('member', null, 'update'), true);
  assert.equal(canTaskAction('viewer', null, 'update'), false);
  assert.equal(canTaskAction('viewer', null, 'comment'), true);
  assert.equal(canTaskAction('guest', 'manager', 'update'), true);
  assert.equal(canTaskAction('guest', 'editor', 'timer'), true);
  assert.equal(canTaskAction('guest', 'viewer', 'update'), false);
  assert.equal(canTaskAction('guest', 'manager', 'comment'), false);
  assert.equal(canProjectAction('member', null, 'create'), true);
  assert.equal(canProjectAction('member', null, 'delete'), false);
  assert.equal(canProjectAction('guest', 'manager', 'update'), true);
  assert.equal(canReopenCompletedTask('admin'), true);
  assert.equal(canReopenCompletedTask('member'), false);
});

test('calculates running timer elapsed time from server state', () => {
  const startedAt = '2026-09-13T10:00:00.000Z';
  const now = Date.parse('2026-09-13T10:00:02.500Z');
  assert.equal(getTimerElapsedMs({ state: 'running', elapsedMs: 1000, startedAt }, now), 3500);
  assert.equal(getTimerElapsedMs({ state: 'paused', elapsedMs: 1000, startedAt }, now), 1000);
});
