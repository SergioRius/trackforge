# Architecture

## Style

Clean Architecture

---

## Layers

### Domain

Business rules.

Entities:

- Track
- Album
- Compilation
- Library

Value Objects:

- TrackNumber
- LibraryPath
- CapacityLimit

---

### Application

Use cases:

- ScanSourceLibrary
- CopyAlbums
- CreateCompilation
- NormalizeFolder
- DeleteDestinationFolder
- CalculateLibrarySize
- ValidateCapacity

---

### Infrastructure

Implementations:

Filesystem

Metadata readers/writers

Configuration storage

Logging

---

### Presentation

REST API

React SPA

---

# Folder Structure

src/

backend/
application/
domain/
infrastructure/
presentation/

frontend/
components/
pages/
hooks/
services/

shared/
types/

tests/

---

# Dependency Rule

Presentation
↓
Application
↓
Domain

Infrastructure implements interfaces defined by Domain/Application.