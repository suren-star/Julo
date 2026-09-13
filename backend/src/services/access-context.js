import { serviceError } from '../domain/service-validation.js';

export function createAccessContext(repository) {
  if (!repository) throw new TypeError('repository is required');

  async function membership(userId, workspaceId) {
    const item = await repository.getWorkspaceMembership(workspaceId, userId);
    if (!item || item.status !== 'active') {
      throw serviceError(404, 'workspace_not_found', 'Workspace not found.');
    }
    return item;
  }

  async function project(workspaceId, projectId) {
    const item = await repository.getProject(workspaceId, projectId);
    if (!item) throw serviceError(404, 'project_not_found', 'Project not found.');
    return item;
  }

  async function projectRole(userId, workspaceId, projectId) {
    if (!projectId) return null;
    await project(workspaceId, projectId);
    const item = await repository.getProjectMembership(projectId, userId);
    return item?.role ?? null;
  }

  async function requiredProjectRole(userId, workspaceId, projectId) {
    if (!projectId) {
      throw serviceError(403, 'project_access_required', 'This action requires a project.');
    }
    return projectRole(userId, workspaceId, projectId);
  }

  return Object.freeze({ membership, project, projectRole, requiredProjectRole });
}
