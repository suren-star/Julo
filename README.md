# Julo

Julo is a local-first desktop planner built with Electron. The current codebase includes task management, projects and sections, subtasks, Today and timeline views, recurring tasks, reminders, notes, attachments, time tracking, multiple local vaults, and backup/import/export.

## Development status

Julo is currently being stabilized for a public beta.

- `main` — preserved baseline imported from the original Planer codebase.
- `beta-dev` — active development branch for the Julo beta.
- Cloud synchronization is intentionally disabled in the current beta baseline.
- The sync layer remains provider-agnostic so a future cloud backend can be added without coupling Julo to Mail.ru/WebDAV.

## Run locally

Requirements: Node.js 22+ and npm.

```bash
npm ci
npm start
```

## Validate source

```bash
npm run check
```

The same validation runs in GitHub Actions on pushes and pull requests.

## Windows build

```bash
npm run build
```

The packaged application is produced under `dist/` with the Julo executable name. The internal package name has intentionally not been changed yet because data-path migration from existing Planer installations must be handled before that rename is safe.

## Data safety

Julo stores its working data locally. The existing storage layer uses atomic JSON writes and `.bak` recovery files. Before beta release we will add explicit schema/version migration checks and automated regression coverage for storage and vault operations.
