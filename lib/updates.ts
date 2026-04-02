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
    date: "2026-04",
    title: "S3-backed uploads",
    description:
      "Production can store avatars, backgrounds, and gallery media on S3-compatible storage (including Cloudflare R2) instead of only a local volume.",
  },
  {
    date: "2026-03",
    title: "Dashboard home and navigation",
    description:
      "The member dashboard has a new home hub with quick links and shortcuts, a mobile-friendly navigation menu, and more consistent layout styling across dashboard pages.",
  },
  {
    date: "2026-03",
    title: "Lucide icons across the site",
    description:
      "Badges, dashboards, and custom link icons now use the Lucide icon set (with automatic mapping for older saved names).",
  },
  {
    date: "2026-03",
    title: "Spanish site UI",
    description:
      "Public pages (home, about, terms, privacy) support English and Spanish via next-intl; switch locale from the homepage footer or use /es/ URLs.",
  },
  {
    date: "2026-03",
    title: "More link types and link styling",
    description:
      "New button presets for OnlyFans, NameMC, and email; optional Lucide icon on Custom links; toggle hover glow on your link row.",
  },
  {
    date: "2026-03",
    title: "Copyable socials",
    description:
      "Optional profile setting: link buttons open http(s) and mailto links in the browser; everything else (handles, plain text) copies to the clipboard so visitors can paste elsewhere.",
  },
  {
    date: "2026-03",
    title: "Crypto wallet balance widget",
    description:
      "Optional profile widget shows native on-chain balance for Ethereum, Bitcoin, and/or Solana—add an address per network you want (with an approximate USD estimate per card).",
  },
  {
    date: "2026-03",
    title: "Profile aliases",
    description:
      "Add alternate URLs that show your main profile (1 slot on free accounts, 5 with Premium). Separate from short links, which redirect to external sites.",
  },
  {
    date: "2026-03",
    title: "Creator Premium voucher links",
    description:
      "Verified creators can create shareable Premium voucher links (optional cap and expiry) and see redemption stats on the Creator dashboard.",
  },
  {
    date: "2026-03",
    title: "Admin: Discord system monitoring",
    description:
      "Configure a Discord webhook and optional CRON_SECRET-backed schedule to push host, process, MongoDB, and Valkey snapshots.",
  },
  {
    date: "2026-03",
    title: "GitHub profile widgets",
    description:
      "Optional cards for last push, public repo count, and a contribution heatmap (GitHub API). Add your username in Settings → Widgets; set GITHUB_TOKEN on the server for the graph.",
  },
  {
    date: "2026-03",
    title: "Premium tip links and commissions",
    description:
      "Ko-fi, Throne, and Amazon wishlist as profile link buttons with icons. Commissions open/closed/waitlist plus optional price hint on your page.",
  },
  {
    date: "2026-03",
    title: "Security & site: 2FA, sessions, RSS, changelog",
    description:
      "Optional TOTP + backup codes, session list and sign-out everywhere, profile blog RSS, public changelog and status pages.",
  },
  {
    date: "2026-03",
    title: "Local accounts: email, SRP-6a, passkeys",
    description:
      "Register with username + email (Resend verification) and SRP password; sign in with SRP or WebAuthn passkeys. Discord sign-in unchanged.",
  },
  {
    date: "2026-03",
    title: "Faster, simpler uploads",
    description:
      "Profile media is stored on durable disk (Docker volume) instead of SeaweedFS—same URLs, simpler ops.",
  },
  {
    date: "2026-03",
    title: "About page, API scope docs, and positioning",
    description:
      "New About page (features, Premium, privacy, identity roadmap), public HTTP API scope at /docs/api, and clearer links from the homepage.",
  },
  {
    date: "2026-03",
    title: "Dynamic Discord avatars",
    description: "Profiles using the Discord avatar option now fetch it live, so your avatar stays up to date when you change it on Discord.",
  },
  {
    date: "2026-03",
    title: "Multi-use badge links & premium vouchers",
    description: "Badge links now support unlimited or capped redemptions with per-user deduplication. Admins can create tracked premium voucher links to grant Premium with creator attribution and stats.",
  },
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
