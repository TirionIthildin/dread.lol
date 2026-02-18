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

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — run ESLint
- `npm run typecheck` — run TypeScript check

## Theme

Theme tokens live in `app/globals.css` (CSS variables). Key colors:

- Background: `#08090a`
- Surface: `#0d0f12`
- Terminal green: `#22c55e`
- Accent cyan: `#06b6d4`
- Text: `#e2e8f0`
- Muted: `#64748b`

Site config (name, URL, description) is in `lib/site.ts`.
