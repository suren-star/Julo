import { createAuthService } from './auth/auth-service.js';
import { createPostgresRepository } from './db/postgres-repository.js';
import { createPostgresTaskCommandRepository } from './db/postgres-task-commands.js';
import { createHttpServer } from './http/server.js';
import { createTaskCommandService } from './services/task-command-service.js';
import { createWorkspaceService } from './services/workspace-service.js';

export function createJuloBackend({ pool, secureCookies = true, allowedOrigins = [], auth = {} }) {
  const repository = createPostgresRepository(pool);
  const taskCommandRepository = createPostgresTaskCommandRepository(pool);
  const authService = createAuthService(repository, auth);
  const workspaceService = createWorkspaceService(repository);
  const taskCommandService = createTaskCommandService(taskCommandRepository);
  const server = createHttpServer({ repository, authService, workspaceService, taskCommandService, secureCookies, allowedOrigins });
  return { repository, taskCommandRepository, authService, workspaceService, taskCommandService, server };
}
