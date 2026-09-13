BEGIN;

CREATE TABLE users (
  id uuid PRIMARY KEY,
  email_normalized text NOT NULL UNIQUE,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz,
  CHECK (email_normalized = lower(email_normalized)),
  CHECK (char_length(email_normalized) BETWEEN 3 AND 320),
  CHECK (char_length(display_name) BETWEEN 1 AND 160)
);

CREATE TABLE user_credentials (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  password_changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CHECK (expires_at > created_at)
);
CREATE INDEX sessions_user_active_idx ON sessions(user_id, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE workspaces (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (char_length(name) BETWEEN 1 AND 160)
);

CREATE TABLE workspace_memberships (
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','member','viewer','guest')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);
CREATE INDEX workspace_memberships_user_idx ON workspace_memberships(user_id, workspace_id) WHERE status = 'active';

CREATE TABLE projects (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CHECK (char_length(name) BETWEEN 1 AND 200)
);
CREATE INDEX projects_workspace_idx ON projects(workspace_id, created_at);

CREATE TABLE project_memberships (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('manager','editor','viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (workspace_id, user_id)
    REFERENCES workspace_memberships(workspace_id, user_id)
    ON DELETE CASCADE
);
CREATE INDEX project_memberships_user_idx ON project_memberships(user_id, workspace_id, project_id);

CREATE TABLE tasks (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','doing','done')),
  execution_type text CHECK (execution_type IN (
    'review_report','execute','prepare_letter','organize_meeting','prepare_documents','acknowledge'
  )),
  due_date date,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
  assignee_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  CHECK (char_length(title) BETWEEN 1 AND 500),
  CHECK (char_length(description) <= 20000)
);
CREATE INDEX tasks_workspace_status_idx ON tasks(workspace_id, status, updated_at DESC);
CREATE INDEX tasks_project_idx ON tasks(workspace_id, project_id, updated_at DESC);
CREATE INDEX tasks_assignee_idx ON tasks(workspace_id, assignee_user_id, status);

CREATE TABLE task_comments (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES users(id),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  CHECK (char_length(body) BETWEEN 1 AND 10000)
);
CREATE INDEX task_comments_task_idx ON task_comments(task_id, created_at, id);

CREATE TABLE task_timers (
  task_id uuid PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'idle' CHECK (state IN ('idle','running','paused','stopped')),
  elapsed_ms bigint NOT NULL DEFAULT 0 CHECK (elapsed_ms >= 0),
  started_at timestamptz,
  stopped_at timestamptz,
  stop_reason text CHECK (stop_reason IN ('manual','completed')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((state = 'running' AND started_at IS NOT NULL) OR state <> 'running')
);
CREATE UNIQUE INDEX task_timers_one_running_per_workspace
  ON task_timers(workspace_id)
  WHERE state = 'running';

CREATE TABLE audit_events (
  id bigserial PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (char_length(action) BETWEEN 1 AND 160),
  CHECK (char_length(entity_type) BETWEEN 1 AND 80)
);
CREATE INDEX audit_events_workspace_idx ON audit_events(workspace_id, created_at DESC, id DESC);

COMMIT;
