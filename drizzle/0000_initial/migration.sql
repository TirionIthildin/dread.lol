-- Initial schema: users table (Discord-linked accounts, reserved for future use)
CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY NOT NULL,
  "discord_user_id" text NOT NULL UNIQUE,
  "username" text,
  "display_name" text,
  "avatar_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
