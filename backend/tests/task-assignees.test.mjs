import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorkspaceService } from '../src/services/workspace-service.js';
import { createTaskCommandService } from '../src/services/task-command-service.js';

const OWNER = 'user-owner-123';
const MEMBER = 'user-member-123';
const ADMIN = 'user-admin-1234';
const VIEWER = 'user-viewer-123';
const WORKSPACE = 'workspace-123';
const PROJECT = 'project-123';
const TASK = 'task-12345';

function createRepo() {
  const created = [];
  return {
    created,
    async getWorkspaceMembership() { return { workspace_id: WORKSPACE, user_id: OWNER, role: 'owner', status: 'active' }; },
    async getProject() { return { id: PROJECT, workspace_id: WORKSPACE }; },
    async listEligibleTaskAssignees() {
      return [
        { id: OWNER, workspace_role: 'owner' },
        { id: ADMIN, workspace_role: 'admin' },
        { id: MEMBER, workspace_role: 'member' },
      ];
    },
    async createTask(input) { created.push(input); return input; },
  };
}

test('task creation accepts multiple assignees and one selected primary assignee', async () => {
  const repo = createRepo();
  const service = createWorkspaceService(repo);
  const task = await service.createTask(OWNER, WORKSPACE, {
    title: 'Multi', executionType: 'execute', dueDate: '2026-09-20', projectId: PROJECT,
    assigneeUserIds: [MEMBER, ADMIN], primaryAssigneeUserId: MEMBER,
  });
  assert.deepEqual(task.assigneeUserIds, [MEMBER, ADMIN]);
  assert.equal(task.primaryAssigneeUserId, MEMBER);
  assert.equal(task.createdBy, OWNER);
});

test('task creation requires at least one assignee', async () => {
  const service = createWorkspaceService(createRepo());
  await assert.rejects(
    () => service.createTask(OWNER, WORKSPACE, {
      title: 'X', executionType: 'execute', dueDate: '2026-09-20', projectId: PROJECT,
      assigneeUserIds: [], primaryAssigneeUserId: '',
    }),
    (error) => error.code === 'assignee_required',
  );
});

test('primary assignee is required', async () => {
  const service = createWorkspaceService(createRepo());
  await assert.rejects(
    () => service.createTask(OWNER, WORKSPACE, {
      title: 'X', executionType: 'execute', dueDate: '2026-09-20', projectId: PROJECT,
      assigneeUserIds: [MEMBER],
    }),
    (error) => error.code === 'primary_assignee_required',
  );
});

test('primary assignee must be one of selected assignees', async () => {
  const service = createWorkspaceService(createRepo());
  await assert.rejects(
    () => service.createTask(OWNER, WORKSPACE, {
      title: 'X', executionType: 'execute', dueDate: '2026-09-20', projectId: PROJECT,
      assigneeUserIds: [MEMBER], primaryAssigneeUserId: ADMIN,
    }),
    (error) => error.code === 'primary_assignee_not_selected',
  );
});

test('ineligible viewer cannot be assigned as task performer', async () => {
  const service = createWorkspaceService(createRepo());
  await assert.rejects(
    () => service.createTask(OWNER, WORKSPACE, {
      title: 'X', executionType: 'execute', dueDate: '2026-09-20', projectId: PROJECT,
      assigneeUserIds: [VIEWER], primaryAssigneeUserId: VIEWER,
    }),
    (error) => error.code === 'ineligible_task_assignee',
  );
});

function taskCommandRepo(calls = []) {
  return {
    async withTaskMutationContext(input, callback) {
      assert.equal(input.taskId, TASK);
      return callback({
        membership: { role: 'owner', status: 'active' },
        task: { id: TASK, workspace_id: WORKSPACE, project_id: PROJECT, status: 'todo', version: 4 },
        projectRole: null,
        timer: { state: 'idle' },
        tx: {
          async validateAssignees(projectId, ids) { calls.push(['validate', projectId, ids]); return []; },
          async replaceAssignees(ids, primary, now) { calls.push(['replace', ids, primary, now instanceof Date]); },
          async updateTask(changes, version) { calls.push(['update', changes, version]); return { id: TASK, version: 5, status: 'todo' }; },
          async audit(action, metadata) { calls.push(['audit', action, metadata]); },
          async completeTimer() {}, async reopenTimer() {},
        },
      });
    },
  };
}

test('task edit replaces assignees transactionally and audits the change', async () => {
  const calls = [];
  const service = createTaskCommandService(taskCommandRepo(calls));
  const task = await service.updateTask(OWNER, WORKSPACE, TASK, {
    expectedVersion: 4,
    assigneeUserIds: [MEMBER, ADMIN],
    primaryAssigneeUserId: ADMIN,
  });
  assert.equal(task.primaryAssigneeUserId, ADMIN);
  assert.deepEqual(task.assigneeUserIds, [MEMBER, ADMIN]);
  assert.deepEqual(calls[0], ['validate', PROJECT, [MEMBER, ADMIN]]);
  assert.deepEqual(calls[1].slice(0,3), ['replace', [MEMBER,ADMIN], ADMIN]);
  assert.ok(calls.some((entry) => entry[0] === 'audit' && entry[1] === 'task.assignees.changed'));
});

test('task edit cannot clear all assignees', async () => {
  const service = createTaskCommandService(taskCommandRepo());
  await assert.rejects(
    () => service.updateTask(OWNER, WORKSPACE, TASK, {
      expectedVersion: 4,
      assigneeUserIds: [],
      primaryAssigneeUserId: '',
    }),
    (error) => error.code === 'assignee_required',
  );
});
