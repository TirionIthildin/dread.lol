# Page Themes Implementation Plan

**Goal:** Profile-level page themes (Classic and Minimalist). When viewing a profile, the theme applies to that profile's page—layout, typography, cards, colors.

**Architecture:** `data-page-theme` on ProfileBackground root, CSS `:has()` to adapt parent layout (grid-bg, scanlines) when profile has Minimalist, CSS variables cascade for Minimalist subtree.

**Tech Stack:** Next.js, MongoDB (ProfileDoc.pageTheme), Tailwind/CSS variables.

---

## Implemented

1. Schema: Add `pageTheme` to ProfileDoc
2. Profile type + memberProfileToProfile
3. Dashboard: Page theme select in profile form (Appearance)
4. ProfileBackground: `data-page-theme={profile.pageTheme ?? "classic"}` on root
5. globals.css: [data-page-theme="minimalist"] vars + :has() for grid/scanlines/ornament
6. Inter font for Minimalist typography
