import { randomUUID } from 'node:crypto';
import { ACTIONS, requireProjectPermission, requireWorkspacePermission } from '../domain/authorization.js';

const EXECUTION_TYPES = new Set(['review_report','execute','prepare_letter','organize_meeting','prepare_documents','acknowledge']);
const PRIORITIES = new Set(['low','normal','high']);

function serviceError(status, code, message) {
  const error = new Error(message); error.status = status; error.code = code; return error;
}

function assertUuidish(value, field) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 80) throw serviceError(400, `invalid_${field}`, `${field} is invalid.`);
  return value;
}

function normalizeAssignees(input) {
  const raw = input?.assigneeUserIds ?? [];
  if (!Array.isArray(raw)) throw serviceError(400, 'invalid_assignees', 'assigneeUserIds must be an array.');
  if (raw.length > 100) throw serviceError(400, 'too_many_assignees', 'Too many task assignees.');
  const assigneeUserIds = [...new Set(raw.map((id) => assertUuidish(id, 'assignee_user_id')))];
  const primaryAssigneeUserId = input?.primaryAssigneeUserId == null || input.primaryAssigneeUserId === ''
    ? null
    : assertUuidish(input.primaryAssigneeUserId, 'primary_assignee_user_id');
  if (assigneeUserIds.length === 0 && primaryAssigneeUserId) {
    throw serviceError(400, 'primary_assignee_without_assignees', 'Primary assignee requires at least one assignee.');
  }
  if (assigneeUserIds.length > 0 && !primaryAssigneeUserId) {
    throw serviceError(400, 'primary_assignee_required', 'A primary assignee is required when task assignees are selected.');
  }
  if (primaryAssigneeUserId && !assigneeUserIds.includes(primaryAssigneeUserId)) {
    throw serviceError(400, 'primary_assignee_not_selected', 'Primary assignee must be one of the selected assignees.');
  }
  return { assigneeUserIds, primaryAssigneeUserId };
}

function validateNewTask(input) {
  const title = typeof input?.title === 'string' ? input.title.trim() : '';
  if (!title || title.length > 500) throw serviceError(400, 'invalid_title', 'Task title is required.');
  if (!EXECUTION_TYPES.has(input?.executionType)) throw serviceError(400, 'invalid_execution_type', 'Execution type is required.');
  if (typeof input?.dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)) throw serviceError(400, 'invalid_due_date', 'Due date is required.');
  const description = typeof input?.description === 'string' ? input.description : '';
  if (description.length > 20_000) throw serviceError(400, 'invalid_description', 'Description is too long.');
  const priority = input?.priority ?? 'normal';
  if (!PRIORITIES.has(priority)) throw serviceError(400, 'invalid_priority', 'Priority is invalid.');
  return { title, description, executionType: input.executionType, dueDate: input.dueDate, priority, projectId: input?.projectId ?? null, ...normalizeAssignees(input) };
}

export function createWorkspaceService(repository) {
  async function getMembership(userId, workspaceId) {
    const membership = await repository.getWorkspaceMembership(workspaceId, userId);
    if (!membership || membership.status !== 'active') throw serviceError(404, 'workspace_not_found', 'Workspace not found.');
    return membership;
  }

  async function projectRoleForGuest(userId, workspaceId, projectId) {
    if (!projectId) throw serviceError(403, 'project_access_required', 'Guest access requires a project.');
    const project = await repository.getProject(workspaceId, projectId);
    if (!project) throw serviceError(404, 'project_not_found', 'Project not found.');
    const membership = await repository.getProjectMembership(projectId, userId);
    return membership?.role ?? null;
  }

  async function assertAssigneeEligibility(workspaceId, projectId, assigneeUserIds) {
    if (!assigneeUserIds.length) return;
    const candidates = await repository.listEligibleTaskAssignees(workspaceId, projectId);
    const allowed = new Set(candidates.map((candidate) => candidate.id));
    const invalid = assigneeUserIds.filter((id) => !allowed.has(id));
    if (invalid.length) throw serviceError(400, 'ineligible_task_assignee', 'One or more selected users cannot be assigned to this task.');
  }

  return {
    async listWorkspaces(userId) {
      return repository.listWorkspacesForUser(userId);
    },

    async getWorkspace(userId, workspaceId) {
      const membership = await getMembership(userId, assertUuidish(workspaceId, 'workspace_id'));
      return repository.getWorkspaceForMember(workspaceId, userId, membership.role);
    },

    async listProjects(userId, workspaceId) {
      const membership = await getMembership(userId, assertUuidish(workspaceId, 'workspace_id'));
      return repository.listProjectsForMember(workspaceId, userId, membership.role);
    },

    async listTasks(userId, workspaceId) {
      const membership = await getMembership(userId, assertUuidish(workspaceId, 'workspace_id'));
      requireProjectPermission({ workspaceRole: membership.role, projectRole: membership.role === 'guest' ? 'viewer' : null, action: ACTIONS.TASK_READ });
      return repository.listTasksForMember(workspaceId, userId, membership.role);
    },

    async listTaskAssigneeCandidates(userId, workspaceId, projectId = null) {
      const safeWorkspaceId = assertUuidish(workspaceId, 'workspace_id');
      const membership = await getMembership(userId, safeWorkspaceId);
      const safeProjectId = projectId == null || projectId === '' ? null : assertUuidish(projectId, 'project_id');
      if (membership.role === 'guest') {
        const projectRole = await projectRoleForGuest(userId, safeWorkspaceId, safeProjectId);
        requireProjectPermission({ workspaceRole: membership.role, projectRole, action: ACTIONS.TASK_READ });
      } else {
        requireWorkspacePermission(membership.role, ACTIONS.TASK_READ);
        if (safeProjectId && !await repository.getProject(safeWorkspaceId, safeProjectId)) throw serviceError(404, 'project_not_found', 'Project not found.');
      }
      return repository.listEligibleTaskAssignees(safeWorkspaceId, safeProjectId);
    },

    async createTask(userId, workspaceId, input) {
      const safeWorkspaceId = assertUuidish(workspaceId, 'workspace_id');
      const membership = await getMembership(userId, safeWorkspaceId);
      const task = validateNewTask(input);
      if (task.projectId !== null) assertUuidish(task.projectId, 'project_id');

      if (membership.role === 'guest') {
        const projectRole = await projectRoleForGuest(userId, safeWorkspaceId, task.projectId);
        requireProjectPermission({ workspaceRole: membership.role, projectRole, action: ACTIONS.TASK_CREATE });
      } else {
        requireWorkspacePermission(membership.role, ACTIONS.TASK_CREATE);
        if (task.projectId && !await repository.getProject(safeWorkspaceId, task.projectId)) {
          throw serviceError(404, 'project_not_found', 'Project not found.');
        }
      }
      await assertAssigneeEligibility(safeWorkspaceId, task.projectId, task.assigneeUserIds);

      return repository.createTask({
        id: randomUUID(),
        workspaceId: safeWorkspaceId,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        executionType: task.executionType,
        dueDate: task.dueDate,
        priority: task.priority,
        createdBy: userId,
        assigneeUserIds: task.assigneeUserIds,
        primaryAssigneeUserId: task.primaryAssigneeUserId,
      });
    },
  };
}
