-- Run this if you see "relation does not exist" or "column does not exist" errors.
-- Applies: 0012 vouches, 0013 + 0014 columns, 0015 gallery_items.
-- Usage: psql "$DATABASE_URL" -f drizzle/apply-missing.sql

-- Vouches (0012)
CREATE TABLE IF NOT EXISTS "vouches" (
  "id" serial PRIMARY KEY NOT NULL,
  "profile_id" integer NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "vouches_profile_user_unique" ON "vouches" ("profile_id", "user_id");
CREATE INDEX IF NOT EXISTS "vouches_profile_id_idx" ON "vouches" ("profile_id");

-- Discord badges (0013)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "discord_public_flags" integer;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "show_discord_badges" boolean DEFAULT false;

-- Birthday (0014)
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "birthday" text;

-- Gallery items (0015)
CREATE TABLE IF NOT EXISTS "gallery_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "profile_id" integer NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "image_url" text NOT NULL,
  "title" text,
  "description" text,
  "sort_order" integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "gallery_items_profile_id_idx" ON "gallery_items" ("profile_id");
