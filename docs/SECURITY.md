# Security

## Overview

Dread.lol uses Discord OAuth, Valkey-backed sessions, MongoDB, and SeaweedFS. This document summarizes security posture and deployment guidance.

## Authentication & Authorization

- **Discord OAuth 2.0** with CSRF protection (state stored in Valkey)
- **Session cookies** (`dread_session`): HMAC-SHA256 signed, `httpOnly`, `secure` in production, `sameSite: "lax"`
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

## Trusted Proxy Headers

The app trusts `x-forwarded-for`, `x-original-host`, `x-forwarded-host` for IP and host detection (subdomain routing). Ensure production proxies (Cloudflare, Traefik, Coolify) are configured to strip or override these headers from untrusted clients.

## File Access

`/api/files/[fid]` serves files from SeaweedFS. fids (`volumeId,fileId`) are public once generated—do not store sensitive content in SeaweedFS if exposure is a concern.

## Deployment Checklist

- [ ] Set `DATABASE_URL` in production (app will not start without it)
- [ ] Use strong `AUTH_SECRET` (32+ bytes)
- [ ] Ensure reverse proxy strips/overrides forwarded headers from clients
- [ ] Run `npm audit` and address vulnerabilities
- [ ] Keep dependencies updated
