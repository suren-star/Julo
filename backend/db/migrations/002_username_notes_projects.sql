BEGIN;

ALTER TABLE users ADD COLUMN username_normalized text;
ALTER TABLE users ADD CONSTRAINT users_username_normalized_check CHECK (
  username_normalized IS NULL OR (
    username_normalized = lower(username_normalized)
    AND username_normalized ~ '^[a-z0-9][a-z0-9._-]{2,31}$'
  )
);
CREATE UNIQUE INDEX users_username_normalized_unique
  ON users(username_normalized)
  WHERE username_normalized IS NOT NULL;

ALTER TABLE tasks
  ADD COLUMN tags text[] NOT NULL DEFAULT ARRAY[]::text[];

CREATE TABLE notes (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  reminder_date date NOT NULL,
  label text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','converted')),
  converted_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  CHECK (char_length(title) BETWEEN 1 AND 500),
  CHECK (char_length(description) <= 20000),
  CHECK (char_length(label) <= 200)
);
CREATE INDEX notes_workspace_date_idx ON notes(workspace_id, reminder_date, updated_at DESC);
CREATE UNIQUE INDEX notes_converted_task_unique ON notes(converted_task_id) WHERE converted_task_id IS NOT NULL;

ALTER TABLE tasks ADD COLUMN source_note_id uuid REFERENCES notes(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX tasks_source_note_unique ON tasks(source_note_id) WHERE source_note_id IS NOT NULL;

COMMIT;
