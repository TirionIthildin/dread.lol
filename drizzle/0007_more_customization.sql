-- More customization: pronouns, location, avatar shape, layout density, noindex, meta description
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "pronouns" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "location" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "avatar_shape" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "layout_density" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "noindex" boolean DEFAULT false;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "meta_description" text;
