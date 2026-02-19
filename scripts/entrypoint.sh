#!/bin/sh
# Run Discord presence bot in background (exits gracefully if no token)
node scripts/discord-presence-bot.mjs &
# Run Next.js as main process
exec node server.js
