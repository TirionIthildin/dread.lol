-- User-chosen status indicator (online/idle/busy/offline). Not synced with Discord (no REST API for presence).
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "display_status" text;
