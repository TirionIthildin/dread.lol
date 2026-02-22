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

Member profiles and Discord login need MongoDB, Valkey (Redis), and env config.

1. **Start databases** (from project root):
   ```bash
   docker compose up -d
   ```
   This starts MongoDB (port 27017) and Valkey (port 6379).

2. **Env** — Copy `.env.example` to `.env` and set:
   - `DATABASE_URL` — e.g. `mongodb://dread:dread@localhost:27017/dread?authSource=admin`
   - `VALKEY_URL` — e.g. `redis://localhost:6379`
   - Discord OAuth: create an app at [Discord Developer Portal](https://discord.com/developers/applications), then set `DISCORD_OAUTH_CLIENT_ID`, `DISCORD_OAUTH_CLIENT_SECRET`, `AUTH_REDIRECT_URI` (e.g. `http://localhost:3000/api/auth/discord/callback`), and `AUTH_SECRET` (e.g. `openssl rand -base64 32`).

3. **Indexes** — Run before first deploy (or let entrypoint do it):
   ```bash
   npm run db:migrate-prod
   ```

4. Visit `/dashboard`, log in with Discord, and edit your profile. Your page is at `/{your-slug}`.

## Wildcard subdomains (Cloudflare Worker)

Profiles work at `username.dread.lol` when using a Cloudflare Worker to forward `*.dread.lol` to your origin.

**Worker** forwards to `https://dread.lol` with:
- `Host: dread.lol` (so your origin accepts the request)
- `X-Original-Host: <original host>` (e.g. `alice.dread.lol`) — use a custom header so Coolify/Traefik doesn't overwrite it

The app reads `X-Forwarded-Host` (or `Host`) and extracts the username: `alice.dread.lol` → `alice`.

**Debug:** `https://username.dread.lol/api/debug/headers` shows incoming headers and extracted slug.

**Analytics:** Profile analytics use Cloudflare headers when available:
- `CF-Connecting-IP` for visitor IP (preferred over `X-Forwarded-For`)
- `CF-IPCountry` for country when "Add visitor location headers" Managed Transform is enabled

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — run ESLint
- `npm run typecheck` — run TypeScript check
- `npm run db:migrate-prod` — create MongoDB indexes (run before deploy)

## Theme

Theme tokens live in `app/globals.css` (CSS variables). Key colors:

- Background: `#08090a`
- Surface: `#0d0f12`
- Terminal green: `#22c55e`
- Accent cyan: `#06b6d4`
- Text: `#e2e8f0`
- Muted: `#64748b`

Site config (name, URL, description) is in `lib/site.ts`.
