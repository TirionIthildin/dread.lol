-- Font switching and custom background for profiles
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "custom_font" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "background_type" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "background_url" text;
