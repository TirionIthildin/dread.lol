# Contributing to Dread.lol

Thanks for your interest in improving the project.

## Prerequisites

- **Node.js** 20 or newer (CI uses Node 22)
- **npm** — install dependencies with `npm ci` (clean lockfile install) or `npm install`
- **Docker** (optional) — for local MongoDB and Valkey: `docker compose up -d` from the repo root

## Before you open a pull request

1. Run **`npm run ci`** — this runs TypeScript, ESLint, and Vitest, matching [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
2. Fix any type or lint errors introduced by your changes.
3. Add or update **tests** when you change behavior that is testable.
4. Keep PRs **small and focused**; unrelated refactors make review harder.

## Branching

Open pull requests against the **`main`** branch (same as CI).

## Code style

- Follow existing patterns in the files you touch (imports, naming, component structure).
- Run **`npm run lint`** and **`npm run typecheck`** if you did not run the full `npm run ci`.

## License

This repository is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE). By contributing, you agree that your contributions are provided under those terms. If you are unsure whether your use case is allowed, read the license or ask the maintainers.

## Security

Do **not** open public issues for undisclosed security vulnerabilities. See [Reporting a vulnerability](docs/SECURITY.md#reporting-a-vulnerability) in [`docs/SECURITY.md`](docs/SECURITY.md).

## Community

Be respectful and constructive. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
