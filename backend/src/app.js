import { createAuthService } from './auth/auth-service.js';
import { createPostgresProjectNotesRepository } from './db/postgres-project-notes.js';
import { createPostgresRepository } from './db/postgres-repository.js';
import { createPostgresTaskCommandRepository } from './db/postgres-task-commands.js';
import { createHttpServer } from './http/server.js';
import { createProjectNotesService } from './services/project-notes-service.js';
import { createTaskCommandService } from './services/task-command-service.js';
import { createWorkspaceService } from './services/workspace-service.js';

export function createJuloBackend({ pool, secureCookies = true, allowedOrigins = [], auth = {} }) {
  const repository = createPostgresRepository(pool);
  const taskCommandRepository = createPostgresTaskCommandRepository(pool);
  const projectNotesRepository = Object.assign(repository, createPostgresProjectNotesRepository(pool));
  const authService = createAuthService(repository, auth);
  const workspaceService = createWorkspaceService(repository);
  const taskCommandService = createTaskCommandService(taskCommandRepository);
  const projectNotesService = createProjectNotesService(projectNotesRepository);
  const server = createHttpServer({ repository, authService, workspaceService, taskCommandService, projectNotesService, secureCookies, allowedOrigins });
  return { repository, taskCommandRepository, projectNotesRepository, authService, workspaceService, taskCommandService, projectNotesService, server };
}
