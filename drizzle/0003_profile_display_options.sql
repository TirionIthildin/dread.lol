-- Custom OG image and "show last updated" for member profiles
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "og_image_url" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "show_updated_at" boolean DEFAULT false;
