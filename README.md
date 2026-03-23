# Dread.lol

[![CI](https://github.com/TirionIthildin/dread.lol/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/TirionIthildin/dread.lol/actions/workflows/ci.yml)

A terminal-themed member profile site in the spirit of [Ithildin](https://ithildin.co): dark background, grid + scanlines, cyan accent, green terminal prompt, and JetBrains Mono.

## Table of contents

- [Stack](#stack)
- [Quick start](#quick-start)
- [Full local setup](#full-local-setup-dashboard--profiles)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Testing](#testing)
- [Theme and site config](#theme-and-site-config)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS v4**
- **TypeScript** (strict)
- **Node.js** ≥ 20 (CI uses Node 22)

Backend-adjacent: **MongoDB**, **Valkey** (Redis-compatible sessions), **Discord OAuth**, optional **Polar** billing, file uploads on disk under `FILE_STORAGE_PATH`.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run dev` runs the Next.js dev server **and** the optional Discord presence bot (see [Scripts](#scripts)). Use `npm run dev:next` if you only want Next.js.

## Full local setup (dashboard + profiles)

Member profiles, sessions, and Discord login need MongoDB, Valkey, and environment variables.

1. **Start databases** (from the project root):

   ```bash
   docker compose up -d
   ```

   This starts MongoDB (port `27017`) and Valkey (port `6379`).

2. **Environment** — Copy `.env.example` to `.env` and set at least:

   - `DATABASE_URL` — e.g. `mongodb://dread:dread@localhost:27017/dread?authSource=admin`
   - `VALKEY_URL` — e.g. `redis://localhost:6379`
   - `FILE_STORAGE_PATH` — e.g. `./data/uploads` for local uploads
   - Discord OAuth: create an app at the [Discord Developer Portal](https://discord.com/developers/applications), then set `DISCORD_OAUTH_CLIENT_ID`, `DISCORD_OAUTH_CLIENT_SECRET`, `AUTH_REDIRECT_URI` (e.g. `http://localhost:3000/api/auth/discord/callback`), and `AUTH_SECRET` (e.g. `openssl rand -base64 32`).
   - **Local accounts** (optional): `RESEND_API_KEY` and `EMAIL_FROM` for verification email. Set `WEBAUTHN_RP_ID` and `WEBAUTHN_ORIGIN` if passkeys should use an explicit RP (defaults are derived from `SITE_URL`).

3. **Indexes** — Run before first deploy (or rely on your deploy entrypoint):

   ```bash
   npm run db:migrate-prod
   ```

4. Visit `/dashboard`, sign in with Discord, and edit your profile. Public URL: `/{your-slug}`.

## Project structure

| Path | Purpose |
|------|---------|
| [`app/`](app/) | Next.js App Router: pages, API routes, layouts |
| [`lib/`](lib/) | Data layer, auth, Polar, uploads, rate limits, site helpers |
| [`scripts/`](scripts/) | MongoDB migrations, Discord presence bot |
| [`docs/`](docs/) | Security notes, deployment, design plans, migrations |
| [`.github/`](.github/) | CI (`ci.yml`), Docker publish, Dependabot |

Notable files: theme tokens in [`app/globals.css`](app/globals.css); branding and URLs in [`lib/site.ts`](lib/site.ts).

Wildcard subdomains, monitoring cron, and Coolify/Docker notes: [`docs/deployment.md`](docs/deployment.md).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server + Discord presence bot (`concurrently`) |
| `npm run dev:next` | Next.js only |
| `npm run build` | Production build |
| `npm run start` | Production server (`next start`) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run ci` | Typecheck + lint + unit tests (matches CI) |
| `npm run db:migrate-prod` | Create/update MongoDB indexes |
| `npm run discord-presence-bot` | Run the presence bot alone |

## Testing

| Command | Description |
|---------|-------------|
| `npm run test` | Vitest unit tests (once) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright E2E |
| `npm run test:e2e:ci` | Playwright, Chromium only (CI-friendly) |

Before opening a PR, run `npm run ci` locally when possible. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Theme and site config

Theme tokens live in `app/globals.css` (CSS variables). Key colors:

- Background: `#08090a`
- Surface: `#0d0f12`
- Terminal green: `#22c55e`
- Accent cyan: `#06b6d4`
- Text: `#e2e8f0`
- Muted: `#64748b`

Site config (name, URL, description) is in [`lib/site.ts`](lib/site.ts).

## Documentation

- **Site (`/docs`)** — user-facing guides built from Markdown in [`content/site-docs/`](content/site-docs/); navigation in [`lib/site-docs.ts`](lib/site-docs.ts). Open `/docs` when running the app locally.
- [docs/README.md](docs/README.md) — index of `docs/`
- [docs/SECURITY.md](docs/SECURITY.md) — security model, env, deployment checklist
- [docs/deployment.md](docs/deployment.md) — subdomains, monitoring, production pointers
- [CONTRIBUTING.md](CONTRIBUTING.md) — how to contribute
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — community standards

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Report security issues responsibly; see [docs/SECURITY.md](docs/SECURITY.md#reporting-a-vulnerability).

## License

[PolyForm Noncommercial License 1.0.0](LICENSE). See [LICENSE](LICENSE) for full terms.
