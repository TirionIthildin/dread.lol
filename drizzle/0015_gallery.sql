-- Gallery items: images with optional title and description, ordered per profile.
CREATE TABLE IF NOT EXISTS "gallery_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "profile_id" integer NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "image_url" text NOT NULL,
  "title" text,
  "description" text,
  "sort_order" integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "gallery_items_profile_id_idx" ON "gallery_items" ("profile_id");
