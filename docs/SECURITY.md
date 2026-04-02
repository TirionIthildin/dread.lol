# Security

## Overview

Dread.lol uses Discord OAuth, Valkey-backed sessions, MongoDB, and user uploads on **S3-compatible storage** when configured (`S3_BUCKET`, `AWS_REGION` / `S3_REGION`, credentials, etc.) or on disk under `FILE_STORAGE_PATH`. This document summarizes security posture and deployment guidance.

## Reporting a vulnerability

**Do not** file a public GitHub issue for undisclosed security bugs (that can put users at risk).

- **Preferred:** Use [GitHub Security Advisories](https://github.com/TirionIthildin/dread.lol/security/advisories) for this repository (“Report a vulnerability”) so the maintainers can triage privately.
- Include enough detail to reproduce or understand the impact (affected routes, env, or versions). Avoid posting working exploit code in public channels.

For general security architecture (sessions, headers, env), read the sections below.

## Authentication & Authorization

- **Discord OAuth 2.0** with CSRF protection (state stored in Valkey)
- **Session cookies** (`dread_session`): HMAC-SHA256 signed, `httpOnly`, `Secure` in production (override with `SECURE_COOKIE`), `sameSite: "lax"`, `Domain` set to the parent zone (e.g. `.dread.lol` from `NEXT_PUBLIC_SITE_DOMAIN` / `SITE_URL`) so the session is sent on the apex and all `*.dread.lol` hosts; logout clears with matching attributes
- **Session registry**: Each sign-in is stored in Valkey under `session:<id>` with optional device metadata (IP, user-agent). A reverse index `user_sessions:<userId>` lists active session ids for “sign out everywhere” and per-device revoke on the Security dashboard
- **Optional TOTP 2FA**: Users can enable time-based one-time passwords (RFC 6238) plus one-time backup codes. Secrets are encrypted at rest (AES-256-GCM with a key derived from `AUTH_SECRET` + user id). After Discord, SRP, or passkey primary auth, a second step may be required via Valkey `mfa_pending:<token>` (short TTL) and optional cookie `mfa_pending` for OAuth redirects
- **Authorization**: `requireAdmin()` for admin routes; profile ownership checks for edit/delete
- **Admin**: Hardcoded Discord user IDs; `user.approved` required for dashboard access

## Security Headers

Next.js adds the following headers globally:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN` (allows same-origin embedding; use DENY to block all framing)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Environment Variables

| Variable | Secret? | Notes |
|----------|---------|-------|
| `AUTH_SECRET` | Yes | Generate with `openssl rand -base64 32` |
| `DISCORD_OAUTH_CLIENT_SECRET` | Yes | |
| `DISCORD_BOT_TOKEN` | Yes | |
| `DATABASE_URL` | Yes | Required in production |
| `VALKEY_URL` | Yes | May contain credentials |
| `DISCORD_OAUTH_CLIENT_ID` | No | Public |
| `NEXT_PUBLIC_*` | No | Exposed to client |
| `SECURE_COOKIE` | No | Optional `true`/`false` to force session cookie `Secure` or disable it (default: secure in production) |
| `NEXT_PUBLIC_SITE_DOMAIN` | No | Apex host without subdomain (e.g. `dread.lol`); sets cookie `Domain` for `*.dread.lol` |
| `S3_BUCKET` | No | Production uploads; pair with `AWS_REGION` or `S3_REGION` |
| `AWS_REGION` / `S3_REGION` | No | AWS SDK region for S3 |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Yes | Optional if the runtime supplies IAM (e.g. task role) |
| `S3_ENDPOINT` | No | Optional; S3-compatible services (R2, MinIO) |
| `FILE_STORAGE_PATH` | No | Local disk uploads when S3 is not configured |

## Trusted Proxy Headers

The app trusts `x-forwarded-for`, `x-original-host`, `x-forwarded-host` for IP and host detection (subdomain routing). Ensure production proxies (Cloudflare, Traefik, Coolify) are configured to strip or override these headers from untrusted clients.

## File Access

`/api/files/[id]` streams user-uploaded files from **S3** when configured, then from **`FILE_STORAGE_PATH`** on disk, then optional **SeaweedFS** during migration (`SEAWEED_MASTER_URL`). File ids (UUID or legacy Seaweed-style `volumeId,fileId`) are public once generated—do not store sensitive content if exposure is a concern.

**S3:** Use scoped IAM (or R2 API tokens) with least privilege for object APIs (`s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` on `bucket/your-prefix/*`). The readiness check uses Put/Delete on a probe key, not HeadBucket. Do not commit access keys.

**Docker (local disk):** The container entrypoint runs as root to `chown` `FILE_STORAGE_PATH` for the `nextjs` user (uid 1001) when that path is mounted.

**Backups:** For S3, use versioning/replication as needed. For disk-backed uploads, include the volume in backup procedures.

## Recent Security Improvements

- **OG open redirect fix**: Custom OG image URLs are validated (same-origin or path only) before redirect
- **Font URL CSS injection fix**: Custom font URLs are escaped for safe use in CSS `url()`
- **Template payload validation**: Marketplace template creation uses Zod schemas and a 500KB limit
- **Debug route**: Sensitive headers (Authorization, Cookie, etc.) are redacted
- **Auth rate limiting**: Discord and Roblox OAuth start endpoints limited to 10/min per IP

## Deployment Checklist

- [ ] Set `DATABASE_URL` in production (app will not start without it)
- [ ] Set `S3_BUCKET` and `AWS_REGION` (or `S3_REGION`) for uploads, with IAM or keys allowing read/write on the bucket (see [migrations/volume-to-s3.md](migrations/volume-to-s3.md) when moving from disk)
- [ ] Use strong `AUTH_SECRET` (32+ bytes)
- [ ] Ensure reverse proxy strips/overrides forwarded headers from clients
- [ ] Run `npm audit` and address vulnerabilities
- [ ] Keep dependencies updated
