import { ACTIONS, requireProjectPermission } from '../domain/authorization.js';
import { validateTaskStatusTransition } from '../domain/task-policy.js';

const EXECUTION_TYPES = new Set(['review_report','execute','prepare_letter','organize_meeting','prepare_documents','acknowledge']);
const PRIORITIES = new Set(['low','normal','high']);
const STATUSES = new Set(['todo','doing','done']);
const PATCH_KEYS = new Set(['expectedVersion','title','description','executionType','dueDate','priority','status','assigneeUserIds','primaryAssigneeUserId']);

function serviceError(status, code, message) { const error = new Error(message); error.status=status; error.code=code; return error; }
function assertId(value, field) { if (typeof value !== 'string' || value.length < 8 || value.length > 80) throw serviceError(400,`invalid_${field}`,`${field} is invalid.`); return value; }
function expectedVersion(value) { if (!Number.isSafeInteger(value) || value < 1) throw serviceError(400,'invalid_expected_version','expectedVersion must be a positive integer.'); return value; }
function currentVersion(task) { const value = Number(task?.version); return Number.isSafeInteger(value) ? value : 0; }
function projectIdOf(task) { return task?.projectId ?? task?.project_id ?? null; }

function normalizeAssignmentPatch(input) {
  const hasIds = Object.prototype.hasOwnProperty.call(input, 'assigneeUserIds');
  const hasPrimary = Object.prototype.hasOwnProperty.call(input, 'primaryAssigneeUserId');
  if (!hasIds && !hasPrimary) return null;
  if (!hasIds) throw serviceError(400,'assignees_required_with_primary','assigneeUserIds is required when primaryAssigneeUserId is changed.');
  if (!Array.isArray(input.assigneeUserIds)) throw serviceError(400,'invalid_assignees','assigneeUserIds must be an array.');
  if (input.assigneeUserIds.length > 100) throw serviceError(400,'too_many_assignees','Too many task assignees.');
  const assigneeUserIds = [...new Set(input.assigneeUserIds.map((id)=>assertId(id,'assignee_user_id')))];
  const primaryAssigneeUserId = input.primaryAssigneeUserId == null || input.primaryAssigneeUserId === '' ? null : assertId(input.primaryAssigneeUserId,'primary_assignee_user_id');
  if (assigneeUserIds.length === 0) throw serviceError(400,'assignee_required','At least one task assignee is required.');
  if (!primaryAssigneeUserId) throw serviceError(400,'primary_assignee_required','A primary assignee is required.');
  if (!assigneeUserIds.includes(primaryAssigneeUserId)) throw serviceError(400,'primary_assignee_not_selected','Primary assignee must be one of the selected assignees.');
  return { assigneeUserIds, primaryAssigneeUserId };
}

function validatePatch(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw serviceError(400,'invalid_task_patch','Task patch must be an object.');
  for (const key of Object.keys(input)) if (!PATCH_KEYS.has(key)) throw serviceError(400,'unsupported_task_field',`Unsupported task field: ${key}.`);
  const version = expectedVersion(input.expectedVersion);
  const changes = {};
  if ('title' in input) { const title = typeof input.title === 'string' ? input.title.trim() : ''; if (!title || title.length > 500) throw serviceError(400,'invalid_title','Task title is required.'); changes.title=title; }
  if ('description' in input) { if (typeof input.description !== 'string' || input.description.length > 20_000) throw serviceError(400,'invalid_description','Description is invalid.'); changes.description=input.description; }
  if ('executionType' in input) { if (!EXECUTION_TYPES.has(input.executionType)) throw serviceError(400,'invalid_execution_type','Execution type is invalid.'); changes.executionType=input.executionType; }
  if ('dueDate' in input) { if (typeof input.dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)) throw serviceError(400,'invalid_due_date','Due date is invalid.'); changes.dueDate=input.dueDate; }
  if ('priority' in input) { if (!PRIORITIES.has(input.priority)) throw serviceError(400,'invalid_priority','Priority is invalid.'); changes.priority=input.priority; }
  if ('status' in input) { if (!STATUSES.has(input.status)) throw serviceError(400,'invalid_status','Status is invalid.'); changes.status=input.status; }
  const assignment = normalizeAssignmentPatch(input);
  if (Object.keys(changes).length === 0 && !assignment) throw serviceError(400,'empty_task_patch','At least one task field must be changed.');
  return { version, changes, assignment };
}

function authorizeContext(context, action) {
  if (!context?.membership || context.membership.status !== 'active') throw serviceError(404,'workspace_not_found','Workspace not found.');
  if (!context.task) throw serviceError(404,'task_not_found','Task not found.');
  requireProjectPermission({ workspaceRole: context.membership.role, projectRole: context.projectRole, action });
}

function timerState(context) { return context.timer?.state ?? 'idle'; }

export function createTaskCommandService(repository) {
  if (!repository || typeof repository.withTaskMutationContext !== 'function') throw new TypeError('Task mutation repository support is required.');

  return {
    async updateTask(userId, workspaceId, taskId, input) {
      const safeWorkspaceId = assertId(workspaceId,'workspace_id');
      const safeTaskId = assertId(taskId,'task_id');
      const patch = validatePatch(input);
      return repository.withTaskMutationContext({ userId, workspaceId:safeWorkspaceId, taskId:safeTaskId }, async (context) => {
        authorizeContext(context, ACTIONS.TASK_UPDATE);
        if (currentVersion(context.task) !== patch.version) throw serviceError(409,'task_version_conflict','Task changed since it was loaded.');

        const currentStatus = context.task.status;
        const nextStatus = patch.changes.status ?? currentStatus;
        const transition = validateTaskStatusTransition({ currentStatus, nextStatus, workspaceRole: context.membership.role });
        if (!transition.allowed) throw serviceError(409, transition.reason, 'Task status transition is not allowed.');

        const now = new Date();
        if (patch.assignment) {
          const invalid = await context.tx.validateAssignees(projectIdOf(context.task), patch.assignment.assigneeUserIds);
          if (invalid.length) throw serviceError(400,'ineligible_task_assignee','One or more selected users cannot be assigned to this task.');
          await context.tx.replaceAssignees(patch.assignment.assigneeUserIds, patch.assignment.primaryAssigneeUserId, now);
        }
        if (transition.timerEffect === 'stop_completed') await context.tx.completeTimer(now);
        if (transition.timerEffect === 'reopen_paused') await context.tx.reopenTimer(now);

        const updated = await context.tx.updateTask(patch.changes, patch.version, now);
        if (!updated) throw serviceError(409,'task_version_conflict','Task changed since it was loaded.');
        const fields = Object.keys(patch.changes);
        if (patch.assignment) fields.push('assignees');
        await context.tx.audit('task.updated', { fields, fromVersion: patch.version, toVersion: patch.version + 1 });
        if (patch.assignment) await context.tx.audit('task.assignees.changed', patch.assignment);
        if (currentStatus !== nextStatus) await context.tx.audit('task.status.changed', { from: currentStatus, to: nextStatus, timerEffect: transition.timerEffect });
        return patch.assignment ? { ...updated, assignee_user_id: patch.assignment.primaryAssigneeUserId, assigneeUserIds: patch.assignment.assigneeUserIds, primaryAssigneeUserId: patch.assignment.primaryAssigneeUserId } : updated;
      });
    },

    async timerCommand(userId, workspaceId, taskId, command) {
      if (!['start','pause','stop'].includes(command)) throw serviceError(400,'invalid_timer_command','Timer command is invalid.');
      const safeWorkspaceId = assertId(workspaceId,'workspace_id');
      const safeTaskId = assertId(taskId,'task_id');
      return repository.withTaskMutationContext({ userId, workspaceId:safeWorkspaceId, taskId:safeTaskId }, async (context) => {
        authorizeContext(context, ACTIONS.TASK_TIMER);
        if (context.task.status === 'done') throw serviceError(409,'completed_task_timer_forbidden','Completed task must be reopened before using the timer.');
        const state = timerState(context);
        const now = new Date();

        if (command === 'start') {
          if (!['idle','paused'].includes(state)) throw serviceError(409,'invalid_timer_transition','Only idle or paused timers can be started.');
          await context.tx.pauseOtherRunningTimers(now);
          const timer = await context.tx.startTimer(now);
          await context.tx.audit('task.timer.started', { previousState: state });
          return timer;
        }
        if (command === 'pause') {
          if (state !== 'running') throw serviceError(409,'invalid_timer_transition','Only a running timer can be paused.');
          const timer = await context.tx.pauseTimer(now);
          await context.tx.audit('task.timer.paused', {});
          return timer;
        }
        if (!['running','paused'].includes(state)) throw serviceError(409,'invalid_timer_transition','Only a running or paused timer can be stopped.');
        const timer = await context.tx.stopTimer(now, 'manual');
        await context.tx.audit('task.timer.stopped', { reason: 'manual' });
        return timer;
      });
    },
  };
}
