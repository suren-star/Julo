# Julo Backend Foundation

This directory is Julo's server-side security boundary. It stays separate from `webapp/` while the current local-first beta remains operational and the backend is built in verified phases.

## Implemented

### Phase 1 — security/domain foundation

- PostgreSQL schema for users, credentials, sessions, workspaces, memberships, projects, project guest roles, tasks, comments, task timers, and audit events.
- Server-owned workspace/project authorization policies matching Julo product roles.
- Completed-task reopen rule: only Owner/Admin may move `done -> doing`; `done -> todo` is rejected.
- Password hashing with Node `crypto.scrypt` and random salts.
- Opaque session tokens; only SHA-256 token digests are intended to be stored.
- Secure `__Host-julo_session` HttpOnly cookie defaults.
- Database partial unique index allowing at most one running timer per workspace.

### Phase 2 — auth/API adapters

- Auth service for register, login, logout, and session lookup.
- Email normalization and generic invalid-credential responses.
- Dummy password verification path to reduce timing differences for unknown accounts.
- Registration transaction creates the user, credential, first workspace, and Owner membership.
- PostgreSQL repository adapter using parameterized queries through a pg-compatible pool/queryable.
- Migration runner with checksums, PostgreSQL advisory locking, and transactional application.
- Node HTTP transport with 64 KiB JSON request limit, no-store responses, and security headers.
- Browser mutation protection using `Sec-Fetch-Site` plus an origin allowlist hook.
- Fixed-window authentication throttling for the single-process foundation.
- `/health`, `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, and `/api/auth/session` routes.
- Composition root in `src/app.js` wiring repository, auth service, and HTTP server.

Run validation:

```bash
cd backend
npm ci --ignore-scripts
npm audit --audit-level=high
npm test
npm run check
```

## Security boundary

The backend resolves the authenticated user exclusively from a server-side session, loads memberships from PostgreSQL, and must authorize every workspace/project/task operation. Client-provided `currentUserId`, workspace role, project role, or other authority claims are never trusted.

The existing browser roles remain UX hints only until the webapp is migrated to this API.

## Intentional current limits

- A concrete PostgreSQL driver package and production pool bootstrap are not pinned yet; repository and migration code accept a pg-compatible pool so hosting/provider selection stays separate.
- The in-memory authentication rate limiter is suitable for one process only. Multi-instance production deployment requires shared rate-limit storage.
- Workspace/project/task HTTP resources are not exposed yet.
- The webapp still uses its local-first storage and local identity model.
- No production database or API host is provisioned yet.

## Next backend phase

1. Select/pin the concrete PostgreSQL driver and add environment/config validation plus pool bootstrap.
2. Add PostgreSQL-backed integration tests and exercise the real migration set.
3. Add authenticated workspace membership context loading.
4. Add workspace/project/task API routes with object-level authorization.
5. Add transactional task status/timer commands and audit-event writes.
6. Add production-grade distributed auth throttling/session cleanup strategy.
7. Only after the API is stable, migrate `webapp/` from local identity/authorization to server sessions and API data.

## Deployment note

GitHub Pages remains a static frontend host and cannot host this backend. Production should use HTTPS and a dedicated Julo origin/domain arrangement. The API/database hosting target remains intentionally provider-neutral until the deployment phase.
