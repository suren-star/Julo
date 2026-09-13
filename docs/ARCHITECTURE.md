# Julo application flow

This file defines the single supported development sequence for the backend-enabled web application.

## Browser flow

1. GitHub Pages serves the root application or the physical `/login/index.html` direct-route shell.
2. Both entries load the same `src/main.jsx` application code.
3. Every route enters through `AuthGateway`; there is no unauthenticated/local-first Board path.
4. `AuthGateway` restores the server session, resolves the first accessible workspace, and renders `App` with the authenticated workspace and user.
5. `App` is the canonical Board UI. Projects and tasks are loaded from the backend API and PostgreSQL.
6. Notes and Owner/Admin/Member project-team management are auxiliary drawers in the same authenticated shell.
7. All server calls go through `src/lib/api-client.js` with `credentials: include`.

`login/index.html` is not a second application. It exists only because GitHub Pages needs a physical direct-route entry for `/Julo/login` and refreshes on that path.

The browser may retain the visual theme preference in localStorage. Tasks, projects, roles, comments, timers and assignments must never use browser storage as an authoritative data source.

## Backend flow

1. `src/runtime.js` validates environment configuration, opens PostgreSQL, applies migrations, optionally seeds development test users, creates the application, and starts HTTP.
2. `src/app.js` composes one repository contract, the task mutation repository, domain services, and the HTTP server.
3. `src/http/server.js` authenticates the session and routes requests to services. It does not own business permissions.
4. Services own validation and authorization. Shared rules live in `domain/service-validation.js` and `services/access-context.js`.
5. PostgreSQL repositories own persistence and transactions. Shared transaction behavior lives in `db/transaction.js`.
6. Database constraints remain the final consistency boundary.

## Canonical Board task flow

The Board reads server tasks and projects. All mutations return to the same server model:

- create task -> `POST /api/workspaces/:workspaceId/tasks`; the requested initial status is validated and persisted in the same transaction;
- edit metadata, status, project, tags or assignments -> versioned task `PATCH`;
- drag/drop status -> the same versioned task `PATCH`;
- add comment -> task comments API;
- start/pause/stop timer -> task timer command API;
- delete task -> versioned task `DELETE`;
- create/rename/archive project -> project APIs.

The task Project selector may call the same project-create API and then select the newly created project. It must not maintain a second project store or task creation path.

The former local task storage, permission and timer engines are removed. Do not reintroduce a second Board task state machine.

## Task invariants

Every server-created task, including a task created from a Note, follows the same rules:

- `created_by` comes from the authenticated session and is immutable;
- a task has one or more selected assignees;
- exactly one selected assignee is primary;
- assignees must be eligible in the workspace/project scope;
- project changes revalidate the existing assignees in the destination project;
- task updates and deletion use optimistic `expectedVersion` checks;
- status transitions are validated server-side;
- a newly created `done` task is persisted as completed in the same transaction, including a completed/stopped timer state;
- completed tasks can be reopened only by Owner/Admin;
- comments are permission checked server-side;
- at most one timer is running in a workspace; starting another pauses the previous timer;
- server task list responses include creator, assignees, comments and timer state for the Board.

The web client mirrors authorization only to hide or disable controls. The backend remains authoritative.

## Role boundary

Workspace roles are `owner`, `admin`, `member`, `viewer`, `guest`. A user may also have a project role `manager`, `editor` or `viewer` on a specific project.

Project roles add project-scoped capabilities; they never remove capabilities already granted by the workspace role. For example, a workspace Viewer who is Project Manager can manage tasks inside that project, while remaining a Viewer elsewhere.

Project-team assignment follows a strict workspace-role hierarchy:

- Owner can assign project roles to Admin, Member, Viewer and Guest users;
- Admin can assign project roles to Member, Viewer and Guest users;
- Member can assign project roles to Viewer and Guest users;
- Viewer and Guest cannot assign project roles;
- no role can assign or modify a project role for a peer or a higher workspace role.

Viewer and Guest users with Project Manager or Editor roles may be task assignees inside that project. If such a user is already assigned to project tasks, their project access must not be reduced to Project Viewer or removed until those tasks are reassigned. A project with assignees who are not eligible outside that project must be cleaned up before the project can be archived and its tasks moved to no project.

The Board must use the server-returned workspace/project roles and never derive elevated permissions from client-owned data.

## Test environment

The five requested development identities are seeded only when both test-seed environment guards allow it. Task cleanup is not part of runtime startup and must not be reintroduced as an environment-driven boot hook.

## Development rule

When adding a task feature, extend the existing server Task model, API client and Board UI in the same flow. Do not add a parallel localStorage task implementation or a second task drawer.
