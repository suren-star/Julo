import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACTIONS,
  canManageProjectMember,
  canProject,
  canReopenCompletedTask,
  canWorkspace,
} from '../src/domain/authorization.js';
import { validateTaskStatusTransition } from '../src/domain/task-policy.js';

test('owner has wildcard workspace access', () => {
  assert.equal(canWorkspace('owner', ACTIONS.WORKSPACE_MEMBERS_MANAGE), true);
  assert.equal(canWorkspace('owner', ACTIONS.TASK_TIMER), true);
});

test('member can manage lower project-team roles but not workspace members', () => {
  assert.equal(canWorkspace('member', ACTIONS.PROJECT_MEMBERS_MANAGE), true);
  assert.equal(canWorkspace('member', ACTIONS.WORKSPACE_MEMBERS_MANAGE), false);
});

test('viewer can comment but cannot edit or control timers without a project role', () => {
  assert.equal(canWorkspace('viewer', ACTIONS.TASK_COMMENT), true);
  assert.equal(canWorkspace('viewer', ACTIONS.TASK_UPDATE), false);
  assert.equal(canWorkspace('viewer', ACTIONS.TASK_TIMER), false);
});

test('project roles add project-scoped capabilities to lower workspace roles', () => {
  assert.equal(canProject({ workspaceRole: 'viewer', projectRole: 'manager', action: ACTIONS.TASK_UPDATE }), true);
  assert.equal(canProject({ workspaceRole: 'viewer', projectRole: 'editor', action: ACTIONS.TASK_TIMER }), true);
  assert.equal(canProject({ workspaceRole: 'viewer', projectRole: 'viewer', action: ACTIONS.TASK_TIMER }), false);
  assert.equal(canProject({ workspaceRole: 'guest', projectRole: 'manager', action: ACTIONS.TASK_UPDATE }), true);
  assert.equal(canProject({ workspaceRole: 'guest', projectRole: 'manager', action: ACTIONS.TASK_COMMENT }), false);
});

test('project member assignment follows workspace role hierarchy', () => {
  assert.equal(canManageProjectMember('owner', 'admin'), true);
  assert.equal(canManageProjectMember('owner', 'guest'), true);
  assert.equal(canManageProjectMember('owner', 'owner'), false);

  assert.equal(canManageProjectMember('admin', 'member'), true);
  assert.equal(canManageProjectMember('admin', 'viewer'), true);
  assert.equal(canManageProjectMember('admin', 'guest'), true);
  assert.equal(canManageProjectMember('admin', 'admin'), false);
  assert.equal(canManageProjectMember('admin', 'owner'), false);

  assert.equal(canManageProjectMember('member', 'viewer'), true);
  assert.equal(canManageProjectMember('member', 'guest'), true);
  assert.equal(canManageProjectMember('member', 'member'), false);
  assert.equal(canManageProjectMember('member', 'admin'), false);

  assert.equal(canManageProjectMember('viewer', 'guest'), false);
  assert.equal(canManageProjectMember('guest', 'viewer'), false);
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
