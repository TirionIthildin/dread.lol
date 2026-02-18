-- Birthday (month + day only, no year). Displayed as countdown on profile.
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "birthday" text;
