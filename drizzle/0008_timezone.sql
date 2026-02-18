-- Timezone for local time display
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "timezone" text;
