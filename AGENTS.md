# AGENTS.md

## Project Name

TrackForge

## Documentation Priority

When documents disagree:

1. ./AGENTS.md
2. ./docs/SPECS.md
3. ./docs/ARCHITECTURE.md
4. ./docs/DECISIONS.md
5. ./docs/ROADMAP.md

Higher priority documents always win.

---
---

## Project Overview

TrackForge is a self-hosted web application designed to build and maintain a portable-player-compatible music library from a read-only master music collection.

The application is deployed as a single Docker container running as a non-root user (configurable via PUID/PGID).

The source library (mounted at `/library`) is considered the source of truth and must never be modified.

The destination library (mounted at `/destination`) is a generated and managed copy optimized for portable media players.

Configuration is stored at `/config`.

No database is used.

---

## Core Principles

### Never modify source

The source directory is mounted read-only.

The application must never:

- Write to source.
- Rename files in source.
- Delete files in source.
- Modify metadata in source.

### Destination is disposable

Destination content may be:

- Created
- Modified
- Renamed
- Deleted

All transformations happen only inside destination.

### Simplicity first

Avoid unnecessary infrastructure.

Do not introduce:

- SQL databases
- Redis
- Message queues
- SMB clients
- NFS clients
- Cloud dependencies

Directories are already mounted by Docker.

Use local filesystem access only.

---

## Architecture Requirements

Use Clean Architecture.

Layers:

1. Presentation
2. Application
3. Domain
4. Infrastructure

Dependencies must point inward.

Forbidden:

UI → Filesystem

Required:

UI → API → Application → Domain → Infrastructure

---

## Technology Stack

### Backend

- Node.js LTS
- TypeScript
- Fastify

### Frontend

- React
- TypeScript
- Vite
- Tailwind
- shadcn/ui

### Validation

- Zod

### Testing

- Vitest
- React Testing Library
- Integration tests

---

## Functional Areas

### Source Browser

Browse source music hierarchy.

### Album Copy

Copy complete albums or entire folder hierarchies preserving structure.

- Supports selecting individual albums or entire artist folders (copies all albums recursively).
- Destination duplicate detection prevents re-copying existing albums.
- Uses `AlbumTree` component with `+` button for selection.

### Compilation Builder

Create custom compilations from individual tracks.

- Select tracks via `+` buttons at directory, album, or track level.
- Drag-and-drop reordering via grip handle in the compilation list.
- Batch operations: check-all, uncheck-all, remove selected.
- Uses `TrackSelectionTree` component with checkboxes on tracks.

### Destination Browser

Browse generated destination library with full hierarchy: directories, albums, and individual files.

- Supports selecting any level for deletion or normalization.
- Uses `DestinationTree` component.
- Track-level visibility with green file icons.

### Normalization

Normalize metadata and filenames for portable player compatibility.

### Capacity Management

Prevent destination from exceeding a configured size limit.

---

## Coding Rules

### TypeScript

Strict mode enabled.

No any.

No ts-ignore unless documented.

### Error Handling

Never swallow exceptions.

Return structured errors.

### Logging

Structured JSON logging.

### File Operations

All file operations must be:

- Atomic when possible
- Recoverable
- Logged

### Security

Validate all paths.

Prevent path traversal.

Never trust client-supplied paths.

---

## User Experience

The UI is the primary interface.

Do not build a backend-first application.

Every feature must include UI support.

No placeholder pages.

No "future UI".

---

## Performance

Do not load entire libraries into memory.

Use lazy loading via shallow directory scanning.

Tree components fetch children on demand when expanding nodes.

Support large collections.

---

## Acceptance Criteria

A feature is complete only when:

- Backend implemented
- UI implemented
- Tests implemented
- Documentation updated

---
---

# Testing Requirements

## Unit Tests

Required for:

- Naming rules
- Capacity validation
- Path validation
- Metadata normalization

Target:

80%+ coverage in domain and application layers.

---

## Integration Tests

Required for:

- Album copy
- Compilation creation
- Folder normalization
- Folder deletion

Use temporary directories.

Never require real libraries.

---

## Frontend Tests

Required for:

- Forms
- Navigation
- Track selection
- Compilation ordering

---

## End-to-End

Optional future phase.

Playwright recommended.

---
---

# Deployment Reference

## Docker Run

```bash
docker run \
  -d \
  --name trackforge \
  -p 8080:8080 \
  -e PUID=1000 \
  -e PGID=1000 \
  -v /library:/library:ro \
  -v /portable:/destination \
  -v /trackforge-config:/config \
  trackforge
```

## Docker Compose

```yaml
services:
  trackforge:
    image: trackforge:latest
    container_name: trackforge
    ports:
      - "8080:8080"
    volumes:
      - /library:/library:ro
      - /portable:/destination
      - /trackforge-config:/config
    environment:
      - PUID=1000
      - PGID=1000
    restart: unless-stopped
```

## Volumes

| Mount | Mode | Purpose |
|-------|------|---------|
| `/library` | read-only | Source music library (never modified) |
| `/destination` | read-write | Managed output library |
| `/config` | read-write | Application configuration |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PUID` | `1000` | User ID for file ownership |
| `PGID` | `1000` | Group ID for file ownership |

---

# Folder Structure Examples

## Source → Destination (Album Copy)

```
Source:
Rock/
└── Queen/
    └── 1986 - A Kind Of Magic/

Destination:
Rock/
└── Queen/
    └── 1986 - A Kind Of Magic/
```

## Compilation Output

```
Compilations/
└── Road Trip 2026/
    ├── 01 - Bohemian Rhapsody.mp3
    ├── 02 - Don't Stop Me Now.mp3
    └── 03 - Under Pressure.mp3
```

## Destination with Mixed Content

```
Destination/
├── Rock/
├── Jazz/
└── Compilations/
    └── Road Trip 2026/
```

---

## Critical rules (must follow)

- Never infer or fabricate:
  - user names
  - email addresses
  - repository names
  - Git handles
  - configuration values

If missing → ask explicitly.

- Always read existing git configuration before changing it:
  - git config user.name
  - git config user.email
  - git config --global user.name
  - git config --global user.email

- Never modify global git configuration (--global) without explicit user request.

- Never run git commit with assumed identity.
  If identity is required and not explicitly provided, stop and ask.

- Never execute destructive or state-changing commands without showing them first and requesting confirmation:
  - git push
  - git reset
  - git commit --amend
  - docker push
  - any remote operation

- Treat GitHub, Gitea, GitLab, GHCR and external services as production systems.