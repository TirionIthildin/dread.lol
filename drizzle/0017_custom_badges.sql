-- Custom badges (admin-created). Staff and Verified remain on users table.
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
  UNIQUE("user_id", "badge_id")
);
