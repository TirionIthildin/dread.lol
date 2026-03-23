# Documentation index

This folder holds reference material that is not part of the Next.js app.

**User-facing docs** (the `/docs` pages on the site) are Markdown files in [`content/site-docs/`](../content/site-docs/) with navigation in [`lib/site-docs.ts`](../lib/site-docs.ts).

| Item | Description |
|------|-------------|
| [SECURITY.md](SECURITY.md) | Authentication, sessions, headers, environment variables, file access, deployment checklist |
| [deployment.md](deployment.md) | Wildcard subdomains (e.g. Cloudflare Worker), Discord monitoring cron, Coolify/Docker pointers |
| [plans/](plans/) | Design and implementation planning notes (dated filenames) |
| [migrations/](migrations/) | Runbooks for data or storage migrations (e.g. legacy blob stores) |

**Plans** are working documents for features and refactors. **Migrations** are operational steps for operators. **SECURITY** and **deployment** are the main references for running the app safely in production.

The project overview, local setup, and scripts are in the root [README.md](../README.md). For AI/automation tooling, see [AGENTS.md](../AGENTS.md).
