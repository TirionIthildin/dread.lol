-- Toggle to show/hide page view count in dashboard
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "show_page_views" boolean DEFAULT true;
