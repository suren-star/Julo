import { randomUUID } from 'node:crypto';
import { ACTIONS, PROJECT_ROLES, requireProjectPermission, requireWorkspacePermission } from '../domain/authorization.js';
import {
  assertExpectedVersion,
  assertId,
  assertTaskExecutionType,
  assertTaskPriority,
  cleanText,
  dateOnly,
  normalizeProjectId,
  normalizeTaskAssignees,
  serviceError,
} from '../domain/service-validation.js';
import { createAccessContext } from './access-context.js';

function noteInput(input) {
  return {
    title: cleanText(input?.title, { field: 'title', max: 500 }),
    description: cleanText(input?.description ?? '', { field: 'description', max: 20_000, required: false, trim: false }),
    reminderDate: dateOnly(input?.reminderDate, 'reminder_date'),
    label: cleanText(input?.label ?? '', { field: 'label', max: 200, required: false }),
  };
}

export function createProjectNotesService(repository) {
  if (!repository) throw new TypeError('repository is required');
  const access = createAccessContext(repository);

  async function assertAssigneeEligibility(workspaceId, projectId, assigneeUserIds) {
    const candidates = await repository.listEligibleTaskAssignees(workspaceId, projectId);
    const allowed = new Set(candidates.map((candidate) => candidate.id));
    if (assigneeUserIds.some((id) => !allowed.has(id))) {
      throw serviceError(400, 'ineligible_task_assignee', 'One or more selected users cannot be assigned to this task.');
    }
  }

  return {
    async createProject(userId, workspaceId, input) {
      const wid = assertId(workspaceId, 'workspace_id');
      const wm = await access.membership(userId, wid);
      requireWorkspacePermission(wm.role, ACTIONS.PROJECT_CREATE);
      return repository.createProject({
        id: randomUUID(),
        workspaceId: wid,
        name: cleanText(input?.name, { field: 'project_name', max: 200 }),
        actorUserId: userId,
      });
    },

    async renameProject(userId, workspaceId, projectId, input) {
      const wid = assertId(workspaceId, 'workspace_id');
      const pid = assertId(projectId, 'project_id');
      const wm = await access.membership(userId, wid);
      if (wm.role === 'guest') {
        const role = await access.guestProjectRole(userId, wid, pid);
        requireProjectPermission({ workspaceRole: wm.role, projectRole: role, action: ACTIONS.PROJECT_UPDATE });
      } else {
        requireWorkspacePermission(wm.role, ACTIONS.PROJECT_UPDATE);
      }
      const result = await repository.renameProject({
        workspaceId: wid,
        projectId: pid,
        name: cleanText(input?.name, { field: 'project_name', max: 200 }),
        actorUserId: userId,
      });
      if (!result) throw serviceError(404, 'project_not_found', 'Project not found.');
      return result;
    },

    async deleteProject(userId, workspaceId, projectId) {
      const wid = assertId(workspaceId, 'workspace_id');
      const pid = assertId(projectId, 'project_id');
      const wm = await access.membership(userId, wid);
      requireWorkspacePermission(wm.role, ACTIONS.PROJECT_DELETE);
      const result = await repository.archiveProject({ workspaceId: wid, projectId: pid, actorUserId: userId });
      if (!result) throw serviceError(404, 'project_not_found', 'Project not found.');
      return result;
    },

    async listWorkspaceMembers(userId, workspaceId) {
      const wid = assertId(workspaceId, 'workspace_id');
      const wm = await access.membership(userId, wid);
      requireWorkspacePermission(wm.role, ACTIONS.PROJECT_MEMBERS_MANAGE);
      return repository.listWorkspaceMembers(wid);
    },

    async listProjectMembers(userId, workspaceId, projectId) {
      const wid = assertId(workspaceId, 'workspace_id');
      const pid = assertId(projectId, 'project_id');
      const wm = await access.membership(userId, wid);
      requireWorkspacePermission(wm.role, ACTIONS.PROJECT_MEMBERS_MANAGE);
      await access.project(wid, pid);
      return repository.listProjectMembers(wid, pid);
    },

    async setProjectMember(userId, workspaceId, projectId, targetUserId, input) {
      const wid = assertId(workspaceId, 'workspace_id');
      const pid = assertId(projectId, 'project_id');
      const uid = assertId(targetUserId, 'user_id');
      const wm = await access.membership(userId, wid);
      requireWorkspacePermission(wm.role, ACTIONS.PROJECT_MEMBERS_MANAGE);
      if (!PROJECT_ROLES.includes(input?.role)) {
        throw serviceError(400, 'invalid_project_role', 'Project role is invalid.');
      }
      const result = await repository.setProjectMembership({
        workspaceId: wid,
        projectId: pid,
        userId: uid,
        role: input.role,
        actorUserId: userId,
      });
      if (result.kind === 'project_not_found') throw serviceError(404, 'project_not_found', 'Project not found.');
      if (result.kind === 'member_not_found') throw serviceError(404, 'member_not_found', 'Workspace member not found.');
      return result.membership;
    },

    async removeProjectMember(userId, workspaceId, projectId, targetUserId) {
      const wid = assertId(workspaceId, 'workspace_id');
      const pid = assertId(projectId, 'project_id');
      const uid = assertId(targetUserId, 'user_id');
      const wm = await access.membership(userId, wid);
      requireWorkspacePermission(wm.role, ACTIONS.PROJECT_MEMBERS_MANAGE);
      return Boolean(await repository.removeProjectMembership({
        workspaceId: wid,
        projectId: pid,
        userId: uid,
        actorUserId: userId,
      }));
    },

    async listNotes(userId, workspaceId) {
      const wid = assertId(workspaceId, 'workspace_id');
      const wm = await access.membership(userId, wid);
      requireWorkspacePermission(wm.role, ACTIONS.NOTE_READ);
      return repository.listNotes(wid);
    },

    async createNote(userId, workspaceId, input) {
      const wid = assertId(workspaceId, 'workspace_id');
      const wm = await access.membership(userId, wid);
      requireWorkspacePermission(wm.role, ACTIONS.NOTE_CREATE);
      return repository.createNote({ id: randomUUID(), workspaceId: wid, ...noteInput(input), actorUserId: userId });
    },

    async updateNote(userId, workspaceId, noteId, input) {
      const wid = assertId(workspaceId, 'workspace_id');
      const nid = assertId(noteId, 'note_id');
      const wm = await access.membership(userId, wid);
      requireWorkspacePermission(wm.role, ACTIONS.NOTE_UPDATE);
      const expectedVersion = assertExpectedVersion(input?.expectedVersion);
      const result = await repository.updateNote({
        workspaceId: wid,
        noteId: nid,
        expectedVersion,
        ...noteInput(input),
        actorUserId: userId,
      });
      if (result.kind === 'not_found') throw serviceError(404, 'note_not_found', 'Note not found.');
      if (result.kind === 'conflict') throw serviceError(409, 'note_version_conflict', 'Note has changed. Refresh and retry.');
      return result.note;
    },

    async deleteNote(userId, workspaceId, noteId) {
      const wid = assertId(workspaceId, 'workspace_id');
      const nid = assertId(noteId, 'note_id');
      const wm = await access.membership(userId, wid);
      requireWorkspacePermission(wm.role, ACTIONS.NOTE_DELETE);
      if (!await repository.deleteNote({ workspaceId: wid, noteId: nid, actorUserId: userId })) {
        throw serviceError(404, 'note_not_found', 'Note not found.');
      }
      return true;
    },

    async convertNote(userId, workspaceId, noteId, input) {
      const wid = assertId(workspaceId, 'workspace_id');
      const nid = assertId(noteId, 'note_id');
      const wm = await access.membership(userId, wid);
      requireWorkspacePermission(wm.role, ACTIONS.NOTE_CONVERT);
      requireWorkspacePermission(wm.role, ACTIONS.TASK_CREATE);

      const expectedVersion = assertExpectedVersion(input?.expectedVersion);
      const executionType = assertTaskExecutionType(input?.executionType, 'Execution type is required.');
      const dueDate = dateOnly(input?.dueDate, 'due_date');
      const priority = assertTaskPriority(input?.priority ?? 'normal');
      const projectId = normalizeProjectId(input?.projectId);
      const assignment = normalizeTaskAssignees(input);

      if (projectId) await access.project(wid, projectId);
      await assertAssigneeEligibility(wid, projectId, assignment.assigneeUserIds);

      const result = await repository.convertNoteToTask({
        workspaceId: wid,
        noteId: nid,
        expectedVersion,
        projectId,
        executionType,
        dueDate,
        priority,
        assigneeUserIds: assignment.assigneeUserIds,
        primaryAssigneeUserId: assignment.primaryAssigneeUserId,
        actorUserId: userId,
      });

      if (result.kind === 'not_found') throw serviceError(404, 'note_not_found', 'Note not found.');
      if (result.kind === 'conflict') throw serviceError(409, 'note_version_conflict', 'Note has changed. Refresh and retry.');
      if (result.kind === 'already_converted') throw serviceError(409, 'note_already_converted', 'Note was already converted to a task.');
      if (result.kind === 'project_not_found') throw serviceError(404, 'project_not_found', 'Project not found.');
      return { note: result.note, task: result.task };
    },
  };
}
