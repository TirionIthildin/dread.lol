-- Verified and Staff badges (admin-assignable)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verified" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "staff" boolean DEFAULT false NOT NULL;
