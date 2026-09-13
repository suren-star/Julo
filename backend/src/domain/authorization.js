export const WORKSPACE_ROLES = Object.freeze(['owner', 'admin', 'member', 'viewer', 'guest']);
export const PROJECT_ROLES = Object.freeze(['manager', 'editor', 'viewer']);

export const ACTIONS = Object.freeze({
  WORKSPACE_MEMBERS_MANAGE: 'workspace.members.manage',
  WORKSPACE_SETTINGS_UPDATE: 'workspace.settings.update',
  WORKSPACE_EXPORT: 'workspace.export',
  PROJECT_CREATE: 'projects.create',
  PROJECT_UPDATE: 'projects.update',
  PROJECT_DELETE: 'projects.delete',
  TASK_CREATE: 'tasks.create',
  TASK_UPDATE: 'tasks.update',
  TASK_DELETE: 'tasks.delete',
  TASK_COMMENT: 'tasks.comment',
  TASK_TIMER: 'tasks.timer',
  TASK_READ: 'tasks.read',
});

const WORKSPACE_PERMISSIONS = Object.freeze({
  owner: new Set(['*']),
  admin: new Set([
    ACTIONS.WORKSPACE_MEMBERS_MANAGE,
    ACTIONS.WORKSPACE_SETTINGS_UPDATE,
    ACTIONS.WORKSPACE_EXPORT,
    ACTIONS.PROJECT_CREATE,
    ACTIONS.PROJECT_UPDATE,
    ACTIONS.PROJECT_DELETE,
    ACTIONS.TASK_CREATE,
    ACTIONS.TASK_UPDATE,
    ACTIONS.TASK_DELETE,
    ACTIONS.TASK_COMMENT,
    ACTIONS.TASK_TIMER,
    ACTIONS.TASK_READ,
  ]),
  member: new Set([
    ACTIONS.WORKSPACE_EXPORT,
    ACTIONS.PROJECT_CREATE,
    ACTIONS.PROJECT_UPDATE,
    ACTIONS.TASK_CREATE,
    ACTIONS.TASK_UPDATE,
    ACTIONS.TASK_DELETE,
    ACTIONS.TASK_COMMENT,
    ACTIONS.TASK_TIMER,
    ACTIONS.TASK_READ,
  ]),
  viewer: new Set([
    ACTIONS.WORKSPACE_EXPORT,
    ACTIONS.TASK_COMMENT,
    ACTIONS.TASK_READ,
  ]),
  guest: new Set(),
});

const PROJECT_PERMISSIONS = Object.freeze({
  manager: new Set([
    ACTIONS.PROJECT_UPDATE,
    ACTIONS.TASK_CREATE,
    ACTIONS.TASK_UPDATE,
    ACTIONS.TASK_DELETE,
    ACTIONS.TASK_TIMER,
    ACTIONS.TASK_READ,
  ]),
  editor: new Set([
    ACTIONS.TASK_CREATE,
    ACTIONS.TASK_UPDATE,
    ACTIONS.TASK_DELETE,
    ACTIONS.TASK_TIMER,
    ACTIONS.TASK_READ,
  ]),
  viewer: new Set([ACTIONS.TASK_READ]),
});

export function isWorkspaceRole(role) {
  return WORKSPACE_ROLES.includes(role);
}

export function isProjectRole(role) {
  return PROJECT_ROLES.includes(role);
}

export function canWorkspace(workspaceRole, action) {
  const permissions = WORKSPACE_PERMISSIONS[workspaceRole];
  return Boolean(permissions && (permissions.has('*') || permissions.has(action)));
}

export function canProject({ workspaceRole, projectRole, action }) {
  if (canWorkspace(workspaceRole, action)) return true;
  if (workspaceRole !== 'guest') return false;
  const permissions = PROJECT_PERMISSIONS[projectRole];
  return Boolean(permissions?.has(action));
}

export function requireWorkspacePermission(workspaceRole, action) {
  if (!canWorkspace(workspaceRole, action)) {
    const error = new Error('Forbidden.');
    error.code = 'FORBIDDEN';
    error.status = 403;
    throw error;
  }
}

export function requireProjectPermission(input) {
  if (!canProject(input)) {
    const error = new Error('Forbidden.');
    error.code = 'FORBIDDEN';
    error.status = 403;
    throw error;
  }
}

export function canReopenCompletedTask(workspaceRole) {
  return workspaceRole === 'owner' || workspaceRole === 'admin';
}
