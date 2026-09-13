# Julo Backend Foundation

This directory starts Julo's server-side security boundary. It is intentionally separate from `webapp/` so the current local-first beta keeps working while the backend is built and validated in phases.

## Phase 1 (this foundation)

Implemented now:

- PostgreSQL schema for users, credentials, sessions, workspaces, memberships, projects, project-scoped guest roles, tasks, comments, task timers, and audit events.
- Server-owned workspace roles and project roles matching the existing Julo product semantics.
- Authorization helpers for workspace and project actions.
- Completed-task reopen policy: only Owner/Admin may move `done -> doing`; `done -> todo` is rejected.
- Password hashing primitive based on Node `crypto.scrypt` with per-password random salts.
- Opaque session tokens where only a SHA-256 digest is intended to be persisted.
- Secure `__Host-` HttpOnly session-cookie defaults.
- Database-level partial unique index that permits at most one `running` timer per workspace.
- Node built-in tests with no runtime dependencies yet.

Run:

```bash
cd backend
npm test
npm run check
```

## Security boundary

The backend must resolve the authenticated user from a server-side session, load memberships from the database, and authorize every workspace/project/task access. It must never accept `currentUserId`, workspace role, or project role from the client as an authority.

The browser's existing roles remain UX hints only until the webapp is migrated to the API.

## Next backend phase

1. Add PostgreSQL connection/repository adapter and migration runner.
2. Add HTTP API transport and explicit origin/CORS policy.
3. Add register/login/logout/session endpoints, login throttling, and session revocation.
4. Add workspace/project/task repositories that load authorization context from the database.
5. Add transactional task status/timer commands and audit events.
6. Add integration tests against PostgreSQL.
7. Only after the API is stable, migrate `webapp/` from local identity/authorization to server sessions and API data.

## Deployment note

GitHub Pages remains a static frontend host and cannot host this backend. The API/database deployment target is intentionally not provider-locked yet. A production deployment should use a dedicated Julo domain/origin arrangement and HTTPS.
