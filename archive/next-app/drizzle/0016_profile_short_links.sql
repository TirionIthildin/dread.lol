-- URL shortener: /username/slug -> redirect URL
CREATE TABLE IF NOT EXISTS "profile_short_links" (
  "id" serial PRIMARY KEY NOT NULL,
  "profile_id" integer NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "slug" text NOT NULL,
  "url" text NOT NULL,
  CONSTRAINT "profile_short_links_profile_slug_unique" UNIQUE("profile_id", "slug")
);
CREATE INDEX IF NOT EXISTS "profile_short_links_profile_id_idx" ON "profile_short_links" ("profile_id");
