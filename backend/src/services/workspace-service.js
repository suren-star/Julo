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

function validateNewTask(input) {
  const title = typeof input?.title === 'string' ? input.title.trim() : '';
  if (!title || title.length > 500) throw serviceError(400, 'invalid_title', 'Task title is required.');
  if (!EXECUTION_TYPES.has(input?.executionType)) throw serviceError(400, 'invalid_execution_type', 'Execution type is required.');
  if (typeof input?.dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)) throw serviceError(400, 'invalid_due_date', 'Due date is required.');
  const description = typeof input?.description === 'string' ? input.description : '';
  if (description.length > 20_000) throw serviceError(400, 'invalid_description', 'Description is too long.');
  const priority = input?.priority ?? 'normal';
  if (!PRIORITIES.has(priority)) throw serviceError(400, 'invalid_priority', 'Priority is invalid.');
  return { title, description, executionType: input.executionType, dueDate: input.dueDate, priority, projectId: input?.projectId ?? null };
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
      });
    },
  };
}
