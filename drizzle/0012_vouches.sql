-- Vouches: logged-in users can vouch for a profile (one vouch per user per profile)
CREATE TABLE IF NOT EXISTS "vouches" (
  "id" serial PRIMARY KEY NOT NULL,
  "profile_id" integer NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "vouches_profile_user_unique" ON "vouches" ("profile_id", "user_id");
CREATE INDEX IF NOT EXISTS "vouches_profile_id_idx" ON "vouches" ("profile_id");
