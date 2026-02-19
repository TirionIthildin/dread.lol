#!/bin/sh
# Run migrations before starting (creates users, profiles, etc. if missing)
# Must succeed when DATABASE_URL is set; abort container start on failure
node scripts/migrate.mjs || exit 1
# Run Discord presence bot in background (exits gracefully if no token)
node scripts/discord-presence-bot.mjs &
# Run Next.js as main process
exec node server.js
