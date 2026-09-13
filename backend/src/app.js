import { createAuthService } from './auth/auth-service.js';
import { createPostgresRepository } from './db/postgres-repository.js';
import { createHttpServer } from './http/server.js';

export function createJuloBackend({ pool, secureCookies = true, allowedOrigins = [], auth = {} }) {
  const repository = createPostgresRepository(pool);
  const authService = createAuthService(repository, auth);
  const server = createHttpServer({ repository, authService, secureCookies, allowedOrigins });
  return { repository, authService, server };
}
