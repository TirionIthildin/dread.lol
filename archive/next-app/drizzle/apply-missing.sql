-- Run this if you see "relation does not exist" or "column does not exist" errors.
-- Applies: 0012 vouches, 0013 + 0014 columns, 0015 gallery_items, 0016 profile_short_links, 0017 custom badges, 0018 font and background, 0019 badge icon/image.
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

-- Profile short links (0016)
CREATE TABLE IF NOT EXISTS "profile_short_links" (
  "id" serial PRIMARY KEY NOT NULL,
  "profile_id" integer NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "slug" text NOT NULL,
  "url" text NOT NULL,
  CONSTRAINT "profile_short_links_profile_slug_unique" UNIQUE("profile_id", "slug")
);
CREATE INDEX IF NOT EXISTS "profile_short_links_profile_id_idx" ON "profile_short_links" ("profile_id");

-- Custom badges (0017)
CREATE TABLE IF NOT EXISTS "badges" (
  "id" serial PRIMARY KEY NOT NULL,
  "key" text NOT NULL UNIQUE,
  "label" text NOT NULL,
  "description" text,
  "color" text,
  "sort_order" integer DEFAULT 0 NOT NULL
);
CREATE TABLE IF NOT EXISTS "user_badges" (
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "badge_id" integer NOT NULL REFERENCES "badges"("id") ON DELETE CASCADE,
  CONSTRAINT "user_badges_user_badge_unique" UNIQUE("user_id", "badge_id")
);
CREATE INDEX IF NOT EXISTS "user_badges_user_id_idx" ON "user_badges" ("user_id");
CREATE INDEX IF NOT EXISTS "user_badges_badge_id_idx" ON "user_badges" ("badge_id");

-- Font and background (0018)
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "custom_font" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "background_type" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "background_url" text;

-- Badge icon and image (0019)
ALTER TABLE "badges" ADD COLUMN IF NOT EXISTS "badge_type" text DEFAULT 'label';
ALTER TABLE "badges" ADD COLUMN IF NOT EXISTS "image_url" text;
ALTER TABLE "badges" ADD COLUMN IF NOT EXISTS "icon_name" text;
