import assert from 'node:assert/strict';
import test from 'node:test';
import { createProjectNotesService } from '../src/services/project-notes-service.js';

const ACTOR_ID = 'user-12345678';
const ASSIGNEE_ID = 'member-12345678';
const GUEST_ID = 'guest-12345678';
const WORKSPACE_ID = 'workspace-12345678';
const PROJECT_ID = 'project-12345678';
const NOTE_ID = 'note-12345678';

function repo(role = 'owner', { tasks = [] } = {}) {
  const calls = [];
  return {
    calls,
    async getWorkspaceMembership(_workspaceId, userId) {
      if (userId === GUEST_ID) return { role: 'guest', status: 'active' };
      if (userId === ASSIGNEE_ID) return { role: 'member', status: 'active' };
      return { role, status: 'active' };
    },
    async getProject() { return { id: PROJECT_ID }; },
    async getProjectMembership() { return { role: 'manager' }; },
    async listEligibleTaskAssignees(_workspaceId, projectId) {
      const base = [
        { id: ACTOR_ID, display_name: 'Actor' },
        { id: ASSIGNEE_ID, display_name: 'Member' },
      ];
      return projectId ? [...base, { id: GUEST_ID, display_name: 'Guest' }] : base;
    },
    async listTasksForMember() { return tasks; },
    async createProject(input) { calls.push(['createProject', input]); return input; },
    async renameProject(input) { calls.push(['renameProject', input]); return input; },
    async archiveProject() { calls.push(['archiveProject']); return { id: PROJECT_ID }; },
    async listWorkspaceMembers() { return []; },
    async listProjectMembers() { return []; },
    async setProjectMembership(input) {
      calls.push(['setProjectMembership', input]);
      return { kind: 'ok', membership: input };
    },
    async removeProjectMembership() { calls.push(['removeProjectMembership']); return { id: 'x' }; },
    async listNotes() { return []; },
    async createNote(input) { calls.push(['createNote', input]); return { ...input, version: 1 }; },
    async updateNote(input) { return { kind: 'ok', note: { ...input, version: input.expectedVersion + 1 } }; },
    async deleteNote() { return { id: NOTE_ID }; },
    async convertNoteToTask(input) {
      calls.push(['convert', input]);
      return { kind: 'ok', note: { id: input.noteId, status: 'converted' }, task: { id: 'task-12345678' } };
    },
  };
}

test('owner can create/rename projects and assign Guest project team members', async () => {
  const r = repo('owner');
  const service = createProjectNotesService(r);
  await service.createProject(ACTOR_ID, WORKSPACE_ID, { name: 'Նոր նախագիծ' });
  await service.renameProject(ACTOR_ID, WORKSPACE_ID, PROJECT_ID, { name: 'Վերանվանված' });
  await service.setProjectMember(ACTOR_ID, WORKSPACE_ID, PROJECT_ID, GUEST_ID, { role: 'editor' });
  assert.deepEqual(r.calls.map((call) => call[0]), ['createProject', 'renameProject', 'setProjectMembership']);
});

test('project roles cannot be assigned to non-Guest workspace members', async () => {
  const service = createProjectNotesService(repo('owner'));
  await assert.rejects(
    () => service.setProjectMember(ACTOR_ID, WORKSPACE_ID, PROJECT_ID, ASSIGNEE_ID, { role: 'editor' }),
    (error) => error.status === 400 && error.code === 'project_role_guest_only',
  );
});

test('assigned Guest cannot lose task access until project tasks are reassigned', async () => {
  const tasks = [{ id: 'task-1', project_id: PROJECT_ID, assignees: [{ id: GUEST_ID }] }];
  const service = createProjectNotesService(repo('owner', { tasks }));

  await assert.rejects(
    () => service.setProjectMember(ACTOR_ID, WORKSPACE_ID, PROJECT_ID, GUEST_ID, { role: 'viewer' }),
    (error) => error.status === 409 && error.code === 'project_member_has_task_assignments',
  );
  await assert.rejects(
    () => service.removeProjectMember(ACTOR_ID, WORKSPACE_ID, PROJECT_ID, GUEST_ID),
    (error) => error.status === 409 && error.code === 'project_member_has_task_assignments',
  );
});

test('project with scoped task assignees cannot be archived until tasks are reassigned', async () => {
  const tasks = [{ id: 'task-1', project_id: PROJECT_ID, assignees: [{ id: GUEST_ID }] }];
  const service = createProjectNotesService(repo('owner', { tasks }));
  await assert.rejects(
    () => service.deleteProject(ACTOR_ID, WORKSPACE_ID, PROJECT_ID),
    (error) => error.status === 409 && error.code === 'project_has_scoped_task_assignees',
  );
});

test('viewer reads notes but cannot create or convert them', async () => {
  const r = repo('viewer');
  const service = createProjectNotesService(r);
  assert.deepEqual(await service.listNotes(ACTOR_ID, WORKSPACE_ID), []);
  await assert.rejects(
    () => service.createNote(ACTOR_ID, WORKSPACE_ID, { title: 'X', reminderDate: '2026-09-14' }),
    (error) => error.status === 403,
  );
  await assert.rejects(
    () => service.convertNote(ACTOR_ID, WORKSPACE_ID, NOTE_ID, { expectedVersion: 1, executionType: 'execute', dueDate: '2026-09-14' }),
    (error) => error.status === 403,
  );
});

test('member converts reminder using the same required task assignment invariant', async () => {
  const r = repo('member');
  const service = createProjectNotesService(r);
  const note = await service.createNote(ACTOR_ID, WORKSPACE_ID, {
    title: 'Զանգահարել գործընկերոջը',
    description: 'Քննարկել փաստաթուղթը',
    reminderDate: '2026-09-14',
    label: 'Կարևոր',
  });
  assert.equal(note.title, 'Զանգահարել գործընկերոջը');

  const converted = await service.convertNote(ACTOR_ID, WORKSPACE_ID, NOTE_ID, {
    expectedVersion: 1,
    executionType: 'execute',
    dueDate: '2026-09-14',
    priority: 'normal',
    assigneeUserIds: [ASSIGNEE_ID, ACTOR_ID],
    primaryAssigneeUserId: ASSIGNEE_ID,
  });

  assert.equal(converted.task.id, 'task-12345678');
  const convertCall = r.calls.find(([name]) => name === 'convert')[1];
  assert.deepEqual(convertCall.assigneeUserIds, [ASSIGNEE_ID, ACTOR_ID]);
  assert.equal(convertCall.primaryAssigneeUserId, ASSIGNEE_ID);
});

test('note conversion cannot bypass task assignee requirements', async () => {
  const service = createProjectNotesService(repo('member'));
  await assert.rejects(
    () => service.convertNote(ACTOR_ID, WORKSPACE_ID, NOTE_ID, {
      expectedVersion: 1,
      executionType: 'execute',
      dueDate: '2026-09-14',
      priority: 'normal',
    }),
    (error) => error.status === 400 && error.code === 'assignee_required',
  );
});

test('guest has no workspace notes access', async () => {
  const service = createProjectNotesService(repo('guest'));
  await assert.rejects(
    () => service.listNotes(ACTOR_ID, WORKSPACE_ID),
    (error) => error.status === 403,
  );
});
