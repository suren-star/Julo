const API_BASE = String(import.meta.env.VITE_JULO_API_BASE_URL || '').replace(/\/$/, '');

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let payload = null;
  try { payload = await response.json(); } catch {}
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.code = payload?.error?.code || 'request_failed';
    throw error;
  }
  return payload;
}

export const backendApi = Object.freeze({
  session: () => request('/api/auth/session'),
  login: (input) => request('/api/auth/login', { method: 'POST', body: input }),
  register: (input) => request('/api/auth/register', { method: 'POST', body: input }),
  logout: () => request('/api/auth/logout', { method: 'POST', body: {} }),
  roleDefaults: () => request('/api/roles/defaults'),
  workspaces: () => request('/api/workspaces'),
  projects: (workspaceId) => request(`/api/workspaces/${encodeURIComponent(workspaceId)}/projects`),
  createProject: (workspaceId, input) => request(`/api/workspaces/${encodeURIComponent(workspaceId)}/projects`, { method: 'POST', body: input }),
  renameProject: (workspaceId, projectId, input) => request(`/api/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(projectId)}`, { method: 'PATCH', body: input }),
  deleteProject: (workspaceId, projectId) => request(`/api/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' }),
  members: (workspaceId) => request(`/api/workspaces/${encodeURIComponent(workspaceId)}/members`),
  projectMembers: (workspaceId, projectId) => request(`/api/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(projectId)}/members`),
  setProjectMember: (workspaceId, projectId, userId, role) => request(`/api/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(userId)}`, { method: 'PUT', body: { role } }),
  removeProjectMember: (workspaceId, projectId, userId) => request(`/api/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(userId)}`, { method: 'DELETE' }),
  notes: (workspaceId) => request(`/api/workspaces/${encodeURIComponent(workspaceId)}/notes`),
  createNote: (workspaceId, input) => request(`/api/workspaces/${encodeURIComponent(workspaceId)}/notes`, { method: 'POST', body: input }),
  updateNote: (workspaceId, noteId, input) => request(`/api/workspaces/${encodeURIComponent(workspaceId)}/notes/${encodeURIComponent(noteId)}`, { method: 'PATCH', body: input }),
  deleteNote: (workspaceId, noteId) => request(`/api/workspaces/${encodeURIComponent(workspaceId)}/notes/${encodeURIComponent(noteId)}`, { method: 'DELETE' }),
  convertNote: (workspaceId, noteId, input) => request(`/api/workspaces/${encodeURIComponent(workspaceId)}/notes/${encodeURIComponent(noteId)}/convert`, { method: 'POST', body: input }),
});
