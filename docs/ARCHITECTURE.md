# Julo application flow

This file defines the single supported development sequence for the backend-enabled web application.

## Browser flow

1. GitHub Pages serves the root application or the physical `/login/index.html` direct-route shell.
2. Both entries load the same `src/main.jsx` application code.
3. `/login` mounts `AuthGateway`; other routes mount the current local-first `App` directly.
4. `AuthGateway` restores the server session, resolves the first accessible workspace, and then renders the shared application plus server-backed task, note, and project-team surfaces.
5. All server calls go through `src/lib/api-client.js` with `credentials: include`.

`login/index.html` is not a second application. It exists only because GitHub Pages needs a physical direct-route entry for `/Julo/login` and refreshes on that path.

## Backend flow

1. `src/runtime.js` validates environment configuration, opens PostgreSQL, applies migrations, optionally seeds development test users, creates the application, and starts HTTP.
2. `src/app.js` composes one repository contract, the task mutation repository, domain services, and the HTTP server.
3. `src/http/server.js` authenticates the session and routes requests to services. It does not own business permissions.
4. Services own validation and authorization. Shared rules live in `domain/service-validation.js` and `services/access-context.js`.
5. PostgreSQL repositories own persistence and transactions. Shared transaction behavior lives in `db/transaction.js`.
6. Database constraints remain the final consistency boundary.

## Task invariants

Every server-created task, including a task created from a Note, follows the same rules:

- `created_by` comes from the authenticated session and is immutable.
- A task has one or more selected assignees.
- Exactly one selected assignee is primary.
- Assignees must be eligible in the workspace/project scope.
- Task updates use optimistic `expectedVersion` checks.
- Status transitions are validated server-side.
- At most one timer is running in a workspace; starting another pauses the previous timer.

The web client mirrors these rules only for user experience. The backend remains authoritative.

## Test environment

The five requested development identities are seeded only when both test-seed environment guards allow it. Task cleanup is not part of runtime startup and must not be reintroduced as an environment-driven boot hook.

## Transitional boundary

The main legacy board is still local-first and uses `storage.js`, `permissions.js`, and `task-timer.js`. Those modules are retained intentionally until the board is migrated to the server task API. They must not be treated as the source of truth for backend authorization.

When that migration is implemented, remove the local task persistence/permission path in the same change rather than maintaining two permanent task engines.
