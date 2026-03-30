-- Fun customization: accent color, terminal prompt, name greeting, card style
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "accent_color" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "terminal_prompt" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "name_greeting" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "card_style" text;
