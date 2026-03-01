# Dread.lol Improvement Plan

**Date:** 2026-02-28
**Status:** In Progress

---

## Prioritized Items

| Priority | Area | Item | Status |
|----------|------|------|--------|
| P0 | Performance | Double `getSession()` on profile pageload | pending |
| P0 | Performance | `getBillingSettings()` fetched but unused in 9+ actions | pending |
| P0 | Code quality | 2,790-line god component + 86 inline type casts | pending |
| P0 | Testing | No tests for `updateProfileAction` or `memberProfileToProfile` | pending |
| P0 | Feature | Admin improvement page is a stub (`Coming soon.`) | pending |
| P1 | Performance | `getProfileAnalytics` / leaderboard / trending uncached | pending |
| P1 | Performance | `getProfileViewCount` full scan per pageload — add Valkey cache | pending |
| P1 | Performance | `getBillingSettings` makes 7 serial MongoDB calls — batch + cache | pending |
| P1 | UX | `confirm()` dialogs instead of `ConfirmDialog` (7 sites) | pending |
| P1 | UX | No unsaved-changes navigation guard in dashboard form | pending |
| P1 | UX | Vouches/similar edit panels read-only stubs in editor | done |
| P1 | Code quality | `member-profiles.ts` is 1,939 lines; split by domain | pending |
| P1 | Code quality | `updateProfileAction` inline validation → extract pure functions | pending |
| P1 | Testing | E2E covers only 4 smoke pages; core flows untested | pending |
| P2 | Performance | Banner gradient renders per-character spans → CSS gradient instead | pending |
| P2 | UX | Dual save mechanisms in drag-drop editor (layout vs. field) | pending |
| P2 | Feature | Non-Discord avatars bypass Next.js image optimization | pending |
| P2 | Feature | OG image has no `Cache-Control` header | pending |
| P2 | Feature | Version slots hard-coded at 5; no premium tier | pending |

---

## Completed Quick Wins (2026-02-28)

- **Tags/Skills live preview**: `TagsPanel` and `SkillsPanel` in `SectionEditPanels.tsx` now call `onProfileChange` on every keystroke so the drag-drop editor updates live without requiring a save.
- **GalleryBlogPanel navigation**: Replaced static info text with action buttons linking to `/dashboard/gallery` and `/dashboard/blog`.
- **Similar/Vouches panels**: Improved info text + added quick links to analytics.
- **Dead code removed**: `DashboardLayoutEditor.tsx` (unused, superseded by `/editor/ProfilePageEditor.tsx`).

---

## P0 Details

### Double `getSession()` on profile pageload

**File:** `app/(site)/[slug]/page.tsx`

Inside the `Promise.all`, `getSession()` is called twice — once for `currentUser` resolution and once in a nested IIFE. Each call is a Valkey lookup (session cookie → session data). Fix by calling `getSession()` once before the `Promise.all` and reusing the result.

### `getBillingSettings()` called but unused in most actions

**File:** `app/dashboard/actions.ts`

`getBillingSettings()` is fetched in parallel with `getOrCreateUser()` in ~9 actions but the result is only used in `updateProfileAction` and `updateLinksAction` (for premium gating). The other 7+ actions destructure it but never use `billing.*`. Each call makes 7 serial MongoDB `findOne` queries. Remove from actions that don't need it.

### `getBillingSettings` — 7 serial MongoDB calls

**File:** `lib/settings.ts`

Replace 7 individual `getSetting()` calls with a single `{ key: { $in: [...keys] } }` batch query and reduce to a map. Add 60-second Valkey caching since admin settings rarely change.

---

## P1 Details

### Caching strategy for expensive queries

Add `unstable_cache` or Valkey caching:

| Function | Location | Suggested TTL |
|----------|----------|---------------|
| `getProfileAnalytics` | `lib/member-profiles.ts` | 5 min |
| `getLeaderboardTopVouches` | `lib/member-profiles.ts` | 15 min |
| `getTrendingProfiles` | `lib/member-profiles.ts` | 15 min |
| `getSimilarProfiles` | `lib/member-profiles.ts` | 10 min, keyed by profileId |
| `getProfileViewCount` | `lib/member-profiles.ts` | 60 sec, Valkey increment pattern |
| `getBillingSettings` | `lib/settings.ts` | 60 sec, Valkey |

### OG image caching

**File:** `app/api/og/[slug]/route.ts`

Add `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` header. This is critical for Discord/Slack/Twitter crawlers which can hammer OG endpoints.

### `member-profiles.ts` domain split

Target structure:
- `lib/db/users.ts` — user CRUD
- `lib/db/badges.ts` — badge CRUD
- `lib/db/vouches.ts` — vouch operations + leaderboard
- `lib/db/views.ts` — view recording, analytics
- `lib/db/profiles.ts` — profile CRUD + `memberProfileToProfile`
- `lib/member-profiles.ts` — re-exports for backwards compat during migration

### Replace `confirm()` with `ConfirmDialog`

Locations using native browser `confirm()`:
- `DashboardMyProfile.tsx` (Roblox unlink, bg audio remove)
- `DashboardBadgesClient.tsx`
- `marketplace/page.tsx`
- `marketplace/[id]/page.tsx`
- `AdminTemplatesPanel.tsx`
- `AdminUserModal.tsx`

`ConfirmDialog` already exists and is used for version management — extend its usage consistently.

---

## P2 Details

### Banner gradient — eliminate per-character spans

**File:** `app/components/ProfileContent.tsx`

When `isGradient` is true, the banner text is split per character into individual `<span>` elements. For a 30-line ASCII banner this is ~2,400 DOM nodes. Replace with a single `<pre>` using:

```css
background: linear-gradient(...);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
color: transparent;
```

This makes gradient banners a single element.

### Non-Discord avatar image optimization

**File:** `next.config.ts` + `app/components/ProfileContent.tsx`

Add `{ hostname: process.env.NEXT_PUBLIC_SITE_URL_HOST }` (same-origin `/api/files/...`) to `remotePatterns`. Remove `unoptimized` from non-Discord `<Image>` elements. This enables WebP conversion and responsive sizing for uploaded avatars.

### Version slot premium tier

**File:** `lib/profile-versions.ts` + `lib/settings.ts`

Add `billing.versionSlotsBasic` (default 5) and `billing.versionSlotsPremium` (e.g. 20) to the settings schema. `saveProfileVersion` should read the user's access level and apply the appropriate cap. Surface the limit clearly in the versions UI with a premium upsell.
