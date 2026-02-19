-- Custom badge icon or image: use Phosphor icon name or uploaded image URL
ALTER TABLE "badges" ADD COLUMN IF NOT EXISTS "badge_type" text DEFAULT 'label';
ALTER TABLE "badges" ADD COLUMN IF NOT EXISTS "image_url" text;
ALTER TABLE "badges" ADD COLUMN IF NOT EXISTS "icon_name" text;
