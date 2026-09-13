import { randomUUID } from 'node:crypto';
import { ACTIONS, requireProjectPermission } from '../domain/authorization.js';
import { validateTaskStatusTransition } from '../domain/task-policy.js';
import {
  assertExpectedVersion,
  assertId,
  assertTaskExecutionType,
  assertTaskPriority,
  assertTaskStatus,
  cleanText,
  dateOnly,
  normalizeProjectId,
  normalizeTaskAssignees,
  normalizeTaskTags,
  serviceError,
} from '../domain/service-validation.js';

const PATCH_KEYS = new Set([
  'expectedVersion',
  'title',
  'description',
  'executionType',
  'dueDate',
  'priority',
  'status',
  'projectId',
  'tags',
  'assigneeUserIds',
  'primaryAssigneeUserId',
]);

function currentVersion(task) {
  const value = Number(task?.version);
  return Number.isSafeInteger(value) ? value : 0;
}

function projectIdOf(task) {
  return task?.projectId ?? task?.project_id ?? null;
}

function validatePatch(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw serviceError(400, 'invalid_task_patch', 'Task patch must be an object.');
  }

  for (const key of Object.keys(input)) {
    if (!PATCH_KEYS.has(key)) {
      throw serviceError(400, 'unsupported_task_field', `Unsupported task field: ${key}.`);
    }
  }

  const version = assertExpectedVersion(input.expectedVersion);
  const changes = {};

  if ('title' in input) {
    changes.title = cleanText(input.title, { field: 'title', max: 500 });
  }
  if ('description' in input) {
    changes.description = cleanText(input.description, { field: 'description', max: 20_000, required: false, trim: false });
  }
  if ('executionType' in input) {
    changes.executionType = assertTaskExecutionType(input.executionType);
  }
  if ('dueDate' in input) {
    changes.dueDate = dateOnly(input.dueDate, 'due_date');
  }
  if ('priority' in input) {
    changes.priority = assertTaskPriority(input.priority);
  }
  if ('status' in input) {
    changes.status = assertTaskStatus(input.status);
  }
  if ('projectId' in input) {
    changes.projectId = normalizeProjectId(input.projectId);
  }
  if ('tags' in input) {
    changes.tags = normalizeTaskTags(input.tags);
  }

  const assignment = normalizeTaskAssignees(input, { patch: true });
  if (Object.keys(changes).length === 0 && !assignment) {
    throw serviceError(400, 'empty_task_patch', 'At least one task field must be changed.');
  }

  return { version, changes, assignment };
}

function authorizeContext(context, action) {
  if (!context?.membership || context.membership.status !== 'active') {
    throw serviceError(404, 'workspace_not_found', 'Workspace not found.');
  }
  if (!context.task) throw serviceError(404, 'task_not_found', 'Task not found.');
  requireProjectPermission({ workspaceRole: context.membership.role, projectRole: context.projectRole, action });
}

async function authorizeTargetProject(context, projectId, action) {
  if (!projectId) {
    requireProjectPermission({ workspaceRole: context.membership.role, projectRole: null, action });
    return;
  }
  if (!(await context.tx.projectExists(projectId))) {
    throw serviceError(404, 'project_not_found', 'Project not found.');
  }
  const projectRole = await context.tx.projectRole(projectId);
  requireProjectPermission({ workspaceRole: context.membership.role, projectRole, action });
}

function timerState(context) {
  return context.timer?.state ?? 'idle';
}

export function createTaskCommandService(repository) {
  if (!repository || typeof repository.withTaskMutationContext !== 'function') {
    throw new TypeError('Task mutation repository support is required.');
  }

  return {
    async updateTask(userId, workspaceId, taskId, input) {
      const safeWorkspaceId = assertId(workspaceId, 'workspace_id');
      const safeTaskId = assertId(taskId, 'task_id');
      const patch = validatePatch(input);

      return repository.withTaskMutationContext(
        { userId, workspaceId: safeWorkspaceId, taskId: safeTaskId },
        async (context) => {
          authorizeContext(context, ACTIONS.TASK_UPDATE);
          if (currentVersion(context.task) !== patch.version) {
            throw serviceError(409, 'task_version_conflict', 'Task changed since it was loaded.');
          }

          const currentProjectId = projectIdOf(context.task);
          const targetProjectId = Object.prototype.hasOwnProperty.call(patch.changes, 'projectId')
            ? patch.changes.projectId
            : currentProjectId;
          const projectChanged = targetProjectId !== currentProjectId;
          if (projectChanged) {
            await authorizeTargetProject(context, targetProjectId, ACTIONS.TASK_UPDATE);
          }

          const currentStatus = context.task.status;
          const nextStatus = patch.changes.status ?? currentStatus;
          const transition = validateTaskStatusTransition({
            currentStatus,
            nextStatus,
            workspaceRole: context.membership.role,
          });
          if (!transition.allowed) {
            throw serviceError(409, transition.reason, 'Task status transition is not allowed.');
          }

          const assigneeUserIds = patch.assignment
            ? patch.assignment.assigneeUserIds
            : projectChanged ? await context.tx.listAssigneeIds() : null;
          if (assigneeUserIds) {
            const invalid = await context.tx.validateAssignees(targetProjectId, assigneeUserIds);
            if (invalid.length) {
              throw serviceError(400, 'ineligible_task_assignee', 'One or more selected users cannot be assigned to this task.');
            }
          }

          const now = new Date();
          if (patch.assignment) {
            await context.tx.replaceAssignees(
              patch.assignment.assigneeUserIds,
              patch.assignment.primaryAssigneeUserId,
              now,
            );
          }

          if (transition.timerEffect === 'stop_completed') await context.tx.completeTimer(now);
          if (transition.timerEffect === 'reopen_paused') await context.tx.reopenTimer(now);

          const updated = await context.tx.updateTask(patch.changes, patch.version, now);
          if (!updated) {
            throw serviceError(409, 'task_version_conflict', 'Task changed since it was loaded.');
          }

          const fields = Object.keys(patch.changes);
          if (patch.assignment) fields.push('assignees');
          await context.tx.audit('task.updated', {
            fields,
            fromVersion: patch.version,
            toVersion: patch.version + 1,
          });
          if (patch.assignment) await context.tx.audit('task.assignees.changed', patch.assignment);
          if (projectChanged) {
            await context.tx.audit('task.project.changed', {
              from: currentProjectId,
              to: targetProjectId,
            });
          }
          if (currentStatus !== nextStatus) {
            await context.tx.audit('task.status.changed', {
              from: currentStatus,
              to: nextStatus,
              timerEffect: transition.timerEffect,
            });
          }

          return patch.assignment
            ? {
                ...updated,
                assignee_user_id: patch.assignment.primaryAssigneeUserId,
                assigneeUserIds: patch.assignment.assigneeUserIds,
                primaryAssigneeUserId: patch.assignment.primaryAssigneeUserId,
              }
            : updated;
        },
      );
    },

    async addComment(userId, workspaceId, taskId, input) {
      const safeWorkspaceId = assertId(workspaceId, 'workspace_id');
      const safeTaskId = assertId(taskId, 'task_id');
      const body = cleanText(input?.body, { field: 'comment', max: 10_000 });

      return repository.withTaskMutationContext(
        { userId, workspaceId: safeWorkspaceId, taskId: safeTaskId },
        async (context) => {
          authorizeContext(context, ACTIONS.TASK_COMMENT);
          const comment = await context.tx.addComment(randomUUID(), body, new Date());
          await context.tx.audit('task.comment.created', { commentId: comment.id });
          return comment;
        },
      );
    },

    async deleteTask(userId, workspaceId, taskId, input) {
      const safeWorkspaceId = assertId(workspaceId, 'workspace_id');
      const safeTaskId = assertId(taskId, 'task_id');
      const expectedVersion = assertExpectedVersion(input?.expectedVersion);

      return repository.withTaskMutationContext(
        { userId, workspaceId: safeWorkspaceId, taskId: safeTaskId },
        async (context) => {
          authorizeContext(context, ACTIONS.TASK_DELETE);
          if (currentVersion(context.task) !== expectedVersion) {
            throw serviceError(409, 'task_version_conflict', 'Task changed since it was loaded.');
          }
          await context.tx.audit('task.deleted', { version: expectedVersion });
          const deleted = await context.tx.deleteTask(expectedVersion);
          if (!deleted) {
            throw serviceError(409, 'task_version_conflict', 'Task changed since it was loaded.');
          }
          return true;
        },
      );
    },

    async timerCommand(userId, workspaceId, taskId, command) {
      if (!['start', 'pause', 'stop'].includes(command)) {
        throw serviceError(400, 'invalid_timer_command', 'Timer command is invalid.');
      }

      const safeWorkspaceId = assertId(workspaceId, 'workspace_id');
      const safeTaskId = assertId(taskId, 'task_id');

      return repository.withTaskMutationContext(
        { userId, workspaceId: safeWorkspaceId, taskId: safeTaskId },
        async (context) => {
          authorizeContext(context, ACTIONS.TASK_TIMER);
          if (context.task.status === 'done') {
            throw serviceError(409, 'completed_task_timer_forbidden', 'Completed task must be reopened before using the timer.');
          }

          const state = timerState(context);
          const now = new Date();

          if (command === 'start') {
            if (!['idle', 'paused'].includes(state)) {
              throw serviceError(409, 'invalid_timer_transition', 'Only idle or paused timers can be started.');
            }
            await context.tx.pauseOtherRunningTimers(now);
            const timer = await context.tx.startTimer(now);
            await context.tx.audit('task.timer.started', { previousState: state });
            return timer;
          }

          if (command === 'pause') {
            if (state !== 'running') {
              throw serviceError(409, 'invalid_timer_transition', 'Only a running timer can be paused.');
            }
            const timer = await context.tx.pauseTimer(now);
            await context.tx.audit('task.timer.paused', {});
            return timer;
          }

          if (!['running', 'paused'].includes(state)) {
            throw serviceError(409, 'invalid_timer_transition', 'Only a running or paused timer can be stopped.');
          }
          const timer = await context.tx.stopTimer(now, 'manual');
          await context.tx.audit('task.timer.stopped', { reason: 'manual' });
          return timer;
        },
      );
    },
  };
}
