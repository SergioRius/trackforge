# Specifications

## Purpose

Build and maintain a destination music library optimized for portable media players.

---

# Configuration

The application uses fixed directories mounted as Docker volumes:

- `/library` — Read-only source library
- `/destination` — Managed destination library
- `/config` — Application configuration

Runtimes settings stored in `/config/config.json`:

Example:

```json
{
  "compilationsDirectory": "Compilations",
  "maxLibrarySizeGb": 64
}
```

---

# Album Copy Workflow

## Input

User selects one or more album directories or artist folders from source via `+` buttons.

Selecting an artist folder copies all albums under it recursively.

Example:

Rock/
└── Queen/
    └── 1986 - A Kind Of Magic/

## Output

Destination hierarchy must be preserved. Duplicate detection prevents re-copying existing albums.

Example:

Destination/
└── Rock/
    └── Queen/
        └── 1986 - A Kind Of Magic/

Missing parent folders must be created.

Existing folders must not be removed.

Albums already present in destination are grayed out and cannot be re-selected.

---

## Metadata Normalization During Copy

After copying:

For every track:

Title:

07 - One Vision

Generated from:

Track Number
Title

First should check if the track number is already present, and trim it before adding the new track number to avoid repeating. Ex: 01 - 01 - Bohemian Rhapsody.mp3 is bad.

Track number must be zero padded.

Track number metadata must remain unchanged except formatting improvements when supported.

Filename must remain unchanged.

Album metadata must remain unchanged.

---

# Compilation Workflow

Compilations are created from individual tracks selected from the source tree.

Users can:

- Select individual tracks via `+` buttons
- Add all tracks from an album via album `+` button
- Add all tracks from a directory via directory `+` button
- Reorder tracks via drag-and-drop on grip handle
- Remove tracks individually or batch (via checkboxes)

Example:

Road Trip 2026

Output:

Compilations/
└── Road Trip 2026/

---

## Compilation Metadata

Track 1:

Filename:

01 - Bohemian Rhapsody.mp3

Title:

01 - Bohemian Rhapsody

Existing track number prefixes must be stripped before adding the new number to avoid duplication (e.g., "01 - 01 - Bohemian Rhapsody").

Track Number:

01

Album:

Road Trip 2026

All tracks must follow the same pattern.

---

# Normalization Workflow

Users may normalize any destination folder.

Mode is determined automatically.

Rule:

If first-level directory equals configured compilation directory:

Compilation Mode

Else:

Album Mode

---

## Album Mode

Modify:

- Title metadata

Do not modify:

- Filename
- Album
- Artist

---

## Compilation Mode

Modify:

- Filename
- Title
- Track Number
- Album

---

# Destination Management

Users may:

- Browse destination with full hierarchy (directories, albums, individual files)
- Select any level for actions
- Delete folders, albums, or individual files
- Normalize folders and albums

Deletion never affects source.

---

# Capacity Management

The destination library size is limited.

Before operations:

Current Size + Incoming Size <= Configured Limit

If exceeded:

Operation must be rejected.

No partial copies allowed.

---

# Preview Mode

Before execution:

Display:

- Files affected
- Estimated size
- Metadata changes
- Destination path

User confirms execution.

---

# Supported Formats

Initial support:

- MP3
- FLAC
- M4A

Unsupported formats may be copied unchanged.

---
---

# API Requirements

Base path:

/api

---

GET /source/tree

Returns source hierarchy.

---

POST /albums/copy

Copies selected albums.

---

POST /compilations

Creates compilation.

---

POST /normalize

Normalizes destination folder.

---

DELETE /destination/folder

Deletes destination folder.

---

GET /destination/tree

Returns destination hierarchy.

---

GET /capacity

Returns:

- Used space
- Limit
- Available space

---

GET /settings

Returns current settings.

---

PUT /settings

Updates settings.

---
---

# User Interface

The application is UI-first.

---

## Main Navigation

- Dashboard
- Album Copy
- Compilation Builder
- Destination Library
- Settings

---

## Dashboard

Displays:

- Destination usage
- Capacity limit
- Album count
- Compilation count

---

## Album Copy

Left panel:

Source tree with lazy-loaded hierarchy (expand to load children).

Right panel:

Selected albums and folders.

Features:

- `+` button on each album or folder to add to selection.
- Artist folders expand to all albums for batch copy.
- Duplicate detection grays out albums already in destination.
- Resizable divider between panels (persisted).

---

## Compilation Builder

Left:

Source browser with `+` buttons at directory, album, and track levels.

Center:

Compilation track list with drag-and-drop reorder, checkboxes, and batch operations.

Features:

- `+` button on directory adds all tracks from all albums under it.
- `+` button on album adds all tracks from that album.
- `+` button on individual track adds just that track.
- Grip handle for drag-and-drop reordering.
- Check-all, uncheck-all, remove selected batch operations.
- Resizable divider between panels (persisted).

---

## Destination Library

Tree browser with full hierarchy: directories, albums, and individual files.

Actions:

- Click folder, album, or file to select.
- Delete any selected item.
- Normalize selected folders/albums.

---

## Settings

Editable:

- Compilation directory name
- Capacity limit

Changes saved immediately.

---

## Design

Use modern responsive design.

Use shadcn/ui.

Use dark mode support.

Desktop-first.

Mobile usable but not primary target.

---

# Deployment

The application runs as a single Docker container with three volume mounts and configurable user/group via PUID/PGID.

Container runs as non-root user (default PUID=1000, PGID=1000).

Port: 8080

Image: trackforge:latest
