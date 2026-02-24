# Drag-and-Drop Profile Editor — Plan & Options

**Date:** 2026-02-24  
**Status:** Planning

## Overview

Add a full-page drag-and-drop editor variant where all profile elements are rearrangeable. Users see the live profile and drag blocks to reorder them.

---

## Current State

- **Editor:** Form-based dashboard (`DashboardMyProfile.tsx`) with tabbed sections (Basics, Extras, Discord, Links, etc.)
- **Preview:** Side-by-side live preview via `sessionStorage` + `postMessage` → `/live-preview`
- **Rendering:** `ProfileContent.tsx` renders a fixed order of elements (banner → avatar+name → description → tags → skills → quote → links → widgets → audio → vouches)
- **Schema:** `ProfileDoc` has no layout/order fields — order is hardcoded in `ProfileContent`

---

## Proposed Architecture

### 1. Layout model

Add a `sectionOrder` field to the profile schema:

```ts
// New field in ProfileDoc / Profile
sectionOrder?: string[];  // Array of section IDs in display order
```

**Default order** (when `sectionOrder` is absent) = current `ProfileContent` order, so existing profiles behave identically.

### 2. Section / block IDs

Each rearrangeable block gets a stable ID. Suggested mapping:

| Block ID | Description |
|----------|-------------|
| `banner` | ASCII banner / text art |
| `hero` | Avatar + name + pronouns + tagline + meta (location, timezone, birthday, etc.) + Discord presence |
| `description` | Markdown description |
| `tags` | Tag pills |
| `skills` | Skills / roles |
| `quote` | Quote / fun fact |
| `links` | Website + Discord + Roblox + custom links |
| `discord-widgets` | Discord widgets (account age, joined, server count, invite) |
| `roblox-widgets` | Roblox widgets |
| `gallery-blog` | Gallery and Blog buttons |
| `audio` | Audio player |
| `similar` | Similar profiles (when shown) |
| `vouches` | Vouches + page views |

The **terminal command bar** stays fixed at the bottom (it’s part of the card chrome, not content). We can revisit if you want it moveable.

### 3. Tech stack

- **DnD library:** `@dnd-kit/core` + `@dnd-kit/sortable`
  - Modern, accessible, works well with React 19
  - Good touch support

### 4. Editor UX

Full-page editor with:
- **Canvas:** Live profile preview where blocks are draggable
- **Toolbar:** Save, revert, maybe “Add block” later
- **Block affordances:** Grip handle, hover highlight, reorder feedback

---

## Options for You to Decide

### A. Block granularity

1. **Coarse (recommended)** — ~12 blocks as above. Simpler, fewer items to drag.
2. **Medium** — Split hero into `avatar-name` + `meta` + `discord-presence`. ~15–18 blocks.
3. **Fine** — Every logical element separate (pronouns, location, timezone, birthday, etc.). Maximum flexibility, more complex.

### B. Visibility per block

1. **Reorder only** — Blocks can be reordered, not hidden.
2. **Reorder + hide** — Each block can be shown/hidden (toggle in editor). Requires `sectionVisibility?: Record<string, boolean>` or similar.

### C. Editor entry point

1. **New route** — `/dashboard/editor` or `/dashboard/layout` as a dedicated full-page drag editor. Keep current form editor; add a “Layout” or “Reorder” entry.
2. **Replace** — Replace the current preview with a unified editor (drag to reorder, click block to edit in a side panel). Bigger UX change.
3. **Tab** — Add a “Layout” tab to the existing dashboard. On that tab you see a simplified list/canvas with drag handles. Simpler but less “full page”.

### D. Edit-in-place vs. side panel

1. **Preview-only** — Drag editor shows live preview; clicking a block either does nothing or opens the existing form in a modal/tab. Keeps editing logic in one place.
2. **Inline editing** — Click a block to edit its content inline. More complex, requires refactoring `ProfileContent` into editable components.

### E. Mobile / responsive

1. **Desktop-first** — Drag editor optimized for desktop; mobile shows a simpler “Reorder” list.
2. **Touch support** — Ensure `@dnd-kit` touch handling works; same UI on mobile.

### F. Future extensions

- **Add block:** Palette of optional blocks (e.g. “Add a custom HTML block”) — would need new block types and schema.
- **Nested blocks:** e.g. links as sub-blocks — significantly more complex.
- **Templates:** Section order as part of marketplace templates — would require including `sectionOrder` in template snapshot/apply.

---

## Implementation Phases

### Phase 1: Schema + render

1. Add `sectionOrder?: string[]` to `ProfileDoc`, `Profile`, and any conversion logic.
2. Refactor `ProfileContent` to render sections based on `sectionOrder` (with default order for backward compat).
3. Extract each block into a small render helper or sub-component for easier mapping.

### Phase 2: Drag editor UI

1. Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
2. Create `/dashboard/editor` (or chosen route) with DndContext + SortableContext.
3. Wrap each block in a `SortableBlock` that shows grip handle + reorder feedback.
4. Wire state to `sessionStorage` for live preview (same mechanism as current editor).

### Phase 3: Persistence

1. Add API/action to save `sectionOrder`.
2. Wire editor save button to persist order.
3. Ensure profile versions include `sectionOrder` for save/restore.

### Phase 4: Polish

1. Visibility toggles (if chosen).
2. Mobile touch support.
3. Undo/redo (optional).

---

## Recommendation

- **Block granularity:** Coarse
- **Visibility:** Reorder + hide (very common expectation)
- **Entry point:** New route `/dashboard/editor` for full-page drag experience
- **Edit-in-place:** Preview-only; click to focus opens existing dashboard tab
- **Mobile:** Touch support, same UI

---

## Next Steps

Once you’ve chosen options for A–F, I’ll implement Phase 1 (schema + render refactor) and Phase 2 (drag editor UI), then Phase 3 for persistence.
