const API_BASE = String(import.meta.env.VITE_JULO_API_BASE_URL || '').replace(/\/$/, '');

const encode = (value) => encodeURIComponent(value);
const workspacePath = (workspaceId, suffix = '') => `/api/workspaces/${encode(workspaceId)}${suffix}`;
const projectPath = (workspaceId, projectId, suffix = '') => workspacePath(workspaceId, `/projects/${encode(projectId)}${suffix}`);
const taskPath = (workspaceId, taskId, suffix = '') => workspacePath(workspaceId, `/tasks/${encode(taskId)}${suffix}`);
const notePath = (workspaceId, noteId, suffix = '') => workspacePath(workspaceId, `/notes/${encode(noteId)}${suffix}`);

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {}

  if (!response.ok) {
    const error = new Error(payload?.error?.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.code = payload?.error?.code || 'request_failed';
    throw error;
  }
  return payload;
}

function normalizeTaskInput(input) {
  return { ...input, projectId: input?.projectId ? input.projectId : null };
}

export const backendApi = Object.freeze({
  session: () => request('/api/auth/session'),
  login: (input) => request('/api/auth/login', { method: 'POST', body: input }),
  register: (input) => request('/api/auth/register', { method: 'POST', body: input }),
  logout: () => request('/api/auth/logout', { method: 'POST', body: {} }),
  roleDefaults: () => request('/api/roles/defaults'),
  workspaces: () => request('/api/workspaces'),

  projects: (workspaceId) => request(workspacePath(workspaceId, '/projects')),
  createProject: (workspaceId, input) => request(workspacePath(workspaceId, '/projects'), { method: 'POST', body: input }),
  renameProject: (workspaceId, projectId, input) => request(projectPath(workspaceId, projectId), { method: 'PATCH', body: input }),
  deleteProject: (workspaceId, projectId) => request(projectPath(workspaceId, projectId), { method: 'DELETE' }),

  members: (workspaceId) => request(workspacePath(workspaceId, '/members')),
  projectMembers: (workspaceId, projectId) => request(projectPath(workspaceId, projectId, '/members')),
  setProjectMember: (workspaceId, projectId, userId, role) => request(
    projectPath(workspaceId, projectId, `/members/${encode(userId)}`),
    { method: 'PUT', body: { role } },
  ),
  removeProjectMember: (workspaceId, projectId, userId) => request(
    projectPath(workspaceId, projectId, `/members/${encode(userId)}`),
    { method: 'DELETE' },
  ),

  tasks: (workspaceId) => request(workspacePath(workspaceId, '/tasks')),
  taskAssignees: (workspaceId, projectId = '') => request(
    workspacePath(workspaceId, `/task-assignees${projectId ? `?projectId=${encode(projectId)}` : ''}`),
  ),
  createTask: (workspaceId, input) => request(
    workspacePath(workspaceId, '/tasks'),
    { method: 'POST', body: normalizeTaskInput(input) },
  ),
  updateTask: (workspaceId, taskId, input) => request(taskPath(workspaceId, taskId), { method: 'PATCH', body: input }),
  timerCommand: (workspaceId, taskId, command) => request(taskPath(workspaceId, taskId, `/timer/${encode(command)}`), { method: 'POST', body: {} }),

  notes: (workspaceId) => request(workspacePath(workspaceId, '/notes')),
  createNote: (workspaceId, input) => request(workspacePath(workspaceId, '/notes'), { method: 'POST', body: input }),
  updateNote: (workspaceId, noteId, input) => request(notePath(workspaceId, noteId), { method: 'PATCH', body: input }),
  deleteNote: (workspaceId, noteId) => request(notePath(workspaceId, noteId), { method: 'DELETE' }),
  convertNote: (workspaceId, noteId, input) => request(notePath(workspaceId, noteId, '/convert'), { method: 'POST', body: input }),
});
