/**
 * Feature updates displayed on the main page.
 * Edit this file to add or modify update entries.
 */
export interface FeatureUpdate {
  date: string;
  title: string;
  description?: string;
}

export const FEATURE_UPDATES: FeatureUpdate[] = [
  {
    date: "2026-02",
    title: "Security hardening",
    description: "OG open redirect fix, font URL CSS injection prevention, template payload limits, auth rate limiting, debug header redaction.",
  },
  {
    date: "2026-02",
    title: "Security & quality improvements",
    description: "API rate limiting, Zod validation, centralized auth helpers, structured logging, and test suite (Vitest + Playwright).",
  },
  {
    date: "2026-02",
    title: "Professional theme & solid background",
    description: "New Professional theme for portfolios and resumes. Solid or gradient background options.",
  },
  {
    date: "2026-02",
    title: "Full-page profile editor",
    description: "Standalone editor at /editor with elements on the left, canvas in the center, and properties panel on the right. Drag to reorder on canvas.",
  },
  {
    date: "2026-02",
    title: "Elementor-style profile editor",
    description: "Element picker sidebar: add elements by drag or click, reorder sections, edit content inline, style panel. Dashboard → Layout.",
  },
  {
    date: "2026-02",
    title: "Profile card effects",
    description: "Profile cards tilt in 3D, spotlight glow, glossy reflection, magnetic border, and shine sweep—like Linktree and Carrd.",
  },
  {
    date: "2026-02",
    title: "Admin analytics overview",
    description: "Admin dashboard now shows service analytics: users, signups, templates, subscriptions, profile views, and recent activity.",
  },
  {
    date: "2026-02",
    title: "Open signup",
    description: "No approval needed—anyone who signs in can use the dashboard and create a profile.",
  },
  {
    date: "2026-02",
    title: "Badge redemption & vouchers",
    description: "Share badges with one-time-use redemption links. Admins can grant extra custom badge slots from the user modal.",
  },
  {
    date: "2026-02",
    title: "Premium & addons",
    description: "Premium unlocks all features. Gallery and custom badge addons available standalone or as part of Premium. Polar payments integrated.",
  },
  {
    date: "2026-02",
    title: "Background & username effects",
    description: "Add snow, rain, blur, or retro-computer overlay. Typewriter and sparkle effects for your display name.",
  },
  {
    date: "2026-02",
    title: "Roblox & Discord widgets",
    description: "Link Roblox via OAuth. Show account age, server count, and server invite links on your profile.",
  },
  {
    date: "2026-02",
    title: "Profile Marketplace",
    description: "Browse and apply community templates to style your profile.",
  },
  {
    date: "2026-02",
    title: "Profile analytics",
    description: "See who viewed your profile, traffic sources, views over time, and device breakdown.",
  },
  {
    date: "2026-02",
    title: "Profile micro-blog",
    description: "Write markdown posts on your profile. Each member gets their own blog at /slug/blog.",
  },
  {
    date: "2026-02",
    title: "Gallery & paste",
    description: "Add images and text blocks to your profile. Pastes default to Markdown and render formatted.",
  },
];
