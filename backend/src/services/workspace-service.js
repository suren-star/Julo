import { randomUUID } from 'node:crypto';
import { ACTIONS, requireProjectPermission, requireWorkspacePermission } from '../domain/authorization.js';
import {
  assertId,
  assertTaskExecutionType,
  assertTaskPriority,
  cleanText,
  dateOnly,
  normalizeProjectId,
  normalizeTaskAssignees,
  normalizeTaskTags,
  serviceError,
} from '../domain/service-validation.js';
import { createAccessContext } from './access-context.js';

function validateNewTask(input) {
  const title = cleanText(input?.title, { field: 'title', max: 500 });
  const description = cleanText(input?.description ?? '', { field: 'description', max: 20_000, required: false, trim: false });
  return {
    title,
    description,
    executionType: assertTaskExecutionType(input?.executionType, 'Execution type is required.'),
    dueDate: dateOnly(input?.dueDate, 'due_date'),
    priority: assertTaskPriority(input?.priority ?? 'normal'),
    projectId: normalizeProjectId(input?.projectId),
    tags: normalizeTaskTags(input?.tags ?? []),
    ...normalizeTaskAssignees(input),
  };
}

export function createWorkspaceService(repository) {
  if (!repository) throw new TypeError('repository is required');
  const access = createAccessContext(repository);

  async function assertAssigneeEligibility(workspaceId, projectId, assigneeUserIds) {
    const candidates = await repository.listEligibleTaskAssignees(workspaceId, projectId);
    const allowed = new Set(candidates.map((candidate) => candidate.id));
    const invalid = assigneeUserIds.filter((id) => !allowed.has(id));
    if (invalid.length) {
      throw serviceError(400, 'ineligible_task_assignee', 'One or more selected users cannot be assigned to this task.');
    }
  }

  return {
    async listWorkspaces(userId) {
      return repository.listWorkspacesForUser(userId);
    },

    async getWorkspace(userId, workspaceId) {
      const safeWorkspaceId = assertId(workspaceId, 'workspace_id');
      const membership = await access.membership(userId, safeWorkspaceId);
      return repository.getWorkspaceForMember(safeWorkspaceId, userId, membership.role);
    },

    async listProjects(userId, workspaceId) {
      const safeWorkspaceId = assertId(workspaceId, 'workspace_id');
      const membership = await access.membership(userId, safeWorkspaceId);
      return repository.listProjectsForMember(safeWorkspaceId, userId, membership.role);
    },

    async listTasks(userId, workspaceId) {
      const safeWorkspaceId = assertId(workspaceId, 'workspace_id');
      const membership = await access.membership(userId, safeWorkspaceId);
      requireProjectPermission({
        workspaceRole: membership.role,
        projectRole: membership.role === 'guest' ? 'viewer' : null,
        action: ACTIONS.TASK_READ,
      });
      return repository.listTasksForMember(safeWorkspaceId, userId, membership.role);
    },

    async listTaskAssigneeCandidates(userId, workspaceId, projectId = null) {
      const safeWorkspaceId = assertId(workspaceId, 'workspace_id');
      const membership = await access.membership(userId, safeWorkspaceId);
      const safeProjectId = normalizeProjectId(projectId);

      if (membership.role === 'guest') {
        const projectRole = await access.guestProjectRole(userId, safeWorkspaceId, safeProjectId);
        requireProjectPermission({ workspaceRole: membership.role, projectRole, action: ACTIONS.TASK_READ });
      } else {
        requireWorkspacePermission(membership.role, ACTIONS.TASK_READ);
        if (safeProjectId) await access.project(safeWorkspaceId, safeProjectId);
      }

      return repository.listEligibleTaskAssignees(safeWorkspaceId, safeProjectId);
    },

    async createTask(userId, workspaceId, input) {
      const safeWorkspaceId = assertId(workspaceId, 'workspace_id');
      const membership = await access.membership(userId, safeWorkspaceId);
      const task = validateNewTask(input);

      if (membership.role === 'guest') {
        const projectRole = await access.guestProjectRole(userId, safeWorkspaceId, task.projectId);
        requireProjectPermission({ workspaceRole: membership.role, projectRole, action: ACTIONS.TASK_CREATE });
      } else {
        requireWorkspacePermission(membership.role, ACTIONS.TASK_CREATE);
        if (task.projectId) await access.project(safeWorkspaceId, task.projectId);
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
        tags: task.tags,
        createdBy: userId,
        assigneeUserIds: task.assigneeUserIds,
        primaryAssigneeUserId: task.primaryAssigneeUserId,
      });
    },
  };
}
