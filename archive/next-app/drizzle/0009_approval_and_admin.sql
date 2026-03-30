-- Account approval and admin flags (admin panel)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "approved" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_admin" boolean DEFAULT false NOT NULL;
-- Existing users before this migration are considered approved
UPDATE "users" SET "approved" = true WHERE "approved" = false;
