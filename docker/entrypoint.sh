#!/bin/sh

PUID=${PUID:-1000}
PGID=${PGID:-1000}

# Create group if it doesn't exist with the target GID
if ! getent group "$PGID" >/dev/null 2>&1; then
    addgroup -g "$PGID" appgroup
fi

GROUP_NAME=$(getent group "$PGID" | cut -d: -f1)

# Create user if it doesn't exist with the target UID
if ! getent passwd "$PUID" >/dev/null 2>&1; then
    adduser -D -u "$PUID" -G "$GROUP_NAME" appuser
fi

USER_NAME=$(getent passwd "$PUID" | cut -d: -f1)

# Fix ownership
chown -R "$PUID:$PGID" /app /config /destination 2>/dev/null || true

# Run as the target user
exec su-exec "$USER_NAME" node src/backend/dist/presentation/server.js
