import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACTIONS,
  canProject,
  canReopenCompletedTask,
  canWorkspace,
} from '../src/domain/authorization.js';
import { validateTaskStatusTransition } from '../src/domain/task-policy.js';

test('owner has wildcard workspace access', () => {
  assert.equal(canWorkspace('owner', ACTIONS.WORKSPACE_MEMBERS_MANAGE), true);
  assert.equal(canWorkspace('owner', ACTIONS.TASK_TIMER), true);
});

test('viewer can comment but cannot edit or control timers', () => {
  assert.equal(canWorkspace('viewer', ACTIONS.TASK_COMMENT), true);
  assert.equal(canWorkspace('viewer', ACTIONS.TASK_UPDATE), false);
  assert.equal(canWorkspace('viewer', ACTIONS.TASK_TIMER), false);
});

test('guest permissions come only from project role and never grant comments', () => {
  assert.equal(canProject({ workspaceRole: 'guest', projectRole: 'manager', action: ACTIONS.TASK_UPDATE }), true);
  assert.equal(canProject({ workspaceRole: 'guest', projectRole: 'editor', action: ACTIONS.TASK_TIMER }), true);
  assert.equal(canProject({ workspaceRole: 'guest', projectRole: 'viewer', action: ACTIONS.TASK_TIMER }), false);
  assert.equal(canProject({ workspaceRole: 'guest', projectRole: 'manager', action: ACTIONS.TASK_COMMENT }), false);
});

test('only owner/admin can reopen completed task to doing', () => {
  assert.equal(canReopenCompletedTask('owner'), true);
  assert.equal(canReopenCompletedTask('admin'), true);
  assert.equal(canReopenCompletedTask('member'), false);

  assert.deepEqual(
    validateTaskStatusTransition({ currentStatus: 'done', nextStatus: 'doing', workspaceRole: 'admin' }),
    { allowed: true, timerEffect: 'reopen_paused' },
  );
  assert.equal(
    validateTaskStatusTransition({ currentStatus: 'done', nextStatus: 'doing', workspaceRole: 'member' }).allowed,
    false,
  );
  assert.equal(
    validateTaskStatusTransition({ currentStatus: 'done', nextStatus: 'todo', workspaceRole: 'owner' }).allowed,
    false,
  );
});

test('completing a task requires timer stop semantics', () => {
  assert.deepEqual(
    validateTaskStatusTransition({ currentStatus: 'doing', nextStatus: 'done', workspaceRole: 'member' }),
    { allowed: true, timerEffect: 'stop_completed' },
  );
});
