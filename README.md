# TrackForge

Build and maintain a portable music library from a read-only master collection.

TrackForge is a self-hosted web application that lets you curate a subset of your music library optimized for portable players, car systems, or any storage-constrained device. It operates from a read-only source, so your master collection is never touched.

This is a small project I did for myself as training in AI agents based programming, and I thought I could take advantage of it to do something that would help me, for example to transfer a subset of my music library to my Tesla. In the car I use a project called [TeslaUsb](https://github.com/marcone/teslausb) (which I recommend even if you don't have a Tesla), which allows, among other things, to keep the car's music synchronized with a network folder.

---

## Features

- **Album Copy** — Browse your source library and copy complete albums or entire artists folders, preserving the original folder hierarchy. Albums already present in the destination are grayed out to prevent duplicates.
- **Compilation Builder** — Select individual tracks from any album or directory, reorder them via drag-and-drop, and export as a numbered compilation with normalized metadata.
- **Metadata Normalization** — Automatically cleans up track titles and filenames for compatibility with portable player systems (e.g. Adds track names to titles to preserve ordering). Runs on copy and is also available manually on any destination folder.
- **Capacity Management** — Set a size limit for the destination library. Operations that would exceed it are rejected before execution.
- **Destination Browser** — Browse the destination down to individual files. Delete or normalize any item.

---

## Quick Start

### Docker

```bash
docker run \
  -d \
  --name trackforge \
  -p 8080:8080 \
  -e PUID=1000 \
  -e PGID=1000 \
  -v /path/to/library:/library:ro \
  -v /path/to/destination:/destination \
  -v /path/to/config:/config \
  ghcr.io/SergioRius/trackforge:latest
```

### Docker Compose

```yaml
services:
  trackforge:
    image: ghcr.io/SergioRius/trackforge:latest
    container_name: trackforge
    ports:
      - "8080:8080"
    volumes:
      - /path/to/library:/library:ro
      - /path/to/destination:/destination
      - /path/to/config:/config
    environment:
      - PUID=1000
      - PGID=1000
    restart: unless-stopped
```

Open `http://localhost:8080` once the container is running.

---

## Volumes

| Mount | Mode | Purpose |
|-------|------|---------|
| `/library` | read-only | Source music library. Never modified. |
| `/destination` | read-write | Managed output library. |
| `/config` | read-write | Application configuration. |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PUID` | `1000` | User ID for file ownership in destination. |
| `PGID` | `1000` | Group ID for file ownership in destination. |

---

## Configuration

Settings are stored in `/config/config.json` and editable from the Settings page in the UI.

```json
{
  "compilationsDirectory": "Compilations",
  "maxLibrarySizeGb": 64
}
```

- `compilationsDirectory` — First-level folder name used to identify compilations in the destination.
- `maxLibrarySizeGb` — Hard limit for total destination size in GB.

---

## Supported Formats

- MP3
- FLAC
- M4A

Unsupported formats are copied without normalization.

---

## Development

### Requirements

- Node.js 22+
- npm 10+

### Install

```bash
npm install
```

### Run (dev mode)

```bash
npm run dev          # backend + frontend
npm run dev:backend  # backend only
npm run dev:frontend # frontend only
```

### Build & Run (production)

```bash
npm run build
npm run start
```

### Tests

```bash
npm test                  # all tests
npm run test:coverage     # with coverage report
npm run test:integration  # integration tests only
npm run test:watch        # watch mode
```

### Lint & Format

```bash
npm run lint
npm run lint:fix
npm run format:check
npm run format
```

---

## Architecture

Clean Architecture with four layers: Presentation → Application → Domain → Infrastructure.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for details.

---

## License

TrackForge is licensed under the PolyForm Noncommercial License 1.0.0.

You may use, modify, and redistribute this software for non-commercial purposes only. Copyright and license notices must be preserved.

Commercial use, including selling the software, integrating it into commercial products, or offering it as a paid service, is not permitted.

See [LICENSE](LICENSE) for the full license text.

Copyright (c) 2026 Sergio Rius (https://github.com/SergioRius/TrackForge)