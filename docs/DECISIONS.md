# Architectural Decisions

This document records architectural and product decisions that have already been made.

These decisions should not be revisited unless there is a compelling technical reason.

---

# ADR-001

## Runtime Platform

Decision:

Use Node.js and TypeScript.

Reasoning:

* Strong ecosystem for metadata processing.
* Fast development cycle.
* Excellent React integration.
* Large contributor base.

Status:

Accepted

---

# ADR-002

## Frontend Stack

Decision:

Use React with Vite.

Reasoning:

* Fast development experience.
* Modern tooling.
* Good compatibility with TypeScript.

Status:

Accepted

---

# ADR-003

## Backend Framework

Decision:

Use Fastify.

Reasoning:

* Lightweight.
* High performance.
* Excellent TypeScript support.

Status:

Accepted

---

# ADR-004

## Architecture Style

Decision:

Use Clean Architecture.

Reasoning:

* Clear separation of responsibilities.
* Easier testing.
* Better long-term maintainability.

Status:

Accepted

---

# ADR-005

## Database

Decision:

No database.

Reasoning:

* Application state is minimal.
* Direct filesystem operations are primary.
* Reduces complexity.

Status:

Accepted

---

# ADR-006

## Source Library

Decision:

Source library is read-only.

Reasoning:

* Source is the system of record.
* Prevents accidental modifications.

Rules:

* Never write to source.
* Never rename source files.
* Never modify source metadata.
* Never delete source files.

Status:

Accepted

---

# ADR-007

## Destination Library

Decision:

Destination is fully managed by the application.

Reasoning:

* Destination exists only for portable player compatibility.
* Files may be modified safely.

Allowed:

* Copy
* Rename
* Metadata updates
* Deletion

Status:

Accepted

---

# ADR-008

## Network Filesystems

Decision:

No SMB or NFS support.

Reasoning:

* Directories are mounted externally by Docker.
* Network mounting is outside application scope.

Status:

Accepted

---

# ADR-009

## Compilation Detection

Decision:

Compilations are identified by a configurable first-level directory.

Default:

Compilations

Example:

Destination/
├── Rock/
├── Jazz/
└── Compilations/

Reasoning:

* Simple.
* Predictable.
* No additional metadata storage required.

Status:

Accepted

---

# ADR-010

## Metadata Normalization

Decision:

Normalization occurs automatically during copy operations.

Additionally:

Users may manually normalize destination folders.

Reasoning:

* Ensures destination remains compatible with portable players.
* Supports existing destination libraries.

Status:

Accepted

---

# ADR-011

## Capacity Management

Decision:

Destination library size is limited.

Operations exceeding the configured limit are rejected.

Reasoning:

* Destination may target storage-constrained portable players.
* Prevents invalid library creation.

Status:

Accepted

---

# ADR-012

## User Interface

Decision:

The web interface is the primary user experience.

Reasoning:

* Application is intended for interactive use.
* All major features must be available from the UI.

Status:

Accepted

---

# ADR-013

## Testing

Decision:

Business logic requires automated tests.

Required:

* Unit tests
* Integration tests

Reasoning:

* Filesystem operations are safety-critical.
* Metadata transformations must be reliable.

Status:

Accepted
