## Prerequisites

- Node.js 20 or newer
- Optional: Docker for MongoDB and Valkey

## Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `npm run dev` starts Next.js and the optional Discord presence bot. Use `npm run dev:next` if you only need the web app.

## Databases

From the project root:

```bash
docker compose up -d
```

This starts MongoDB (`27017`) and Valkey (`6379`). Copy `.env.example` to `.env` and set `DATABASE_URL`, `VALKEY_URL`, and either `FILE_STORAGE_PATH` (for example `./data/uploads`) or S3 variables if you want uploads against a dev bucket.

## Discord OAuth

Create an application in the [Discord Developer Portal](https://discord.com/developers/applications). Set OAuth redirect URIs and put `DISCORD_OAUTH_CLIENT_ID`, `DISCORD_OAUTH_CLIENT_SECRET`, `AUTH_REDIRECT_URI`, and `AUTH_SECRET` in `.env`.

## Indexes

Before first deploy or after schema changes:

```bash
npm run db:migrate-prod
```

Then open `/dashboard`, sign in, and edit your profile.
