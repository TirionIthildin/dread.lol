# Dread.Lol

A terminal-themed site built with the same visual style as [Ithildin](https://ithildin.co): dark background, grid + scanlines, cyan accent, green terminal prompt, and JetBrains Mono.

## Stack

- **Next.js 15** (App Router)
- **React 19**
- **Tailwind CSS v4**
- **TypeScript**

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Development (dashboard + member profiles)

Member profiles and Discord login need Postgres, Valkey (Redis), and env config.

1. **Start databases** (from project root):
   ```bash
   docker compose up -d
   ```
   This starts Postgres (port 5432) and Valkey (port 6379).

2. **Env** — Copy `.env.example` to `.env` and set:
   - `DATABASE_URL` — e.g. `postgresql://dread:dread@localhost:5432/dread`
   - `VALKEY_URL` — e.g. `redis://localhost:6379`
   - Discord OAuth: create an app at [Discord Developer Portal](https://discord.com/developers/applications), then set `DISCORD_OAUTH_CLIENT_ID`, `DISCORD_OAUTH_CLIENT_SECRET`, `AUTH_REDIRECT_URI` (e.g. `http://localhost:3000/api/auth/discord/callback`), and `AUTH_SECRET` (e.g. `openssl rand -base64 32`).

3. **Migrations** — Create `users`, `profiles`, and `profile_views` tables:
   ```bash
   npm run db:migrate
   ```

4. Visit `/dashboard`, log in with Discord, and edit your profile. Your page is at `/{your-slug}`.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — run ESLint
- `npm run typecheck` — run TypeScript check
- `npm run db:migrate` — run database migrations
- `npm run db:generate` — generate migrations from schema (Drizzle)
- `npm run db:studio` — open Drizzle Studio

## Theme

Theme tokens live in `app/globals.css` (CSS variables). Key colors:

- Background: `#08090a`
- Surface: `#0d0f12`
- Terminal green: `#22c55e`
- Accent cyan: `#06b6d4`
- Text: `#e2e8f0`
- Muted: `#64748b`

Site config (name, URL, description) is in `lib/site.ts`.
