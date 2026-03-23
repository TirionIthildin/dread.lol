#!/bin/sh
# Run migrations before starting (creates users, profiles, etc. if missing)
# Must succeed when DATABASE_URL is set; abort container start on failure
if [ -n "$FILE_STORAGE_PATH" ]; then
  mkdir -p "$FILE_STORAGE_PATH" 2>/dev/null || true
fi
node scripts/migrate.mjs || exit 1
# Run Discord presence bot in background (exits gracefully if no token)
node scripts/discord-presence-bot.mjs &
# Run Next.js as main process
exec node server.js
