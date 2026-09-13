export const TIMER_STATES = Object.freeze({
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  STOPPED: 'stopped',
});

export const WORKSPACE_ROLE_LABELS = Object.freeze({
  owner: 'Սեփականատեր',
  admin: 'Ադմինիստրատոր',
  member: 'Անդամ',
  viewer: 'Դիտորդ',
  guest: 'Հյուր',
});

const MEMBER_TASK_ACTIONS = new Set(['create', 'update', 'delete', 'comment', 'timer']);
const VIEWER_TASK_ACTIONS = new Set(['comment']);
const PROJECT_MANAGER_ACTIONS = new Set(['create', 'update', 'delete', 'timer']);
const PROJECT_EDITOR_ACTIONS = new Set(['create', 'update', 'delete', 'timer']);
const PROJECT_MEMBER_TARGETS = Object.freeze({
  owner: new Set(['admin', 'member', 'viewer', 'guest']),
  admin: new Set(['member', 'viewer', 'guest']),
  member: new Set(['viewer', 'guest']),
  viewer: new Set(),
  guest: new Set(),
});

export function canTaskAction(workspaceRole, projectRole, action) {
  if (workspaceRole === 'owner' || workspaceRole === 'admin') return true;
  if (workspaceRole === 'member' && MEMBER_TASK_ACTIONS.has(action)) return true;
  if (workspaceRole === 'viewer' && VIEWER_TASK_ACTIONS.has(action)) return true;
  if (projectRole === 'manager') return PROJECT_MANAGER_ACTIONS.has(action);
  if (projectRole === 'editor') return PROJECT_EDITOR_ACTIONS.has(action);
  return false;
}

export function canProjectAction(workspaceRole, projectRole, action) {
  if (workspaceRole === 'owner' || workspaceRole === 'admin') return true;
  if (workspaceRole === 'member' && (action === 'create' || action === 'update')) return true;
  if (action === 'update' && projectRole === 'manager') return true;
  return false;
}

export function canManageProjectMember(actorWorkspaceRole, targetWorkspaceRole) {
  return Boolean(PROJECT_MEMBER_TARGETS[actorWorkspaceRole]?.has(targetWorkspaceRole));
}

export function canReopenCompletedTask(workspaceRole) {
  return workspaceRole === 'owner' || workspaceRole === 'admin';
}

function stringDate(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export function normalizeServerTask(row = {}) {
  const timer = row.timer && typeof row.timer === 'object' ? row.timer : {};
  return {
    id: row.id,
    title: row.title || '',
    description: row.description || '',
    status: row.status || 'todo',
    projectId: row.project_id ?? row.projectId ?? '',
    priority: row.priority || 'normal',
    executionType: row.execution_type ?? row.executionType ?? '',
    dueDate: stringDate(row.due_date ?? row.dueDate),
    tags: Array.isArray(row.tags) ? row.tags : [],
    version: Number(row.version || 1),
    createdAt: row.created_at ?? row.createdAt ?? '',
    updatedAt: row.updated_at ?? row.updatedAt ?? '',
    creatorName: row.creator_name ?? row.creatorName ?? row.creator_username ?? row.created_by ?? '',
    assignees: Array.isArray(row.assignees) ? row.assignees : [],
    primaryAssigneeUserId: row.assignee_user_id ?? row.primaryAssigneeUserId ?? '',
    comments: Array.isArray(row.comments) ? row.comments : [],
    timer: {
      state: timer.state || TIMER_STATES.IDLE,
      elapsedMs: Math.max(0, Number(timer.elapsedMs ?? timer.elapsed_ms ?? 0) || 0),
      startedAt: timer.startedAt ?? timer.started_at ?? null,
      stoppedAt: timer.stoppedAt ?? timer.stopped_at ?? null,
      stopReason: timer.stopReason ?? timer.stop_reason ?? null,
      updatedAt: timer.updatedAt ?? timer.updated_at ?? null,
    },
  };
}

export function taskAssigneeDraft(task = {}) {
  const assigneeUserIds = (task.assignees || []).map((assignee) => assignee.id).filter(Boolean);
  const primary = (task.assignees || []).find((assignee) => assignee.isPrimary)?.id
    || task.primaryAssigneeUserId
    || assigneeUserIds[0]
    || '';
  return { assigneeUserIds, primaryAssigneeUserId: primary };
}

export function getTimerElapsedMs(timer = {}, nowMs = Date.now()) {
  const base = Math.max(0, Number(timer.elapsedMs || 0) || 0);
  if (timer.state !== TIMER_STATES.RUNNING || !timer.startedAt) return base;
  const started = Date.parse(timer.startedAt);
  return Number.isFinite(started) ? base + Math.max(0, nowMs - started) : base;
}

export function formatElapsedTime(milliseconds) {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}
