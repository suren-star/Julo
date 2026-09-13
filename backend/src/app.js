import { createAuthService } from './auth/auth-service.js';
import { createPostgresRepository } from './db/postgres-repository.js';
import { createHttpServer } from './http/server.js';
import { createWorkspaceService } from './services/workspace-service.js';

export function createJuloBackend({ pool, secureCookies = true, allowedOrigins = [], auth = {} }) {
  const repository = createPostgresRepository(pool);
  const authService = createAuthService(repository, auth);
  const workspaceService = createWorkspaceService(repository);
  const server = createHttpServer({ repository, authService, workspaceService, secureCookies, allowedOrigins });
  return { repository, authService, workspaceService, server };
}
