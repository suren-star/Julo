# Julo

Julo is a local-first desktop productivity and task management app built with Electron. The current codebase includes task management, projects and sections, subtasks, Today and timeline views, recurring tasks, reminders, notes, attachments, time tracking, multiple local vaults, and backup/import/export.

## Development status

Julo is being stabilized for a public beta.

- `main` — preserved baseline imported from the original Planer codebase.
- `beta-dev` — active development branch for the Julo beta.
- Current beta version: `0.1.0-beta.1`.
- Cloud synchronization is intentionally disabled until a new provider is selected.
- The sync layer remains provider-agnostic so a future backend can be added without coupling Julo to Mail.ru/WebDAV.

## Run locally

Requirements: Node.js 22+ and npm.

```bash
npm ci
npm start
```

## Validate source

```bash
npm run check
npm test
```

GitHub Actions runs dependency installation, syntax validation, and regression tests on beta development changes.

## Windows build

```bash
npm run build
```

The package identity and Windows executable are now `Julo`.

## Data and profile migration

Julo uses its own Electron profile under `%APPDATA%/Julo` on Windows. On the first Julo start, if a legacy Planer profile is found, Julo performs a non-destructive migration:

- local data and backup directories are copied into the Julo profile;
- vault paths that pointed inside the legacy Planer data directory are rewritten to the matching Julo data directory;
- vaults stored at custom/external paths are left untouched;
- the original Planer profile is not deleted or modified;
- a migration marker prevents the profile copy from being repeated on later launches.

Stored Julo data now has an explicit schema version. Schema migration preserves tasks and ordinary settings, removes retired `settings.webdav` configuration/credentials, strips runtime-only `_vaultInfo`, and reserves a neutral `settings.sync` object for a future provider.

## Data safety

Working data is local-first. Writes use atomic JSON replacement and `.bak` recovery files. Migration behavior is covered by automated regression tests, including legacy WebDAV cleanup, idempotent schema migration, and Windows vault path rewriting.
