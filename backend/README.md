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

### Phase 3 — server-owned workspace/task access

- Authenticated identity is derived only from the server session.
- Active workspace memberships are loaded from PostgreSQL for workspace/project/task access.
- Guest project roles are loaded from `project_memberships`; client role claims are ignored.
- Authenticated workspace/project/task list routes.
- Server-authorized task creation with required title, execution type, and due-date validation.
- Task creation writes an idle timer row and `task.created` audit event transactionally.

### Phase 4 — transactional task status and timer commands

- `PATCH /api/workspaces/:workspaceId/tasks/:taskId` updates whitelisted task fields with required `expectedVersion` optimistic concurrency.
- Completed-task status rules are enforced server-side; only Owner/Admin can reopen `done -> doing`.
- Completion finalizes the timer as `completed`, except a previously manual-stopped timer stays manual-stopped.
- Reopen restores the timer to `paused` without losing elapsed time.
- Timer `start`, `pause`, and `stop` commands are server-authorized and audited.
- Starting a timer auto-pauses another running timer in the same workspace and settles its elapsed time.
- Workspace row locking serializes task/timer mutation transactions and avoids competing-start deadlocks.
- A manually stopped timer cannot restart through the normal start command.
- All task/timer mutation audits use the authenticated session user as actor.

Run validation:

```bash
cd backend
npm ci --ignore-scripts
npm audit --audit-level=high
npm test
npm run check
```

## Security boundary

The backend resolves the authenticated user exclusively from a server-side session, loads memberships from PostgreSQL, and authorizes workspace/project/task operations from server-owned data. Client-provided `currentUserId`, workspace role, project role, or other authority claims are never trusted.

The existing browser roles remain UX hints only until the webapp is migrated to this API.

## Intentional current limits

- A concrete PostgreSQL driver package and production pool bootstrap are not pinned yet; repository and migration code accept a pg-compatible pool so hosting/provider selection stays separate.
- PostgreSQL SQL is not yet exercised in CI against a real PostgreSQL service; current repository tests use adapters/mocks.
- The in-memory authentication rate limiter is suitable for one process only. Multi-instance production deployment requires shared rate-limit storage.
- Task comments, task deletion, project/member mutations, and production deployment are not exposed yet.
- The webapp still uses its local-first storage and local identity model.

## Next backend phase

1. Pin the concrete PostgreSQL driver and add environment/config validation plus pool bootstrap.
2. Add PostgreSQL-backed CI integration tests that execute all migrations and task/timer transactions against a real database.
3. Add task comments and task deletion with server-side authorization and audit events.
4. Add project/member mutation endpoints and ownership invariants.
5. Add session cleanup and production-grade distributed auth throttling strategy.
6. Only after the API is stable, migrate `webapp/` from local identity/authorization to server sessions and API data.

## Deployment note

GitHub Pages remains a static frontend host and cannot host this backend. Production should use HTTPS and a dedicated Julo origin/domain arrangement. The API/database hosting target remains provider-neutral until the deployment phase.
