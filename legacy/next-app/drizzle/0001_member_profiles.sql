-- Member profiles (1 per user) and profile view log
CREATE TABLE IF NOT EXISTS "profiles" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "tagline" text,
  "description" text NOT NULL,
  "avatar_url" text,
  "status" text,
  "quote" text,
  "tags" text[],
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "profile_views" (
  "id" serial PRIMARY KEY NOT NULL,
  "profile_id" integer NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "visitor_ip" text NOT NULL,
  "user_agent" text,
  "viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "profile_views_profile_id_idx" ON "profile_views" ("profile_id");
CREATE INDEX IF NOT EXISTS "profile_views_viewed_at_idx" ON "profile_views" ("viewed_at" DESC);
