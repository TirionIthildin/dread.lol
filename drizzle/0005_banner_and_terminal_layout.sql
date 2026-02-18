-- Banner style (gradient) and optional terminal-window layout with custom commands
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "banner_style" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "use_terminal_layout" boolean DEFAULT false;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "terminal_title" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "terminal_commands" text;
