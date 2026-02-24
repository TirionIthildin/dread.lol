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
    title: "Profile card effects",
    description: "Profile cards tilt and follow your cursor in 3D on hover, with a spotlight glow and subtle shine sweep.",
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
    title: "Improved Shop admin",
    description: "Redesigned Admin → Shop with status overview, setup checklist, collapsible sections, product name resolution, and copy buttons for API links.",
  },
  {
    date: "2026-02",
    title: "Badge redemption links",
    description: "Share your badges with one-time-use redemption links. Create a link per person.",
  },
  {
    date: "2026-02",
    title: "Custom badge vouchers",
    description: "Admins can grant extra custom badge slots from the user modal—no Polar purchase required.",
  },
  {
    date: "2026-02",
    title: "Open signup & access model",
    description: "Anyone can sign up and get access. Free: no gallery, no paste. Gallery and paste are addons or included in Premium.",
  },
  {
    date: "2026-02",
    title: "Badges page",
    description: "Custom badges now have their own page. Create badges with live preview, better form layout, and a dedicated navigation.",
  },
  {
    date: "2026-02",
    title: "Gallery addon",
    description: "Image hosting is now a separate purchasable addon. Get it standalone or as part of Premium. Configure product IDs in Admin → Premium.",
  },
  {
    date: "2026-02",
    title: "Premium + addons",
    description: "Premium unlocks all features. Custom badge and Gallery addons are managed on their own pages.",
  },
  {
    date: "2026-02",
    title: "Premium subscription",
    description: "Single Premium tier. Subscribe for full access to all features—effects, custom colors, gallery, pastes, microblog, and more.",
  },
  {
    date: "2026-02",
    title: "Configurable Premium limits",
    description: "Gallery addon product IDs, microblog Premium-only, and paste limit are configurable in Admin → Premium.",
  },
  {
    date: "2026-02",
    title: "Premium feature gates",
    description: "Username effects (typewriter, sparkle), custom colors, background effects, profile analytics, and per-field animations now require Premium. Premium badge shown on profiles.",
  },
  {
    date: "2026-02",
    title: "Improved Premium page",
    description: "Clearer status badges, expanded feature list (microblog, gallery, pastes), trust cues, and better pricing cards with period labels.",
  },
  {
    date: "2026-02",
    title: "Auto-fetch prices from Polar",
    description: "Prices are fetched from Polar API and shown on Subscribe/Buy buttons. No manual price config needed.",
  },
  {
    date: "2026-02",
    title: "Auto-detect product types",
    description: "Subscription vs one-time is automatically determined from Polar API. Subscribe and Buy buttons route to the correct product.",
  },
  {
    date: "2026-02",
    title: "Multiple products per tier",
    description: "Add multiple product IDs per tier (Premium, Basic). Support subscriptions, one-time purchases, and lifetime deals like $100 permanent Premium.",
  },
  {
    date: "2026-02",
    title: "Premium permissions & admin grant",
    description: "Admins can grant free Premium to any user from the Admin panel. Use hasPremiumAccess() to gate features.",
  },
  {
    date: "2026-02",
    title: "Admin billing config",
    description: "Configure Polar products, sandbox mode, and enable billing from Admin → Billing.",
  },
  {
    date: "2026-02",
    title: "Polar payments",
    description: "Integrated Polar for subscriptions, one-time purchases, and entitlements.",
  },
  {
    date: "2026-02",
    title: "Background effects",
    description: "Add snow, rain, blur, or retro-computer overlay effects to your profile background.",
  },
  {
    date: "2026-02",
    title: "Username effects",
    description: "Typewriter and sparkle effects for your display name—like those forum-style floating sparkles.",
  },
  {
    date: "2026-02",
    title: "Per-field animations",
    description: "Set typewriter, fade-in, slide-up, and other animations for your name, tagline, and description.",
  },
  {
    date: "2026-02",
    title: "Custom profile colors",
    description: "Set custom accent, text, and background colors with hex inputs and color pickers in the Look section.",
  },
  {
    date: "2026-02",
    title: "Card blur & opacity controls",
    description: "Customize your profile card's backdrop blur and transparency in the Look section.",
  },
  {
    date: "2026-02",
    title: "Bigger profile editor",
    description: "Full-viewport editor with side-by-side live preview, wider layout, sticky save bar, and ⌘/Ctrl+Enter shortcut.",
  },
  {
    date: "2026-02",
    title: "Roblox widgets",
    description: "Link your Roblox account via OAuth and show account age or profile link on your profile.",
  },
  {
    date: "2026-02",
    title: "Joined widget & badge controls",
    description: "Show when you joined Dread.lol on your profile. Choose which Discord badges to display.",
  },
  {
    date: "2026-02",
    title: "Discord widgets",
    description: "Show account age, server count, and server invite links on your profile.",
  },
  {
    date: "2026-02",
    title: "Profile micro-blog",
    description: "Write markdown posts on your profile. Each member gets their own blog at /slug/blog.",
  },
  {
    date: "2026-02",
    title: "Profile analytics",
    description: "See who viewed your profile, traffic sources (Google, Discord, X, etc.), views over time, and device breakdown.",
  },
  {
    date: "2026-02",
    title: "Unique view counts",
    description: "Profile views now count unique visitors (IP + browser) instead of every page load.",
  },
  {
    date: "2026-02",
    title: "Profile versions",
    description: "Save and restore up to 5 snapshots of your profile, including gallery and short links.",
  },
  {
    date: "2026-02",
    title: "Page themes",
    description: "Choose Classic or Minimalist with light or dark mode for your profile.",
  },
  {
    date: "2026-02",
    title: "Paste history & raw",
    description: "View, edit, and delete your pastes. Copy raw URL or open raw content directly.",
  },
  {
    date: "2026-02",
    title: "Paste: Markdown by default",
    description: "Pastes now default to Markdown and render formatted when viewed.",
  },
  {
    date: "2026-02",
    title: "Themed embed images",
    description: "Twitter, Discord, and other platforms now show a custom preview with your profile picture, grid background, and description.",
  },
  {
    date: "2026-02",
    title: "More profile fields",
    description: "Add website, skills, languages, availability, current focus, and when you're usually online.",
  },
  {
    date: "2026-02",
    title: "Profile Marketplace",
    description: "Browse and apply community templates to style your profile.",
  },
  {
    date: "2026-02",
    title: "Trending profiles",
    description: "Discover profiles getting the most attention this week.",
  },
  {
    date: "2026-02",
    title: "Leaderboard",
    description: "Top vouched profiles ranked monthly.",
  },
  {
    date: "2026-02",
    title: "Gallery & paste",
    description: "Add images and text blocks to your profile.",
  },
];
