#!/bin/sh
set -e
# Writable uploads dir on Docker named volumes (often root-owned); app runs as nextjs after chown.
if [ -n "$FILE_STORAGE_PATH" ]; then
  mkdir -p "$FILE_STORAGE_PATH"
  chown -R nextjs:nodejs "$FILE_STORAGE_PATH" || true
fi
exec su-exec nextjs sh -c '
set -e
node scripts/migrate.mjs || exit 1
node scripts/discord-presence-bot.mjs &
exec node server.js
'
