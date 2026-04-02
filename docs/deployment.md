# Deployment and production operations

Operational notes for running Dread.lol behind proxies, on subdomains, and with scheduled jobs.

## Wildcard subdomains (Cloudflare Worker)

Profiles can be served at `username.example.com` when a Cloudflare Worker (or similar) forwards `*.example.com` to your origin.

**Worker** forwards to your apex (e.g. `https://dread.lol`) with:

- `Host: dread.lol` (or your apex) so the origin accepts the request
- `X-Original-Host: <original host>` (e.g. `alice.dread.lol`) — use a custom header so Coolify/Traefik does not overwrite it

The app reads `X-Forwarded-Host` (or `Host`) and extracts the subdomain label: `alice.dread.lol` → `alice`, `dashboard.dread.lol` → `dashboard`.

**Dashboard:** `dashboard.example.com` can serve the same app as `https://example.com/dashboard` (including nested routes like `/dashboard/gallery`). Middleware rewrites paths so `/dashboard/...` links work on the dashboard subdomain.

**OAuth:** Register Discord (and other) redirect URIs on the apex host only, e.g. `https://dread.lol/api/auth/discord/callback`. Visiting `/api/auth/*` on a subdomain (e.g. `dashboard.dread.lol/api/auth/discord`) redirects to the apex first so third-party OAuth pages resolve static assets on the correct origin.

**Sessions:** The `dread_session` cookie is set with `Domain` = `.` + your apex host (from `NEXT_PUBLIC_SITE_DOMAIN` or `SITE_URL`, e.g. `.dread.lol`) so it is sent on the apex and every subdomain. Logout clears it with the same attributes.

**Debug:** `https://username.example.com/api/debug/headers` shows incoming headers, extracted slug, and rewrite metadata (admin only).

**Analytics:** Profile analytics use Cloudflare headers when available:

- `CF-Connecting-IP` for visitor IP (preferred over `X-Forwarded-For`)
- `CF-IPCountry` for country when “Add visitor location headers” Managed Transform is enabled

## System monitoring (Discord)

Admins can configure **Admin → Monitoring**: save a Discord incoming webhook URL and enable pushes. The app does not run an internal timer; set `CRON_SECRET` in the environment (e.g. `openssl rand -hex 32`) and schedule an HTTP request to `GET /api/cron/monitoring` with header `Authorization: Bearer <CRON_SECRET>` every few minutes (Coolify scheduled job, systemd timer, or cron + `curl`). See `.env.example` for `CRON_SECRET`.

## Coolify / Docker

Production layout is in [`docker-compose.coolify.yml`](../docker-compose.coolify.yml) at the repository root. Adjust image tags, env, and volumes for your host.

**Validate locally:** `MONGO_PASSWORD=… docker compose -f docker-compose.coolify.yml config` (syntax and interpolation).

**Requirements:** `MONGO_PASSWORD` must be set in the environment (Coolify secrets). The `dread` service uses `user: "0:0"` so the entrypoint can `chown` `FILE_STORAGE_PATH` on the uploads volume before the app runs as `nextjs`; do not override the service user to a non-root uid in Coolify or local-disk uploads can fail.

**Uploads:** Set `S3_BUCKET` and `S3_REGION` or `AWS_REGION` (see [`docker-compose.coolify.yml`](../docker-compose.coolify.yml)) with credentials or an IAM role that can read/write objects under your prefix. Optional `S3_ENDPOINT` for R2/MinIO. `FILE_STORAGE_PATH=/data/uploads` with the `uploads_data` volume supports legacy disk reads or hybrid setups. The image uses `read_only: true` plus `tmpfs` for `/tmp`, `/var/tmp`, and `/app/.next/cache`. Migrating from a disk volume: [migrations/volume-to-s3.md](migrations/volume-to-s3.md).

## Further reading

- [SECURITY.md](SECURITY.md) — auth, headers, env secrets, file storage
- [README.md](../README.md) — local development and project overview
