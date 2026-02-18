-- Extra profile fields to match static profiles (discord, roblox, banner, links, easter eggs)
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "discord" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "roblox" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "banner" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "banner_small" boolean DEFAULT false;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "banner_animated_fire" boolean DEFAULT false;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "easter_egg" boolean DEFAULT false;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "easter_egg_tagline_word" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "easter_egg_link_trigger" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "easter_egg_link_url" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "easter_egg_link_popup_url" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "links" text;
