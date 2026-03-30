-- Store Discord public_flags (badge bitfield) and profile opt-in to show them
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "discord_public_flags" integer;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "show_discord_badges" boolean DEFAULT false;
