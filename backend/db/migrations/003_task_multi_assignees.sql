BEGIN;

CREATE TABLE task_assignees (
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES users(id),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, user_id),
  FOREIGN KEY (workspace_id, user_id)
    REFERENCES workspace_memberships(workspace_id, user_id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX task_assignees_one_primary_per_task
  ON task_assignees(task_id)
  WHERE is_primary = true;

CREATE INDEX task_assignees_user_idx
  ON task_assignees(workspace_id, user_id, task_id);

INSERT INTO task_assignees (task_id, workspace_id, user_id, assigned_by, is_primary)
SELECT id, workspace_id, assignee_user_id, created_by, true
FROM tasks
WHERE assignee_user_id IS NOT NULL
ON CONFLICT (task_id, user_id) DO UPDATE
SET is_primary = true,
    updated_at = now();

COMMIT;
